from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from api.models import db, Appointment, Service, Pet, User, Clinic, AppointmentStatus, RoleEnum
from api.utils import roles_required
from datetime import datetime

appointments_bp = Blueprint('appointments', __name__)


@appointments_bp.route('/appointments', methods=['POST'])
@jwt_required()
def create_appointment():
    client_id = get_jwt_identity()
    claims = get_jwt()
    clinic_id = claims.get("clinic_id")

    data = request.json
    if not data:
        return jsonify({"message": "Cuerpo de la petición vacío"}), 400

    # 1. Extraer y validar datos del JSON
    # Aseguramos que los IDs sean enteros para evitar errores de tipo en SQLAlchemy
    try:
        pet_id = int(data.get("pet_id"))
        doctor_id = int(data.get("doctor_id"))
        date_str = data.get("date")  # Esperado: YYYY-MM-DD
        time_str = data.get("time")  # Esperado: HH:mm
        service_id = data.get("service_id")
    except (TypeError, ValueError):
        return jsonify({"message": "Los IDs de mascota y doctor deben ser números"}), 400

    if not all([pet_id, doctor_id, date_str, time_str, service_id]):
        return jsonify({"message": "Faltan datos obligatorios (mascota, doctor, fecha, hora o servicio)"}), 400

    try:
        service_id = int(service_id)
    except (TypeError, ValueError):
        return jsonify({"message": "El ID de servicio debe ser un número válido"}), 400

    # 2. Procesar la fecha
    try:
        appointment_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        print(appointment_date, "*"*20)
    except ValueError:
        return jsonify({"message": "Formato de fecha inválido. Use YYYY-MM-DD"}), 400

    # 3. Validar servicio seleccionado
    service = Service.query.get(service_id)
    if not service or service.clinic_id != clinic_id or not service.is_active:
        return jsonify({"message": "Servicio inválido o no disponible para esta clínica"}), 400

    # 4. VERIFICACIÓN DE DISPONIBILIDAD (Aquí es donde daba el error)
    # Filtramos por doctor, fecha, hora y que la cita NO esté cancelada
    conflict = Appointment.query.filter(
        Appointment.doctor_id == doctor_id,
        Appointment.date_time == appointment_date,
        Appointment.time == str(time_str),  # Forzamos a string por seguridad
        Appointment.status != AppointmentStatus.CANCELADA
    ).first()

    if conflict:
        return jsonify({"message": "El médico ya tiene una cita en ese horario"}), 409

    # 4. Validar doctor y crear la cita
    doctor = User.query.get(doctor_id)
    if not doctor or doctor.clinic_id != clinic_id:
        return jsonify({"message": "El médico seleccionado no pertenece a esta clínica"}), 400

    new_appointment = Appointment(
        clinic_id=clinic_id,
        pet_id=pet_id,
        doctor_id=doctor_id,
        date_time=appointment_date,
        time=time_str,
        tipo=service.name,
        service_id=service.id,
        service_name=service.name,
        service_price_usd=service.price_usd,
        status=AppointmentStatus.PROGRAMADA
    )

    try:
        db.session.add(new_appointment)
        db.session.commit()
        return jsonify({"message": "Cita programada", "appointment": new_appointment.serialize()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error al guardar en DB", "error": str(e)}), 500


@appointments_bp.route('/reception/appointments', methods=['GET'])
@jwt_required()
@roles_required(RoleEnum.RECEPTIONIST, RoleEnum.CLINIC_ADMIN, RoleEnum.INDEPENDENT_VET)
def get_clinic_appointments():
    # Obtenemos el clinic_id desde el token JWT
    claims = get_jwt()
    clinic_id = claims.get("clinic_id")

    if not clinic_id:
        return jsonify({"message": "Usuario no asociado a una clínica"}), 403

    # Buscamos las citas de hoy (puedes añadir filtros de fecha luego)
    appointments = Appointment.query.filter_by(clinic_id=clinic_id).all()

    return jsonify([app.serialize() for app in appointments]), 200


@appointments_bp.route('/doctor/appointments', methods=['GET'])
@jwt_required()
def get_doctor_appointments():
    # El ID lo sacamos del token del médico que inició sesión
    doctor_id = get_jwt_identity()

    # IMPORTANTE: Filtrar por doctor_id y NO traer las canceladas
    appointments = Appointment.query.filter(
        Appointment.doctor_id == doctor_id,
        Appointment.status != AppointmentStatus.CANCELADA
    ).all()

    # Usamos el serialize() que ya tiene 'pet_name', 'service_type', etc.
    return jsonify([app.serialize() for app in appointments]), 200


@appointments_bp.route('/doctor/appointments/<int:appointment_id>/status', methods=['PATCH'])
@jwt_required()
@roles_required(RoleEnum.DOCTOR, RoleEnum.INDEPENDENT_VET)
def update_appointment_status(appointment_id):
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({"message": "Cita no encontrada"}), 404

    # Validar que el doctor pertenece a la misma sede de la cita
    claims = get_jwt()
    if appointment.clinic_id != claims.get("clinic_id"):
        return jsonify({"message": "No tienes acceso a esta cita."}), 403

    data = request.json
    new_status = data.get("status")

    # Validamos que el estado enviado sea uno de nuestro Enum
    try:
        status_enum = AppointmentStatus(new_status)
    except ValueError:
        return jsonify({"message": "Estado inválido."}), 400

    appointment.status = status_enum
    db.session.commit()

    return jsonify({"message": f"Estado actualizado a {new_status}"}), 200


@appointments_bp.route('/appointments/me', methods=['GET'])
@jwt_required()
def get_client_appointments():
    user_id = get_jwt_identity()

    # 1. Obtenemos todas las mascotas de este usuario
    pets = Pet.query.filter_by(user_id=user_id).all()
    pet_ids = [pet.id for pet in pets]

    # 2. Buscamos las citas que pertenezcan a esas mascotas
    appointments = Appointment.query.filter(Appointment.pet_id.in_(
        pet_ids)).order_by(Appointment.date_time.asc()).all()

    # 3. Armamos la respuesta
    response = []
    for app in appointments:
        response.append({
            "id": app.id,
            "date": app.date_time.isoformat() if app.date_time else None,
            "time": app.time,
            "status": app.status.value,
            "service_type": app.tipo,
            "pet_name": app.pet.nombre
        })

    return jsonify(response), 200


@appointments_bp.route('/clinics/available-slots', methods=['GET'])
@jwt_required()
def get_available_slots():
    # 1. Obtener clinic_id del token y fecha de los parámetros de la URL
    claims = get_jwt()
    clinic_id = claims.get("clinic_id")
    date_str = request.args.get("date")  # Formato: YYYY-MM-DD

    if not date_str:
        return jsonify({"message": "La fecha es obligatoria"}), 400

    try:
        # Convertimos el string a objeto date de Python para filtrar en SQLAlchemy
        query_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"message": "Formato de fecha inválido. Use YYYY-MM-DD"}), 400

    # 2. Definir los bloques de 1 hora (8am a 4pm, excluyendo 12pm)
    work_slots = ["08:00", "09:00", "10:00",
                  "11:00", "13:00", "14:00", "15:00"]
    lunch_break = "12:00"

    # 3. Obtener todos los médicos activos de esta clínica
    all_doctors = User.query.filter_by(
        clinic_id=clinic_id,
        role=RoleEnum.DOCTOR,
        is_active=True
    ).all()

    if not all_doctors:
        return jsonify({"message": "No hay médicos disponibles en esta sede"}), 404

    # 4. Consultar citas ya existentes para ese día y esa clínica
    booked_appointments = Appointment.query.filter(
        Appointment.clinic_id == clinic_id,
        Appointment.date_time == query_date,
        Appointment.status != AppointmentStatus.CANCELADA
    ).all()

    # 5. Construir la respuesta cruzando horarios y médicos
    available_slots = []

    for slot_time in work_slots:
        # Buscamos quiénes están ocupados a esta hora específica
        busy_doctor_ids = [
            a.doctor_id for a in booked_appointments if a.time == slot_time]

        # Filtramos los médicos que NO están en la lista de ocupados
        free_doctors = [
            {"id": doc.id, "full_name": doc.full_name}
            for doc in all_doctors if doc.id not in busy_doctor_ids
        ]

        status = "available" if len(free_doctors) > 0 else "busy"

        available_slots.append({
            "time": slot_time,
            "status": status,
            "available_doctors": free_doctors
        })

    # Insertamos el bloque de almuerzo como informativo (índice 4)
    available_slots.insert(4, {
        "time": lunch_break,
        "status": "lunch",
        "available_doctors": []
    })

    return jsonify({
        "date": date_str,
        "clinic_id": clinic_id,
        "slots": available_slots
    }), 200


@appointments_bp.route('/appointments/<int:appointment_id>/cancel', methods=['PATCH'])
@jwt_required()
@roles_required(RoleEnum.CLIENTE)
def cancel_appointment(appointment_id):
    user_id = int(get_jwt_identity())
    appointment = Appointment.query.get(appointment_id)

    if not appointment:
        return jsonify({"message": "Cita no encontrada"}), 404

    # Seguridad: Solo el dueño de la mascota puede cancelar la cita
    if appointment.pet.user_id != user_id:
        return jsonify({"message": "No tienes permiso para cancelar esta cita"}), 403

    # Solo se pueden cancelar citas PROGRAMADAS
    if appointment.status != AppointmentStatus.PROGRAMADA:
        return jsonify({"message": "Solo puedes cancelar citas que estén programadas"}), 400

    appointment.status = AppointmentStatus.CANCELADA
    db.session.commit()

    return jsonify({"message": "Cita cancelada con éxito"}), 200
