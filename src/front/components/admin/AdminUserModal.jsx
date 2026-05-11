import React, { useState, useEffect } from "react";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import toast from 'react-hot-toast';

export const AdminUserModal = ({ show, onClose, user, editing, onSave }) => {
    const { store } = useGlobalReducer();
    const [formData, setFormData] = useState({
        email: "",
        full_name: "",
        role: "DOCTOR",
        clinic_id: "",
        password: ""
    });
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editing && user) {
            setFormData({
                email: user.email || "",
                full_name: user.full_name || "",
                role: user.role || "DOCTOR",
                clinic_id: user.clinic_id || "",
                password: ""
            });
        } else {
            setFormData({
                email: "",
                full_name: "",
                role: "DOCTOR",
                clinic_id: "",
                password: ""
            });
        }
    }, [user, editing, show]);

    useEffect(() => {
        if (show) {
            loadClinics();
        }
    }, [show]);

    const loadClinics = async () => {
        try {
            const response = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/clinics", {
                headers: { "Authorization": `Bearer ${store.token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setClinics(data);
            }
        } catch (error) {
            console.error("Error cargando clínicas:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                email: formData.email,
                full_name: formData.full_name,
                role: formData.role,
                clinic_id: formData.clinic_id || null
            };

            if (!editing && formData.password) {
                payload.password = formData.password;
            } else if (editing && formData.password) {
                payload.password = formData.password;
            }

            const response = await fetch(
                editing
                    ? `${import.meta.env.VITE_BACKEND_URL}/api/users/${user.id}`
                    : `${import.meta.env.VITE_BACKEND_URL}/api/users`,
                {
                    method: editing ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${store.token}`
                    },
                    body: JSON.stringify(payload)
                }
            );

            if (response.ok) {
                toast.success(editing ? "Usuario actualizado" : "Usuario creado");
                onSave();
                onClose();
            } else {
                const error = await response.json();
                toast.error(error.message || "Error al guardar usuario");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error al guardar usuario");
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2000 }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4">
                    <div className={`modal-header ${editing ? 'bg-primary' : 'bg-success'} text-white border-0 rounded-top-4`}>
                        <h5 className="modal-title fw-bold">
                            <i className={`fas ${editing ? 'fa-edit' : 'fa-plus-circle'} me-2`}></i>
                            {editing ? 'Editar Usuario' : 'Crear Usuario'}
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body p-4">
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-uppercase text-muted">Email *</label>
                                <input
                                    type="email"
                                    className="form-control bg-light border-0"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={editing}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-uppercase text-muted">Nombre Completo *</label>
                                <input
                                    type="text"
                                    className="form-control bg-light border-0"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-uppercase text-muted">Rol *</label>
                                <select
                                    className="form-select bg-light border-0"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="DOCTOR">Doctor/Veterinario</option>
                                    <option value="CLINIC_ADMIN">Admin de Clínica</option>
                                    <option value="RECEPTIONIST">Recepcionista</option>
                                    <option value="SUPER_ADMIN">Super Admin</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-uppercase text-muted">Clínica</label>
                                <select
                                    className="form-select bg-light border-0"
                                    name="clinic_id"
                                    value={formData.clinic_id}
                                    onChange={handleChange}
                                >
                                    <option value="">Sin clínica asociada</option>
                                    {clinics.map(clinic => (
                                        <option key={clinic.id} value={clinic.id}>
                                            {clinic.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-uppercase text-muted">
                                    {editing ? 'Nueva Contraseña (deixa en blanco para mantener)' : 'Contraseña *'}
                                </label>
                                <input
                                    type="password"
                                    className="form-control bg-light border-0"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required={!editing}
                                    minLength="8"
                                />
                            </div>
                        </div>
                        <div className="modal-footer border-top bg-light rounded-bottom-4">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                            <button type="submit" className={`btn ${editing ? 'btn-primary' : 'btn-success'} fw-bold`} disabled={loading}>
                                {loading ? "Guardando..." : editing ? "Actualizar" : "Crear"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
