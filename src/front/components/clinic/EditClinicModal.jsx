import React from "react";

export const EditClinicModal = ({ show, onClose, onSubmit, editFormData, handleChange }) => {
    if (!show) return null;

    return (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">Editar Datos de la Clínica</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <form onSubmit={onSubmit}>
                        <div className="modal-body text-start row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Nombre</label>
                                <input type="text" className="form-control" name="nombre" value={editFormData.nombre} onChange={(e) => handleChange(e, true)} required />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold">RIF</label>
                                <input type="text" className="form-control" name="rif" value={editFormData.rif} onChange={(e) => handleChange(e, true)} required />
                            </div>
                            <div className="col-md-12">
                                <label className="form-label fw-bold">Ubicación</label>
                                <input type="text" className="form-control" name="ubicacion" value={editFormData.ubicacion} onChange={(e) => handleChange(e, true)} required />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Teléfono de Contacto</label>
                                <input type="text" className="form-control" name="telefono" value={editFormData.telefono || ""} onChange={(e) => handleChange(e, true)} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Correo de Contacto</label>
                                <input type="email" className="form-control" name="correo" value={editFormData.correo || ""} onChange={(e) => handleChange(e, true)} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                            <button type="submit" className="btn btn-primary">Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};