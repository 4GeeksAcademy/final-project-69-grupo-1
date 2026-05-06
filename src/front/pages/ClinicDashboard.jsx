import React, { useEffect, useState } from "react";
import { useGlobalReducer } from "../hooks/useGlobalReducer";
import { BulkUpload } from "../components/BulkUpload";
import { QRCodeSVG } from 'qrcode.react';

export const ClinicDashboard = () => {
    const { store, actions } = useGlobalReducer();
    const [searchTerm, setSearchFilter] = useState("");
    const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });
    const [copied, setCopied] = useState(false);

    // --- ESTADOS PARA INVITACIÓN ---
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("DOCTOR");

    // --- LÓGICA DE MARKETING (QR) ---
    const clinicId = store.user?.clinic_id;
    const registrationUrl = `${window.location.origin}/clinic/${clinicId}`;

    useEffect(() => {
        if (store.user?.clinic_id) {
            actions.getStaff(store.user.clinic_id);
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
                <header className="mb-4">
                    <h2 className="fw-bold text-primary mb-1">
                        <i className="fas fa-hospital-user me-2"></i>
                        {store.user?.clinic_name || "Gestión de Sede"}
                    </h2>
                    <p className="text-muted">Administra tu personal y herramientas de captación</p>
                </header>

                {/* Notificaciones flotantes */}
                {statusMsg.text && (
                    <div className={`alert alert-${statusMsg.type} shadow-sm border-0 animate__animated animate__fadeIn`}>
                        <i className={`fas ${statusMsg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2`}></i>
                        {statusMsg.text}
                    </div>
                )}

                <div className="row g-4">
                    {/* COLUMNA IZQUIERDA: LISTADO DE PERSONAL */}
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm rounded-4">
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
                    </div>

                    {/* COLUMNA DERECHA: SIDEBAR DE HERRAMIENTAS */}
                    <div className="col-lg-4">

                        <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                            <span className="badge bg-white text-dark border p-2 shadow-sm">
                                <span className="text-muted fw-normal">Código de Sede:</span>
                                <code className="ms-2 fs-6 text-primary">{store.user?.staff_code || "VET-AUTO-77"}</code>
                            </span>
                        </div>
                        {/* 1. QR DE CAPTACIÓN DE CLIENTES */}
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

                        {/* 2. INVITAR PERSONAL */}
                        <div className="card border-0 shadow-sm rounded-4 mb-4">
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
                                        {/* Mostramos opciones de Admin según el rol del usuario actual */}
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

                        {/* 3. CARGA MASIVA */}
                        <div className="card border-0 shadow-sm rounded-4">
                            <div className="card-header bg-white py-3 border-bottom">
                                <h6 className="mb-0 fw-bold">Registro por Lote (CSV)</h6>
                            </div>
                            <div className="card-body">
                                <BulkUpload
                                    clinicId={store.user?.clinic_id}
                                    onComplete={() => actions.getStaff(store.user.clinic_id)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};