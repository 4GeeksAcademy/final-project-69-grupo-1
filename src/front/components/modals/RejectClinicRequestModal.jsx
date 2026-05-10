import React, { useState } from "react";

const REJECTION_REASONS = {
    "doc_ilegible": "Uno o más documentos cargados no son legibles. Por favor, asegúrese de que tengan buena resolución.",
    "rif_vencido": "El RIF de la empresa se encuentra vencido. Por favor, cargue una copia vigente.",
    "titulo_invalido": "El título profesional cargado no corresponde al área de medicina veterinaria.",
    "datos_inconsistentes": "Existe una inconsistencia entre el nombre de la clínica y el RIF proporcionado.",
    "otro": ""
};

export const RejectClinicRequestModal = ({ show, onClose, onConfirm, loading }) => {
    const [observations, setObservations] = useState("");

    if (!show) return null;

    const handleConfirm = () => {
        onConfirm(observations);
        setObservations(""); // Limpiar para la próxima vez
    };

    return (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4">
                    <div className="modal-header bg-danger text-white rounded-top-4">
                        <h5 className="modal-title fw-bold">Rechazar Solicitud</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <div className="modal-body p-4">
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-secondary text-uppercase">Motivo predefinido:</label>
                            <select
                                className="form-select border-0 bg-light"
                                onChange={(e) => {
                                    const selected = e.target.value;
                                    setObservations(selected !== "otro" ? REJECTION_REASONS[selected] : "");
                                }}
                            >
                                <option value="otro">-- Motivo personalizado --</option>
                                <option value="doc_ilegible">Documentos ilegibles</option>
                                <option value="rif_vencido">RIF Vencido</option>
                                <option value="titulo_invalido">Título no válido</option>
                                <option value="datos_inconsistentes">Inconsistencia de datos</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-secondary text-uppercase">Observaciones finales:</label>
                            <textarea
                                className="form-control border-0 bg-light"
                                rows="4"
                                value={observations}
                                onChange={(e) => setObservations(e.target.value)}
                                placeholder="Detalles que el usuario recibirá por correo..."
                            ></textarea>
                            <div className="form-text text-end">{observations.length} caracteres (min. 10)</div>
                        </div>
                    </div>
                    <div className="modal-footer border-0">
                        <button className="btn btn-light rounded-pill px-4" onClick={onClose}>Cancelar</button>
                        <button
                            className="btn btn-danger rounded-pill px-4 fw-bold shadow-sm"
                            onClick={handleConfirm}
                            disabled={loading || observations.trim().length < 10}
                        >
                            {loading ? "Procesando..." : "Confirmar Rechazo"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};