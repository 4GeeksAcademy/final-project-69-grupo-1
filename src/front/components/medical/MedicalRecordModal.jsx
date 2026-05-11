import React, { useState, useEffect } from "react";
import { useGlobalReducer } from "../../hooks/useGlobalReducer";
import Swal from "sweetalert2";

export const MedicalRecordModal = ({ show, onClose, appointment }) => {
    const { actions } = useGlobalReducer();
    const [loading, setLoading] = useState(false);

    // Estado del formulario
    const [formData, setFormData] = useState({
        peso: "",
        temperatura: "",
        motivo: "",
        diagnostico: "",
        tratamiento: "",
        examenes: ""
    });

    // Estado para saber qué cita estamos editando (ESTO ES LA MAGIA DE LA PERSISTENCIA)
    const [currentApptId, setCurrentApptId] = useState(null);

    useEffect(() => {
        // Solo limpiamos los datos si el doctor abre una cita TOTALMENTE DIFERENTE.
        // Si cierra y abre la misma cita, los datos de 'formData' se mantienen intactos.
        if (appointment && appointment.id !== currentApptId) {
            setFormData({
                peso: "",
                temperatura: "",
                motivo: appointment.tipo || "Consulta Médica",
                diagnostico: "",
                tratamiento: "",
                examenes: ""
            });
            setCurrentApptId(appointment.id); // Registramos esta nueva cita como la actual
        }
    }, [appointment]);

    if (!show || !appointment) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        // Validación de campos obligatorios
        if (!formData.diagnostico || !formData.tratamiento) {
            return Swal.fire("Campos Incompletos", "El diagnóstico y el tratamiento son obligatorios.", "warning");
        }

        setLoading(true);
        const success = await actions.submitMedicalRecord(appointment.id, formData);
        setLoading(false);

        if (success) {
            Swal.fire("¡Éxito!", "La historia médica ha sido guardada y la cita quedó pendiente de pago.", "success");
            setCurrentApptId(null); // Limpiamos para que la próxima vez arranque de cero
            onClose();
        } else {
            Swal.fire("Error", "Hubo un problema al guardar la historia clínica.", "error");
        }
    };

    return (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">

                    {/* HEADER DEL MODAL (Igual a tu diseño) */}
                    <div className="modal-header bg-primary text-white p-4">
                        <div className="d-flex align-items-center">
                            <div className="bg-white text-primary rounded-circle d-flex justify-content-center align-items-center me-3 shadow-sm" style={{ width: "48px", height: "48px" }}>
                                <i className="fas fa-notes-medical fs-4"></i>
                            </div>
                            <div>
                                <h5 className="modal-title fw-bold mb-1">Historia Clínica Digital</h5>
                                <h6 className="mb-1">Paciente: <span className="fw-bold">{appointment.pet_name || `ID Mascota: ${appointment.pet_id}`}</span></h6>
                                <div className="small opacity-75 d-flex gap-3">
                                    <span><i className="fas fa-paw me-1"></i> Especie: {appointment.pet_especie || "N/A"}</span>
                                    <span><i className="fas fa-tag me-1"></i> Raza: {appointment.pet_raza || "N/A"}</span>
                                    <span><i className="fas fa-birthday-cake me-1"></i> Edad: {appointment.pet_edad || "N/A"} años</span>
                                </div>
                            </div>
                        </div>
                        <button type="button" className="btn-close btn-close-white align-self-start" onClick={onClose}></button>
                    </div>

                    {/* CUERPO DEL MODAL */}
                    <div className="modal-body p-4 bg-light">

                        {/* Fila de Información de la Cita */}
                        <div className="row text-center mb-4 bg-white rounded-3 shadow-sm py-3 mx-0 border">
                            <div className="col-4 border-end">
                                <small className="text-muted fw-bold d-block text-uppercase">Servicio</small>
                                <span className="fw-bold text-primary">{appointment.tipo}</span>
                            </div>
                            <div className="col-4 border-end">
                                <small className="text-muted fw-bold d-block text-uppercase">Fecha</small>
                                <span className="fw-bold text-dark">{appointment.date_time?.split("T")[0]}</span>
                            </div>
                            <div className="col-4">
                                <small className="text-muted fw-bold d-block text-uppercase">Hora</small>
                                <span className="fw-bold text-dark">{appointment.time}</span>
                            </div>
                        </div>

                        {/* Campos del Formulario */}
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-bold text-dark small">Peso (kg)</label>
                                <input type="number" className="form-control bg-white" name="peso" value={formData.peso} onChange={handleInputChange} placeholder="0.0" />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold text-dark small">Temperatura (°C)</label>
                                <input type="number" step="0.1" className="form-control bg-white" name="temperatura" value={formData.temperatura} onChange={handleInputChange} placeholder="38.5" />
                            </div>
                            <div className="col-12">
                                <label className="form-label fw-bold text-dark small">Motivo de consulta</label>
                                <input type="text" className="form-control bg-white" name="motivo" value={formData.motivo} onChange={handleInputChange} />
                            </div>
                            <div className="col-12">
                                <label className="form-label fw-bold text-danger small">Diagnóstico *</label>
                                <textarea className="form-control bg-white" rows="3" name="diagnostico" value={formData.diagnostico} onChange={handleInputChange} placeholder="Escriba los hallazgos médicos aquí..." required></textarea>
                            </div>
                            <div className="col-12">
                                <label className="form-label fw-bold text-success small">Tratamiento / Receta *</label>
                                <textarea className="form-control bg-white" rows="3" name="tratamiento" value={formData.tratamiento} onChange={handleInputChange} placeholder="Medicamentos, dosis y duración..." required></textarea>
                            </div>
                            <div className="col-12">
                                <label className="form-label fw-bold text-dark small">Exámenes solicitados</label>
                                <textarea className="form-control bg-white" rows="2" name="examenes" value={formData.examenes} onChange={handleInputChange} placeholder="Ej: Hematología completa, Rayos X tórax..."></textarea>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER Y BOTONES */}
                    <div className="modal-footer bg-white border-top p-3 d-flex justify-content-between">
                        {/* El botón ahora dice Cerrar / Pausar, dejando claro que no borra los datos */}
                        <button type="button" className="btn btn-outline-secondary fw-bold rounded-pill px-4" onClick={onClose}>
                            Cerrar / Pausar
                        </button>
                        <button type="button" className="btn btn-primary fw-bold rounded-pill px-4" onClick={handleSubmit} disabled={loading}>
                            {loading ? "Guardando..." : "Guardar y Finalizar Cita"}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};