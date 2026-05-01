from datetime import datetime

from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from api.models import Appointment, AppointmentStatus, Clinic, db
from .base import api


@api.route('/appointments', methods=['POST'])
@jwt_required()
def create_appointment():
    user_id = get_jwt_identity()
    body = request.json

    if not body.get('pet_id') or not body.get('date'):
        return jsonify({'msg': 'Faltan datos obligatorios'}), 400

    try:
        date_obj = datetime.fromisoformat(body['date'].replace('Z', '+00:00'))
    except Exception:
        return jsonify({'msg': 'Formato de fecha inválido'}), 400

    clinic = Clinic.query.filter_by(is_active=True).first()
    if not clinic:
        return jsonify({'msg': 'No hay clínicas disponibles'}), 404

    new_appointment = Appointment(
        date_time=date_obj,
        tipo=body.get('service_type', 'Consulta'),
        status=AppointmentStatus.PROGRAMADA,
        pet_id=body['pet_id'],
        clinic_id=clinic.id,
        user_id=user_id,
    )
    db.session.add(new_appointment)
    db.session.commit()

    return jsonify({'msg': 'Cita solicitada con éxito'}), 201
