import secrets
import string

from flask import jsonify, request
from flask_jwt_extended import get_jwt, jwt_required
from flask_mailman import EmailMessage

from api.models import Clinic, ClinicRequest, RoleEnum, RequestStatus, User, db
from api.utils import roles_required
from .base import api


def generate_temp_password(length=12):
    alphabet = string.ascii_letters + string.digits + '!@#$%'
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def serialize_clinic_with_users(clinic):
    data = clinic.serialize()
    data['users'] = [u.serialize() for u in clinic.users]
    return data


@api.route('/admin/requests', methods=['GET'])
@jwt_required()
@roles_required(RoleEnum.SUPER_ADMIN)
def get_all_requests():
    claims = get_jwt()
    if claims.get('role') != RoleEnum.SUPER_ADMIN.value:
        return jsonify({'message': 'No autorizado'}), 403

    requests = ClinicRequest.query.filter_by(status=RequestStatus.PENDING).all()
    return jsonify([r.serialize() for r in requests]), 200


@api.route('/admin/approve-request/<int:request_id>', methods=['POST'])
@jwt_required()
@roles_required(RoleEnum.SUPER_ADMIN)
def approve_request(request_id):
    claims = get_jwt()
    if claims.get('role') != 'SUPER_ADMIN':
        return jsonify({'message': 'No tienes permisos'}), 403

    solicitud = ClinicRequest.query.get(request_id)
    if not solicitud or solicitud.status != RequestStatus.PENDING:
        return jsonify({'error': 'Solicitud no válida'}), 404

    temp_pw = generate_temp_password()
    nuevo_usuario = User(
        email=solicitud.email,
        full_name=solicitud.nombre_admin,
        role=RoleEnum.CLINIC_ADMIN if solicitud.tipo_solicitud == 'EMPRESA' else RoleEnum.INDEPENDENT_VET,
        is_active=True,
        must_change_password=True,
    )
    nuevo_usuario.set_password(temp_pw)
    db.session.add(nuevo_usuario)
    db.session.flush()

    nueva_clinica = Clinic(
        nombre=solicitud.nombre_clinica,
        rif=solicitud.rif_empresa if solicitud.tipo_solicitud == 'EMPRESA' else solicitud.cedula_identidad,
        ubicacion=solicitud.direccion,
        telefono=solicitud.telefono,
        correo=solicitud.email,
        is_active=True,
    )
    db.session.add(nueva_clinica)
    db.session.flush()

    nuevo_usuario.clinic_id = nueva_clinica.id
    solicitud.status = RequestStatus.APPROVED
    db.session.commit()

    try:
        msg = EmailMessage(
            subject='🎉 ¡Tu clínica ha sido aprobada! - PetHealth & Spa',
            body=f'Usuario: {solicitud.email}\nClave temporal: {temp_pw}',
            to=[solicitud.email],
        )
        msg.send()
    except Exception as e:
        print(f'Error enviando correo: {e}')

    return jsonify({'message': 'Clínica aprobada exitosamente', 'temp_password': temp_pw}), 200


@api.route('/admin/reject-request/<int:request_id>', methods=['POST'])
@jwt_required()
@roles_required(RoleEnum.SUPER_ADMIN)
def reject_request(request_id):
    claims = get_jwt()
    if claims.get('role') != 'SUPER_ADMIN':
        return jsonify({'message': 'No tienes permisos'}), 403

    solicitud = ClinicRequest.query.get(request_id)
    if not solicitud or solicitud.status != RequestStatus.PENDING:
        return jsonify({'error': 'Solicitud no encontrada o ya procesada'}), 404

    observaciones = (request.json or {}).get('observaciones', 'No se especificó un motivo detallado.')

    try:
        solicitud.status = RequestStatus.REJECTED
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

    try:
        msg = EmailMessage(
            subject='Información sobre su solicitud - PetHealth & Spa',
            body=f'Solicitud rechazada. Motivo: {observaciones}',
            to=[solicitud.email],
        )
        msg.send()
    except Exception as e:
        print(f'Error enviando correo: {e}')

    return jsonify({'message': 'Solicitud rechazada exitosamente'}), 200


