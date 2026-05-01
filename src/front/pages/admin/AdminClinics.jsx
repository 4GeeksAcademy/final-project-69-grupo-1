import React, { useEffect, useState } from "react";
import useGlobalReducer from "../../hooks/useGlobalReducer.jsx";

// Importamos los modales
import { ToggleStatusModal } from "../../components/modals/ToggleStatusModal.jsx";
import { EditClinicModal } from "../../components/modals/EditClinicModal.jsx";
import { DeleteClinicModal } from "../../components/modals/DeleteClinicModal.jsx";
import { ViewClinicDetailsModal } from "../../components/modals/ViewClinicDetailsModal.jsx";

export const AdminClinics = () => {
    const { store, dispatch } = useGlobalReducer();

    // ESTADOS DEL FORMULARIO DE REGISTRO
    const [showForm, setShowForm] = useState(false);
    const initialFormState = { nombre: "", rif: "", ubicacion: "", telefono: "", correo: "" };
    const [formData, setFormData] = useState(initialFormState);

    // ESTADOS PARA LOS MODALES
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const [selectedClinic, setSelectedClinic] = useState(null);
    const [editFormData, setEditFormData] = useState(initialFormState);
    const [suspensionReason, setSuspensionReason] = useState("Falta de pago");

    // ESTADO PARA EL BUSCADOR
    const [searchTerm, setSearchTerm] = useState("");

    const loadClinics = async () => {
        if (!store.token) return; // Protección: Si no hay token, no intentar pedir datos

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const response = await fetch(backendUrl + "/api/clinics", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${store.token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                dispatch({ type: "set_clinics", payload: data });
            } else if (response.status === 403) {
                alert("No tienes permisos de Super Admin para ver esta sección.");
            }
        } catch (error) {
            console.error("Error trayendo clínicas:", error);
        }
    };
    
    useEffect(() => { loadClinics(); }, [store.token]);

    // EVENTOS DE FORMULARIO
    const handleChange = (e, isEdit = false) => {
        if (isEdit) {
            setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    // --- FUNCIONES CRUD ---

    const handleCreateClinic = async (e) => {
        e.preventDefault();
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const response = await fetch(backendUrl + "/api/clinics", {
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
                loadClinics();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.message || errorData.error}`);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const executeToggle = async () => {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const response = await fetch(backendUrl + `/api/clinics/${selectedClinic.id}/status`, {
                method: "PATCH",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${store.token}` 
                },
                body: JSON.stringify({ reason: selectedClinic.is_active ? suspensionReason : null })
            });

            if (response.ok) {
                const data = await response.json();
                dispatch({ type: "update_clinic", payload: data.clinic });
                setShowStatusModal(false);
                setSelectedClinic(null);
                setSuspensionReason("Falta de pago");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const executeEdit = async (e) => {
        e.preventDefault();
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const response = await fetch(backendUrl + `/api/clinics/${selectedClinic.id}`, {
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
                setShowEditModal(false);
                setSelectedClinic(null);
            } else {
                alert("Error al actualizar la clínica.");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const executeDelete = async () => {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const response = await fetch(backendUrl + `/api/clinics/${selectedClinic.id}`, {
                method: "DELETE",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${store.token}`
                }
            });

            if (response.ok) {
                setShowDeleteModal(false);
                setSelectedClinic(null);
                loadClinics();
            } else {
                alert("Error al eliminar la clínica.");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const handleToggleUserBan = async (clinicId, userId, newStatus) => {
        const isConfirmed = window.confirm(`¿Seguro que deseas ${newStatus ? 'quitar el veto' : 'vetar'} a este usuario?`);
        if (!isConfirmed) return;

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const response = await fetch(backendUrl + `/api/users/${userId}/ban`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${store.token}`
                },
                body: JSON.stringify({ is_active: newStatus })
            });

            if (response.ok) {
                loadClinics();
                setShowDetailsModal(false);
            }
        } catch (error) {
            console.error("Error vetando usuario:", error);
        }
    };


    // Filtro para el buscador
    const filteredClinics = store.clinics?.filter(clinic =>
        clinic.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clinic.rif.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="container mt-5 py-4 flex-grow-1" style={{ backgroundColor: "#F8F9FA", borderRadius: "10px" }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 style={{ color: "#212529" }}>Gestión de Clínicas</h2>
                    <p className="text-muted mb-0">Administrador: <strong>{store.user?.email || "SuperAdmin"}</strong></p>
                </div>
                <button className="btn btn-primary shadow-sm" onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cerrar Formulario" : "+ Registrar Clínica"}
                </button>
            </div>

            {/* FORMULARIO DE REGISTRO */}
            {showForm && (
                <div className="card shadow-sm border-0 mb-4 p-4 border-top border-primary border-4">
                    <h5 className="mb-4">Registrar Nueva Clínica Veterinaria</h5>
                    <form onSubmit={handleCreateClinic} className="row g-3">
                        <div className="col-md-4">
                            <label className="form-label fw-bold">Nombre *</label>
                            <input type="text" className="form-control" name="nombre" value={formData.nombre} onChange={(e) => handleChange(e)} placeholder="Ej: VetSalud" required />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-bold">RIF *</label>
                            <input type="text" className="form-control" name="rif" value={formData.rif} onChange={(e) => handleChange(e)} placeholder="Ej: J-12345678-9" required />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-bold">Ubicación *</label>
                            <input type="text" className="form-control" name="ubicacion" value={formData.ubicacion} onChange={(e) => handleChange(e)} placeholder="Ej: Caracas, Miranda" required />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-bold">Teléfono</label>
                            <input type="text" className="form-control" name="telefono" value={formData.telefono} onChange={(e) => handleChange(e)} placeholder="Ej: 0414-1234567" />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-bold">Correo de Contacto</label>
                            <input type="email" className="form-control" name="correo" value={formData.correo} onChange={(e) => handleChange(e)} placeholder="Ej: contacto@vetsalud.com" />
                        </div>
                        <div className="col-12 d-flex justify-content-end mt-3">
                            <button type="submit" className="btn btn-success px-5">Guardar Clínica</button>
                        </div>
                    </form>
                </div>
            )}

            {/* BARRA DE BÚSQUEDA */}
            <div className="row mb-3">
                <div className="col-md-4">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="🔍 Buscar por nombre o RIF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* TABLA PRINCIPAL ACTUALIZADA CON CONTACTO */}
            <div className="card shadow-sm border-0 overflow-auto">
                <table className="table table-hover mb-0 text-center align-middle" style={{ minWidth: "1100px" }}>
                    <thead className="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>RIF</th>
                            <th>Teléfono</th>
                            <th>Correo</th>
                            <th>Estado</th>
                            <th>Acciones Básicas</th>
                            <th>Administración</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClinics.length > 0 ? (
                            filteredClinics.map(clinic => (
                                <tr key={clinic.id}>
                                    <td className="fw-bold text-muted">#{clinic.id}</td>
                                    <td className="fw-semibold text-start">{clinic.nombre}</td>
                                    <td>{clinic.rif}</td>
                                    <td>{clinic.telefono || <span className="text-muted">N/A</span>}</td>
                                    <td>{clinic.correo || <span className="text-muted">N/A</span>}</td>
                                    <td>
                                        {clinic.is_active ? (
                                            <span className="badge bg-success">Activa</span>
                                        ) : (
                                            <div>
                                                <span className="badge bg-danger mb-1">Suspendida</span><br />
                                                <small className="text-muted" style={{ fontSize: "0.75rem" }}>{clinic.suspension_reason}</small>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div className="d-flex justify-content-center gap-2">
                                            <button className="btn btn-sm btn-outline-info" onClick={() => { setSelectedClinic(clinic); setShowDetailsModal(true); }}>
                                                Detalles / Vetar
                                            </button>
                                            <button className="btn btn-sm btn-outline-primary" onClick={() => {
                                                setSelectedClinic(clinic);
                                                setEditFormData({ nombre: clinic.nombre, rif: clinic.rif, ubicacion: clinic.ubicacion || "", telefono: clinic.telefono || "", correo: clinic.correo || "" });
                                                setShowEditModal(true);
                                            }}>
                                                Editar
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="d-flex justify-content-center gap-2">
                                            <button className={`btn btn-sm ${clinic.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`} onClick={() => { setSelectedClinic(clinic); setShowStatusModal(true); }}>
                                                {clinic.is_active ? "Suspender" : "Reactivar"}
                                            </button>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => { setSelectedClinic(clinic); setShowDeleteModal(true); }}>
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="8" className="text-center py-4">No se encontraron clínicas.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* INSTANCIAS DE LOS MODALES */}

            <ToggleStatusModal
                show={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                onConfirm={executeToggle}
                clinic={selectedClinic}
                suspensionReason={suspensionReason}
                setSuspensionReason={setSuspensionReason}
            />

            <EditClinicModal
                show={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSubmit={executeEdit}
                editFormData={editFormData}
                handleChange={handleChange}
            />

            <DeleteClinicModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={executeDelete}
                clinic={selectedClinic}
            />

            <ViewClinicDetailsModal
                show={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                clinic={selectedClinic}
                onToggleUserBan={handleToggleUserBan}
            />

        </div>
    );
};