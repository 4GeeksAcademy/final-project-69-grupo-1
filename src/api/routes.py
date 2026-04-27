"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import secrets
import string
import os
import cloudinary
import cloudinary.uploader
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, Clinic, Appointment, Pet, MedicalRecord, ClinicRequest, RoleEnum, RequestStatus
from api.utils import generate_sitemap, APIException, roles_required
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, get_jwt
from flask_cors import CORS
from werkzeug.security import generate_password_hash
from flask_mailman import EmailMessage

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)

cloudinary.config( 
  cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"), 
  api_key = os.getenv("CLOUDINARY_API_KEY"), 
  api_secret = os.getenv("CLOUDINARY_API_SECRET"),
  secure = True
)

def generate_temp_password(length=12):
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(secrets.choice(alphabet) for i in range(length))

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
    files = request.files # Para archivos
    
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

    # 5. ENVÍO DE CORREOS (Doble notificación)
    try:
        # Notificación para TI (Admin)
        admin_msg = EmailMessage(
            subject="🔔 NUEVA SOLICITUD - PetHealth & Spa",
            body=f"Has recibido una solicitud de: {new_request.nombre_clinica}. Revisa el panel de control.",
            to=[os.getenv('MAIL_USERNAME')]
        )
        admin_msg.send()

        # Confirmación para el CLIENTE
        client_msg = EmailMessage(
            subject="Solicitud Recibida - PetHealth & Spa",
            body=f"Hola {new_request.nombre_admin}, hemos recibido tus documentos. En 24h te daremos respuesta.",
            to=[email]
        )
        client_msg.send()
    except Exception as e:
        # Si el correo falla, no detenemos la respuesta del servidor
        print(f"Error de envío de mail: {e}")

    return jsonify({"message": "Solicitud recibida exitosamente"}), 201

@api.route('/admin/requests', methods=['GET'])
@jwt_required()
@roles_required(RoleEnum.SUPER_ADMIN)
def get_all_requests():
    """ SuperAdmin: Ver todas las solicitudes pendientes """
    claims = get_jwt()
    if claims.get("role") != RoleEnum.SUPER_ADMIN.value:
        return jsonify({"message": "No autorizado"}), 403
    
    requests = ClinicRequest.query.filter_by(status=RequestStatus.PENDING).all()
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

    # 2. Crear Clínica
    nueva_clinica = Clinic(
        nombre=solicitud.nombre_clinica,
        rif=solicitud.rif_empresa if solicitud.tipo_solicitud == 'EMPRESA' else solicitud.cedula_identidad,
        ubicacion=solicitud.direccion,
        telefono=solicitud.telefono,
        correo=solicitud.email,
        is_active=True
    )
    db.session.add(nueva_clinica)
    db.session.flush()
    
    nuevo_usuario.clinic_id = nueva_clinica.id
    solicitud.status = RequestStatus.APPROVED
    db.session.commit()

    try:
        body_html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; border: 1px solid #dee2e6;">
                    <h2 style="color: #0d6efd;">¡Bienvenido a PetHealth & Spa!</h2>
                    <p>Hola <strong>{solicitud.nombre_admin or solicitud.nombre_clinica}</strong>,</p>
                    <p>Tu sede <strong>{solicitud.nombre_clinica}</strong> ha sido aprobada exitosamente por nuestro equipo administrativo.</p>
                    <hr />
                    <p>Aquí tienes tus credenciales de acceso temporal:</p>
                    <p style="font-size: 1.2em; background-color: #fff; padding: 10px; border: 1px dashed #0d6efd; display: inline-block;">
                        <strong>Usuario:</strong> {solicitud.email}<br>
                        <strong>Clave Temporal:</strong> <code>{temp_pw}</code>
                    </p>
                    <p style="color: #666; font-size: 0.9em;">* Por seguridad, el sistema te pedirá cambiar esta clave al ingresar por primera vez.</p>
                    <a href="https://tu-url-de-render.com/login" 
                       style="background-color: #0d6efd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px;">
                       Ir al Login
                    </a>
                </div>
            </body>
        </html>
        """
        
        msg = EmailMessage(
            subject="🎉 ¡Tu clínica ha sido aprobada! - PetHealth & Spa",
            body=body_html,
            to=[solicitud.email]
        )
        msg.content_subtype = "html"  # IMPORTANTE para que se vea el diseño
        msg.send()
        
    except Exception as e:
        print(f"Error enviando correo: {e}")

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
    observaciones = data.get("observaciones", "No se especificó un motivo detallado.")

    try:
        # Cambiamos el estatus a REJECTED (ya definido en tu models.py)
        solicitud.status = RequestStatus.REJECTED
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

    # Envío del correo de notificación
    try:
        body_html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="background-color: #fff; padding: 20px; border: 1px solid #dc3545; border-radius: 10px;">
                    <h2 style="color: #dc3545;">Solicitud de Registro - PetHealth & Spa</h2>
                    <p>Hola <strong>{solicitud.nombre_admin}</strong>,</p>
                    <p>Lamentamos informarle que su solicitud para <strong>{solicitud.nombre_clinica}</strong> ha sido rechazada.</p>
                    <hr />
                    <p><strong>Motivo del rechazo:</strong></p>
                    <p style="background-color: #f8f9fa; padding: 15px; border-left: 5px solid #dc3545;">
                        {observaciones}
                    </p>
                    <hr />
                    <p>Si desea corregir los puntos mencionados, puede realizar una nueva solicitud.</p>
                </div>
            </body>
        </html>
        """
        msg = EmailMessage(
            subject="Información sobre su solicitud - PetHealth & Spa",
            body=body_html,
            to=[solicitud.email]
        )
        msg.content_subtype = "html"
        msg.send()
    except Exception as e:
        print(f"Error enviando correo: {e}")

    return jsonify({"message": "Solicitud rechazada exitosamente"}), 200

## COMIENZO DE LOS ENDPOINTS PARA CLÍNICAS
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
                clinic.suspension_reason = body.get('suspension_reason', "Suspensión administrativa")
                
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