@api.route('/clinics', methods=['GET', 'POST'])
@jwt_required()
@roles_required(RoleEnum.SUPER_ADMIN)
def handle_clinics():
    claims = get_jwt()
    if claims.get('role') != RoleEnum.SUPER_ADMIN.value:
        return jsonify({'message': 'Acceso restringido'}), 403

    if request.method == 'GET':
        all_clinics = Clinic.query.all()
        return jsonify([serialize_clinic_with_users(clinic) for clinic in all_clinics]), 200

    body = request.get_json() or {}
    required = ['nombre', 'rif', 'ubicacion']
    if any(not body.get(field) for field in required):
        return jsonify({'error': 'nombre, rif y ubicacion son obligatorios'}), 400

    if Clinic.query.filter_by(rif=body['rif']).first():
        return jsonify({'error': 'Ya existe una clínica con ese RIF'}), 409

    clinic = Clinic(
        nombre=body['nombre'],
        rif=body['rif'],
        ubicacion=body['ubicacion'],
        telefono=body.get('telefono'),
        correo=body.get('correo'),
        is_active=True,
    )
    db.session.add(clinic)
    db.session.commit()
    return jsonify({'message': 'Clínica creada exitosamente', 'clinic': serialize_clinic_with_users(clinic)}), 201


@api.route('/clinics/<int:clinic_id>', methods=['PUT', 'DELETE'])
@jwt_required()
@roles_required(RoleEnum.SUPER_ADMIN)
def update_or_delete_clinic(clinic_id):
    claims = get_jwt()
    if claims.get('role') != RoleEnum.SUPER_ADMIN.value:
        return jsonify({'message': 'Acceso restringido'}), 403

    clinic = Clinic.query.get(clinic_id)
    if not clinic:
        return jsonify({'error': 'Clínica no encontrada'}), 404

    if request.method == 'DELETE':
        db.session.delete(clinic)
        db.session.commit()
        return jsonify({'message': 'Clínica eliminada exitosamente'}), 200

    body = request.get_json() or {}
    if not body:
        return jsonify({'error': 'No se enviaron datos para actualizar'}), 400

    if 'rif' in body and body['rif'] != clinic.rif:
        existing = Clinic.query.filter_by(rif=body['rif']).first()
        if existing:
            return jsonify({'error': 'Ya existe una clínica con ese RIF'}), 409

    for field in ['nombre', 'rif', 'ubicacion', 'telefono', 'correo', 'suspension_reason']:
        if field in body:
            setattr(clinic, field, body[field])
    if 'is_active' in body:
        clinic.is_active = body['is_active']

    db.session.commit()
    return jsonify({'message': 'Clínica actualizada exitosamente', 'clinic': serialize_clinic_with_users(clinic)}), 200


@api.route('/clinics/<int:clinic_id>/status', methods=['PATCH'])
@jwt_required()
@roles_required(RoleEnum.SUPER_ADMIN)
def toggle_clinic_status(clinic_id):
    clinic = Clinic.query.get(clinic_id)
    if not clinic:
        return jsonify({'error': 'Clínica no encontrada'}), 404

    body = request.get_json() or {}
    clinic.is_active = not clinic.is_active
    clinic.suspension_reason = body.get('reason') if not clinic.is_active else None

    db.session.commit()
    return jsonify({'message': 'Estado de clínica actualizado', 'clinic': serialize_clinic_with_users(clinic)}), 200


@api.route('/clinics/<int:clinic_id>/staff', methods=['GET'])
@jwt_required()
@roles_required(RoleEnum.SUPER_ADMIN)
def get_clinic_staff(clinic_id):
    clinic = Clinic.query.get(clinic_id)
    if not clinic:
        return jsonify({'error': 'Clínica no encontrada'}), 404
    return jsonify([u.serialize() for u in clinic.users]), 200


@api.route('/users/<int:user_id>/status', methods=['PATCH'])
@api.route('/users/<int:user_id>/ban', methods=['PUT'])
@jwt_required()
@roles_required(RoleEnum.SUPER_ADMIN)
def update_user_status(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404

    body = request.get_json() or {}
    if 'is_active' not in body:
        return jsonify({'error': 'is_active es obligatorio'}), 400

    user.is_active = bool(body['is_active'])
    db.session.commit()
    return jsonify({'message': 'Estado de usuario actualizado', 'user': user.serialize()}), 200
