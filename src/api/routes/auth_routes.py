import os
from flask import jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from api.models import Clinic, User, db
from api.utils import setup_initial_admins
from .base import api


@api.route('/master-setup', methods=['POST'])
def master_setup():
    master_key = os.getenv('MASTER_KEY')
    client_key = request.headers.get('X-Master-Key')

    if not master_key or client_key != master_key:
        return jsonify({'error': 'No autorizado'}), 401

    setup_initial_admins()
    return jsonify({'message': 'Sincronización de administradores completada'}), 200


@api.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if user and user.check_password(password):
        if user.clinic_id:
            clinic = Clinic.query.get(user.clinic_id)
            if clinic and not clinic.is_active:
                return jsonify({
                    'message': f"Acceso Denegado: La sede '{clinic.nombre}' ha sido suspendida.",
                    'reason': clinic.suspension_reason,
                }), 403

        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                'role': user.role.value,
                'clinic_id': user.clinic_id,
                'must_change_password': user.must_change_password,
            },
        )
        return jsonify({'token': access_token, 'user': user.serialize()}), 200
    return jsonify({'message': 'Email o contraseña incorrectos'}), 401


@api.route('/me', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    return jsonify(user.serialize()), 200


@api.route('/update-password', methods=['PATCH'])
@jwt_required()
def update_password():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    body = request.json

    new_password = body.get('new_password')
    if not new_password or len(new_password) < 6:
        return jsonify({'error': 'La contraseña debe tener al menos 6 caracteres'}), 400

    user.set_password(new_password)
    user.must_change_password = False
    db.session.commit()

    return jsonify({'message': 'Contraseña actualizada exitosamente'}), 200
