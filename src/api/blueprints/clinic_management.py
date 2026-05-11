from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from api.models import db, Clinic, RoleEnum
from api.utils import generate_staff_code, roles_required

clinic_mgmt_bp = Blueprint('clinic_management', __name__)


@clinic_mgmt_bp.route('/clinics/<int:clinic_id>/public', methods=['GET'])
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


@clinic_mgmt_bp.route('/clinics', methods=['GET'])
@jwt_required()
@roles_required(RoleEnum.SUPER_ADMIN)
def handle_clinics():
    claims = get_jwt()
    if claims.get("role") != RoleEnum.SUPER_ADMIN.value:
        return jsonify({"message": "Acceso restringido"}), 403

    all_clinics = Clinic.query.all()
    return jsonify([clinic.serialize() for clinic in all_clinics]), 200


@clinic_mgmt_bp.route('/clinics/<int:clinic_id>', methods=['PUT', 'DELETE'])
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


@clinic_mgmt_bp.route('/clinics/<int:clinic_id>/generate-code', methods=['PATCH'])
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
