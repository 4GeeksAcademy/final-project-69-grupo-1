from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, create_access_token, decode_token
from api.models import db, User, Clinic, RoleEnum
from api.utils import roles_required, generate_staff_code, generate_temp_password, send_staff_invitation_email, send_welcome_staff_email
from datetime import timedelta
import csv
import io
import os

staff_bp = Blueprint('staff_management', __name__)


@staff_bp.route('/clinics/<int:clinic_id>/staff', methods=['GET'])
@jwt_required()
@roles_required(RoleEnum.CLINIC_ADMIN, RoleEnum.INDEPENDENT_VET, RoleEnum.SUPER_ADMIN)
def get_clinic_staff(clinic_id):
    staff = User.query.filter_by(clinic_id=clinic_id).all()
    return jsonify([member.serialize() for member in staff]), 200


@staff_bp.route('/users/<int:user_id>/status', methods=['PATCH'])
@jwt_required()
@roles_required(RoleEnum.SUPER_ADMIN, RoleEnum.CLINIC_ADMIN, RoleEnum.INDEPENDENT_VET)
def toggle_user_status(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    claims = get_jwt()
    current_role = claims.get("role")

    # Super Admin puede cambiar el estado de cualquier usuario.
    if current_role != RoleEnum.SUPER_ADMIN.value:
        if user.clinic_id != claims.get("clinic_id"):
            return jsonify({"msg": "No tienes permiso sobre este usuario"}), 403

    data = request.json
    user.is_active = data.get("is_active")
    db.session.commit()
    return jsonify({"msg": "Estado actualizado"}), 200


@staff_bp.route('/clinic/invite-staff', methods=['POST'])
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

    frontend_url = os.getenv("VITE_FRONTEND_URL", "http://localhost:3000")
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


@staff_bp.route('/validate-invite', methods=['GET'])
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


@staff_bp.route('/clinic/register-invited', methods=['POST'])
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
            password=password,
            full_name=full_name,
            role=role,        # Viene del token (ej: 'RECEPTIONIST')
            clinic_id=clinic_id,  # Viene del token (ej: 1)
            is_active=True,
            must_change_password=False
        )
        new_staff.set_password(password)
        db.session.add(new_staff)
        db.session.commit()

        return jsonify({"msg": "¡Registro completado con éxito! Ya puedes iniciar sesión."}), 201

    except Exception as e:
        # IMPORTANTE: Mira tu terminal de Flask, aquí saldrá el error real si esto falla
        print(f"DEBUG - ERROR EN REGISTRO: {str(e)}")
        return jsonify({"msg": f"Error al guardar: {str(e)}"}), 400


@staff_bp.route('/register-with-code', methods=['POST'])
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
            password=data.get("password"),
            full_name=data.get("full_name"),
            # Convertimos el string que viene del front ("VET" o "RECEPTIONIST") al Enum
            role=RoleEnum(data.get("role")),
            clinic_id=clinic.id,
            is_active=False,  # Pendiente por aprobación del Admin de la sede
            must_change_password=False  # El usuario ya está eligiendo su clave aquí
        )
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            "message": f"¡Registro exitoso! Te has unido a {clinic.nombre}. Tu acceso está pendiente de activación por el administrador."
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error interno al procesar el registro", "error": str(e)}), 500


@staff_bp.route('/clinics/bulk-staff-upload', methods=['POST'])
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


@staff_bp.route('/users', methods=['GET'])
@jwt_required()
@roles_required(RoleEnum.SUPER_ADMIN)
def get_all_users():
    """
    Endpoint para que el Super Admin obtenga la lista de todos los usuarios del sistema.
    Soporta filtros opcionales por rol y estado.
    Query params:
        - role: Filtra por rol (SUPER_ADMIN, CLINIC_ADMIN, DOCTOR, RECEPTIONIST, CLIENTE)
        - is_active: Filtra por estado (true/false)
        - clinic_id: Filtra por clínica
    """
    try:
        # Obtener parámetros de filtro
        role = request.args.get('role')
        is_active = request.args.get('is_active')
        clinic_id = request.args.get('clinic_id', type=int)

        # Construir query base
        query = User.query

        # Aplicar filtros si están presentes
        if role:
            try:
                role_enum = RoleEnum(role)
                query = query.filter_by(role=role_enum)
            except ValueError:
                return jsonify({"message": f"Rol inválido: {role}"}), 400

        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            query = query.filter_by(is_active=is_active_bool)

        if clinic_id:
            query = query.filter_by(clinic_id=clinic_id)

        # Ejecutar query ordenado por ID
        users = query.order_by(User.id.desc()).all()

        # Serializar respuesta
        return jsonify([user.serialize() for user in users]), 200

    except Exception as e:
        return jsonify({"message": f"Error al obtener usuarios: {str(e)}"}), 500
