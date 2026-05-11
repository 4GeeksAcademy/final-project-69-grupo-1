import React, { useEffect, useState } from "react";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import Swal from 'sweetalert2';
import toast from "react-hot-toast";

import { ToggleStatusModal } from "../../components/clinic/ToggleStatusModal";
import { EditClinicModal } from "../../components/clinic/EditClinicModal";
import { ViewClinicDetailsModal } from "../../components/clinic/ViewClinicDetailsModal";
import { RejectClinicRequestModal } from "../../components/clinic/RejectClinicRequestModal";
import { AdminUsersTab } from "../../components/admin/AdminUsersTab";
import { AdminServicesTab } from "../../components/admin/AdminServicesTab";
import { AdminPaymentsTab } from "../../components/admin/AdminPaymentsTab";
import { AdminMedicalRecordsTab } from "../../components/admin/AdminMedicalRecordsTab";

export const SuperAdminDashboard = () => {
    const { store, actions, dispatch } = useGlobalReducer();

    const [activeTab, setActiveTab] = useState("solicitudes");

    const [loadingId, setLoadingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedClinic, setSelectedClinic] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const initialFormState = { nombre: "", rif: "", ubicacion: "", telefono: "", correo: "" };
    const [formData, setFormData] = useState(initialFormState);

    const [modals, setModals] = useState({
        status: false, edit: false, details: false, reject: false
    });

    const [editFormData, setEditFormData] = useState(initialFormState);
    const [suspensionReason, setSuspensionReason] = useState("Falta de pago");
    const [selectedPass, setSelectedPass] = useState(null);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = () => {
        actions.getPendingRequests();
        loadClinics();
    };

    const loadClinics = async () => {
        if (!store.token) return;
        try {
            const response = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/clinics", {
                headers: { "Authorization": `Bearer ${store.token}` }
            });
            if (response.ok) {
                const data = await response.json();
                dispatch({ type: "set_clinics", payload: data });
            }
        } catch (error) { console.error("Error cargando clínicas:", error); }
    };

    const handleApprove = async (id) => {
        const result = await Swal.fire({
            title: '¿Aprobar esta sede?',
            text: "Se notificará al administrador y se creará su acceso oficial.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, activar sede',
            confirmButtonColor: '#198754'
        });

        if (result.isConfirmed) {
            setLoadingId(id);
            const tempPassword = await actions.approveClinicRequest(id);
            setLoadingId(null);
            if (tempPassword) {
                setSelectedPass(tempPassword);
                toast.success("¡Sede aprobada con éxito!");
            }
        }
    };

    const handleReject = async (observations) => {
        setLoadingId(selectedClinic.id);
        const success = await actions.rejectClinicRequest(selectedClinic.id, observations);
        setLoadingId(null);
        if (success) {
            toast.success("Solicitud rechazada correctamente.");
            setModals({ ...modals, reject: false });
        }
    };

    const handleChange = (e, isEdit = false) => {
        if (isEdit) {
            setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleCreateClinic = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/clinics", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${store.token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setFormData(initialFormState);
                setShowForm(false);
                toast.success("Clínica registrada directamente.");
                loadClinics();
            } else {
                toast.error("Error al registrar la clínica.");
            }
        } catch (error) { console.error("Error:", error); }
    };

    // --- ARREGLO DEL ERROR 405 AQUÍ ---
    const executeToggle = async () => {
        try {
            // El backend usa PUT a la ruta de la clínica, enviando is_active
            const response = await fetch(import.meta.env.VITE_BACKEND_URL + `/api/clinics/${selectedClinic.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${store.token}`
                },
                body: JSON.stringify({
                    is_active: !selectedClinic.is_active,
                    suspension_reason: selectedClinic.is_active ? suspensionReason : null
                })
            });

            if (response.ok) {
                const data = await response.json();
                dispatch({ type: "update_clinic", payload: data.clinic });
                setModals({ ...modals, status: false });
                setSelectedClinic(null);
                setSuspensionReason("Falta de pago");
                toast.success("Estado actualizado con éxito.");
            } else {
                toast.error("Hubo un error al actualizar el estado.");
            }
        } catch (error) { console.error("Error:", error); }
    };

    const executeEdit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(import.meta.env.VITE_BACKEND_URL + `/api/clinics/${selectedClinic.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${store.token}`
                },
                body: JSON.stringify(editFormData)
            });

            if (response.ok) {
                const data = await response.json();
                dispatch({ type: "update_clinic", payload: data.clinic });
                setModals({ ...modals, edit: false });
                setSelectedClinic(null);
                toast.success("Datos actualizados.");
            }
        } catch (error) { console.error("Error:", error); }
    };

    // --- NUEVO SISTEMA DE DOBLE CONFIRMACIÓN PARA BORRADO ---
    const handleDeleteClinicWithDoubleCheck = async (clinic) => {
        // Primera advertencia
        const firstConfirm = await Swal.fire({
            title: `¿Eliminar ${clinic.nombre}?`,
            text: "Esta acción borrará permanentemente la sede, todos sus médicos y el historial de consultas de los pacientes. No se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, proceder',
            cancelButtonText: 'Cancelar'
        });

        if (firstConfirm.isConfirmed) {
            // Segunda advertencia extrema (Obliga a escribir)
            const secondConfirm = await Swal.fire({
                title: '⚠️ ADVERTENCIA CRÍTICA ⚠️',
                text: 'Para confirmar la destrucción de estos datos, escribe la palabra "ELIMINAR" en mayúsculas.',
                input: 'text',
                inputPlaceholder: 'Escribe ELIMINAR',
                icon: 'error',
                showCancelButton: true,
                confirmButtonColor: '#000',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Destruir Clínica',
                cancelButtonText: 'Me arrepentí',
                preConfirm: (inputValue) => {
                    if (inputValue !== "ELIMINAR") {
                        Swal.showValidationMessage('Debes escribir la palabra exacta para proceder');
                    }
                }
            });

            if (secondConfirm.isConfirmed) {
                try {
                    const response = await fetch(import.meta.env.VITE_BACKEND_URL + `/api/clinics/${clinic.id}`, {
                        method: "DELETE",
                        headers: { "Authorization": `Bearer ${store.token}` }
                    });

                    if (response.ok) {
                        loadClinics();
                        toast.success("La clínica ha sido eliminada por completo.");
                    } else {
                        toast.error("Error al intentar eliminar la clínica.");
                    }
                } catch (error) { console.error("Error:", error); }
            }
        }
    };

    const handleToggleUserBan = async (clinicId, userId, newStatus) => {
        const isConfirmed = window.confirm(`¿Seguro que deseas ${newStatus ? 'quitar el veto' : 'vetar'} a este usuario?`);
        if (!isConfirmed) return;

        try {
            const response = await fetch(import.meta.env.VITE_BACKEND_URL + `/api/users/${userId}/ban`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${store.token}`
                },
                body: JSON.stringify({ is_active: newStatus })
            });

            if (response.ok) {
                loadClinics();
                setModals({ ...modals, details: false });
                toast.success("Estado del usuario modificado.");
            }
        } catch (error) { console.error("Error vetando usuario:", error); }
    };

    const filteredClinics = store.clinics?.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || c.rif.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            <div className="container">
                <header className="row mb-4 align-items-end">
                    <div className="col-md-8">
                        <h2 className="fw-bold text-dark mb-1">Panel de Control Maestro 🚀</h2>
                        <p className="text-muted mb-0">Gestión global de sedes, usuarios, servicios y registros médicos.</p>
                    </div>
                    <div className="col-md-4 text-md-end d-flex gap-2 justify-content-md-end">
                        <a
                            href={import.meta.env.VITE_BACKEND_URL + "/admin"}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                            title="Acceso directo a la base de datos"
                        >
                            <i className="fas fa-database me-1"></i> Flask-Admin
                        </a>
                        <span className="badge bg-white text-primary border border-primary px-3 py-2 rounded-pill shadow-sm">
                            Super Admin: {store.user?.full_name}
                        </span>
                    </div>
                </header>

                <ul className="nav nav-pills mb-4 bg-white p-2 rounded-pill shadow-sm d-flex flex-wrap border">
                    <li className="nav-item">
                        <button
                            className={`nav-link rounded-pill px-3 fw-bold ${activeTab === "solicitudes" ? "active" : "text-secondary"}`}
                            onClick={() => setActiveTab("solicitudes")}
                        >
                            <i className="fas fa-clipboard-list me-2"></i> Solicitudes
                            <span className="badge bg-danger ms-2">{store.clinicRequests?.length || 0}</span>
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link rounded-pill px-3 fw-bold ${activeTab === "clinicas" ? "active" : "text-secondary"}`}
                            onClick={() => setActiveTab("clinicas")}
                        >
                            <i className="fas fa-hospital me-2"></i> Clínicas Activas
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link rounded-pill px-3 fw-bold ${activeTab === "usuarios" ? "active" : "text-secondary"}`}
                            onClick={() => setActiveTab("usuarios")}
                        >
                            <i className="fas fa-users me-2"></i> Usuarios
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link rounded-pill px-3 fw-bold ${activeTab === "servicios" ? "active" : "text-secondary"}`}
                            onClick={() => setActiveTab("servicios")}
                        >
                            <i className="fas fa-briefcase-medical me-2"></i> Servicios
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link rounded-pill px-3 fw-bold ${activeTab === "pagos" ? "active" : "text-secondary"}`}
                            onClick={() => setActiveTab("pagos")}
                        >
                            <i className="fas fa-credit-card me-2"></i> Pagos
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link rounded-pill px-3 fw-bold ${activeTab === "medicos" ? "active" : "text-secondary"}`}
                            onClick={() => setActiveTab("medicos")}
                        >
                            <i className="fas fa-notes-medical me-2"></i> Registros Médicos
                        </button>
                    </li>
                </ul>

                {activeTab === "solicitudes" && (
                    <div className="card border-0 shadow-sm rounded-4 animate__animated animate__fadeIn">
                        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between">
                            <h5 className="mb-0 fw-bold">Nuevas Solicitudes de Registro</h5>
                            <button className="btn btn-sm btn-outline-secondary rounded-pill" onClick={loadData}>
                                <i className="fas fa-sync-alt"></i> Actualizar
                            </button>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light text-muted small text-uppercase">
                                    <tr>
                                        <th className="px-4">Clínica / Sede</th>
                                        <th>Tipo</th>
                                        <th>Contacto Admin</th>
                                        <th>Docs</th>
                                        <th className="text-end px-4">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {store.clinicRequests?.length > 0 ? store.clinicRequests.map(req => (
                                        <tr key={req.id}>
                                            <td className="px-4">
                                                <div className="fw-bold text-primary">{req.clinica}</div>
                                                <small className="text-muted">{req.email}</small>
                                            </td>
                                            <td><span className={`badge rounded-pill ${req.tipo === 'EMPRESA' ? 'bg-info' : 'bg-warning text-dark'}`}>{req.tipo}</span></td>
                                            <td className="small"><div>{req.nombre_admin}</div><div className="text-muted">{req.telefono}</div></td>
                                            <td>
                                                <div className="d-flex gap-1">
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
                                            <td className="text-end px-4">
                                                <div className="btn-group shadow-sm">
                                                    <button className="btn btn-success btn-sm fw-bold px-3" onClick={() => handleApprove(req.id)} disabled={loadingId === req.id}>
                                                        {loadingId === req.id ? "..." : "APROBAR"}
                                                    </button>
                                                    <button className="btn btn-outline-danger btn-sm" onClick={() => { setSelectedClinic(req); setModals({ ...modals, reject: true }); }}>
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : <tr><td colSpan="5" className="text-center py-5 text-muted">No hay solicitudes nuevas.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === "clinicas" && (
                    <div className="animate__animated animate__fadeIn">
                        <div className="row mb-3 g-3">
                            <div className="col-md-6">
                                <div className="input-group shadow-sm rounded-pill overflow-hidden border">
                                    <span className="input-group-text bg-white border-0"><i className="fas fa-search text-muted"></i></span>
                                    <input type="text" className="form-control border-0" placeholder="Buscar por nombre o RIF..." onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                            </div>
                            <div className="col-md-6 text-md-end">
                                <button className="btn btn-primary rounded-pill px-4 shadow-sm" onClick={() => setShowForm(!showForm)}>
                                    {showForm ? "Cerrar Registro" : "+ Registrar Clínica Directa"}
                                </button>
                            </div>
                        </div>

                        {showForm && (
                            <div className="card shadow-sm border-0 mb-4 p-4 rounded-4 animate__animated animate__fadeInDown">
                                <h5 className="mb-4 fw-bold text-dark"><i className="fas fa-plus-circle text-primary me-2"></i>Registrar Nueva Clínica Manualmente</h5>
                                <form onSubmit={handleCreateClinic} className="row g-3">
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold small text-secondary text-uppercase">Nombre *</label>
                                        <input type="text" className="form-control bg-light border-0" name="nombre" value={formData.nombre} onChange={(e) => handleChange(e)} required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold small text-secondary text-uppercase">RIF *</label>
                                        <input type="text" className="form-control bg-light border-0" name="rif" value={formData.rif} onChange={(e) => handleChange(e)} required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold small text-secondary text-uppercase">Ubicación *</label>
                                        <input type="text" className="form-control bg-light border-0" name="ubicacion" value={formData.ubicacion} onChange={(e) => handleChange(e)} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small text-secondary text-uppercase">Teléfono</label>
                                        <input type="text" className="form-control bg-light border-0" name="telefono" value={formData.telefono} onChange={(e) => handleChange(e)} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small text-secondary text-uppercase">Correo de Contacto</label>
                                        <input type="email" className="form-control bg-light border-0" name="correo" value={formData.correo} onChange={(e) => handleChange(e)} />
                                    </div>
                                    <div className="col-12 d-flex justify-content-end mt-4">
                                        <button type="submit" className="btn btn-success px-5 rounded-pill fw-bold shadow-sm">Guardar Clínica</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="card border-0 shadow-sm rounded-4">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light text-muted small text-uppercase">
                                        <tr>
                                            <th className="px-4">Nombre / RIF</th>
                                            <th>Contacto</th>
                                            <th>Estado</th>
                                            <th className="text-center">Personal</th>
                                            <th className="text-end px-4">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredClinics.map(clinic => (
                                            <tr key={clinic.id}>
                                                <td className="px-4">
                                                    <div className="fw-bold">{clinic.nombre}</div>
                                                    <small className="text-muted">RIF: {clinic.rif}</small>
                                                </td>
                                                <td className="small"><div>{clinic.telefono || "N/A"}</div><div className="text-muted">{clinic.correo}</div></td>
                                                <td>
                                                    <span className={`badge rounded-pill ${clinic.is_active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                                        {clinic.is_active ? 'ACTIVA' : 'SUSPENDIDA'}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <button className="btn btn-sm btn-outline-info rounded-pill fw-bold" onClick={() => { setSelectedClinic(clinic); setModals({ ...modals, details: true }); }}>
                                                        <i className="fas fa-users"></i> Ver Staff
                                                    </button>
                                                </td>
                                                <td className="text-end px-4">
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <button className="btn btn-sm btn-light border" onClick={() => {
                                                            setSelectedClinic(clinic);
                                                            setEditFormData({ nombre: clinic.nombre, rif: clinic.rif, ubicacion: clinic.ubicacion || "", telefono: clinic.telefono || "", correo: clinic.correo || "" });
                                                            setModals({ ...modals, edit: true });
                                                        }}><i className="fas fa-edit text-primary"></i></button>

                                                        <button className={`btn btn-sm ${clinic.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`} onClick={() => { setSelectedClinic(clinic); setModals({ ...modals, status: true }); }}>
                                                            <i className={`fas ${clinic.is_active ? 'fa-ban' : 'fa-check'}`}></i>
                                                        </button>

                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteClinicWithDoubleCheck(clinic)}>
                                                            <i className="fas fa-trash-alt"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredClinics.length === 0 && <tr><td colSpan="5" className="text-center py-5 text-muted">No se encontraron clínicas.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "usuarios" && (
                    <AdminUsersTab />
                )}

                {activeTab === "servicios" && (
                    <AdminServicesTab />
                )}

                {activeTab === "pagos" && (
                    <AdminPaymentsTab />
                )}

                {activeTab === "medicos" && (
                    <AdminMedicalRecordsTab />
                )}
            </div>

            {selectedPass && (
                <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2000 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header bg-success text-white border-0 rounded-top-4">
                                <h5 className="modal-title fw-bold">¡Sede Activada!</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedPass(null)}></button>
                            </div>
                            <div className="modal-body text-center p-4">
                                <div className="bg-light p-3 rounded-3 border mb-3">
                                    <label className="small text-uppercase fw-bold text-muted d-block mb-1">Clave Temporal del Nuevo Admin:</label>
                                    <h2 className="fw-bold text-primary mb-0" style={{ letterSpacing: "2px" }}>{selectedPass}</h2>
                                </div>
                                <button className="btn btn-primary w-100 py-2 rounded-pill fw-bold" onClick={() => setSelectedPass(null)}>Entendido</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ToggleStatusModal show={modals.status} onClose={() => setModals({ ...modals, status: false })} clinic={selectedClinic} onConfirm={executeToggle} suspensionReason={suspensionReason} setSuspensionReason={setSuspensionReason} />
            <EditClinicModal show={modals.edit} onClose={() => setModals({ ...modals, edit: false })} editFormData={editFormData} handleChange={(e) => handleChange(e, true)} onSubmit={executeEdit} />
            <ViewClinicDetailsModal show={modals.details} onClose={() => setModals({ ...modals, details: false })} clinic={selectedClinic} onToggleUserBan={handleToggleUserBan} />
            <RejectClinicRequestModal show={modals.reject} onClose={() => setModals({ ...modals, reject: false })} onConfirm={handleReject} loading={loadingId !== null} />
        </div>
    );
};