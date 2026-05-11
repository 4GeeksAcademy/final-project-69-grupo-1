import React, { useState, useEffect } from "react";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import toast from 'react-hot-toast';

export const AdminServiceModal = ({ show, onClose, service, clinicId, editing, onSave }) => {
    const { store } = useGlobalReducer();
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price_usd: ""
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editing && service) {
            setFormData({
                name: service.name || "",
                description: service.description || "",
                price_usd: service.price_usd || ""
            });
        } else {
            setFormData({
                name: "",
                description: "",
                price_usd: ""
            });
        }
    }, [service, editing, show]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const endpoint = editing
                ? `${import.meta.env.VITE_BACKEND_URL}/api/services/${service.id}`
                : `${import.meta.env.VITE_BACKEND_URL}/api/clinics/${clinicId}/services`;

            const response = await fetch(endpoint, {
                method: editing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${store.token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    price_usd: parseFloat(formData.price_usd)
                })
            });

            if (response.ok) {
                toast.success(editing ? "Servicio actualizado" : "Servicio creado");
                onSave();
                onClose();
            } else {
                const error = await response.json();
                toast.error(error.message || "Error al guardar servicio");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error al guardar servicio");
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
                            {editing ? 'Editar Servicio' : 'Crear Servicio'}
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body p-4">
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-uppercase text-muted">Nombre del Servicio *</label>
                                <input
                                    type="text"
                                    className="form-control bg-light border-0"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ej: Consulta General"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-uppercase text-muted">Descripción</label>
                                <textarea
                                    className="form-control bg-light border-0"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Describe brevemente el servicio"
                                ></textarea>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-uppercase text-muted">Precio USD *</label>
                                <input
                                    type="number"
                                    className="form-control bg-light border-0"
                                    name="price_usd"
                                    value={formData.price_usd}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    required
                                    placeholder="0.00"
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
