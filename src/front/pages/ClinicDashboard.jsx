import React, { useEffect, useState } from "react";
import { useGlobalReducer } from "../hooks/useGlobalReducer";
import { BulkUpload } from "../components/BulkUpload";
import { QRCodeSVG } from 'qrcode.react';

export const ClinicDashboard = () => {
    const { store, actions } = useGlobalReducer();
    const [activeTab, setActiveTab] = useState("personal");
    const [searchTerm, setSearchFilter] = useState("");
    const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });
    const [copied, setCopied] = useState(false);

    const [serviceForm, setServiceForm] = useState({ name: "", price_usd: "", description: "" });
    const [editingService, setEditingService] = useState(null);
    const [serviceLoading, setServiceLoading] = useState(false);

    // --- ESTADOS PARA INVITACIÓN ---
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("DOCTOR");

    // --- LÓGICA DE MARKETING (QR) ---
    const clinicId = store.user?.clinic_id;
    const registrationUrl = `${window.location.origin}/clinic/${clinicId}`;

    useEffect(() => {
        if (store.user?.clinic_id) {
            actions.getStaff(store.user.clinic_id);
            actions.loadClinicServices(store.user.clinic_id, false);
        }
    }, [store.user?.clinic_id]);

    const showNotification = (text, type = "success") => {
        setStatusMsg({ text, type });
        setTimeout(() => setStatusMsg({ text: "", type: "" }), 4000);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(registrationUrl);
        setCopied(true);
        showNotification("Enlace de registro copiado", "success");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendInvite = async () => {
        if (!inviteEmail) {
            showNotification("Por favor ingresa un correo electrónico", "danger");
            return;
        }

        try {
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clinic/invite-staff`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    email: inviteEmail,
                    role: inviteRole
                })
            });

            const data = await resp.json();
            if (resp.ok) {
                showNotification("¡Invitación enviada con éxito!");
                setInviteEmail("");
            } else {
                showNotification(data.message || "Error al enviar invitación", "danger");
            }
        } catch (error) {
            showNotification("Error de conexión con el servidor", "danger");
        }
    };

    const resetServiceForm = () => {
        setServiceForm({ name: "", price_usd: "", description: "" });
        setEditingService(null);
    };

    const handleServiceSave = async () => {
        if (!serviceForm.name || serviceForm.price_usd === "") {
            showNotification("Nombre y precio son obligatorios", "danger");
            return;
        }

        setServiceLoading(true);
        const payload = {
            name: serviceForm.name,
            price_usd: Number(serviceForm.price_usd),
            description: serviceForm.description
        };

        const clinicId = store.user?.clinic_id;
        if (!clinicId) {
            showNotification("No se encontró la clínica asociada", "danger");
            setServiceLoading(false);
            return;
        }

        let result;
        if (editingService) {
            result = await actions.updateClinicService(editingService.id, payload);
        } else {
            result = await actions.createClinicService(clinicId, payload);
        }

        setServiceLoading(false);
        if (result.success) {
            showNotification(editingService ? "Servicio actualizado" : "Servicio creado", "success");
            resetServiceForm();
            actions.loadClinicServices(clinicId);
        } else {
            showNotification(result.message || "No se pudo guardar el servicio", "danger");
        }
    };

    const handleServiceEdit = (service) => {
        setEditingService(service);
        setServiceForm({
            name: service.name,
            price_usd: service.price_usd,
            description: service.description || ""
        });
    };

    const handleServiceRemove = async (serviceId) => {
        if (!window.confirm("¿Eliminar este servicio? Esta acción no se puede deshacer.")) {
            return;
        }

        const result = await actions.deleteClinicService(serviceId);
        if (result.success) {
            showNotification("Servicio eliminado", "success");
        } else {
            showNotification(result.message || "No se pudo eliminar el servicio", "danger");
        }
    };

    const handleServiceToggle = async (service) => {
        const result = await actions.updateClinicService(service.id, { is_active: !service.is_active });
        if (result.success) {
            showNotification(`Servicio ${!service.is_active ? 'activado' : 'desactivado'}`, "success");
            actions.loadClinicServices(store.user?.clinic_id);
        } else {
            showNotification(result.message || "No se pudo actualizar el servicio", "danger");
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        const success = await actions.updateStaffStatus(userId, !currentStatus);
        if (success) {
            showNotification(`Usuario ${!currentStatus ? 'habilitado' : 'vetado'} con éxito`, "info");
        } else {
            showNotification("Error al actualizar el estado", "danger");
        }
    };

    // Filtrar personal según búsqueda
    const filteredStaff = store.staff?.filter(member =>
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            <div className="container">
                <header className="row mb-4 align-items-end">
                    <div className="col-md-8">
                        <h2 className="fw-bold text-primary mb-1">
                            <i className="fas fa-hospital-user me-2"></i>
                            Gestión Administrativa de Sede
                        </h2>
                        <p className="text-muted">Administra tu personal y herramientas de captación</p>
                    </div>
                    <div className="col-md-4 text-md-end">
                        <span className="badge bg-white text-primary border border-primary px-3 py-2 rounded-pill shadow-sm">
                            Clínica: {store.user?.clinic_name}
                        </span>
                    </div>
                </header>

                {/* Notificaciones flotantes */}
                {statusMsg.text && (
                    <div className={`alert alert-${statusMsg.type} shadow-sm border-0 animate__animated animate__fadeIn mb-4`}>
                        <i className={`fas ${statusMsg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2`}></i>
                        {statusMsg.text}
                    </div>
                )}

                {/* BARRA DE PESTAÑAS */}
                <ul className="nav nav-pills mb-4 bg-white p-2 rounded-pill shadow-sm d-inline-flex border">
                    <li className="nav-item">
                        <button
                            className={`nav-link rounded-pill px-4 fw-bold ${activeTab === "personal" ? "active" : "text-secondary"}`}
                            onClick={() => setActiveTab("personal")}
                        >
                            <i className="fas fa-users me-2"></i>Personal
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link rounded-pill px-4 fw-bold ${activeTab === "servicios" ? "active" : "text-secondary"}`}
                            onClick={() => setActiveTab("servicios")}
                        >
                            <i className="fas fa-briefcase-medical me-2"></i>Servicios
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link rounded-pill px-4 fw-bold ${activeTab === "captacion" ? "active" : "text-secondary"}`}
                            onClick={() => setActiveTab("captacion")}
                        >
                            <i className="fas fa-qrcode me-2"></i>Captación
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link rounded-pill px-4 fw-bold ${activeTab === "carga" ? "active" : "text-secondary"}`}
                            onClick={() => setActiveTab("carga")}
                        >
                            <i className="fas fa-file-csv me-2"></i>Carga Masiva
                        </button>
                    </li>
                </ul>

                {/* TAB: PERSONAL */}
                {activeTab === "personal" && (
                    <div className="card border-0 shadow-sm rounded-4 animate__animated animate__fadeIn">
                        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                            <h5 className="mb-0 fw-bold">Personal de la Sede</h5>
                            <div className="input-group input-group-sm w-50">
                                <span className="input-group-text bg-light border-0"><i className="fas fa-search text-muted"></i></span>
                                <input
                                    type="text"
                                    className="form-control border-0 bg-light"
                                    placeholder="Buscar por nombre o email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchFilter(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="px-4">Nombre / Email</th>
                                            <th>Rol</th>
                                            <th>Estado</th>
                                            <th className="text-end px-4">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStaff.length > 0 ? filteredStaff.map((member) => (
                                            <tr key={member.id}>
                                                <td className="px-4">
                                                    <div className="fw-bold">{member.full_name || "Pendiente de registro"}</div>
                                                    <div className="text-muted small">{member.email}</div>
                                                </td>
                                                <td>
                                                    <span className="badge bg-soft-primary text-primary border border-primary-subtle px-2 py-1">
                                                        {member.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${member.is_active ? 'bg-success' : 'bg-danger'} rounded-pill`}>
                                                        {member.is_active ? 'Activo' : 'Vetado'}
                                                    </span>
                                                </td>
                                                <td className="text-end px-4">
                                                    <button
                                                        onClick={() => handleToggleStatus(member.id, member.is_active)}
                                                        className={`btn btn-sm shadow-sm ${member.is_active ? 'btn-light text-danger' : 'btn-primary'}`}
                                                    >
                                                        {member.is_active ? 'Revocar' : 'Activar'}
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="4" className="text-center py-5 text-muted">
                                                    No hay personal registrado o que coincida con la búsqueda.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: SERVICIOS */}
                {activeTab === "servicios" && (
                    <div className="card border-0 shadow-sm rounded-4 animate__animated animate__fadeIn">
                        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-0 fw-bold">Servicios de la Clínica</h5>
                                <small className="text-muted">Define nombre, precio USD y activa o desactiva servicios.</small>
                            </div>
                            <button
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                    resetServiceForm();
                                }}
                            >
                                <i className="fas fa-plus me-2"></i>Nuevo servicio
                            </button>
                        </div>
                        <div className="card-body">
                            <div className="row g-3 mb-4">
                                <div className="col-12 col-md-5">
                                    <label className="form-label small fw-bold">Nombre del servicio</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm bg-light"
                                        value={serviceForm.name}
                                        onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="col-12 col-md-4">
                                    <label className="form-label small fw-bold">Precio USD</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="form-control form-control-sm bg-light"
                                        value={serviceForm.price_usd}
                                        onChange={(e) => setServiceForm({ ...serviceForm, price_usd: e.target.value })}
                                    />
                                </div>
                                <div className="col-12 col-md-3">
                                    <label className="form-label small fw-bold">Acción</label>
                                    <button
                                        type="button"
                                        onClick={handleServiceSave}
                                        className="btn btn-success btn-sm w-100"
                                        disabled={serviceLoading}
                                    >
                                        {serviceLoading ? 'Guardando...' : editingService ? 'Guardar cambios' : 'Crear servicio'}
                                    </button>
                                </div>
                                <div className="col-12">
                                    <label className="form-label small fw-bold">Descripción opcional</label>
                                    <textarea
                                        rows="2"
                                        className="form-control form-control-sm bg-light"
                                        value={serviceForm.description}
                                        onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Servicio</th>
                                            <th>Precio USD</th>
                                            <th>Estado</th>
                                            <th className="text-end">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {store.clinicServices.length > 0 ? store.clinicServices.map((service) => (
                                            <tr key={service.id}>
                                                <td>
                                                    <div className="fw-bold">{service.name}</div>
                                                    <div className="text-muted small">{service.description || 'Sin descripción'}</div>
                                                </td>
                                                <td>${service.price_usd.toFixed(2)}</td>
                                                <td>
                                                    <span className={`badge ${service.is_active ? 'bg-success' : 'bg-secondary'}`}>
                                                        {service.is_active ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td className="text-end">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary me-2"
                                                        onClick={() => handleServiceEdit(service)}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        className={`btn btn-sm ${service.is_active ? 'btn-outline-warning' : 'btn-outline-success'} me-2`}
                                                        onClick={() => handleServiceToggle(service)}
                                                    >
                                                        {service.is_active ? 'Desactivar' : 'Activar'}
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleServiceRemove(service.id)}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="4" className="text-center py-4 text-muted">
                                                    No hay servicios registrados para tu clínica.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: CAPTACIÓN */}
                {activeTab === "captacion" && (
                    <div className="animate__animated animate__fadeIn">
                        <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                            <span className="badge bg-white text-dark border p-2 shadow-sm">
                                <span className="text-muted fw-normal">Código de Sede:</span>
                                <code className="ms-2 fs-6 text-primary">{store.user?.staff_code || "VET-AUTO-77"}</code>
                            </span>
                        </div>

                        <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                            <div className="card-header bg-dark text-white py-3">
                                <h6 className="mb-0">
                                    <i className="fas fa-qrcode me-2 text-info"></i>QR para Clientes
                                </h6>
                            </div>
                            <div className="card-body text-center p-4">
                                <p className="text-muted small mb-3">
                                    Imprime este código y colócalo en recepción para que tus clientes se registren en tu sede.
                                </p>

                                <div className="bg-white p-3 d-inline-block rounded-4 border mb-3 shadow-sm">
                                    <QRCodeSVG value={registrationUrl} size={160} level="H" includeMargin={true} />
                                </div>

                                <div className="input-group input-group-sm mb-3">
                                    <input type="text" className="form-control bg-light border-0" value={registrationUrl} readOnly />
                                    <button
                                        className={`btn ${copied ? 'btn-success' : 'btn-outline-primary'}`}
                                        onClick={handleCopyLink}
                                    >
                                        <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                                    </button>
                                </div>

                                <div className="row g-2">
                                    <div className="col-6">
                                        <button className="btn btn-primary btn-sm w-100" onClick={() => window.print()}>
                                            <i className="fas fa-print me-1"></i> Imprimir
                                        </button>
                                    </div>
                                    <div className="col-6">
                                        <a href={registrationUrl} target="_blank" className="btn btn-light btn-sm w-100 border text-decoration-none text-dark">
                                            <i className="fas fa-external-link-alt me-1"></i> Ver Landing
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card border-0 shadow-sm rounded-4">
                            <div className="card-header bg-white py-3 border-bottom">
                                <h6 className="mb-0 fw-bold">Invitar Nuevo Empleado</h6>
                            </div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Email del Invitado</label>
                                    <input
                                        type="email"
                                        className="form-control form-control-sm border-0 bg-light px-3 py-2"
                                        placeholder="ejemplo@correo.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Asignar Rol</label>
                                    <select
                                        className="form-select form-select-sm border-0 bg-light px-3 py-2"
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value)}
                                    >
                                        <option value="DOCTOR">Médico Veterinario</option>
                                        <option value="RECEPTIONIST">Recepcionista</option>
                                        {store.user?.role === "CLINIC_ADMIN" ? (
                                            <option value="CLINIC_ADMIN">Co-Administrador</option>
                                        ) : (
                                            <option value="INDEPENDENT_VET">Administrador</option>
                                        )}
                                    </select>
                                </div>
                                <button className="btn btn-dark btn-sm w-100 fw-bold py-2 shadow-sm" onClick={handleSendInvite}>
                                    <i className="fas fa-paper-plane me-2"></i>Enviar Invitación
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: CARGA MASIVA */}
                {activeTab === "carga" && (
                    <div className="card border-0 shadow-sm rounded-4 animate__animated animate__fadeIn">
                        <div className="card-header bg-white py-3 border-bottom">
                            <h5 className="mb-0 fw-bold">Registro por Lote (CSV)</h5>
                        </div>
                        <div className="card-body">
                            <BulkUpload
                                clinicId={store.user?.clinic_id}
                                onComplete={() => actions.getStaff(store.user.clinic_id)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};