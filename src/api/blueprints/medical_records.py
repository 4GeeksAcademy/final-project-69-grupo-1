from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from api.models import db, MedicalRecord, Appointment, Pet, User, AppointmentStatus, RoleEnum
from api.utils import roles_required

medical_bp = Blueprint('medical_records', __name__)


@medical_bp.route('/doctor/appointments/<int:appointment_id>/medical-record', methods=['POST'])
@jwt_required()
@roles_required(RoleEnum.DOCTOR, RoleEnum.INDEPENDENT_VET)
def create_medical_record(appointment_id):
    current_user_id = int(get_jwt_identity())
    claims = get_jwt()
    appointment = Appointment.query.get(appointment_id)

    if not appointment:
        return jsonify({"message": "Cita no encontrada"}), 404

    # Validar sede
    if appointment.clinic_id != claims.get("clinic_id"):
        return jsonify({"message": "No tienes acceso a esta cita."}), 403

    if appointment.record:
        return jsonify({"message": "La cita ya tiene una historia clínica registrada"}), 409

    body = request.get_json(silent=True) or {}

    # Capturamos todos los datos médicos nuevos
    motivo = body.get("motivo", "Consulta general")
    peso = body.get("peso")
    temperatura = body.get("temperatura")
    diagnostico = body.get("diagnostico")
    tratamiento = body.get("tratamiento")
    examenes = body.get("examenes")

    # Validación mínima
    if not diagnostico or not tratamiento:
        return jsonify({"message": "El diagnóstico y el tratamiento son obligatorios"}), 400

    # Asociamos al doctor y dejamos la cita en estado de pago pendiente.
    appointment.doctor_id = current_user_id
    appointment.status = AppointmentStatus.PENDIENTE_PAGO

    # AQUÍ ESTABA EL ERROR: Ahora usamos los campos correctos para crear el registro
    new_record = MedicalRecord(
        motivo=motivo,
        peso=peso,
        temperatura=temperatura,
        diagnostico=diagnostico,
        tratamiento=tratamiento,
        examenes=examenes,
        pet_id=appointment.pet_id,
        doctor_id=current_user_id,
        appointment_id=appointment.id
    )

    db.session.add(new_record)
    db.session.commit()

    return jsonify({"message": "Historia médica guardada con éxito."}), 201


@medical_bp.route('/pets/<int:pet_id>/medical-records', methods=['GET'])
@jwt_required()
def get_pet_medical_history(pet_id):
    # 1. Buscamos la mascota
    pet = Pet.query.get(pet_id)
    if not pet:
        return jsonify({"message": "Mascota no encontrada"}), 404

    current_user_id = int(get_jwt_identity())
    claims = get_jwt()

    # 2. Seguridad: Si el que pide la historia es un CLIENTE, verificamos que sea SU mascota.
    # Si es un DOCTOR o ADMIN, lo dejamos pasar para que evalúe al paciente.
    if claims.get("role") == "CLIENTE" and pet.user_id != current_user_id:
        return jsonify({"message": "No tienes acceso al historial de esta mascota"}), 403

    # 3. Buscamos todas las historias de esta mascota ordenadas de la más nueva a la más vieja
    records = MedicalRecord.query.filter_by(
        pet_id=pet_id).order_by(MedicalRecord.fecha.desc()).all()

    # 4. Usamos el serialize que agregamos a models.py para mandarlo bonito al frontend
    return jsonify([record.serialize() for record in records]), 200


@medical_bp.route('/medical-records', methods=['GET'])
@jwt_required()
@roles_required(RoleEnum.SUPER_ADMIN)
def get_all_medical_records():
    """
    Endpoint para que el Super Admin obtenga la lista de todos los registros médicos del sistema.
    Para auditoría y gestión centralizada.
    Query params:
        - clinic_id: Filtra por clínica
        - doctor_id: Filtra por doctor/veterinario
        - pet_id: Filtra por mascota
        - date_from: Filtra desde esta fecha (formato: YYYY-MM-DD)
        - date_to: Filtra hasta esta fecha (formato: YYYY-MM-DD)
    """
    try:
        from datetime import datetime

        # Obtener parámetros de filtro
        clinic_id = request.args.get('clinic_id', type=int)
        doctor_id = request.args.get('doctor_id', type=int)
        pet_id = request.args.get('pet_id', type=int)
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')

        # Construir query base
        query = MedicalRecord.query

        # Aplicar filtros si están presentes
        if clinic_id:
            # Filtrar por clínica: buscamos registros de doctores de esa clínica
            query = query.join(User, MedicalRecord.doctor_id == User.id).filter(
                User.clinic_id == clinic_id
            )

        if doctor_id:
            query = query.filter_by(doctor_id=doctor_id)

        if pet_id:
            query = query.filter_by(pet_id=pet_id)

        if date_from:
            try:
                from_date = datetime.strptime(date_from, "%Y-%m-%d").date()
                query = query.filter(MedicalRecord.fecha >= from_date)
            except ValueError:
                return jsonify({"message": "Formato de date_from inválido (use YYYY-MM-DD)"}), 400

        if date_to:
            try:
                from datetime import timedelta
                to_date = datetime.strptime(date_to, "%Y-%m-%d").date()
                # Para incluir todo el día
                to_date = to_date + timedelta(days=1)
                query = query.filter(MedicalRecord.fecha < to_date)
            except ValueError:
                return jsonify({"message": "Formato de date_to inválido (use YYYY-MM-DD)"}), 400

        # Ejecutar query ordenado por fecha descendente (más recientes primero)
        records = query.order_by(MedicalRecord.fecha.desc()).all()

        # Serializar respuesta
        return jsonify([record.serialize() for record in records]), 200

    except Exception as e:
        return jsonify({"message": f"Error al obtener registros médicos: {str(e)}"}), 500