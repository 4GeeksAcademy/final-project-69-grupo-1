import React, { useState, useEffect } from "react";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import toast from 'react-hot-toast';

export const AdminPaymentModal = ({ show, onClose, onSave }) => {
    const { store } = useGlobalReducer();
    const [formData, setFormData] = useState({
        appointment_id: "",
        amount: "",
        payment_method: "EFECTIVO"
    });
    const [loading, setLoading] = useState(false);

    const paymentMethods = ["EFECTIVO", "PUNTO_DE_VENTA", "PAGO_MOVIL", "ZELLE"];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${store.token}`
                },
                body: JSON.stringify({
                    appointment_id: formData.appointment_id,
                    amount: parseFloat(formData.amount),
                    payment_method: formData.payment_method
                })
            });

            if (response.ok) {
                toast.success("Pago registrado exitosamente");
                setFormData({
                    appointment_id: "",
                    amount: "",
                    payment_method: "EFECTIVO"
                });
                onSave();
                onClose();
            } else {
                const error = await response.json();
                toast.error(error.message || "Error al registrar pago");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error al registrar pago");
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2000 }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4">
                    <div className="modal-header bg-success text-white border-0 rounded-top-4">
                        <h5 className="modal-title fw-bold">
                            <i className="fas fa-money-bill-wave me-2"></i>
                            Registrar Pago
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body p-4">
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-uppercase text-muted">ID de Cita *</label>
                                <input
                                    type="number"
                                    className="form-control bg-light border-0"
                                    name="appointment_id"
                                    value={formData.appointment_id}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ingresa el ID de la cita"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-uppercase text-muted">Monto USD *</label>
                                <input
                                    type="number"
                                    className="form-control bg-light border-0"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    required
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-uppercase text-muted">Método de Pago *</label>
                                <select
                                    className="form-select bg-light border-0"
                                    name="payment_method"
                                    value={formData.payment_method}
                                    onChange={handleChange}
                                    required
                                >
                                    {paymentMethods.map(method => (
                                        <option key={method} value={method}>
                                            {method}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer border-top bg-light rounded-bottom-4">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                            <button type="submit" className="btn btn-success fw-bold" disabled={loading}>
                                {loading ? "Registrando..." : "Registrar Pago"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
