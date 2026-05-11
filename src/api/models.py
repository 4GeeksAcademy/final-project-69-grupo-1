from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
from sqlalchemy import func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Float, Boolean, DateTime, Text, Enum as SQLEnum
from werkzeug.security import generate_password_hash, check_password_hash
import enum
from typing import Optional, List

db = SQLAlchemy()


def utcnow():
    return datetime.now(timezone.utc)


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
    PENDIENTE_PAGO = 'PENDIENTE_PAGO'
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

    id: Mapped[int] = mapped_column(primary_key=True)
    tipo_solicitud: Mapped[str] = mapped_column(String(20), nullable=False)
    nombre_clinica: Mapped[str] = mapped_column(String(120), nullable=False)
    rif_empresa: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True)
    cedula_identidad: Mapped[str] = mapped_column(String(50), nullable=False)
    direccion: Mapped[str] = mapped_column(String(255), nullable=False)
    telefono: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False)
    nombre_admin: Mapped[Optional[str]] = mapped_column(
        String(120), nullable=True)
    url_cedula: Mapped[str] = mapped_column(String(255), nullable=False)
    url_rif: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    url_registro_mercantil: Mapped[Optional[str]
                                   ] = mapped_column(String(255), nullable=True)
    url_permiso_sanitario: Mapped[Optional[str]
                                  ] = mapped_column(String(255), nullable=True)
    url_titulo_profesional: Mapped[Optional[str]
                                   ] = mapped_column(String(255), nullable=True)
    status: Mapped[RequestStatus] = mapped_column(
        SQLEnum(RequestStatus, native_enum=False), nullable=False,
        default=RequestStatus.PENDING)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), default=utcnow)

    def serialize(self):
        return {
            "id": self.id,
            "tipo": self.tipo_solicitud,
            "clinica": self.nombre_clinica,
            "rif_empresa": self.rif_empresa,
            "cedula_admin": self.cedula_identidad,
            "email": self.email,
            "nombre_admin": self.nombre_admin,
            "direccion": self.direccion,
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

    id: Mapped[int] = mapped_column(primary_key=True)
    tipo_sede: Mapped[str] = mapped_column(String(20), nullable=False)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    rif: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    ubicacion: Mapped[str] = mapped_column(String(255), nullable=False)
    telefono: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    correo: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    suspension_reason: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), default=utcnow)
    staff_code: Mapped[Optional[str]] = mapped_column(
        String(20), unique=True, nullable=True)

    users: Mapped[List["User"]] = relationship(
        back_populates='clinic',
        cascade="all, delete",
        foreign_keys="User.clinic_id")
    appointments: Mapped[List["Appointment"]] = relationship(
        back_populates='clinic', cascade="all, delete")
    payments: Mapped[List["Payment"]] = relationship(
        back_populates='clinic', cascade="all, delete")
    services: Mapped[List["Service"]] = relationship(
        back_populates='clinic', cascade="all, delete")

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

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    role: Mapped[RoleEnum] = mapped_column(
        SQLEnum(RoleEnum, native_enum=False), nullable=False,
        default=RoleEnum.CLIENTE)
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False)
    clinic_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey('clinics.id'), nullable=True)
    staff_cod: Mapped[Optional[str]] = mapped_column(
        ForeignKey('clinics.staff_code'), nullable=True)
    must_change_password: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False)

    clinic: Mapped[Optional["Clinic"]] = relationship(
        back_populates='users', foreign_keys=[clinic_id])
    pets: Mapped[List["Pet"]] = relationship(
        back_populates='owner', cascade="all, delete")
    appointments_as_doctor: Mapped[List["Appointment"]] = relationship(
        back_populates='doctor')
    medical_records: Mapped[List["MedicalRecord"]] = relationship(
        back_populates='doctor')
    payments_processed: Mapped[List["Payment"]] = relationship(
        back_populates='cashier')

    @property
    def password(self):
        raise AttributeError('La contraseña no es un atributo legible')

    @password.setter
    def password(self, password):
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

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(80), nullable=False)
    especie: Mapped[str] = mapped_column(String(50), nullable=False)
    raza: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    edad: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey('users.id'), nullable=False)

    owner: Mapped["User"] = relationship(back_populates='pets')
    appointments: Mapped[List["Appointment"]] = relationship(
        back_populates='pet', cascade="all, delete")
    medical_history: Mapped[List["MedicalRecord"]] = relationship(
        back_populates='pet', cascade="all, delete")

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "raza": self.raza,
            "edad": self.edad,
            "especie": self.especie,
            "owner_email": self.owner.email if self.owner else None
        }


