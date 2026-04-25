from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
import enum

db = SQLAlchemy()

# Enums para estandarizar estados y roles
class RoleEnum(enum.Enum):
    SUPER_ADMIN = 'SUPER_ADMIN'
    CLINIC_ADMIN = 'CLINIC_ADMIN'
    DOCTOR = 'DOCTOR'
    CLIENTE = 'CLIENTE'

class AppointmentStatus(enum.Enum):
    PROGRAMADA = 'PROGRAMADA'
    COMPLETADA = 'COMPLETADA'
    CANCELADA = 'CANCELADA'

class PaymentMethod(enum.Enum):
    EFECTIVO = 'EFECTIVO'
    PUNTO_DE_VENTA = 'PUNTO_DE_VENTA'
    PAGO_MOVIL = 'PAGO_MOVIL'
    ZELLE = 'ZELLE'
class Clinic(db.Model):
    __tablename__ = 'clinics'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(120), nullable=False)
    rif = db.Column(db.String(50), unique=True, nullable=False)
    ubicacion = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True) # El "botón de apagado"
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relaciones
    users = db.relationship('User', back_populates='clinic')
    appointments = db.relationship('Appointment', back_populates='clinic')
    payments = db.relationship('Payment', back_populates='clinic')

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "rif": self.rif,
            "is_active": self.is_active
        }

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.Enum(RoleEnum), default=RoleEnum.CLIENTE, nullable=False)
    clinic_id = db.Column(db.Integer, db.ForeignKey('clinics.id'), nullable=True) # Opcional para Super Admin

    # Relaciones
    clinic = db.relationship('Clinic', back_populates='users')
    pets = db.relationship('Pet', back_populates='owner')
    appointments_as_doctor = db.relationship('Appointment', back_populates='doctor')
    medical_records = db.relationship('MedicalRecord', back_populates='doctor')
    payments_processed = db.relationship('Payment', back_populates='cashier')

    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role.value,
            "clinic_id": self.clinic_id
        }

class Pet(db.Model):
    __tablename__ = 'pets'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(80), nullable=False)
    especie = db.Column(db.String(50), nullable=False) # Perro, Gato, etc.
    raza = db.Column(db.String(80), nullable=True)
    edad = db.Column(db.Integer, nullable=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Relaciones
    owner = db.relationship('User', back_populates='pets')
    appointments = db.relationship('Appointment', back_populates='pet')
    medical_history = db.relationship('MedicalRecord', back_populates='pet')

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "especie": self.especie,
            "owner_email": self.owner.email if self.owner else None
        }

class Appointment(db.Model):
    __tablename__ = 'appointments'
    id = db.Column(db.Integer, primary_key=True)
    date_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.Enum(AppointmentStatus), default=AppointmentStatus.PROGRAMADA)
    tipo = db.Column(db.String(50), nullable=False) # 'Médica' o 'Barbería'
    
    clinic_id = db.Column(db.Integer, db.ForeignKey('clinics.id'), nullable=False)
    pet_id = db.Column(db.Integer, db.ForeignKey('pets.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) # Opcional si es barbería
    payment = db.relationship('Payment', back_populates='appointment', uselist=False)

    # Relaciones
    clinic = db.relationship('Clinic', back_populates='appointments')
    pet = db.relationship('Pet', back_populates='appointments')
    doctor = db.relationship('User', back_populates='appointments_as_doctor')
    record = db.relationship('MedicalRecord', back_populates='appointment', uselist=False)

class MedicalRecord(db.Model):
    __tablename__ = 'medical_records'
    id = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    motivo = db.Column(db.String(200), nullable=False)
    diagnostico_tratamiento = db.Column(db.Text, nullable=False) # Texto libre para rapidez
    
    pet_id = db.Column(db.Integer, db.ForeignKey('pets.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'), nullable=True)

    # Relaciones
    pet = db.relationship('Pet', back_populates='medical_history')
    doctor = db.relationship('User', back_populates='medical_records')
    appointment = db.relationship('Appointment', back_populates='record')

class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    clinic_id = db.Column(db.Integer, db.ForeignKey('clinics.id'), nullable=False)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'), unique=True, nullable=False)
    cashier_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.Enum(PaymentMethod), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    clinic = db.relationship('Clinic', back_populates='payments')
    appointment = db.relationship('Appointment', back_populates='payment')
    cashier = db.relationship('User', back_populates='payments_processed')

    def serialize(self):
        return {
            "id": self.id,
            "clinic_id": self.clinic_id,
            "appointment_id": self.appointment_id,
            "cashier_id": self.cashier_id,
            "amount": self.amount,
            "payment_method": self.payment_method.value if self.payment_method else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }