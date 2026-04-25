"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, Clinic, Appointment, Pet, MedicalRecord
from api.utils import generate_sitemap, APIException
from flask_cors import CORS

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)

# COMIENZO DE LOS ENDPOINTS PARA CLÍNICAS
@api.route('/clinics', methods=['GET', 'POST'])
def handle_clinics():
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
            ubicacion=body.get('ubicacion', 'Caracas') # Valor por defecto acorde al MVP
        )

        db.session.add(new_clinic)
        db.session.commit()

        return jsonify({
            "message": "Clínica creada exitosamente", 
            "clinic": new_clinic.serialize()
        }), 201
    
@api.route('/clinics/<int:clinic_id>', methods=['PUT'])
def update_clinic(clinic_id):
    clinic = Clinic.query.get(clinic_id)
    
    if not clinic:
        return jsonify({"error": "Clínica no encontrada"}), 404

    body = request.get_json()
    if not body:
        return jsonify({"error": "No se enviaron datos para actualizar"}), 400

    # Actualización dinámica de campos
    if 'is_active' in body:
        clinic.is_active = body['is_active']
    
    if 'nombre' in body:
        clinic.nombre = body['nombre']

    if 'rif' in body:
        clinic.rif = body['rif']

    if 'ubicacion' in body:
        clinic.ubicacion = body['ubicacion']
        
    if 'suspension_reason' in body:
        clinic.suspension_reason = body['suspension_reason']

    db.session.commit()

    return jsonify({
        "message": "Clínica actualizada exitosamente",
        "clinic": clinic.serialize()
    }), 200