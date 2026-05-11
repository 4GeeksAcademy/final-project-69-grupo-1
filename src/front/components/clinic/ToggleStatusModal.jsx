import React from "react";

export const ToggleStatusModal = ({ show, onClose, onConfirm, clinic, suspensionReason, setSuspensionReason }) => {
    if (!show || !clinic) return null;

    return (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-warning">
                        <h5 className="modal-title">Confirmación de Acción</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body text-center fs-5">
                        ¿Está seguro de <strong>{clinic.is_active ? "suspender" : "reactivar"}</strong> la clínica <span className="text-primary fw-bold">{clinic.nombre}</span>?

                        {clinic.is_active && (
                            <div className="mt-4 text-start">
                                <label className="form-label fw-bold fs-6">Motivo de la suspensión:</label>
                                <select
                                    className="form-select"
                                    value={suspensionReason}
                                    onChange={(e) => setSuspensionReason(e.target.value)}
                                >
                                    <option value="Falta de pago">Falta de pago</option>
                                    <option value="Incumplimiento de contrato">Incumplimiento de contrato</option>
                                    <option value="Cese de operaciones">Cese de operaciones</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer justify-content-center">
                        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button className={`btn ${clinic.is_active ? 'btn-danger' : 'btn-success'}`} onClick={onConfirm}>
                            Sí, {clinic.is_active ? "Suspender" : "Reactivar"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};