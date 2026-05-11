import React, { useEffect, useState } from "react";
import { useGlobalReducer } from "../../hooks/useGlobalReducer";
import toast from "react-hot-toast";
import Swal from 'sweetalert2';

// Motivos de rechazo predefinidos para estandarizar respuestas
const REJECTION_REASONS = {
    "doc_ilegible": "Uno o más documentos cargados no son legibles. Por favor, asegúrese de que las fotos o PDFs tengan buena resolución y luz.",
    "rif_vencido": "El RIF de la empresa se encuentra vencido. Por favor, cargue una copia del RIF vigente para proceder con la aprobación.",
    "titulo_invalido": "El título profesional cargado no corresponde al área de medicina veterinaria o no es verificable.",
    "datos_inconsistentes": "Existe una inconsistencia entre el nombre de la clínica y el RIF proporcionado. Verifique los datos e intente de nuevo.",
    "otro": ""
};

export const SuperAdminRequests = () => {
    const { store, actions } = useGlobalReducer();
    const [selectedPass, setSelectedPass] = useState(null);
    const [loadingId, setLoadingId] = useState(null);

    // Estados para el Modal de Rechazo
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectingId, setRejectingId] = useState(null);
    const [observations, setObservations] = useState("");

    useEffect(() => {
        actions.getPendingRequests();
    }, []);

    const handleApprove = async (id) => {
        // Reemplazamos el confirm nativo por la alerta de SweetAlert2
        const result = await Swal.fire({
            title: '¿Aprobar esta sede?',
            text: "Se creará un usuario administrador oficial.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6', // Color de tu botón principal (puedes cambiarlo)
            cancelButtonColor: '#d33', // Color del botón de cancelar
            confirmButtonText: 'Sí, aprobar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true // Opcional: pone el botón de confirmar a la derecha
        });

        if (!result.isConfirmed) return;

        setLoadingId(id);
        const tempPassword = await actions.approveClinicRequest(id);
        setLoadingId(null);

        if (tempPassword) {
            setSelectedPass(tempPassword);
            toast.success("¡Clínica aprobada con éxito!");
        } else {
            toast.error("Error al procesar la aprobación.");
        }
    };

    const handleOpenRejectModal = (id) => {
        setRejectingId(id);
        setObservations("");
        setShowRejectModal(true);
    };

    const handleConfirmReject = async () => {
        if (observations.trim().length < 10) {
            toast.error("Por favor, indique un motivo de al menos 10 caracteres.");
            return;
        }

        setLoadingId(rejectingId);
        const success = await actions.rejectClinicRequest(rejectingId, observations);
        setLoadingId(null);

        if (success) {
            toast.success("Solicitud rechazada y notificada por correo.");
            setShowRejectModal(false);
        } else {
            toast.error("Error al procesar el rechazo.");
        }
    };

    return (
        <div className="container mt-5 mb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold">
                    <i className="fas fa-clipboard-check text-primary me-2"></i>
                    Solicitudes Pendientes
                </h2>
                <span className="badge bg-secondary">{store.clinicRequests?.length || 0} nuevas</span>
            </div>

            <div className="card shadow-sm border-0">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light text-muted small text-uppercase">
                            <tr>
                                <th>Sede / Clínica</th>
                                <th>Tipo</th>
                                <th>Contacto Admin</th>
                                <th>Documentos</th>
                                <th className="text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {store.clinicRequests && store.clinicRequests.length > 0 ? (
                                store.clinicRequests.map((req) => (
                                    <tr key={req.id}>
                                        <td>
                                            <div className="fw-bold">{req.clinica}</div>
                                            <div className="text-muted small">{req.email}</div>
                                        </td>
                                        <td>
                                            <span className={`badge ${req.tipo === 'EMPRESA' ? 'bg-info' : 'bg-warning text-dark'}`}>
                                                {req.tipo}
                                            </span>
                                        </td>
                                        <td className="small">
                                            <div>{req.nombre_admin || "N/A"}</div>
                                            <div className="text-muted">{req.telefono}</div>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <a href={req.docs.cedula} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary" title="Cédula">
                                                    <i className="fas fa-id-card"></i>
                                                </a>
                                                {req.tipo === 'EMPRESA' ? (
                                                    <>
                                                        <a href={req.docs.rif} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary" title="RIF">
                                                            <i className="fas fa-file-invoice"></i>
                                                        </a>
                                                        <a href={req.docs.mercantil} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary" title="Registro">
                                                            <i className="fas fa-building"></i>
                                                        </a>
                                                    </>
                                                ) : (
                                                    <a href={req.docs.titulo} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary" title="Título">
                                                        <i className="fas fa-graduation-cap"></i>
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-end">
                                            <div className="d-flex justify-content-end gap-2">
                                                <button
                                                    className="btn btn-success btn-sm fw-bold px-3 shadow-sm"
                                                    onClick={() => handleApprove(req.id)}
                                                    disabled={loadingId === req.id}
                                                >
                                                    {loadingId === req.id ? <span className="spinner-border spinner-border-sm"></span> : "APROBAR"}
                                                </button>
                                                <button
                                                    className="btn btn-outline-danger btn-sm px-2 shadow-sm"
                                                    onClick={() => handleOpenRejectModal(req.id)}
                                                    disabled={loadingId === req.id}
                                                >
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-5 text-muted">
                                        <i className="fas fa-inbox fa-3x mb-3 d-block"></i>
                                        No hay solicitudes pendientes de revisión.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL DE RECHAZO */}
            {showRejectModal && (
                <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title fw-bold">Rechazar Solicitud</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowRejectModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Motivo predefinido:</label>
                                    <select
                                        className="form-select mb-2"
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
                                    <label className="form-label small fw-bold">Observaciones finales:</label>
                                    <textarea
                                        className="form-control"
                                        rows="4"
                                        value={observations}
                                        onChange={(e) => setObservations(e.target.value)}
                                        placeholder="Escriba aquí los detalles que el usuario recibirá por correo..."
                                    ></textarea>
                                    <div className="form-text small text-end">{observations.length} / 10 min</div>
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button className="btn btn-light" onClick={() => setShowRejectModal(false)}>Cancelar</button>
                                <button className="btn btn-danger px-4 fw-bold" onClick={handleConfirmReject} disabled={loadingId}>
                                    Confirmar Rechazo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE ÉXITO (APROBACIÓN) */}
            {selectedPass && (
                <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-success text-white border-0">
                                <h5 className="modal-title fw-bold">¡Sede Activada!</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedPass(null)}></button>
                            </div>
                            <div className="modal-body text-center p-4">
                                <p className="mb-4 text-muted small">Copia estos accesos para el nuevo administrador:</p>
                                <div className="bg-light p-3 rounded border mb-3">
                                    <label className="small text-uppercase fw-bold text-muted d-block mb-1">Clave Temporal</label>
                                    <h2 className="fw-bold text-primary mb-0" style={{ letterSpacing: "2px" }}>{selectedPass}</h2>
                                </div>
                                <button className="btn btn-primary w-100 py-2 fw-bold" onClick={() => setSelectedPass(null)}>Entendido</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};