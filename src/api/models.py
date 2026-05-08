from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
import enum

db = SQLAlchemy()

# Enums para estandarizar estados y roles
class RoleEnum(enum.Enum):
    SUPER_ADMIN = 'SUPER_ADMIN'
    CLINIC_ADMIN = 'CLINIC_ADMIN'
    INDEPENDENT_VET = 'INDEPENDENT_VET'
    DOCTOR = 'DOCTOR'
    RECEPTIONIST = 'RECEPTIONIST'
    CLIENTE = 'CLIENTE'

class AppointmentStatus(enum.Enum):
    PROGRAMADA = 'PROGRAMADA'
    EN_ATENCION = 'EN_ATENCION'
    COMPLETADA = 'COMPLETADA'
    CANCELADA = 'CANCELADA'

class RequestStatus(enum.Enum):       
    PENDING = 'PENDING'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'

class PaymentMethod(enum.Enum):
    EFECTIVO = 'EFECTIVO'
    PUNTO_DE_VENTA = 'PUNTO_DE_VENTA'
    PAGO_MOVIL = 'PAGO_MOVIL'
    ZELLE = 'ZELLE'

class ClinicRequest(db.Model):
    __tablename__ = 'clinic_requests'
    id = db.Column(db.Integer, primary_key=True)
    tipo_solicitud = db.Column(db.String(20), nullable=False) # 'EMPRESA' o 'INDEPENDIENTE'
    
    # Datos de la sede
    nombre_clinica = db.Column(db.String(120), nullable=False)
    rif_empresa = db.Column(db.String(50), nullable=True) # Solo para Empresa
    cedula_identidad = db.Column(db.String(50), nullable=False) # Para Indep o Admin de Empresa
    direccion = db.Column(db.String(255), nullable=False)
    telefono = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    
    # Datos del Admin (solo si es Empresa)
    nombre_admin = db.Column(db.String(120), nullable=True)

    # Documentos (URLs de Cloudinary/S3)
    url_cedula = db.Column(db.String(255), nullable=False)
    url_rif = db.Column(db.String(255), nullable=True)
    url_registro_mercantil = db.Column(db.String(255), nullable=True)
    url_permiso_sanitario = db.Column(db.String(255), nullable=True)
    url_titulo_profesional = db.Column(db.String(255), nullable=True)

    status = db.Column(db.Enum(RequestStatus), default=RequestStatus.PENDING)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def serialize(self):
        return {
            "id": self.id,
            "tipo": self.tipo_solicitud,
            "clinica": self.nombre_clinica,
            "rif_empresa" : self.rif_empresa,
            "cedula_admin" : self.cedula_identidad,
            "email": self.email,
            "nombre_admin": self.nombre_admin,
            "direccion" : self.direccion,
            "telefono": self.telefono,
            "status": self.status.value if self.status else "PENDING",
            "docs": {
                "cedula": self.url_cedula,
                "rif": self.url_rif,
                "mercantil": self.url_registro_mercantil,
                "sanitario": self.url_permiso_sanitario,
                "titulo": self.url_titulo_profesional
             }
        }

