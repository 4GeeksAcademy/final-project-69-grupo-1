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
