from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from api.models import db, User, RoleEnum
from api.utils import roles_required
import requests

utils_bp = Blueprint('utils_routes', __name__)


@utils_bp.route('/exchange-rate', methods=['GET'])
def get_exchange_rate():
    try:
        # Llamada a DolarAPI para obtener solo el BCV
        response = requests.get("https://ve.dolarapi.com/v1/dolares/oficial")

        if response.status_code == 200:
            data = response.json()
            return jsonify({
                "rate": data['promedio'],  # Este es el valor del dólar
                "last_update": data['fechaActualizacion']
            }), 200

        return jsonify({"message": "No se pudo obtener la tasa"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@utils_bp.route('/doctor/search-clients', methods=['GET'])
@jwt_required()
@roles_required(RoleEnum.DOCTOR, RoleEnum.INDEPENDENT_VET)
def search_clients():
    query = request.args.get('q', '').strip()

    if len(query) < 3:
        return jsonify({"message": "Ingresa al menos 3 caracteres para buscar"}), 400

    # Buscamos usuarios que sean CLIENTES y que el nombre o email coincidan con la búsqueda
    # Usamos ilike para que no importe si escriben en mayúsculas o minúsculas
    clients = User.query.filter(
        User.role == RoleEnum.CLIENTE,
        db.or_(
            User.email.ilike(f'%{query}%'),
            User.full_name.ilike(f'%{query}%')
        )
    ).all()

    # Armamos una respuesta que incluya al cliente Y a sus mascotas directamente
    results = []
    for client in clients:
        results.append({
            "id": client.id,
            "full_name": client.full_name,
            "email": client.email,
            # Aprovechamos la relación de SQLAlchemy
            "pets": [pet.serialize() for pet in client.pets]
        })

    return jsonify(results), 200
