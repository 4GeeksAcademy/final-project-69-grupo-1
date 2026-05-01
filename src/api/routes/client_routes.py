import os
import cloudinary.uploader
from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_mailman import EmailMessage

from api.models import ClinicRequest, Pet, User, db
from .base import api


@api.route('/submit-registration', methods=['POST'])
def submit_registration():
    data = request.form
    files = request.files
    email = data.get('email')

    if not email:
        return jsonify({'error': 'El campo email es obligatorio'}), 400

    if User.query.filter_by(email=email).first() or ClinicRequest.query.filter_by(email=email).first():
        return jsonify({'error': 'El correo ya está registrado o en proceso de revisión'}), 400

    def upload_file(file_key):
        if file_key not in files:
            return None
        try:
            result = cloudinary.uploader.upload(files[file_key], resource_type='auto', access_mode='public', type='upload')
            return result['secure_url']
        except Exception as e:
            print(f'Error subiendo {file_key}: {e}')
            return None

    url_cedula = upload_file('file_cedula')
    if not url_cedula:
        return jsonify({'error': 'No se pudo cargar la Cédula de Identidad'}), 400

    new_request = ClinicRequest(
        tipo_solicitud=data.get('tipo_solicitud'),
        nombre_clinica=data.get('nombre_clinica'),
        rif_empresa=data.get('rif_empresa'),
        cedula_identidad=data.get('cedula_identidad'),
        direccion=data.get('direccion'),
        telefono=data.get('telefono'),
        email=email,
        nombre_admin=data.get('nombre_admin'),
        url_cedula=url_cedula,
        url_rif=upload_file('file_rif'),
        url_registro_mercantil=upload_file('file_mercantil'),
        url_permiso_sanitario=upload_file('file_sanitario'),
        url_titulo_profesional=upload_file('file_titulo'),
    )
    db.session.add(new_request)
    db.session.commit()

    try:
        EmailMessage(subject='🔔 NUEVA SOLICITUD - PetHealth & Spa', body=f'Nueva solicitud: {new_request.nombre_clinica}', to=[os.getenv('MAIL_USERNAME')]).send()
        EmailMessage(subject='Solicitud Recibida - PetHealth & Spa', body=f'Hola {new_request.nombre_admin}, recibimos tus documentos.', to=[email]).send()
    except Exception as e:
        print(f'Error de envío de mail: {e}')

    return jsonify({'message': 'Solicitud recibida exitosamente'}), 201


@api.route('/users/me/pets', methods=['GET'])
@jwt_required()
def get_my_pets():
    user_id = get_jwt_identity()
    pets = Pet.query.filter_by(user_id=user_id).all()
    return jsonify([pet.serialize() for pet in pets]), 200


@api.route('/pets', methods=['POST'])
@jwt_required()
def add_pet():
    user_id = get_jwt_identity()
    body = request.json
    if not body.get('nombre'):
        return jsonify({'msg': 'Nombre obligatorio'}), 400

    new_pet = Pet(nombre=body['nombre'], especie=body.get('especie', 'Otro'), raza=body.get('raza', 'Desconocida'), user_id=user_id)
    db.session.add(new_pet)
    db.session.commit()
    return jsonify(new_pet.serialize()), 201
