"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, Clinic, Appointment, Pet, MedicalRecord
from api.utils import generate_sitemap, APIException
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from flask_cors import CORS

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)

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
                "clinic_id": user.clinic_id
                })
        return jsonify({"token": access_token, "user": user.serialize()}), 200
    return jsonify({"message": "Email o contraseña incorrectos"}), 401

@api.route('/me', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    return jsonify(user.serialize()), 200

## COMIENZO DE LOS ENDPOINTS PARA CLÍNICAS
@api.route('/clinics', methods=['GET', 'POST'])
@jwt_required()
def handle_clinics():

    claims = get_jwt()
    if claims.get("role") != RoleEnum.SUPER_ADMIN.value:
        return jsonify({"message": "Acceso restringido a administradores del sistema"}), 403
    
    # Método GET: Obtener todas las clínicas
    if request.method == 'GET':
        all_clinics = Clinic.query.all()
        result = [clinic.serialize() for clinic in all_clinics]
        return jsonify(result), 200

    # Método POST: Crear una nueva clínica
    if request.method == 'POST':
        body = request.get_json()
        if not body or 'nombre' not in body or 'rif' not in body:
            return jsonify({"error": "Faltan datos obligatorios (nombre, rif)"}), 400

        existing_clinic = Clinic.query.filter_by(rif=body['rif']).first()
        if existing_clinic:
            return jsonify({"error": "Ya existe una clínica registrada con este RIF"}), 400

        new_clinic = Clinic(
            nombre=body['nombre'],
            rif=body['rif'],
            ubicacion=body.get('ubicacion', 'Caracas'), # Valor por defecto
            telefono=body.get('telefono', None),        # Capturamos el teléfono
            correo=body.get('correo', None)             # Capturamos el correo
        )

        db.session.add(new_clinic)
        db.session.commit()

        return jsonify({
            "message": "Clínica creada exitosamente", 
            "clinic": new_clinic.serialize()
        }), 201
    
@api.route('/clinics/<int:clinic_id>', methods=['PUT', 'DELETE'])
@jwt_required()
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
            if not clinic.is_active and 'suspension_reason' not in body:
                clinic.suspension_reason = "Suspensión administrativa"
                
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