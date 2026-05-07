import os
from app import app
from api.models import db, User, Clinic, Pet, Appointment, RoleEnum, AppointmentStatus
from datetime import datetime, timedelta, timezone

def seed():
    with app.app_context():
        print("Iniciando carga de datos de prueba...")

        # 1. Crear la Clínica
        clinic = Clinic.query.filter_by(rif="J-12345678-9").first()
        if not clinic:
            clinic = Clinic(
                nombre="Veterinaria PetHealth & Spa",
                rif="J-12345678-9",
                ubicacion="Chacao, Caracas",
                telefono="0212-5551234",
                correo="contacto@pethealth.com",
                tipo_sede="EMPRESA",
                is_active=True,
                staff_code="PHS001"
            )
            db.session.add(clinic)
            db.session.flush()

        # 2. Crear Doctor
        doctor = User.query.filter_by(email="doctor@test.com").first()
        if not doctor:
            doctor = User(
                email="doctor@test.com",
                full_name="Dr. Mauricio Caldera",
                role=RoleEnum.DOCTOR,
                is_active=True,
                clinic_id=clinic.id
            )
            doctor.set_password("doctor123")
            db.session.add(doctor)

        # 3. Crear Cliente
        client = User.query.filter_by(email="cliente@test.com").first()
        if not client:
            client = User(
                email="cliente@test.com",
                full_name="Juan Pérez",
                role=RoleEnum.CLIENTE,
                is_active=True
            )
            client.set_password("cliente123")
            db.session.add(client)
            db.session.flush()

        # 4. Crear Mascota
        pet = Pet.query.filter_by(nombre="Firulais").first()
        if not pet:
            pet = Pet(
                nombre="Firulais",
                especie="Perro",
                raza="Golden Retriever",
                edad=3,
                user_id=client.id
            )
            db.session.add(pet)
            db.session.flush()

        # 5. Crear Cita para HOY (Historia 37)
        appointment = Appointment.query.filter_by(pet_id=pet.id).first()
        if not appointment:
            appointment = Appointment(
                date_time=datetime.now(timezone.utc) + timedelta(hours=2),
                status=AppointmentStatus.PROGRAMADA,
                tipo="Consulta Médica",
                clinic_id=clinic.id,
                pet_id=pet.id
            )
            db.session.add(appointment)

        db.session.commit()
        print("¡Datos inyectados con éxito! Puedes loguearte como doctor@test.com / doctor123")

if __name__ == '__main__':
    seed()