class Service(db.Model):
    __tablename__ = 'services'

    id: Mapped[int] = mapped_column(primary_key=True)
    clinic_id: Mapped[int] = mapped_column(
        ForeignKey('clinics.id'), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    price_usd: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0)
    description: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), default=utcnow)

    clinic: Mapped["Clinic"] = relationship(back_populates='services')
    appointments: Mapped[List["Appointment"]] = relationship(
        back_populates='service', cascade='all, delete')

    def serialize(self):
        return {
            "id": self.id,
            "clinic_id": self.clinic_id,
            "name": self.name,
            "price_usd": self.price_usd,
            "description": self.description,
            "is_active": self.is_active
        }


class Appointment(db.Model):
    __tablename__ = 'appointments'

    id: Mapped[int] = mapped_column(primary_key=True)
    date_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    time: Mapped[str] = mapped_column(String(5), nullable=False)
    status: Mapped[AppointmentStatus] = mapped_column(
        SQLEnum(AppointmentStatus, native_enum=False), nullable=False,
        default=AppointmentStatus.PROGRAMADA)
    tipo: Mapped[str] = mapped_column(String(50), nullable=False)
    service_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey('services.id'), nullable=True)
    service_name: Mapped[Optional[str]] = mapped_column(
        String(120), nullable=True)
    service_price_usd: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True, default=0.0)
    clinic_id: Mapped[int] = mapped_column(
        ForeignKey('clinics.id'), nullable=False)
    pet_id: Mapped[int] = mapped_column(ForeignKey('pets.id'), nullable=False)
    doctor_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey('users.id'), nullable=True)

    clinic: Mapped["Clinic"] = relationship(back_populates='appointments')
    pet: Mapped["Pet"] = relationship(back_populates='appointments')
    doctor: Mapped[Optional["User"]] = relationship(
        back_populates='appointments_as_doctor')
    service: Mapped[Optional["Service"]] = relationship(
        back_populates='appointments')
    payment: Mapped[Optional["Payment"]] = relationship(
        back_populates='appointment', uselist=False, cascade="all, delete")
    record: Mapped[Optional["MedicalRecord"]] = relationship(
        back_populates='appointment', uselist=False, cascade="all, delete")

    def serialize(self):
        return {
            "id": self.id,
            "clinic_id": self.clinic_id,
            "pet_id": self.pet_id,
            "pet_name": self.pet.nombre if self.pet else "Desconocido",
            "owner_name": self.pet.owner.full_name if self.pet and self.pet.owner else None,
            "pet_raza": self.pet.raza,
            "pet_especie": self.pet.especie,
            "pet_edad": self.pet.edad,
            "doctor_id": self.doctor_id,
            "date_time": self.date_time.strftime('%Y-%m-%d') if self.date_time else None,
            "time": self.time,
            "tipo": self.tipo,
            "service_id": self.service_id,
            "service_name": self.service_name or self.tipo,
            "service_price_usd": self.service_price_usd or 0.0,
            "service_type": self.service_name or self.tipo,
            "status": self.status.value
        }


class MedicalRecord(db.Model):
    __tablename__ = 'medical_records'

    id: Mapped[int] = mapped_column(primary_key=True)
    fecha: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), default=utcnow)
    price: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    motivo: Mapped[str] = mapped_column(String(200), nullable=False)
    peso: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    temperatura: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    diagnostico: Mapped[str] = mapped_column(Text, nullable=False)
    tratamiento: Mapped[str] = mapped_column(Text, nullable=False)
    examenes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pet_id: Mapped[int] = mapped_column(ForeignKey('pets.id'), nullable=False)
    doctor_id: Mapped[int] = mapped_column(
        ForeignKey('users.id'), nullable=False)
    appointment_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey('appointments.id'), nullable=True)

    pet: Mapped["Pet"] = relationship(back_populates='medical_history')
    doctor: Mapped["User"] = relationship(back_populates='medical_records')
    appointment: Mapped[Optional["Appointment"]
                        ] = relationship(back_populates='record')

    def serialize(self):
        return {
            "id": self.id,
            "fecha": self.fecha.isoformat() if self.fecha else None,
            "precio": self.price,
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

    id: Mapped[int] = mapped_column(primary_key=True)
    clinic_id: Mapped[int] = mapped_column(
        ForeignKey('clinics.id'), nullable=False)
    appointment_id: Mapped[int] = mapped_column(
        ForeignKey('appointments.id'), unique=True, nullable=False)
    cashier_id: Mapped[int] = mapped_column(
        ForeignKey('users.id'), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    payment_method: Mapped[PaymentMethod] = mapped_column(
        SQLEnum(PaymentMethod, native_enum=False), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), default=utcnow)

    clinic: Mapped["Clinic"] = relationship(back_populates='payments')
    appointment: Mapped["Appointment"] = relationship(back_populates='payment')
    cashier: Mapped["User"] = relationship(back_populates='payments_processed')

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
