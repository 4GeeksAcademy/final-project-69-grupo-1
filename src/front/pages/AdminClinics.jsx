import React, { useEffect, useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";

export const AdminClinics = () => {
    const { store, dispatch } = useGlobalReducer();

    // ESTADOS DEL FORMULARIO DE REGISTRO
    const [showForm, setShowForm] = useState(false);
    const initialFormState = { nombre: "", rif: "", ubicacion: "" };
    const [formData, setFormData] = useState(initialFormState);

    // ESTADOS PARA EL MODAL DE SUSPENDER/REACTIVAR
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [clinicToToggle, setClinicToToggle] = useState(null);
    const [suspensionReason, setSuspensionReason] = useState("Falta de pago");

    // ESTADOS PARA EL MODAL/FORMULARIO DE EDICIÓN
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState(initialFormState);
    const [clinicToEdit, setClinicToEdit] = useState(null);

    // ESTADO PARA EL BUSCADOR
    const [searchTerm, setSearchTerm] = useState("");

    const loadClinics = async () => {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const response = await fetch(backendUrl + "/api/clinics");
            if (response.ok) {
                const data = await response.json();
                dispatch({ type: "set_clinics", payload: data });
            }
        } catch (error) {
            console.error("Error trayendo clínicas:", error);
        }
    };

    useEffect(() => { loadClinics(); }, []);

    // EVENTOS
    const handleChange = (e, isEdit = false) => {
        if (isEdit) {
            setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    // CREAR CLÍNICA
    const handleCreateClinic = async (e) => {
        e.preventDefault();
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const response = await fetch(backendUrl + "/api/clinics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setFormData(initialFormState);
                setShowForm(false);
                loadClinics();
            } else {
                alert("Error: Verifica que el RIF no esté repetido.");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    // SUSPENSIÓN / REACTIVACION
    const executeToggle = async () => {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;

            const payload = {
                is_active: !clinicToToggle.is_active,
                suspension_reason: clinicToToggle.is_active ? suspensionReason : null
            };

            const response = await fetch(backendUrl + `/api/clinics/${clinicToToggle.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setShowStatusModal(false);
                setClinicToToggle(null);
                setSuspensionReason("Falta de pago");
                loadClinics();
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    // EJECUTAR EDICION 
    const executeEdit = async (e) => {
        e.preventDefault();

        const isConfirmed = window.confirm(`¿Estás seguro de guardar los cambios para ${clinicToEdit.nombre}?`);
        if (!isConfirmed) return;

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const response = await fetch(backendUrl + `/api/clinics/${clinicToEdit.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editFormData)
            });

            if (response.ok) {
                setShowEditModal(false);
                setClinicToEdit(null);
                loadClinics();
            } else {
                alert("Error al actualizar la clínica.");
            }
        } catch (error) {
            console.error("Error:", error);
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

            {/* TABLA PRINCIPAL */}
            <div className="card shadow-sm border-0 overflow-auto">
                <table className="table table-hover mb-0 text-center align-middle" style={{ minWidth: "900px" }}>
                    <thead className="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>RIF</th>
                            <th>Ubicación</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClinics.length > 0 ? (
                            filteredClinics.map(clinic => (
                                <tr key={clinic.id}>
                                    <td className="fw-bold text-muted">#{clinic.id}</td>
                                    <td className="fw-semibold text-start">{clinic.nombre}</td>
                                    <td>{clinic.rif}</td>
                                    <td>{clinic.ubicacion || "N/A"}</td>
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
                                            <button className="btn btn-sm btn-outline-primary" onClick={() => { setClinicToEdit(clinic); setEditFormData({ nombre: clinic.nombre, rif: clinic.rif, ubicacion: clinic.ubicacion || "" }); setShowEditModal(true); }}>
                                                Editar
                                            </button>
                                            <button className={`btn btn-sm ${clinic.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`} onClick={() => { setClinicToToggle(clinic); setShowStatusModal(true); }}>
                                                {clinic.is_active ? "Suspender" : "Reactivar"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="6" className="text-center py-4">No se encontraron clínicas.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL DE CONFIRMACIÓN DE ESTADO (CON MOTIVO) */}
            {showStatusModal && (
                <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-warning">
                                <h5 className="modal-title">Confirmación de Acción</h5>
                                <button type="button" className="btn-close" onClick={() => setShowStatusModal(false)}></button>
                            </div>
                            <div className="modal-body text-center fs-5">
                                ¿Está seguro de <strong>{clinicToToggle?.is_active ? "suspender" : "reactivar"}</strong> la clínica <span className="text-primary fw-bold">{clinicToToggle?.nombre}</span>?

                                {clinicToToggle?.is_active && (
                                    <div className="mt-4 text-start">
                                        <label className="form-label fw-bold fs-6">Motivo de la suspensión:</label>
                                        <select
                                            className="form-select"
                                            value={suspensionReason}
                                            onChange={(e) => setSuspensionReason(e.target.value)}
                                        >
                                            <option value="Falta de pago">Falta de pago</option>
                                            <option value="Incumplimiento de contrato">Incumplimiento de contrato</option>
                                            <option value="Cese de operaciones">Cese de operaciones</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer justify-content-center">
                                <button className="btn btn-secondary" onClick={() => setShowStatusModal(false)}>Cancelar</button>
                                <button className={`btn ${clinicToToggle?.is_active ? 'btn-danger' : 'btn-success'}`} onClick={executeToggle}>
                                    Sí, {clinicToToggle?.is_active ? "Suspender" : "Reactivar"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE EDICIÓN DE DATOS */}
            {showEditModal && (
                <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">Editar Datos de la Clínica</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditModal(false)}></button>
                            </div>
                            <form onSubmit={executeEdit}>
                                <div className="modal-body text-start row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Nombre</label>
                                        <input type="text" className="form-control" name="nombre" value={editFormData.nombre} onChange={(e) => handleChange(e, true)} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">RIF</label>
                                        <input type="text" className="form-control" name="rif" value={editFormData.rif} onChange={(e) => handleChange(e, true)} required />
                                    </div>
                                    <div className="col-md-12">
                                        <label className="form-label fw-bold">Ubicación</label>
                                        <input type="text" className="form-control" name="ubicacion" value={editFormData.ubicacion} onChange={(e) => handleChange(e, true)} required />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancelar</button>
                                    <button type="submit" className="btn btn-primary">Guardar Cambios</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};