from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
import enum

db = SQLAlchemy()

class RoleEnum(enum.Enum):
    ADMIN = 'ADMIN'
    MEDICO = 'MEDICO'
    RECEPCION = 'RECEPCION'
    CAJA = 'CAJA'

class AppointmentStatus(enum.Enum):
    EN_ESPERA = 'EN_ESPERA'
    EN_PROCESO = 'EN_PROCESO'
    FINALIZADO = 'FINALIZADO'
    PAGADO = 'PAGADO'

class PaymentMethod(enum.Enum):
    EFECTIVO = 'EFECTIVO'
    TARJETA = 'TARJETA'
    TRANSFERENCIA = 'TRANSFERENCIA'
    SEGURO = 'SEGURO'



class Organization(db.Model):
    __tablename__ = 'organizations'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    rif_nit = db.Column(db.String(50), unique=True, nullable=False)
    country = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    owner_id = db.Column(
        db.Integer, 
        db.ForeignKey('users.id', use_alter=True, name='fk_organization_owner'), 
        nullable=True
    )

    owner = db.relationship('User', foreign_keys=[owner_id], post_update=True)
    users = db.relationship('User', back_populates='organization', foreign_keys='User.tenant_id', cascade="all, delete-orphan")
    patients = db.relationship('Patient', back_populates='organization', cascade="all, delete-orphan")
    appointments = db.relationship('Appointment', back_populates='organization', cascade="all, delete-orphan")
    medical_records = db.relationship('MedicalRecord', back_populates='organization', cascade="all, delete-orphan")
    payments = db.relationship('Payment', back_populates='organization', cascade="all, delete-orphan")

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "rif_nit": self.rif_nit,
            "country": self.country,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "owner_id": self.owner_id
        }

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.Enum(RoleEnum), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    organization = db.relationship('Organization', foreign_keys=[tenant_id], back_populates='users')
    appointments_as_doctor = db.relationship('Appointment', back_populates='doctor', foreign_keys='Appointment.doctor_id')
    records_validated = db.relationship('MedicalRecord', back_populates='doctor', foreign_keys='MedicalRecord.doctor_id')
    payments_processed = db.relationship('Payment', back_populates='cashier', foreign_keys='Payment.cashier_id')

    def serialize(self):
        return {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "email": self.email,
            # NUNCA serializar el password_hash por seguridad
            "full_name": self.full_name,
            "role": self.role.value if self.role else None,
            "is_active": self.is_active
        }

class Patient(db.Model):
    __tablename__ = 'patients'
    __table_args__ = (db.UniqueConstraint('tenant_id', 'document_id', name='uq_tenant_document'),)

    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    document_id = db.Column(db.String(50), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    phone = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), nullable=True)

    organization = db.relationship('Organization', back_populates='patients')
    appointments = db.relationship('Appointment', back_populates='patient', cascade="all, delete-orphan")

    def serialize(self):
        return {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "document_id": self.document_id,
            "date_of_birth": self.date_of_birth.isoformat() if self.date_of_birth else None,
            "phone": self.phone,
            "email": self.email
        }

class Appointment(db.Model):
    __tablename__ = 'appointments'

    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.Enum(AppointmentStatus), default=AppointmentStatus.EN_ESPERA, nullable=False)

    organization = db.relationship('Organization', back_populates='appointments')
    patient = db.relationship('Patient', back_populates='appointments')
    doctor = db.relationship('User', back_populates='appointments_as_doctor')
    
    medical_record = db.relationship('MedicalRecord', back_populates='appointment', uselist=False, cascade="all, delete-orphan")
    payment = db.relationship('Payment', back_populates='appointment', uselist=False, cascade="all, delete-orphan")

    def serialize(self):
        return {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "patient_id": self.patient_id,
            "doctor_id": self.doctor_id,
            "date_time": self.date_time.isoformat() if self.date_time else None,
            "status": self.status.value if self.status else None
        }

class MedicalRecord(db.Model):
    __tablename__ = 'medical_records'

    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'), unique=True, nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    reason_for_visit = db.Column(db.Text, nullable=False)
    blood_pressure = db.Column(db.String(20), nullable=True)
    heart_rate = db.Column(db.Integer, nullable=True)
    weight = db.Column(db.Float, nullable=True)
    temperature = db.Column(db.Float, nullable=True)

    clinical_findings = db.Column(db.Text, nullable=True)
    treatment_plan = db.Column(db.Text, nullable=True)
    is_locked = db.Column(db.Boolean, default=False, nullable=False)

    organization = db.relationship('Organization', back_populates='medical_records')
    appointment = db.relationship('Appointment', back_populates='medical_record')
    doctor = db.relationship('User', back_populates='records_validated')

    def serialize(self):
        return {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "appointment_id": self.appointment_id,
            "doctor_id": self.doctor_id,
            "reason_for_visit": self.reason_for_visit,
            "blood_pressure": self.blood_pressure,
            "heart_rate": self.heart_rate,
            "weight": self.weight,
            "temperature": self.temperature,
            "clinical_findings": self.clinical_findings,
            "treatment_plan": self.treatment_plan,
            "is_locked": self.is_locked
        }

class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'), unique=True, nullable=False)
    cashier_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.Enum(PaymentMethod), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    organization = db.relationship('Organization', back_populates='payments')
    appointment = db.relationship('Appointment', back_populates='payment')
    cashier = db.relationship('User', back_populates='payments_processed')

    def serialize(self):
        return {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "appointment_id": self.appointment_id,
            "cashier_id": self.cashier_id,
            "amount": self.amount,
            "payment_method": self.payment_method.value if self.payment_method else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }