import React from "react";

export const ViewMedicalRecordModal = ({ show, onClose, record }) => {
    if (!show || !record) return null;

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("es-VE");
    };

    return (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2000 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content border-0 shadow-lg rounded-4">
                    <div className="modal-header bg-info text-white border-0 rounded-top-4">
                        <h5 className="modal-title fw-bold">
                            <i className="fas fa-notes-medical me-2"></i>
                            Detalle del Registro Médico
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <div className="modal-body p-4">
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <div className="card border-0 bg-light rounded-3 p-3 mb-3">
                                    <label className="fw-bold text-muted small text-uppercase d-block mb-1">Mascota</label>
                                    <div className="fw-bold text-dark">{record.pet_name || "N/A"}</div>
                                    <small className="text-muted">{record.pet_species || "N/A"}</small>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="card border-0 bg-light rounded-3 p-3 mb-3">
                                    <label className="fw-bold text-muted small text-uppercase d-block mb-1">Doctor/Veterinario</label>
                                    <div className="fw-bold text-dark">{record.doctor_name || "N/A"}</div>
                                </div>
                            </div>
                        </div>

                        <div className="row mb-4">
                            <div className="col-md-3">
                                <div className="card border-0 bg-light rounded-3 p-3 mb-3">
                                    <label className="fw-bold text-muted small text-uppercase d-block mb-1">Fecha</label>
                                    <div className="fw-bold text-dark">{formatDate(record.fecha)}</div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card border-0 bg-light rounded-3 p-3 mb-3">
                                    <label className="fw-bold text-muted small text-uppercase d-block mb-1">Peso</label>
                                    <div className="fw-bold text-dark">{record.peso || "N/A"} kg</div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card border-0 bg-light rounded-3 p-3 mb-3">
                                    <label className="fw-bold text-muted small text-uppercase d-block mb-1">Temperatura</label>
                                    <div className="fw-bold text-dark">{record.temperatura || "N/A"}°C</div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card border-0 bg-light rounded-3 p-3 mb-3">
                                    <label className="fw-bold text-muted small text-uppercase d-block mb-1">Motivo</label>
                                    <div className="fw-bold text-dark text-truncate" title={record.motivo || "N/A"}>{record.motivo || "N/A"}</div>
                                </div>
                            </div>
                        </div>

                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="card border-0 bg-light rounded-3 p-3">
                                    <label className="fw-bold text-muted small text-uppercase d-block mb-2">Diagnóstico</label>
                                    <div className="text-dark" style={{ maxHeight: "150px", overflowY: "auto" }}>
                                        {record.diagnostico || "Sin diagnóstico"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="card border-0 bg-light rounded-3 p-3">
                                    <label className="fw-bold text-muted small text-uppercase d-block mb-2">Tratamiento</label>
                                    <div className="text-dark" style={{ maxHeight: "150px", overflowY: "auto" }}>
                                        {record.tratamiento || "Sin tratamiento registrado"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {record.examenes && (
                            <div className="row">
                                <div className="col-12">
                                    <div className="card border-0 bg-light rounded-3 p-3">
                                        <label className="fw-bold text-muted small text-uppercase d-block mb-2">Exámenes</label>
                                        <div className="text-dark" style={{ maxHeight: "150px", overflowY: "auto" }}>
                                            {record.examenes || "Sin exámenes"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer border-top bg-light rounded-bottom-4">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
