import React, { useState } from "react";
import useGlobalReducer from "../../hooks/useGlobalReducer";

export const MedicalRecordModal = ({ show, onClose, appointment }) => {
    const { actions } = useGlobalReducer();
    const [formData, setFormData] = useState({ diagnostico: "", tratamiento: "" });
    const [loading, setLoading] = useState(false);

    if (!show || !appointment) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Llamamos a la acción que se comunica con el backend
        const success = await actions.submitMedicalRecord(appointment.id, formData);

        if (success) {
            alert("Historia clínica guardada exitosamente");
            setFormData({ diagnostico: "", tratamiento: "" }); // Limpiamos el form
            onClose(); // Cerramos el modal
        } else {
            alert("Error al guardar la historia clínica. Inténtalo de nuevo.");
        }
        setLoading(false);
    };

    // Función extra para la Historia 38: Marcar como "En Atención"
    const handleStartAttention = async () => {
        const success = await actions.markAppointmentAsInAttention(appointment.id);
        if (success) {
            alert("La cita ahora está 'En Atención'.");
            onClose(); // Puedes cerrar el modal o dejarlo abierto para que el doctor empiece a escribir
        }
    };

    return (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">
                            Consulta Médica: {appointment.mascota?.nombre}
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>

                    <div className="modal-body">
                        {/* Información básica del paciente */}
                        <div className="row mb-3 bg-light p-2 rounded">
                            <div className="col-md-4"><strong>Mascota:</strong> {appointment.mascota?.nombre}</div>
                            <div className="col-md-4"><strong>Especie/Raza:</strong> {appointment.mascota?.especie} - {appointment.mascota?.raza}</div>
                            <div className="col-md-4"><strong>Dueño:</strong> {appointment.mascota?.dueno}</div>
                            <div className="col-12 mt-2"><strong>Motivo de Cita:</strong> {appointment.tipo}</div>
                        </div>

                        {/* Botón para cambiar estado (Historia 38) */}
                        {appointment.estado === "PROGRAMADA" && (
                            <div className="mb-4 text-center">
                                <button className="btn btn-warning" onClick={handleStartAttention}>
                                    🏥 Iniciar Atención (Avisar a recepción)
                                </button>
                            </div>
                        )}

                        {/* Formulario de Historia Médica (Historia 36) */}
                        {appointment.estado !== "COMPLETADA" ? (
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Diagnóstico Clínico *</label>
                                    <textarea
                                        className="form-control"
                                        name="diagnostico"
                                        rows="3"
                                        required
                                        placeholder="Describe los síntomas y el diagnóstico..."
                                        value={formData.diagnostico}
                                        onChange={handleChange}
                                    ></textarea>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Tratamiento Recetado *</label>
                                    <textarea
                                        className="form-control"
                                        name="tratamiento"
                                        rows="3"
                                        required
                                        placeholder="Medicamentos, dosis y recomendaciones..."
                                        value={formData.tratamiento}
                                        onChange={handleChange}
                                    ></textarea>
                                </div>
                                <div className="d-flex justify-content-end gap-2">
                                    <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                                    <button type="submit" className="btn btn-success" disabled={loading}>
                                        {loading ? "Guardando..." : "Guardar y Finalizar Cita"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="alert alert-success text-center">
                                Esta cita ya fue completada y su historia clínica está guardada.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};