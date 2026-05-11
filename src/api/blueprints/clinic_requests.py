from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, create_access_token
from api.models import db, ClinicRequest, User, Clinic, RoleEnum, RequestStatus
from api.utils import generate_temp_password, generate_staff_code, send_registration_notification, send_approval_email, send_rejection_email
from datetime import timedelta
import cloudinary
import cloudinary.uploader
import os

clinic_requests_bp = Blueprint('clinic_requests', __name__)

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)


@clinic_requests_bp.route('/submit-registration', methods=['POST'])
def submit_registration():
    # 1. Capturamos los datos correctamente
    data = request.form  # Para textos
    files = request.files  # Para archivos

    # Obtenemos el email de forma segura
    email = data.get('email')
    print(f"DEBUG: Email recibido: {email}")

    if not email:
        print("DEBUG: Email faltante")
        return jsonify({"error": "El campo email es obligatorio"}), 400

    # 2. VALIDACIÓN (Usando 'email' que acabamos de extraer)
    user_exists = User.query.filter_by(email=email).first()
    request_exists = ClinicRequest.query.filter_by(email=email).first()
    print(
        f"DEBUG: User exists: {user_exists is not None}, Request exists: {request_exists is not None}")

    if user_exists or request_exists:
        print("DEBUG: Email duplicado")
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

    print(
        f"DEBUG: URLs - cedula: {url_cedula}, rif: {url_rif}, mercantil: {url_mercantil}, sanitario: {url_sanitario}, titulo: {url_titulo}")

    # Verificación de documento mínimo
    if not url_cedula:
        print("DEBUG: Cedula upload failed")
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

    clinic_data = {
        "name": new_request.nombre_clinica
    }
    admin_data = {
        "full_name": new_request.nombre_admin,
        "email": new_request.email
    }
    send_registration_notification(clinic_data, admin_data)

    return jsonify({"message": "Solicitud recibida exitosamente"}), 201


@clinic_requests_bp.route('/admin/requests', methods=['GET'])
@jwt_required()
def get_all_requests():
    """ SuperAdmin: Ver todas las solicitudes pendientes """
    claims = get_jwt()
    if claims.get("role") != RoleEnum.SUPER_ADMIN.value:
        return jsonify({"message": "No autorizado"}), 403

    requests = ClinicRequest.query.filter_by(
        status=RequestStatus.PENDING).all()
    return jsonify([r.serialize() for r in requests]), 200


@clinic_requests_bp.route('/admin/approve-request/<int:request_id>', methods=['POST'])
@jwt_required()
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


@clinic_requests_bp.route('/admin/reject-request/<int:request_id>', methods=['POST'])
@jwt_required()
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
