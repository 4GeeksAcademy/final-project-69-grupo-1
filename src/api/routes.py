"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import Organization, db, User
from api.utils import generate_sitemap, APIException
from flask_cors import CORS

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)


@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():

    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }

    return jsonify(response_body), 200

@api.route('organizations', methods=['GET','POST'])
def handle_organizations():
    #metodo GET 
    if request.method == 'GET':
        all_organizations = Organization.query.all()
        result = [org.serialize() for org in all_organizations]
        return jsonify(result), 200
    #metodo POST
    if request.method == 'POST':
        body = request.get_json()
        if not body or 'name' not in body or 'rif_nit' not in body:
            return jsonify({"error": "Faltan datos obligatorios (name, rif_nit)"}), 400

        existing_org = Organization.query.filter_by(rif_nit=body['rif_nit']).first()
        if existing_org:
            return jsonify({"error": "Ya existe una organización registrada con este RIF"}), 400

        new_org = Organization(
            name=body['name'],
            rif_nit=body['rif_nit'],
            country=body.get('country', 'Venezuela') 
        )

        db.session.add(new_org)
        db.session.commit()

        return jsonify({
            "message": "Clínica creada exitosamente", 
            "organization": new_org.serialize()
        }), 201
    
@api.route('/organizations/<int:org_id>', methods=['PUT'])
def update_organization(org_id):

    organization = Organization.query.get(org_id)
    
    if not organization:
        return jsonify({"error": "Clínica no encontrada"}), 404

    body = request.get_json()
    if not body:
        return jsonify({"error": "No se enviaron datos para actualizar"}), 400


    if 'is_active' in body:
        organization.is_active = body['is_active']
    
    if 'subscription_plan' in body:
        organization.subscription_plan = body['subscription_plan']
        
    if 'billing_email' in body:
        organization.billing_email = body['billing_email']
        
    if 'contact_phone' in body:
        organization.contact_phone = body['contact_phone']

    if 'name' in body:
        organization.name = body['name']

    if 'rif_nit' in body:
        organization.rif_nit = body['rif_nit']

    if 'country' in body:
        organization.country = body['country']
        
    if 'suspension_reason' in body:
        organization.suspension_reason = body['suspension_reason']

    db.session.commit()

    return jsonify({
        "message": "Clínica actualizada exitosamente",
        "organization": organization.serialize()
    }), 200