class Clinic(db.Model):
    __tablename__ = 'clinics'
    id = db.Column(db.Integer, primary_key=True)
    tipo_sede = db.Column(db.String(20), nullable=False)
    nombre = db.Column(db.String(120), nullable=False)
    rif = db.Column(db.String(50), unique=True, nullable=False)
    ubicacion = db.Column(db.String(255), nullable=False)
    telefono = db.Column(db.String(50), nullable=True) # Nuevo campo de contacto
    correo = db.Column(db.String(120), nullable=True)  # Nuevo campo de contacto
    is_active = db.Column(db.Boolean, default=True) 
    suspension_reason = db.Column(db.String(255), nullable=True) # Motivo de suspension que hablamos antes
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    staff_code = db.Column(db.String(20), unique=True, nullable=True)
    
    # Relaciones con borrado en cascada para poder eliminar clínicas
    users = db.relationship('User', back_populates='clinic', cascade="all, delete",foreign_keys='User.clinic_id')
    appointments = db.relationship('Appointment', back_populates='clinic', cascade="all, delete")
    payments = db.relationship('Payment', back_populates='clinic', cascade="all, delete")

    def serialize(self):
        return {
            "id": self.id,
            "tipo_sede": self.tipo_sede,
            "nombre": self.nombre,
            "rif": self.rif,
            "ubicacion": self.ubicacion,
            "telefono": self.telefono,
            "correo": self.correo,
            "is_active": self.is_active,
            "suspension_reason": self.suspension_reason,
            "staff_code": self.staff_code   
        }

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.Enum(RoleEnum), default=RoleEnum.CLIENTE, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False) # Nuevo: para vetar doctores o clientes
    clinic_id = db.Column(db.Integer, db.ForeignKey('clinics.id'), nullable=True) 
    staff_cod = db.Column(db.String(20), db.ForeignKey('clinics.staff_code'), nullable=True)
    must_change_password = db.Column(db.Boolean(), nullable=False, default=False)
    
    # Relaciones
    clinic = db.relationship('Clinic', back_populates='users',foreign_keys=[clinic_id])
    pets = db.relationship('Pet', back_populates='owner', cascade="all, delete")
    appointments_as_doctor = db.relationship('Appointment', back_populates='doctor')
    medical_records = db.relationship('MedicalRecord', back_populates='doctor')
    payments_processed = db.relationship('Payment', back_populates='cashier')

    @property
    def password(self):
        raise AttributeError('La contraseña no es un atributo legible')
    
    @password.setter
    def password(self, password):
        # Cada vez que hagas user.password = "nueva_clave", se ejecutará esto:
        self.password_hash = generate_password_hash(password)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role.value,
            "is_active": self.is_active,
            "must_change_password": self.must_change_password,
            "clinic_id": self.clinic_id,
            "clinic_name": self.clinic.nombre if self.clinic else "Sin Clínica",
            "staff_code": self.clinic.staff_code if self.clinic else "No asignado"
        }

class Pet(db.Model):
    __tablename__ = 'pets'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(80), nullable=False)
    especie = db.Column(db.String(50), nullable=False) 
    raza = db.Column(db.String(80), nullable=True)
    edad = db.Column(db.Integer, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Relaciones
    owner = db.relationship('User', back_populates='pets')
    appointments = db.relationship('Appointment', back_populates='pet', cascade="all, delete")
    medical_history = db.relationship('MedicalRecord', back_populates='pet', cascade="all, delete")

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "raza": self.raza,
            "edad": self.edad,
            "especie": self.especie,
            "owner_email": self.owner.email if self.owner else None
        }

class Appointment(db.Model):
    __tablename__ = 'appointments'
    id = db.Column(db.Integer, primary_key=True)
    date_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.Enum(AppointmentStatus), default=AppointmentStatus.PROGRAMADA)
    tipo = db.Column(db.String(50), nullable=False) 
    
    clinic_id = db.Column(db.Integer, db.ForeignKey('clinics.id'), nullable=False)
    pet_id = db.Column(db.Integer, db.ForeignKey('pets.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) 
    payment = db.relationship('Payment', back_populates='appointment', uselist=False, cascade="all, delete")

    # Relaciones
    clinic = db.relationship('Clinic', back_populates='appointments')
    pet = db.relationship('Pet', back_populates='appointments')
    doctor = db.relationship('User', back_populates='appointments_as_doctor')
    record = db.relationship('MedicalRecord', back_populates='appointment', uselist=False, cascade="all, delete")

class MedicalRecord(db.Model):
    __tablename__ = 'medical_records'
    id = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # --- Datos de Triaje (Toma de vitales) ---
    motivo = db.Column(db.String(200), nullable=False)
    peso = db.Column(db.Float, nullable=True) # Guardado en Kilogramos (ej: 12.5)
    temperatura = db.Column(db.Float, nullable=True) # Guardado en °C (ej: 38.5)
    
    # --- Evaluación Médica ---
    diagnostico = db.Column(db.Text, nullable=False) 
    tratamiento = db.Column(db.Text, nullable=False)
    examenes = db.Column(db.Text, nullable=True) # Qué pruebas de laboratorio se mandan
    
    # --- Relaciones ---
    pet_id = db.Column(db.Integer, db.ForeignKey('pets.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'), nullable=True)

    # Relaciones (se mantienen igual)
    pet = db.relationship('Pet', back_populates='medical_history')
    doctor = db.relationship('User', back_populates='medical_records')
    appointment = db.relationship('Appointment', back_populates='record')

    def serialize(self):
        return {
            "id": self.id,
            "fecha": self.fecha.isoformat() if self.fecha else None,
            "motivo": self.motivo,
            "peso": self.peso,
            "temperatura": self.temperatura,
            "diagnostico": self.diagnostico,
            "tratamiento": self.tratamiento,
            "examenes": self.examenes,
            "doctor_name": self.doctor.full_name if self.doctor else "Desconocido"
        }

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