from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from api.models import db, Payment, Appointment, PaymentMethod, AppointmentStatus, RoleEnum
from api.utils import roles_required

payments_bp = Blueprint('payments', __name__)


@payments_bp.route('/payments', methods=['POST'])
@jwt_required()
@roles_required(RoleEnum.RECEPTIONIST, RoleEnum.CLINIC_ADMIN, RoleEnum.INDEPENDENT_VET)
def register_payment():
    data = request.json
    appointment_id = data.get("appointment_id")

    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({"message": "Cita no encontrada"}), 404

    claims = get_jwt()
    if appointment.clinic_id != claims.get("clinic_id"):
        return jsonify({"message": "No tienes permiso para procesar esta cita"}), 403

    if appointment.status == AppointmentStatus.CANCELADA:
        return jsonify({"message": "No se puede registrar el pago de una cita cancelada"}), 400

    if appointment.status != AppointmentStatus.PENDIENTE_PAGO:
        return jsonify({"message": "Solo se puede cobrar una cita cuyo estado sea PENDIENTE_PAGO"}), 400

    if appointment.payment is not None:
        return jsonify({"message": "Esta cita ya tiene un pago registrado"}), 409

    amount = data.get("monto") or data.get("amount")
    payment_method_raw = data.get("metodo_pago") or data.get("payment_method")
    transaction_id = data.get("transaction_id")

    if amount is None:
        return jsonify({"message": "El monto del pago es obligatorio"}), 400

    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return jsonify({"message": "El monto debe ser un número válido"}), 400

    if not payment_method_raw:
        return jsonify({"message": "El método de pago es obligatorio"}), 400

    payment_method_map = {
        "Efectivo": "EFECTIVO",
        "EFECTIVO": "EFECTIVO",
        "Punto de Venta": "PUNTO_DE_VENTA",
        "PUNTO_DE_VENTA": "PUNTO_DE_VENTA",
        "Pago Móvil": "PAGO_MOVIL",
        "Pago Movil": "PAGO_MOVIL",
        "PAGO_MOVIL": "PAGO_MOVIL",
        "Zelle": "ZELLE",
        "ZELLE": "ZELLE"
    }

    payment_method_key = payment_method_map.get(payment_method_raw.strip())
    if not payment_method_key:
        return jsonify({"message": "Método de pago inválido"}), 400

    try:
        payment_method = PaymentMethod(payment_method_key)
    except ValueError:
        return jsonify({"message": "Método de pago inválido"}), 400

    try:
        new_payment = Payment(
            appointment_id=appointment_id,
            clinic_id=appointment.clinic_id,
            cashier_id=int(get_jwt_identity()),
            amount=amount,
            payment_method=payment_method
        )

        appointment.status = AppointmentStatus.COMPLETADA

        db.session.add(new_payment)
        db.session.commit()

        return jsonify({
            "message": "Pago registrado y cita finalizada",
            "payment": new_payment.serialize()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al procesar el pago: {str(e)}"}), 500

@payments_bp.route('/payments', methods=['GET'])
@jwt_required()
@roles_required(RoleEnum.SUPER_ADMIN)
def get_all_payments():
    """
    Endpoint para que el Super Admin obtenga la lista de todos los pagos del sistema.
    Query params:
        - clinic_id: Filtra por clínica
        - payment_method: Filtra por método de pago
        - date_from: Filtra desde esta fecha (formato: YYYY-MM-DD)
        - date_to: Filtra hasta esta fecha (formato: YYYY-MM-DD)
    """
    try:
        from datetime import datetime
        
        # Parámetros de filtrado 
        clinic_id = request.args.get('clinic_id')
        payment_method = request.args.get('payment_method') # Zelle, Pago Móvil, etc.
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        query = Payment.query

        if clinic_id:
            query = query.filter_by(clinic_id=clinic_id)
        if payment_method:
            query = query.filter_by(payment_method=payment_method)
            
        if date_from:
            try:
                from_date = datetime.strptime(date_from, "%Y-%m-%d").date()
                query = query.filter(Payment.created_at >= from_date)
            except ValueError:
                return jsonify({"message": "Formato de date_from inválido (use YYYY-MM-DD)"}), 400
                
        if date_to:
            try:
                to_date = datetime.strptime(date_to, "%Y-%m-%d").date()
                from datetime import timedelta
                to_date = to_date + timedelta(days=1)
                query = query.filter(Payment.created_at < to_date)
            except ValueError:
                return jsonify({"message": "Formato de date_to inválido (use YYYY-MM-DD)"}), 400

        payments = query.order_by(Payment.created_at.desc()).all()
        
        # Serializar respuesta con clinic_name incluido
        return jsonify([{
            "id": p.id,
            "clinic_id": p.clinic_id,
            "clinic_name": p.clinic.nombre if p.clinic else "N/A",
            "appointment_id": p.appointment_id,
            "amount": p.amount,
            "payment_method": p.payment_method.value if p.payment_method else None,
            "created_at": p.created_at.isoformat() if p.created_at else None
        } for p in payments]), 200
        
    except Exception as e:
        return jsonify({"message": f"Error al obtener pagos: {str(e)}"}), 500


@payments_bp.route('/admin/all', methods=['GET'])
@jwt_required()
@roles_required(RoleEnum.SUPER_ADMIN) # Solo acceso para SuperAdmin [cite: 36]
def get_all_payments_admin():
    # Parámetros de filtrado 
    clinic_id = request.args.get('clinic_id')
    payment_method = request.args.get('method') # Zelle, Pago Móvil, etc.
    
    query = Payment.query

    if clinic_id:
        query = query.filter_by(clinic_id=clinic_id)
    if payment_method:
        query = query.filter_by(payment_method=payment_method)

    payments = query.all()
    
    return jsonify([{
        "id": p.id,
        "amount": p.amount,
        "currency": "USD",
        "method": p.payment_method,
        "date": p.created_at.isoformat(),
        "clinic_name": p.clinic.name,
        "status": p.status
    } for p in payments]), 200