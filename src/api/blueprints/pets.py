from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import db, Pet, User
from api.utils import roles_required, RoleEnum

pets_bp = Blueprint('pets', __name__)


@pets_bp.route('/pets', methods=['GET'])
@jwt_required()
def get_user_pets():
    # El identity del token es el ID del usuario
    user_id = get_jwt_identity()

    # Filtramos mascotas por el owner_id
    pets = Pet.query.filter_by(user_id=user_id).all()

    # Retornamos la lista serializada
    return jsonify([pet.serialize() for pet in pets]), 200


@pets_bp.route('/pets', methods=['POST'])
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
