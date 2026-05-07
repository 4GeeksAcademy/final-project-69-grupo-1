"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import secrets
import csv
import io
import string
import os
import cloudinary
import cloudinary.uploader
from datetime import datetime, timedelta, timezone
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, Clinic, Appointment, Pet, MedicalRecord, ClinicRequest, RoleEnum, RequestStatus, AppointmentStatus
from api.utils import generate_sitemap, APIException, generate_temp_password, roles_required, setup_initial_admins, generate_staff_code, send_registration_notification, send_approval_email, send_rejection_email, send_staff_invitation_email, send_welcome_staff_email
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, get_jwt, decode_token
from flask_cors import CORS
from werkzeug.security import generate_password_hash
from flask_mailman import EmailMessage

api = Blueprint('api', __name__, template_folder='templates')

# Allow CORS requests to this API
CORS(api)

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)


def generate_temp_password(length=12):
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(secrets.choice(alphabet) for i in range(length))


@api.route('/master-setup', methods=['POST'])
def master_setup():
    master_key = os.getenv("MASTER_KEY")
    client_key = request.headers.get("X-Master-Key")

    if not master_key or client_key != master_key:
        return jsonify({"error": "No autorizado"}), 401

    setup_initial_admins()

    return jsonify({"message": "Sincronización de administradores completada"}), 200


@api.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()

    if user and user.check_password(password):
        if user.clinic_id:
            clinic = Clinic.query.get(user.clinic_id)
            if clinic and not clinic.is_active:
                return jsonify({
                    "message": f"Acceso Denegado: La sede '{clinic.nombre}' ha sido suspendida.",
                    "reason": clinic.suspension_reason
                }), 403

        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                "role": user.role.value,
                "clinic_id": user.clinic_id,
                "must_change_password": user.must_change_password
            })
        return jsonify({"token": access_token, "user": user.serialize()}), 200
    return jsonify({"message": "Email o contraseña incorrectos"}), 401


