import React, { useState, useEffect } from "react";
import useGlobalReducer from "../../hooks/useGlobalReducer";

export const MedicalRecordModal = ({ show, onClose, appointment }) => {
    const { actions } = useGlobalReducer();
    const [loading, setLoading] = useState(false);

    // Nuestro nuevo estado con todos los campos médicos
    const [recordData, setRecordData] = useState({
        motivo: "Consulta general",
        peso: "",
        temperatura: "",
        diagnostico: "",
        tratamiento: "",
        examenes: ""
    });

    // CORRECCIÓN: Solo reseteamos el formulario si cambia el paciente (appointment?.id).
    // Si el doctor cierra el modal por accidente y lo vuelve a abrir con la misma mascota,
    // el texto que escribió se mantendrá intacto.
    useEffect(() => {
        if (appointment) {
            setRecordData({
                motivo: appointment.tipo || "Consulta general",
                peso: "",
                temperatura: "",
                diagnostico: "",
                tratamiento: "",
                examenes: ""
            });
        }
    }, [appointment?.id]);

    if (!show || !appointment) return null;

    const handleChange = (e) => {
        setRecordData({ ...recordData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Convertimos peso y temperatura a números flotantes antes de enviar
        const payload = {
            ...recordData,
            peso: recordData.peso ? parseFloat(recordData.peso) : null,
            temperatura: recordData.temperatura ? parseFloat(recordData.temperatura) : null
        };

        const success = await actions.submitMedicalRecord(appointment.id, payload);
        setLoading(false);

        if (success) {
            alert("Historia clínica guardada exitosamente");
            // Limpiamos el form ahora sí, porque ya se guardó en la base de datos
            setRecordData({ motivo: "", peso: "", temperatura: "", diagnostico: "", tratamiento: "", examenes: "" });
            onClose();
        } else {
            alert("Hubo un error al guardar la historia clínica. Revisa la consola.");
        }
    };

    // Función para marcar que la mascota ya entró a consultorio
    const handleStartAttention = async () => {
        const success = await actions.markAppointmentAsInAttention(appointment.id);
        if (success) {
            alert("La cita ahora está 'En Atención'.");
        }
    };

    return (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content shadow-lg border-0 rounded-4">

                    {/* Header del Modal */}
                    <div className="modal-header bg-primary text-white rounded-top-4 py-3">
                        <h5 className="modal-title fw-bold">
                            <i className="fas fa-notes-medical me-2"></i>
                            Historia Clínica: {appointment.mascota?.nombre}
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>

                    <div className="modal-body p-4 bg-light">
                        {/* Tarjeta de Info del Paciente */}
                        <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-white border rounded shadow-sm">
                            <div>
                                <h6 className="mb-0 fw-bold text-dark">{appointment.mascota?.nombre} ({appointment.mascota?.especie})</h6>
                                <small className="text-muted">Raza: {appointment.mascota?.raza} | Dueño: {appointment.mascota?.dueno}</small>
                            </div>
                            {appointment.estado === "PROGRAMADA" && (
                                <button className="btn btn-warning btn-sm fw-bold shadow-sm" onClick={handleStartAttention}>
                                    Iniciar Atención
                                </button>
                            )}
                            {appointment.estado === "EN_ATENCION" && (
                                <span className="badge bg-warning text-dark px-3 py-2">En Consultorio</span>
                            )}
                            {appointment.estado === "COMPLETADA" && (
                                <span className="badge bg-success px-3 py-2">Atención Finalizada</span>
                            )}
                        </div>

                        {/* Formulario Médico */}
                        {appointment.estado !== "COMPLETADA" ? (
                            <form onSubmit={handleSubmit}>

                                {/* SECCIÓN 1: TRIAJE Y CONSTANTES */}
                                <h6 className="fw-bold text-secondary border-bottom pb-2 mb-3">1. Triaje y Constantes</h6>
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold">Motivo de la Consulta</label>
                                        <input
                                            type="text" name="motivo" required
                                            className="form-control bg-white"
                                            value={recordData.motivo} onChange={handleChange}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small fw-bold">Peso (Kg)</label>
                                        <input
                                            type="number" step="0.1" name="peso" required
                                            className="form-control bg-white" placeholder="Ej: 12.5"
                                            value={recordData.peso} onChange={handleChange}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small fw-bold">Temp. (°C)</label>
                                        <input
                                            type="number" step="0.1" name="temperatura" required
                                            className="form-control bg-white" placeholder="Ej: 38.5"
                                            value={recordData.temperatura} onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {/* SECCIÓN 2: EVALUACIÓN */}
                                <h6 className="fw-bold text-secondary border-bottom pb-2 mb-3 mt-4">2. Evaluación Médica</h6>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Diagnóstico Clínico *</label>
                                    <textarea
                                        name="diagnostico" rows="2" required
                                        className="form-control bg-white"
                                        placeholder="Hallazgos físicos y diagnóstico presuntivo..."
                                        value={recordData.diagnostico} onChange={handleChange}
                                    ></textarea>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Plan de Tratamiento / Receta *</label>
                                    <textarea
                                        name="tratamiento" rows="2" required
                                        className="form-control bg-white"
                                        placeholder="Medicamentos, dosis y recomendaciones..."
                                        value={recordData.tratamiento} onChange={handleChange}
                                    ></textarea>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Exámenes Solicitados (Opcional)</label>
                                    <textarea
                                        name="examenes" rows="1"
                                        className="form-control bg-white"
                                        placeholder="Ej: Hematología completa, Rayos X tórax..."
                                        value={recordData.examenes} onChange={handleChange}
                                    ></textarea>
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