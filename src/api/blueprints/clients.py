from flask import Blueprint, request, jsonify
from api.models import db, User, RoleEnum

clients_bp = Blueprint('clients', __name__)


@clients_bp.route('/register-client', methods=['POST'])
def register_client():
    data = request.json

    # 1. Extraer datos del JSON
    full_name = data.get("full_name")
    email = data.get("email")
    password = data.get("password")
    clinic_id = data.get("clinic_id")

    # 2. Validaciones básicas
    if not email or not password or not full_name:
        return jsonify({"message": "Todos los campos son obligatorios"}), 400

    # 3. Verificar si el usuario ya existe
    user_exists = User.query.filter_by(email=email).first()
    if user_exists:
        return jsonify({"message": "El correo electrónico ya está registrado"}), 400

    try:
        # 4. Crear el nuevo usuario con rol de CLIENTE
        new_client = User(
            full_name=full_name,
            email=email,
            password=password,
            role=RoleEnum.CLIENTE,
            clinic_id=clinic_id,
            is_active=True,
            must_change_password=False
        )

        new_client.set_password(password)
        db.session.add(new_client)
        db.session.commit()

        return jsonify({
            "message": "Cliente registrado exitosamente",
            "client": {
                "id": new_client.id,
                "email": new_client.email,
                "clinic_id": new_client.clinic_id
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error interno del servidor", "error": str(e)}), 500