@api.route('/me', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    return jsonify(user.serialize()), 200


@api.route('/update-password', methods=['PATCH'])
@jwt_required()
def update_password():
    """ Endpoint para que el usuario cambie su clave temporal por una definitiva """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    body = request.json

    new_password = body.get("new_password")
    if not new_password or len(new_password) < 6:
        return jsonify({"error": "La contraseña debe tener al menos 6 caracteres"}), 400

    user.set_password(new_password)
    user.must_change_password = False
    db.session.commit()

    return jsonify({"message": "Contraseña actualizada exitosamente"}), 200

# --- ENDPOINTS DE MESA DE ENTRADA (CLINIC REQUESTS) ---


@api.route('/submit-registration', methods=['POST'])
def submit_registration():
    # 1. Capturamos los datos correctamente
    data = request.form  # Para textos
    files = request.files  # Para archivos

    # Obtenemos el email de forma segura
    email = data.get('email')

    if not email:
        return jsonify({"error": "El campo email es obligatorio"}), 400

    # 2. VALIDACIÓN (Usando 'email' que acabamos de extraer)
    user_exists = User.query.filter_by(email=email).first()
    request_exists = ClinicRequest.query.filter_by(email=email).first()

    if user_exists or request_exists:
        return jsonify({"error": "El correo ya está registrado o en proceso de revisión"}), 400

    # 3. Función interna para subir a Cloudinary
    def upload_file(file_key):
        if file_key not in files:
            return None
        try:
            # El servidor de Render envía el archivo a Cloudinary
            result = cloudinary.uploader.upload(
                files[file_key],
                resource_type="auto",
                access_mode="public",
                type="upload")
            return result['secure_url']
        except Exception as e:
            print(f"Error subiendo {file_key}: {e}")
            return None

    # Subida de archivos
    url_cedula = upload_file('file_cedula')
    url_rif = upload_file('file_rif')
    url_mercantil = upload_file('file_mercantil')
    url_sanitario = upload_file('file_sanitario')
    url_titulo = upload_file('file_titulo')

    # Verificación de documento mínimo
    if not url_cedula:
        return jsonify({"error": "No se pudo cargar la Cédula de Identidad"}), 400

    # 4. Crear el registro en la Base de Datos
    try:
        new_request = ClinicRequest(
            tipo_solicitud=data.get('tipo_solicitud'),
            nombre_clinica=data.get('nombre_clinica'),
            rif_empresa=data.get('rif_empresa'),
            cedula_identidad=data.get('cedula_identidad'),
            direccion=data.get('direccion'),
            telefono=data.get('telefono'),
            email=email,
            nombre_admin=data.get('nombre_admin'),
            url_cedula=url_cedula,
            url_rif=url_rif,
            url_registro_mercantil=url_mercantil,
            url_permiso_sanitario=url_sanitario,
            url_titulo_profesional=url_titulo
        )

        db.session.add(new_request)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error guardando en DB: {e}")
        return jsonify({"error": "Error al guardar la solicitud"}), 500

    send_registration_notification(new_request)

    return jsonify({"message": "Solicitud recibida exitosamente"}), 201


@api.route('/admin/requests', methods=['GET'])
@jwt_required()
@roles_required(RoleEnum.SUPER_ADMIN)
def get_all_requests():
    """ SuperAdmin: Ver todas las solicitudes pendientes """
    claims = get_jwt()
    if claims.get("role") != RoleEnum.SUPER_ADMIN.value:
        return jsonify({"message": "No autorizado"}), 403

    requests = ClinicRequest.query.filter_by(
        status=RequestStatus.PENDING).all()
    return jsonify([r.serialize() for r in requests]), 200


@api.route('/admin/approve-request/<int:request_id>', methods=['POST'])
@jwt_required()
@roles_required(RoleEnum.SUPER_ADMIN)
def approve_request(request_id):
    """ SuperAdmin: Aprueba una solicitud y crea las entidades reales """
    claims = get_jwt()
    if claims.get("role") != "SUPER_ADMIN":
        return jsonify({"message": "No tienes permisos"}), 403

    solicitud = ClinicRequest.query.get(request_id)
    if not solicitud or solicitud.status != RequestStatus.PENDING:
        return jsonify({"error": "Solicitud no válida"}), 404

    # 1. Crear Usuario
    temp_pw = generate_temp_password()
    nuevo_usuario = User(
        email=solicitud.email,
        full_name=solicitud.nombre_admin,
        role=RoleEnum.CLINIC_ADMIN if solicitud.tipo_solicitud == 'EMPRESA' else RoleEnum.INDEPENDENT_VET,
        is_active=True,
        must_change_password=True
    )
    nuevo_usuario.set_password(temp_pw)
    db.session.add(nuevo_usuario)
    db.session.flush()

    nuevo_codigo = generate_staff_code(solicitud.nombre_clinica)

    # 2. Crear Clínica
    nueva_clinica = Clinic(
        nombre=solicitud.nombre_clinica,
        tipo_sede=solicitud.tipo_solicitud,
        rif=solicitud.rif_empresa if solicitud.tipo_solicitud == 'EMPRESA' else solicitud.cedula_identidad,
        ubicacion=solicitud.direccion,
        telefono=solicitud.telefono,
        correo=solicitud.email,
        is_active=True,
        staff_code=nuevo_codigo
    )
    db.session.add(nueva_clinica)
    db.session.flush()

    nuevo_usuario.clinic_id = nueva_clinica.id
    solicitud.status = RequestStatus.APPROVED
    db.session.commit()

    send_approval_email(
        user_email=solicitud.email,
        admin_name=solicitud.nombre_admin,
        clinic_name=solicitud.nombre_clinica,
        temp_pw=temp_pw
    )

    return jsonify({
        "message": "Clínica aprobada exitosamente",
        "temp_password": temp_pw
    }), 200


@api.route('/admin/reject-request/<int:request_id>', methods=['POST'])
@jwt_required()
@roles_required(RoleEnum.SUPER_ADMIN)
def reject_request(request_id):
    """ SuperAdmin: Rechaza una solicitud y envía feedback al usuario """
    claims = get_jwt()
    if claims.get("role") != "SUPER_ADMIN":
        return jsonify({"message": "No tienes permisos"}), 403

    solicitud = ClinicRequest.query.get(request_id)
    if not solicitud or solicitud.status != RequestStatus.PENDING:
        return jsonify({"error": "Solicitud no encontrada o ya procesada"}), 404

    data = request.json
    # Capturamos las observaciones enviadas desde el modal
    observaciones = data.get(
        "observaciones", "No se especificó un motivo detallado.")

    try:
        solicitud.status = RequestStatus.REJECTED
        db.session.commit()

        # Enviamos el correo usando la nueva función
        send_rejection_email(
            user_email=solicitud.email,
            admin_name=solicitud.nombre_admin,
            clinic_name=solicitud.nombre_clinica,
            observaciones=observaciones
        )

        return jsonify({"message": "Solicitud rechazada exitosamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# COMIENZO DE LOS ENDPOINTS PARA CLÍNICAS


@api.route('/clinics/<int:clinic_id>/public', methods=['GET'])
def get_clinic_public_info(clinic_id):
    clinic = Clinic.query.get(clinic_id)
    if not clinic:
        return jsonify({"message": "Clínica no encontrada"}), 404

    # Retornamos solo datos básicos comerciales
    return jsonify({
        "id": clinic.id,
        "name": clinic.nombre,
        "address": clinic.ubicacion,
    }), 200


@api.route('/register-client', methods=['POST'])
def register_client():
    data = request.json

    # 1. Extraer datos del JSON
    full_name = data.get("full_name")
    email = data.get("email")
    password = data.get("password")
    clinic_id = data.get("clinic_id")

    # 2. Validaciones básicas
    if not email or not password or not full_name:
        return jsonify({"message": "Todos los campos son obligatorios"}), 400

    # 3. Verificar si el usuario ya existe
    user_exists = User.query.filter_by(email=email).first()
    if user_exists:
        return jsonify({"message": "El correo electrónico ya está registrado"}), 400

    try:
        # 4. Crear el nuevo usuario con rol de CLIENTE
        new_client = User(
            full_name=full_name,
            email=email,
            password=generate_password_hash(password),
            role=RoleEnum.CLIENTE,
            clinic_id=clinic_id,
            is_active=True,
            must_change_password=False
        )

        db.session.add(new_client)
        db.session.commit()

        return jsonify({
            "message": "Cliente registrado exitosamente",
            "client": {
                "id": new_client.id,
                "email": new_client.email,
                "clinic_id": new_client.clinic_id
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error interno del servidor", "error": str(e)}), 500


@api.route('/clinics', methods=['GET'])
@jwt_required()
@roles_required(RoleEnum.SUPER_ADMIN)
def handle_clinics():
    claims = get_jwt()
    if claims.get("role") != RoleEnum.SUPER_ADMIN.value:
        return jsonify({"message": "Acceso restringido"}), 403

    all_clinics = Clinic.query.all()
    return jsonify([clinic.serialize() for clinic in all_clinics]), 200


@api.route('/clinics/<int:clinic_id>', methods=['PUT', 'DELETE'])
@jwt_required()
@roles_required(RoleEnum.SUPER_ADMIN)
def update_or_delete_clinic(clinic_id):
    claims = get_jwt()
    if claims.get("role") != RoleEnum.SUPER_ADMIN.value:
        return jsonify({"message": "Acceso restringido"}), 403

    clinic = Clinic.query.get(clinic_id)

    if not clinic:
        return jsonify({"error": "Clínica no encontrada"}), 404

    # Método DELETE: Eliminar la clínica por completo
    if request.method == 'DELETE':
        db.session.delete(clinic)
        db.session.commit()
        return jsonify({"message": "Clínica eliminada exitosamente"}), 200

    # Método PUT: Actualizar datos de la clínica
    if request.method == 'PUT':
        body = request.get_json()
        if not body:
            return jsonify({"error": "No se enviaron datos para actualizar"}), 400

        if 'is_active' in body:
            clinic.is_active = body['is_active']
            if not clinic.is_active:
                clinic.suspension_reason = body.get(
                    'suspension_reason', "Suspensión administrativa")

        if 'nombre' in body:
            clinic.nombre = body['nombre']
        if 'rif' in body:
            clinic.rif = body['rif']
        if 'ubicacion' in body:
            clinic.ubicacion = body['ubicacion']
        if 'telefono' in body:
            clinic.telefono = body['telefono']  # Actualizamos el teléfono
        if 'correo' in body:
            clinic.correo = body['correo']      # Actualizamos el correo
        if 'suspension_reason' in body:
            clinic.suspension_reason = body['suspension_reason']

        db.session.commit()

        return jsonify({
            "message": "Clínica actualizada exitosamente",
            "clinic": clinic.serialize()
        }), 200

# 1. Listar personal de MI clínica


@api.route('/clinics/<int:clinic_id>/staff', methods=['GET'])
@jwt_required()
@roles_required(RoleEnum.CLINIC_ADMIN, RoleEnum.INDEPENDENT_VET, RoleEnum.SUPER_ADMIN)
def get_clinic_staff(clinic_id):
    staff = User.query.filter_by(clinic_id=clinic_id).all()
    return jsonify([member.serialize() for member in staff]), 200

# 2. Activar/Vetar empleado


@api.route('/users/<int:user_id>/status', methods=['PATCH'])
@jwt_required()
@roles_required(RoleEnum.CLINIC_ADMIN, RoleEnum.INDEPENDENT_VET)
def toggle_user_status(user_id):
    user = User.query.get(user_id)
    # Validación: El admin solo puede tocar gente de SU clínica
    claims = get_jwt()
    if user.clinic_id != claims.get("clinic_id"):
        return jsonify({"msg": "No tienes permiso sobre este usuario"}), 403

    data = request.json
    user.is_active = data.get("is_active")
    db.session.commit()
    return jsonify({"msg": "Estado actualizado"}), 200


@api.route('/clinic/invite-staff', methods=['POST'])
@jwt_required()
@roles_required(RoleEnum.CLINIC_ADMIN, RoleEnum.INDEPENDENT_VET)
def invite_staff():
    admin_claims = get_jwt()
    clinic_id = admin_claims.get("clinic_id")

    if not clinic_id:
        return jsonify({"msg": "Usted no tiene una clínica asociada"}), 400

    clinic = Clinic.query.get(clinic_id)
    if not clinic:
        return jsonify({"msg": "Clínica no encontrada"}), 404

    data = request.json
    email = data.get("email")
    role = data.get("role")  # 'VET' o 'RECEPTIONIST'

    allowed_roles = [RoleEnum.DOCTOR.value, RoleEnum.RECEPTIONIST.value]

    # Rol específico según el tipo
    if clinic.tipo_sede == "INDEPENDIENTE":
        allowed_roles.append(RoleEnum.INDEPENDENT_VET.value)
    else:
        allowed_roles.append(RoleEnum.CLINIC_ADMIN.value)

    if role not in allowed_roles:
        return jsonify({"msg": "Rol no permitido para esta sede"}), 403

    # Generamos un token temporal (puedes guardarlo en una tabla 'Invitations' o usar JWT)
    # Por simplicidad, usemos un JWT que expire en 48h
    invite_token = create_access_token(
        identity=email,
        additional_claims={
            "is_invite": True,
            "clinic_id": clinic_id,
            "role": role
        },
        expires_delta=timedelta(hours=48)
    )

    frontend_url = os.getenv("VITE_FROTEND_URL", "http://localhost:3000")
    invite_link = f"{frontend_url}/registro-empleado?token={invite_token}"

    # ENVÍO DEL CORREO
    success = send_staff_invitation_email(
        target_email=email,
        clinic_name=clinic.nombre,
        role_name=role,
        invite_link=invite_link
    )

    if not success:
        return jsonify({"msg": "Token generado pero el correo no pudo enviarse"}), 500

    return jsonify({"message": "Invitación enviada con éxito", "email": email}), 200


@api.route('/validate-invite', methods=['GET'])
def validate_invite():
    token = request.args.get("token")
    try:
        decoded = decode_token(token)
        # CAMBIO AQUÍ: Los claims están directamente en 'decoded'
        clinic_id = decoded.get("clinic_id")
        role = decoded.get("role")
        email = decoded.get("sub")

        clinic = Clinic.query.get(clinic_id)

        if clinic is None:
            return jsonify({"msg": f"Error: La clínica con ID {clinic_id} no existe"}), 404

        return jsonify({
            "email": email,
            "clinic_name": clinic.nombre,
            "role": role
        }), 200
    except Exception as e:
        print(f"Error decodificando: {str(e)}")
        return jsonify({"msg": "Token inválido o expirado"}), 401


@api.route('/clinic/register-invited', methods=['POST'])
def register_invited_staff():
    data = request.json
    token = data.get("token")
    password = data.get("password")
    full_name = data.get("full_name")

    if not all([token, password, full_name]):
        return jsonify({"msg": "Faltan campos obligatorios"}), 400

    try:
        # 1. Decodificar el token
        decoded = decode_token(token)

        # CAMBIO CRÍTICO: Accedemos directamente a las llaves (iat, sub, clinic_id, role están al mismo nivel)
        email = decoded.get("sub")
        role = decoded.get("role")
        clinic_id = decoded.get("clinic_id")

        # Validación de seguridad: Si no hay clinic_id en el token, algo está mal
        if clinic_id is None:
            return jsonify({"msg": "El link no contiene información de la sede"}), 400

        # 2. Verificar si ya se registró alguien con este mail
        user_exists = User.query.filter_by(email=email).first()
        if user_exists:
            return jsonify({"msg": "Este usuario ya completó su registro previamente"}), 400

        # 3. Crear el nuevo empleado
        new_staff = User(
            email=email,
            password=generate_password_hash(password),
            full_name=full_name,
            role=role,        # Viene del token (ej: 'RECEPTIONIST')
            clinic_id=clinic_id,  # Viene del token (ej: 1)
            is_active=True,
            must_change_password=False
        )

        db.session.add(new_staff)
        db.session.commit()

        return jsonify({"msg": "¡Registro completado con éxito! Ya puedes iniciar sesión."}), 201

    except Exception as e:
        # IMPORTANTE: Mira tu terminal de Flask, aquí saldrá el error real si esto falla
        print(f"DEBUG - ERROR EN REGISTRO: {str(e)}")
        return jsonify({"msg": f"Error al guardar: {str(e)}"}), 400


@api.route('/register-with-code', methods=['POST'])
def register_staff():
    data = request.json

    # 1. Validar que el código de sede existe
    staff_code = data.get("staff_code")
    clinic = Clinic.query.filter_by(staff_code=staff_code).first()

    if not clinic:
        return jsonify({"message": "El código de sede es inválido o ha expirado"}), 404

    # 2. Verificar si el email ya está en uso (Vital para evitar errores 500)
    email = data.get("email")
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Este correo electrónico ya está registrado en PetHealth"}), 400

    # 3. Crear el nuevo usuario vinculado a la clínica
    try:
        new_user = User(
            email=email,
            password=generate_password_hash(data.get("password")),
            full_name=data.get("full_name"),
            # Convertimos el string que viene del front ("VET" o "RECEPTIONIST") al Enum
            role=RoleEnum(data.get("role")),
            clinic_id=clinic.id,
            is_active=False,  # Pendiente por aprobación del Admin de la sede
            must_change_password=False  # El usuario ya está eligiendo su clave aquí
        )

        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            "message": f"¡Registro exitoso! Te has unido a {clinic.nombre}. Tu acceso está pendiente de activación por el administrador."
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error interno al procesar el registro", "error": str(e)}), 500


@api.route('/clinics/bulk-staff-upload', methods=['POST'])
@jwt_required()
@roles_required(RoleEnum.CLINIC_ADMIN, RoleEnum.INDEPENDENT_VET)
def bulk_staff_upload():
    admin_claims = get_jwt()
    admin_clinic_id = admin_claims.get("clinic_id")

    # 1. Obtener información de la clínica para validar roles permitidos
    clinic = Clinic.query.get(admin_clinic_id)
    if not clinic:
        return jsonify({"message": "Sede no encontrada"}), 404

    if 'file' not in request.files:
        return jsonify({"message": "No se encontró el archivo"}), 400

    file = request.files['file']
    if not file.filename.endswith('.csv'):
        return jsonify({"message": "El formato debe ser .csv"}), 400

    # Leer el archivo CSV
    stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
    reader = csv.DictReader(stream)

    users_created = 0
    errors = []

    # Definir roles permitidos según el tipo de sede (Igual que en la invitación individual)
    allowed_roles = [RoleEnum.DOCTOR.value, RoleEnum.RECEPTIONIST.value]
    if clinic.tipo_sede == "INDEPENDIENTE":
        allowed_roles.append(RoleEnum.INDEPENDENT_VET.value)
    else:
        allowed_roles.append(RoleEnum.CLINIC_ADMIN.value)

    for row in reader:
        email = row.get('email', '').strip()
        full_name = row.get('full_name', '').strip()
        role_input = row.get('role', '').strip()

        try:
            # Validaciones básicas de datos
            if not email or not full_name or not role_input:
                errors.append(
                    f"Fila incompleta para {email or 'desconocido'}. Saltando.")
                continue

            # Validar si el usuario ya existe en el sistema
            if User.query.filter_by(email=email).first():
                errors.append(f"El correo {email} ya está registrado.")
                continue

            # Validar si el rol es permitido para esta sede
            if role_input not in allowed_roles:
                errors.append(
                    f"Rol '{role_input}' no permitido para esta sede.")
                continue

            # 6. Crear Usuario con Contraseña Temporal
            temp_pass = generate_temp_password()
            new_user = User(
                email=email,
                full_name=full_name,
                role=role_input,
                clinic_id=admin_clinic_id,
                is_active=True,
                must_change_password=True  # Obligatorio para staff nuevo
            )
            new_user.set_password(temp_pass)

            db.session.add(new_user)
            db.session.flush()  # Flush para asegurar que no hay errores de BD antes del correo

            # 7. Disparar Correo de Bienvenida
            send_welcome_staff_email(
                user_email=email,
                staff_name=full_name,
                clinic_name=clinic.nombre,
                role_name=role_input,
                temp_pw=temp_pass
            )

            users_created += 1

        except Exception as e:
            errors.append(f"Error procesando a {email}: {str(e)}")

    # 8. Guardar todo en la base de datos
    db.session.commit()

    return jsonify({
        "success": True,
        "created_count": users_created,
        "errors": errors,
        "total_rows": users_created + len(errors)
    }), 200


@api.route('/clinics/<int:clinic_id>/generate-code', methods=['PATCH'])
@jwt_required()
@roles_required(RoleEnum.CLINIC_ADMIN)
def update_clinic_staff_code(clinic_id):
    # Seguridad: Validar que el admin pertenece a esta clínica
    claims = get_jwt()
    if claims.get("clinic_id") != clinic_id:
        return jsonify({"message": "No tienes permiso para gestionar esta sede"}), 403

    clinic = Clinic.query.get(clinic_id)
    if not clinic:
        return jsonify({"message": "Clínica no encontrada"}), 404

    # Generamos el nuevo código usando nuestra utilidad
    new_code = generate_staff_code(clinic.id)

    # Verificación de colisión (muy rara con 4 chars + ID, pero buena práctica)
    while Clinic.query.filter_by(staff_code=new_code).first():
        new_code = generate_staff_code(clinic.id)

    clinic.staff_code = new_code
    db.session.commit()

    return jsonify({
        "message": "Código de sede actualizado",
        "staff_code": new_code
    }), 200

# --- NUEVOS ENDPOINTS DE TU TAREA (PARA PETS Y APPOINTMENTS) ---


@api.route('/pets', methods=['GET'])
@jwt_required()
def get_user_pets():
    # El identity del token es el ID del usuario
    user_id = get_jwt_identity()
    
    # Filtramos mascotas por el owner_id
    pets = Pet.query.filter_by(user_id=user_id).all()
    
    # Retornamos la lista serializada
    return jsonify([pet.serialize() for pet in pets]), 200


@api.route('/pets', methods=['POST'])
@jwt_required()
@roles_required(RoleEnum.CLIENTE)
def add_pet():
    user_id = get_jwt_identity()
    data = request.json

    if not data.get("name") or not data.get("specie"):
        return jsonify({"message": "Nombre y especie son obligatorios"}), 400

    try:
        new_pet = Pet(
            nombre=data.get("name"),
            especie=data.get("specie"),
            raza=data.get("breed"),
            edad=data.get("age"),
            user_id=user_id
        )
        db.session.add(new_pet)
        db.session.commit()
        return jsonify({"message": "Mascota registrada correctamente"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error al guardar", "error": str(e)}), 500


@api.route('/appointments', methods=['POST'])
@jwt_required()
def create_appointment():
    user_id = get_jwt_identity()
    body = request.json

    if not body.get("pet_id") or not body.get("date"):
        return jsonify({"msg": "Faltan datos obligatorios"}), 400

    try:
        # Limpiamos el formato de la fecha que viene del input datetime-local
        date_str = body['date'].replace('T', ' ')
        date_obj = datetime.fromisoformat(body['date'].replace('Z', '+00:00'))
    except Exception:
        return jsonify({"msg": "Formato de fecha inválido"}), 400

    # Buscamos la primera clínica activa para asignar la cita
    clinic = Clinic.query.filter_by(is_active=True).first()
    if not clinic:
        return jsonify({"msg": "No hay clínicas disponibles"}), 404

    new_appointment = Appointment(
        date_time=date_obj,
        tipo=body.get('service_type', 'Consulta'),
        status=AppointmentStatus.PROGRAMADA,  # Estado inicial "Pendiente"
        pet_id=body['pet_id'],
        clinic_id=clinic.id,
        user_id=user_id
    )

    db.session.add(new_appointment)
    db.session.commit()

    return jsonify({"msg": "Cita solicitada con éxito"}), 201


@api.route('/reception/appointments', methods=['GET'])
@jwt_required()
@roles_required(RoleEnum.RECEPTIONIST, RoleEnum.CLINIC_ADMIN, RoleEnum.INDEPENDENT_VET)
def get_clinic_appointments():
    # Obtenemos el clinic_id desde el token JWT
    claims = get_jwt()
    clinic_id = claims.get("clinic_id")

    if not clinic_id:
        return jsonify({"message": "Usuario no asociado a una clínica"}), 403

    # Buscamos las citas de hoy (puedes añadir filtros de fecha luego)
    appointments = Appointment.query.filter_by(clinic_id=clinic_id).all()

    return jsonify([app.serialize() for app in appointments]), 200


@api.route('/payments', methods=['POST'])
@jwt_required()
@roles_required(RoleEnum.RECEPTIONIST, RoleEnum.CLINIC_ADMIN, RoleEnum.INDEPENDENT_VET)
def register_payment():
    data = request.json
    appointment_id = data.get("appointment_id")

    # 1. Validar existencia de la cita
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({"message": "Cita no encontrada"}), 404

    # 2. Registrar el pago y cerrar la cita
    try:
        new_payment = Payment(
            appointment_id=appointment_id,
            monto=data.get("monto"),
            # Efectivo, Punto, Zelle, etc [cite: 144]
            metodo_pago=data.get("metodo_pago"),
            transaction_id=data.get("transaction_id"),
            clinic_id=appointment.clinic_id
        )

        # Cambio automático de estado
        appointment.status = "Completed"

        db.session.add(new_payment)
        db.session.commit()

        return jsonify({
            "message": "Pago registrado y cita finalizada",
            "payment": new_payment.serialize()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al procesar el pago: {str(e)}"}), 500
