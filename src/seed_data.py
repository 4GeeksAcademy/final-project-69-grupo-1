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
            db.session.flush() # Importante para poder asignarle citas abajo

        # 3. Crear Cliente (Ahora pertenece a la clínica)
        client = User.query.filter_by(email="cliente@test.com").first()
        if not client:
            client = User(
                email="cliente@test.com",
                full_name="Juan Pérez",
                role=RoleEnum.CLIENTE,
                is_active=True,
                clinic_id=clinic.id
            )
            client.set_password("cliente123")
            db.session.add(client)
            db.session.flush()

        # 4. Crear Múltiples Mascotas
        pets_data = [
            {"nombre": "Firulais", "especie": "Canino", "raza": "Golden Retriever", "edad": 3},
            {"nombre": "Luna", "especie": "Felino", "raza": "Siamés", "edad": 2},
            {"nombre": "Rex", "especie": "Canino", "raza": "Pastor Alemán", "edad": 5}
        ]

        created_pets = []
        for p_data in pets_data:
            pet = Pet.query.filter_by(nombre=p_data["nombre"]).first()
            if not pet:
                pet = Pet(
                    nombre=p_data["nombre"],
                    especie=p_data["especie"],
                    raza=p_data["raza"],
                    edad=p_data["edad"],
                    user_id=client.id
                )
                db.session.add(pet)
                db.session.flush()
            created_pets.append(pet)

        # 5. Crear Citas a diferentes horas de HOY
        hoy = datetime.now(timezone.utc)

        # Cita 1: Firulais (Programada a las 10:00)
        app1 = Appointment.query.filter_by(pet_id=created_pets[0].id).first()
        if not app1:
            db.session.add(Appointment(
                date_time=hoy,
                time="10:00", # <--- FIX: Campo time agregado
                status=AppointmentStatus.PROGRAMADA,
                tipo="Consulta Médica",
                clinic_id=clinic.id,
                pet_id=created_pets[0].id,
                doctor_id=doctor.id # <--- FIX: Asignada al doctor para que la pueda ver
            ))

        # Cita 2: Luna (Programada a las 14:00)
        app2 = Appointment.query.filter_by(pet_id=created_pets[1].id).first()
        if not app2:
            db.session.add(Appointment(
                date_time=hoy,
                time="14:00", # <--- FIX: Campo time agregado
                status=AppointmentStatus.PROGRAMADA,
                tipo="Vacunación",
                clinic_id=clinic.id,
                pet_id=created_pets[1].id,
                doctor_id=doctor.id # <--- FIX: Asignada al doctor
            ))

        # Cita 3: Rex (En Atención a las 08:00)
        app3 = Appointment.query.filter_by(pet_id=created_pets[2].id).first()
        if not app3:
            db.session.add(Appointment(
                date_time=hoy,
                time="08:00", # <--- FIX: Campo time agregado
                status=AppointmentStatus.EN_ATENCION,
                tipo="Emergencia",
                clinic_id=clinic.id,
                pet_id=created_pets[2].id,
                doctor_id=doctor.id # <--- FIX: Asignada al doctor
            ))

        db.session.commit()
        print("¡Datos inyectados con éxito! Puedes loguearte como doctor@test.com / doctor123")

if __name__ == '__main__':
    seed()