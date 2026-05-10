import React, { useState, useEffect } from "react";
import { useGlobalReducer } from "../../hooks/useGlobalReducer";

export const PaymentModal = ({ appointment, onClose }) => {
    const { store, actions } = useGlobalReducer();
    const [formData, setFormData] = useState({ 
        monto: appointment.price || "", // Asumimos que la cita tiene un precio en $
        metodo_pago: "Efectivo", 
        transaction_id: "" 
    });
    const [loading, setLoading] = useState(false);

    // Calculamos el monto en Bs. usando la tasa del store
    const rate = store.exchangeRate || 0;
    const montoBs = (formData.monto * rate).toFixed(2);

    useEffect(() => {
        // Si no tenemos la tasa cargada, la buscamos al abrir el modal
        if (!store.exchangeRate) {
            actions.getExchangeRate();
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        // Aquí podrías añadir una validación extra si es Stripe
        const res = await actions.registerPayment({ 
            appointment_id: appointment.id, 
            ...formData,
            monto_bs: montoBs, // Opcional: enviar el monto calculado al backend
            tasa_bcv: rate
        });
        
        if (res.success) onClose();
        else setLoading(false);
    };

    return (
        <div className="modal d-block bg-dark bg-opacity-50">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content shadow-lg border-0">
                    <div className="modal-header bg-success text-white">
                        <h5 className="modal-title">Finalizar Atención #{appointment.id}</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body p-4">
                            {/* --- Sección de Resumen de Montos --- */}
                            <div className="card mb-3 bg-light border-0">
                                <div className="card-body text-center">
                                    <label className="small text-muted text-uppercase fw-bold">Monto en Dólares</label>
                                    <h2 className="text-success mb-0">${formData.monto}</h2>
                                    
                                    <div className="mt-2 pt-2 border-top">
                                        <label className="small text-muted text-uppercase fw-bold">Equivalente BCV</label>
                                        <h4 className="text-primary mb-0">{montoBs} Bs.</h4>
                                        <small className="text-muted">Tasa: {rate} Bs/$</small>
                                    </div>
                                </div>
                            </div>

                            {/* --- Selección de Método --- */}
                            <div className="mb-3">
                                <label className="form-label fw-bold text-secondary">Método de Pago</label>
                                <select 
                                    className="form-select form-select-lg" 
                                    value={formData.metodo_pago}
                                    onChange={e => setFormData({...formData, metodo_pago: e.target.value})}
                                >
                                    <option value="Efectivo">💵 Efectivo</option>
                                    <option value="Punto de Venta">💳 Punto de Venta</option>
                                    <option value="Pago Móvil">📲 Pago Móvil</option>
                                    <option value="Zelle">📧 Zelle</option>
                                    <option value="Stripe">🌍 Tarjeta Internacional (Stripe)</option>
                                </select>
                            </div>

                            {/* --- Simulación de Stripe --- */}
                            {formData.metodo_pago === "Stripe" && (
                                <div className="alert alert-info border-0 shadow-sm animate__animated animate__fadeIn">
                                    <label className="form-label fw-bold small">Simulación de Tarjeta</label>
                                    <input 
                                        type="text" 
                                        className="form-control mb-2" 
                                        placeholder="4242 4242 4242 4242" 
                                        maxLength="16"
                                    />
                                    <div className="row g-2">
                                        <div className="col-6"><input type="text" className="form-control" placeholder="MM/YY" /></div>
                                        <div className="col-6"><input type="text" className="form-control" placeholder="CVC" /></div>
                                    </div>
                                    <p className="mt-2 mb-0 x-small text-dark" style={{fontSize: '0.7rem'}}>
                                        * Este es un entorno de prueba seguro.
                                    </p>
                                </div>
                            )}

                            {/* --- Referencia --- */}
                            {formData.metodo_pago !== "Efectivo" && (
                                <div className="mb-3">
                                    <label className="form-label fw-bold text-secondary">Referencia / Confirmación</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="Ej: 12345678"
                                        required
                                        onChange={e => setFormData({...formData, transaction_id: e.target.value})} 
                                    />
                                </div>
                            )}
                        </div>

                        <div className="modal-footer border-0">
                            <button type="button" className="btn btn-light" onClick={onClose}>Cerrar</button>
                            <button type="submit" className="btn btn-success px-5 fw-bold" disabled={loading || !rate}>
                                {loading ? (
                                    <><span className="spinner-border spinner-border-sm me-2"></span>Procesando...</>
                                ) : "Registrar Pago"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};