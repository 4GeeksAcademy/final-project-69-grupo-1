import React from "react";

export const DeleteClinicModal = ({ show, onClose, onConfirm, clinic }) => {
    if (!show || !clinic) return null;

    return (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-danger">
                    <div className="modal-header bg-danger text-white">
                        <h5 className="modal-title">Eliminar Clínica Definitivamente</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <div className="modal-body text-center fs-5">
                        <p>Está a punto de eliminar la clínica <strong className="text-danger">{clinic.nombre}</strong>.</p>
                        <p className="text-muted fs-6">Esta acción borrará en cascada a todos sus doctores, citas y pagos. Esta acción <strong>no se puede deshacer</strong>.</p>
                    </div>
                    <div className="modal-footer justify-content-center">
                        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button className="btn btn-danger" onClick={onConfirm}>Sí, Eliminar Definitivamente</button>
                    </div>
                </div>
            </div>
        </div>
    );
};