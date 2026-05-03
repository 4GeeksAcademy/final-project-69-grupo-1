import React, { useEffect, useState } from "react";
import { useGlobalReducer } from "../hooks/useGlobalReducer";
import { BulkUpload } from "../components/BulkUpload";

export const ClinicDashboard = () => {
    const { store, actions } = useGlobalReducer();
    const [searchTerm, setSearchFilter] = useState("");
    const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });
    
    // --- NUEVOS ESTADOS PARA INVITACIÓN ---
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("DOCTOR"); // Rol por defecto

    useEffect(() => {
        if (store.user?.clinic_id) {
            actions.getStaff(store.user.clinic_id);
        }
    }, [store.user?.clinic_id]);

    const showNotification = (text, type = "success") => {
        setStatusMsg({ text, type });
        setTimeout(() => setStatusMsg({ text: "", type: "" }), 4000);
    };

    // --- FUNCIÓN PARA ENVIAR INVITACIÓN AL BACKEND ---
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
                    "Authorization": `Bearer ${localStorage.getItem("token")}` // Ajusta según tu manejo de tokens
                },
                body: JSON.stringify({
                    email: inviteEmail,
                    role: inviteRole
                })
            });

            const data = await resp.json();

            if (resp.ok) {
                showNotification(`Invitación enviada a ${inviteEmail}`, "success");
                setInviteEmail(""); // Limpiar campo
            } else {
                showNotification(data.msg || "Error al enviar invitación", "danger");
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

    const filteredStaff = store.staff.filter(member => 
        member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            {statusMsg.text && (
                <div className={`alert alert-${statusMsg.type} shadow-lg position-fixed top-0 end-0 m-3 z-3 animate__animated animate__fadeInRight`} role="alert" style={{ minWidth: '250px' }}>
                    <i className={`fas ${statusMsg.type === 'danger' ? 'fa-exclamation-triangle' : 'fa-check-circle'} me-2`}></i>
                    {statusMsg.text}
                </div>
            )}

            <div className="row justify-content-center">
                <div className="col-xl-11">
                    <div className="d-md-flex align-items-center justify-content-between mb-4 text-center text-md-start">
                        <div>
                            <h2 className="fw-bold text-primary mb-1">
                                <i className="fas fa-hospital-user me-2"></i>
                                {store.user?.clinic_name || "Gestión de Sede"}
                            </h2>
                            <p className="text-muted mb-0">Control de personal y migración de datos.</p>
                        </div>
                        <div className="mt-3 mt-md-0">
                            <span className="badge bg-white text-dark border p-2 shadow-sm">
                                <span className="text-muted fw-normal">Código de Sede:</span> 
                                <code className="ms-2 fs-6 text-primary">{store.user?.staff_code || "VET-AUTO-77"}</code>
                            </span>
                        </div>
                    </div>

                    <div className="row g-4">
                        <div className="col-lg-8">
                            {/* ... (Tabla de equipo - Se mantiene igual) ... */}
                            <div className="card shadow-sm border-0 h-100">
                                <div className="card-header bg-white py-3 border-0">
                                    <div className="row align-items-center g-2">
                                        <div className="col-12 col-sm-6">
                                            <h5 className="mb-0 fw-bold text-secondary">Equipo de Trabajo</h5>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="input-group input-group-sm">
                                                <span className="input-group-text bg-light border-0"><i className="fas fa-search text-muted"></i></span>
                                                <input 
                                                    type="text" 
                                                    className="form-control border-0 bg-light" 
                                                    placeholder="Buscar por nombre o email..." 
                                                    onChange={(e) => setSearchFilter(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body p-0">
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0 align-middle">
                                            <thead className="table-light text-muted small text-uppercase">
                                                <tr>
                                                    <th className="ps-4">Empleado</th>
                                                    <th>Rol</th>
                                                    <th>Estado</th>
                                                    <th className="text-end pe-4">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredStaff.length > 0 ? filteredStaff.map((member) => (
                                                    <tr key={member.id} className="animate__animated animate__fadeIn">
                                                        <td className="ps-4">
                                                            <div className="d-flex align-items-center">
                                                                <div className="avatar-sm me-3 bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}}>
                                                                    {member.full_name?.charAt(0) || 'U'}
                                                                </div>
                                                                <div>
                                                                    <div className="fw-bold text-dark">{member.full_name}</div>
                                                                    <div className="small text-muted">{member.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`badge rounded-pill ${member.role === 'VET' ? 'bg-info-subtle text-info' : 'bg-secondary-subtle text-secondary'}`}>
                                                                {member.role}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {member.is_active ? (
                                                                <span className="badge bg-success-subtle text-success border-0"><i className="fas fa-check me-1"></i>Activo</span>
                                                            ) : (
                                                                <span className="badge bg-danger-subtle text-danger border-0"><i className="fas fa-ban me-1"></i>Vetado</span>
                                                            )}
                                                        </td>
                                                        <td className="text-end pe-4">
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
                                                            No se encontró personal registrado.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-4">
                            <div className="d-flex flex-column gap-4">
                                <BulkUpload onNotify={showNotification} />

                                {/* --- APARTADO DE INVITACIÓN ACTUALIZADO --- */}
                                <div className="card shadow-sm border-0 border-top border-primary border-4">
                                    <div className="card-body">
                                        <h6 className="fw-bold mb-3">
                                            <i className="fas fa-paper-plane text-primary me-2"></i>Invitación Directa
                                        </h6>
                                        <p className="small text-muted">Envía un acceso por correo para que el personal se registre.</p>
                                        
                                        <div className="d-grid gap-3">
                                            {/* Input de Email */}
                                            <div>
                                                <label className="small fw-bold text-muted">Correo Electrónico</label>
                                                <input 
                                                    type="email"
                                                    className="form-control form-control-sm bg-light border-0"
                                                    placeholder="ejemplo@correo.com"
                                                    value={inviteEmail}
                                                    onChange={(e) => setInviteEmail(e.target.value)}
                                                />
                                            </div>

                                            {/* Select de Roles Dinámico */}
                                            <div>
                                                <label className="small fw-bold text-muted">Asignar Rol</label>
                                                <select 
                                                    className="form-select form-select-sm border-0 bg-light"
                                                    value={inviteRole}
                                                    onChange={(e) => setInviteRole(e.target.value)}
                                                >
                                                    <option value="DOCTOR">Médico Veterinario</option>
                                                    <option value="RECEPTIONIST">Recepcionista</option>
                                                    
                                                    {/* Lógica condicional según el tipo de clínica */}
                                                    {store.user?.role ? (
                                                        <option value="INDEPENDENT_VET">Administrador</option>
                                                    ) : (
                                                        <option value="CLINIC_ADMIN">Administrador de Clínica</option>
                                                    )}
                                                </select>
                                            </div>

                                            <button 
                                                className="btn btn-primary btn-sm fw-bold shadow-sm"
                                                onClick={handleSendInvite}
                                            >
                                                Enviar Invitación
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};