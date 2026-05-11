from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from api.models import db, Service, Clinic
from api.utils import roles_required, RoleEnum

services_bp = Blueprint('services', __name__)


@services_bp.route('/clinics/<int:clinic_id>/services', methods=['GET'])
def get_clinic_services(clinic_id):
    active_only = request.args.get('active', 'true').lower() in [
        'true', '1', 'yes']
    query = Service.query.filter_by(clinic_id=clinic_id)
    if active_only:
        query = query.filter_by(is_active=True)
    services = query.order_by(Service.name.asc()).all()
    return jsonify([service.serialize() for service in services]), 200


@services_bp.route('/clinics/<int:clinic_id>/services', methods=['POST'])
@jwt_required()
@roles_required(RoleEnum.CLINIC_ADMIN, RoleEnum.INDEPENDENT_VET)
def create_clinic_service(clinic_id):
    claims = get_jwt()
    if claims.get('clinic_id') != clinic_id:
        return jsonify({"message": "No tienes permiso para esta clínica"}), 403

    data = request.json or {}
    name = data.get('name')
    price_usd = data.get('price_usd')
    description = data.get('description')

    if not name or price_usd is None:
        return jsonify({"message": "El nombre y el precio en USD son obligatorios"}), 400

    try:
        price_usd = float(price_usd)
    except (TypeError, ValueError):
        return jsonify({"message": "El precio debe ser un número válido"}), 400

    service = Service(
        clinic_id=clinic_id,
        name=name,
        price_usd=price_usd,
        description=description,
        is_active=True
    )
    db.session.add(service)
    db.session.commit()

    return jsonify({"message": "Servicio creado exitosamente", "service": service.serialize()}), 201


@services_bp.route('/services/<int:service_id>', methods=['PUT', 'DELETE'])
@jwt_required()
@roles_required(RoleEnum.CLINIC_ADMIN, RoleEnum.INDEPENDENT_VET)
def update_or_delete_service(service_id):
    service = Service.query.get(service_id)
    if not service:
        return jsonify({"message": "Servicio no encontrado"}), 404

    claims = get_jwt()
    if service.clinic_id != claims.get('clinic_id'):
        return jsonify({"message": "No tienes permiso para gestionar este servicio"}), 403

    if request.method == 'DELETE':
        db.session.delete(service)
        db.session.commit()
        return jsonify({"message": "Servicio eliminado correctamente"}), 200

    data = request.json or {}
    if 'name' in data:
        service.name = data.get('name')
    if 'price_usd' in data:
        try:
            service.price_usd = float(data.get('price_usd'))
        except (TypeError, ValueError):
            return jsonify({"message": "El precio debe ser un número válido"}), 400
    if 'description' in data:
        service.description = data.get('description')
    if 'is_active' in data:
        service.is_active = bool(data.get('is_active'))

    db.session.commit()
    return jsonify({"message": "Servicio actualizado", "service": service.serialize()}), 200
