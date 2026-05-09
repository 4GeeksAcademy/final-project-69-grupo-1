import React, { useState, useEffect } from "react";
import { useGlobalReducer } from "../../hooks/useGlobalReducer"; // Se agregaron las llaves { }
import Swal from "sweetalert2";

export const MedicalRecordModal = ({ show, onClose, appointment }) => {
    const { actions } = useGlobalReducer();
    const [loading, setLoading] = useState(false);

    // Estado con los campos médicos
    const [recordData, setRecordData] = useState({
        motivo: "Consulta general",
        peso: "",
        temperatura: "",
        diagnostico: "",
        tratamiento: "",
        examenes: ""
    });

    // Sincronizar el formulario con la cita seleccionada al abrir el modal
    useEffect(() => {
        if (appointment && show) {
            setRecordData({
                motivo: appointment.tipo || "Consulta general",
                peso: "",
                temperatura: "",
                diagnostico: "",
                tratamiento: "",
                examenes: ""
            });
        }
    }, [appointment?.id, show]); // Agregamos 'show' para asegurar actualización al abrir

    if (!show || !appointment) return null;

    const handleChange = (e) => {
        setRecordData({ ...recordData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...recordData,
            appointment_id: appointment.id,
            pet_id: appointment.pet_id,
            peso: parseFloat(recordData.peso),
            temperatura: parseFloat(recordData.temperatura)
        };

        const result = await actions.saveMedicalRecord(payload);
        setLoading(false);

        if (result?.success) {
            Swal.fire("¡Guardado!", "La historia médica se registró con éxito", "success");
            onClose();
        } else {
            Swal.fire("Error", result?.message || "No se pudo guardar la historia", "error");
        }
    };

    return (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4">
                    <div className="modal-header bg-primary text-white p-4">
                        <div className="d-flex align-items-center">
                            <div className="bg-white p-2 rounded-circle me-3">
                                <i className="fas fa-notes-medical text-primary fs-4"></i>
                            </div>
                            <div>
                                <h5 className="modal-title fw-bold mb-0">Historia Clínica Digital</h5>
                                {/* CAMBIO: Usamos pet_name o pet_id según el Network */}
                                <p className="mb-1 fs-5 fw-semibold">
                                    Paciente: {appointment.pet_name || `ID: ${appointment.pet_id}`}
                                </p>
                                <div className="d-flex flex-wrap gap-4 small opacity-75">
                                    <span><i className="fas fa-dna me-1"></i> <strong>Especie:</strong> {appointment.pet_especie || "N/A"}</span>
                                    <span><i className="fas fa-tag me-1"></i> <strong>Raza:</strong> {appointment.pet_raza || "N/A"}</span>
                                    <span><i className="fas fa-birthday-cake me-1"></i> <strong>Edad:</strong> {appointment.pet_edad ? `${appointment.pet_edad} años` : "N/A"}</span>
                                </div>
                            </div>
                        </div>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>

                    <div className="modal-body p-4 bg-light">
                        {/* Info de la Cita */}
                        <div className="card border-0 shadow-sm mb-4 p-3 rounded-3">
                            <div className="row text-center">
                                <div className="col-4 border-end">
                                    <span className="d-block small text-muted text-uppercase fw-bold">Servicio</span>
                                    <span className="fw-bold text-primary">{appointment.tipo}</span>
                                </div>
                                <div className="col-4 border-end">
                                    <span className="d-block small text-muted text-uppercase fw-bold">Fecha</span>
                                    <span className="fw-bold">{appointment.date_time}</span>
                                </div>
                                <div className="col-4">
                                    <span className="d-block small text-muted text-uppercase fw-bold">Hora</span>
                                    <span className="fw-bold text-secondary">{appointment.time}</span>
                                </div>
                            </div>
                        </div>

                        {appointment.status !== "COMPLETADA" ? (
                            <form onSubmit={handleSubmit}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Peso (kg)</label>
                                        <input type="number" step="0.1" name="peso" className="form-control bg-white"
                                            placeholder="0.0" value={recordData.peso} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Temperatura (°C)</label>
                                        <input type="number" step="0.1" name="temperatura" className="form-control bg-white"
                                            placeholder="38.5" value={recordData.temperatura} onChange={handleChange} required />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-bold">Motivo de consulta</label>
                                        <input type="text" name="motivo" className="form-control bg-white"
                                            value={recordData.motivo} onChange={handleChange} />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-bold text-danger">Diagnóstico</label>
                                        <textarea name="diagnostico" rows="3" className="form-control bg-white"
                                            placeholder="Escriba los hallazgos médicos aquí..."
                                            value={recordData.diagnostico} onChange={handleChange} required></textarea>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-bold text-success">Tratamiento / Receta</label>
                                        <textarea name="tratamiento" rows="3" className="form-control bg-white"
                                            placeholder="Medicamentos, dosis y duración..."
                                            value={recordData.tratamiento} onChange={handleChange} required></textarea>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-bold">Exámenes solicitados</label>
                                        <textarea name="examenes" rows="1" className="form-control bg-white"
                                            placeholder="Ej: Hematología completa, Rayos X tórax..."
                                            value={recordData.examenes} onChange={handleChange}></textarea>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-end gap-2 mt-4">
                                    <button type="button" className="btn btn-light border fw-bold" onClick={onClose}>
                                        Cerrar / Pausar
                                    </button>
                                    <button type="submit" className="btn btn-primary fw-bold shadow-sm" disabled={loading}>
                                        {loading ? "Guardando..." : "Guardar y Finalizar Cita"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="alert alert-success text-center py-4">
                                <i className="fas fa-check-circle fa-2x mb-2 text-success"></i><br />
                                Esta cita ya fue completada y la historia clínica está archivada.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};