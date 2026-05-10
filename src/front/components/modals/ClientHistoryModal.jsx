import React from "react";

export const ClientHistoryModal = ({ show, onClose, petName, history }) => {
    if (!show) return null;

    return (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content shadow-lg border-0 rounded-4">
                    <div className="modal-header bg-primary text-white rounded-top-4 py-3">
                        <h5 className="modal-title fw-bold">
                            <i className="fas fa-book-medical me-2"></i>Historial Clínico: {petName}
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <div className="modal-body p-4 bg-light">
                        {history && history.length > 0 ? (
                            <div className="accordion shadow-sm" id="clientHistoryAccordion">
                                {history.map((record, index) => (
                                    <div className="accordion-item mb-3 border-0 rounded-4 overflow-hidden" key={record.id}>
                                        <h2 className="accordion-header">
                                            <button className={`accordion-button ${index !== 0 ? 'collapsed' : ''} bg-white fw-bold`} type="button" data-bs-toggle="collapse" data-bs-target={`#clientCollapse${record.id}`}>
                                                🗓️ {new Date(record.fecha).toLocaleDateString()} - {record.motivo}
                                            </button>
                                        </h2>
                                        <div id={`clientCollapse${record.id}`} className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`} data-bs-parent="#clientHistoryAccordion">
                                            <div className="accordion-body bg-white border-top">
                                                <div className="row mb-3">
                                                    <div className="col-6"><small className="text-muted fw-bold">Peso:</small> <span className="fw-medium">{record.peso} Kg</span></div>
                                                    <div className="col-6"><small className="text-muted fw-bold">Temp:</small> <span className="fw-medium">{record.temperatura} °C</span></div>
                                                </div>
                                                <h6 className="fw-bold text-secondary mb-2">Diagnóstico:</h6>
                                                <p className="text-dark mb-4">{record.diagnostico}</p>

                                                <h6 className="fw-bold text-secondary mb-2 border-top pt-3">Receta / Tratamiento:</h6>
                                                <p className="text-dark mb-4">{record.tratamiento}</p>

                                                {record.examenes && (
                                                    <>
                                                        <h6 className="fw-bold text-secondary mb-2 border-top pt-3">Exámenes Solicitados:</h6>
                                                        <p className="text-dark mb-0">{record.examenes}</p>
                                                    </>
                                                )}
                                                <div className="text-end mt-3 border-top pt-2">
                                                    <small className="text-muted"><i className="fas fa-user-md me-1"></i> Atendido por: <strong>{record.doctor_name}</strong></small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-5">
                                <i className="fas fa-folder-open fa-3x mb-3 text-secondary opacity-50"></i>
                                <h5 className="text-muted">No hay registros</h5>
                                <p className="small text-secondary mb-0">Tu mascota no tiene diagnósticos previos registrados en el sistema.</p>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer border-0 bg-light rounded-bottom-4">
                        <button type="button" className="btn btn-secondary fw-bold rounded-pill px-4" onClick={onClose}>Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};