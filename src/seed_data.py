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

        # 3. Crear Cliente (¡CORREGIDO! Ahora pertenece a la clínica)
        client = User.query.filter_by(email="cliente@test.com").first()
        if not client:
            client = User(
                email="cliente@test.com",
                full_name="Juan Pérez",
                role=RoleEnum.CLIENTE,
                is_active=True,
                clinic_id=clinic.id # Este es el fix para que el doctor vea sus citas
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
        
        # Cita 1: Firulais (En 2 horas - Programada)
        app1 = Appointment.query.filter_by(pet_id=created_pets[0].id).first()
        if not app1:
            db.session.add(Appointment(
                date_time=datetime.now(timezone.utc) + timedelta(hours=2),
                status=AppointmentStatus.PROGRAMADA,
                tipo="Consulta Médica",
                clinic_id=clinic.id,
                pet_id=created_pets[0].id
            ))

        # Cita 2: Luna (En 4 horas - Programada)
        app2 = Appointment.query.filter_by(pet_id=created_pets[1].id).first()
        if not app2:
            db.session.add(Appointment(
                date_time=datetime.now(timezone.utc) + timedelta(hours=4),
                status=AppointmentStatus.PROGRAMADA,
                tipo="Vacunación",
                clinic_id=clinic.id,
                pet_id=created_pets[1].id
            ))

        # Cita 3: Rex (Hace 1 hora - En Atención)
        app3 = Appointment.query.filter_by(pet_id=created_pets[2].id).first()
        if not app3:
            db.session.add(Appointment(
                date_time=datetime.now(timezone.utc) - timedelta(hours=1),
                status=AppointmentStatus.EN_ATENCION, # Simulando que ya la empezaste a atender
                tipo="Emergencia",
                clinic_id=clinic.id,
                pet_id=created_pets[2].id
            ))

        db.session.commit()
        print("¡Datos inyectados con éxito! Puedes loguearte como doctor@test.com / doctor123")

if __name__ == '__main__':
    seed()