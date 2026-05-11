import React, { useEffect, useState } from "react";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { AdminServiceModal } from "./AdminServiceModal";

export const AdminServicesTab = () => {
    const { store } = useGlobalReducer();
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [selectedClinicId, setSelectedClinicId] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        loadClinics();
    }, []);

    useEffect(() => {
        if (selectedClinicId) {
            loadServices(selectedClinicId);
        } else {
            setServices([]);
            setFilteredServices([]);
        }
    }, [selectedClinicId]);

    useEffect(() => {
        const filtered = services.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredServices(filtered);
    }, [searchTerm, services]);

    const loadClinics = async () => {
        try {
            const response = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/clinics", {
                headers: { "Authorization": `Bearer ${store.token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setClinics(data);
                if (data.length > 0 && !selectedClinicId) {
                    setSelectedClinicId(data[0].id.toString());
                }
            }
        } catch (error) {
            console.error("Error cargando clínicas:", error);
        }
    };

    const loadServices = async (clinicId) => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clinics/${clinicId}/services`, {
                headers: { "Authorization": `Bearer ${store.token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setServices(data);
            }
        } catch (error) {
            console.error("Error cargando servicios:", error);
            toast.error("Error al cargar servicios");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateService = () => {
        setSelectedService(null);
        setEditing(false);
        setShowModal(true);
    };

    const handleEditService = (service) => {
        setSelectedService(service);
        setEditing(true);
        setShowModal(true);
    };

    const handleDeleteService = async (service) => {
        const confirmed = await Swal.fire({
            title: `¿Eliminar "${service.name}"?`,
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        });

        if (confirmed.isConfirmed) {
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/services/${service.id}`, {
                    method: "DELETE",
                    headers: { "Authorization": `Bearer ${store.token}` }
                });

                if (response.ok) {
                    setServices(services.filter(s => s.id !== service.id));
                    toast.success("Servicio eliminado");
                } else {
                    toast.error("Error al eliminar servicio");
                }
            } catch (error) {
                console.error("Error:", error);
                toast.error("Error al eliminar");
            }
        }
    };

    const handleToggleServiceStatus = async (service) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/services/${service.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${store.token}`
                },
                body: JSON.stringify({ is_active: !service.is_active })
            });

            if (response.ok) {
                const updatedService = { ...service, is_active: !service.is_active };
                setServices(services.map(s => s.id === service.id ? updatedService : s));
                toast.success(`Servicio ${service.is_active ? 'desactivado' : 'activado'}`);
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error al cambiar estado");
        }
    };

    const handleServiceSaved = () => {
        toast.success(editing ? "Servicio actualizado" : "Servicio creado");
        setShowModal(false);
        if (selectedClinicId) {
            loadServices(selectedClinicId);
        }
    };

    return (
        <div className="animate__animated animate__fadeIn">
            <div className="row mb-3 g-3">
                <div className="col-md-4">
                    <label className="form-label fw-bold small text-uppercase text-muted d-block mb-2">Filtrar por Clínica</label>
                    <select
                        className="form-select shadow-sm border-0 bg-light"
                        value={selectedClinicId}
                        onChange={(e) => setSelectedClinicId(e.target.value)}
                    >
                        <option value="">Selecciona una clínica...</option>
                        {clinics.map(clinic => (
                            <option key={clinic.id} value={clinic.id}>
                                {clinic.nombre}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-md-4">
                    <label className="form-label fw-bold small text-uppercase text-muted d-block mb-2">Buscar Servicio</label>
                    <div className="input-group shadow-sm rounded-pill overflow-hidden border">
                        <span className="input-group-text bg-white border-0"><i className="fas fa-search text-muted"></i></span>
                        <input
                            type="text"
                            className="form-control border-0"
                            placeholder="Nombre del servicio..."
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={!selectedClinicId}
                        />
                    </div>
                </div>
                <div className="col-md-4 text-md-end d-flex align-items-end">
                    <button
                        className="btn btn-primary rounded-pill px-4 shadow-sm w-100"
                        onClick={handleCreateService}
                        disabled={!selectedClinicId}
                    >
                        + Crear Servicio
                    </button>
                </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4">
                <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between">
                    <h5 className="mb-0 fw-bold">Servicios {selectedClinicId && `de ${clinics.find(c => c.id.toString() === selectedClinicId)?.nombre || ''}`}</h5>
                    <button className="btn btn-sm btn-outline-secondary rounded-pill" onClick={() => selectedClinicId && loadServices(selectedClinicId)} disabled={loading || !selectedClinicId}>
                        <i className="fas fa-sync-alt"></i> {loading ? "Cargando..." : "Actualizar"}
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light text-muted small text-uppercase">
                            <tr>
                                <th className="px-4">Servicio</th>
                                <th>Descripción</th>
                                <th className="text-end">Precio USD</th>
                                <th className="text-center">Estado</th>
                                <th className="text-end px-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-4"><div className="spinner-border spinner-border-sm" role="status"><span className="visually-hidden">Cargando...</span></div></td></tr>
                            ) : !selectedClinicId ? (
                                <tr><td colSpan="5" className="text-center py-5 text-muted">Selecciona una clínica para ver servicios</td></tr>
                            ) : filteredServices.length > 0 ? (
                                filteredServices.map(service => (
                                    <tr key={service.id}>
                                        <td className="px-4">
                                            <div className="fw-bold">{service.name}</div>
                                        </td>
                                        <td>
                                            <small className="text-muted">{service.description || "Sin descripción"}</small>
                                        </td>
                                        <td className="text-end fw-bold text-primary">${service.price_usd?.toFixed(2) || "0.00"}</td>
                                        <td className="text-center">
                                            <span className={`badge rounded-pill ${service.is_active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                                {service.is_active ? 'ACTIVO' : 'INACTIVO'}
                                            </span>
                                        </td>
                                        <td className="text-end px-4">
                                            <div className="d-flex justify-content-end gap-2">
                                                <button
                                                    className="btn btn-sm btn-light border"
                                                    onClick={() => handleEditService(service)}
                                                    title="Editar"
                                                >
                                                    <i className="fas fa-edit text-primary"></i>
                                                </button>
                                                <button
                                                    className={`btn btn-sm ${service.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                    onClick={() => handleToggleServiceStatus(service)}
                                                    title={service.is_active ? "Desactivar" : "Activar"}
                                                >
                                                    <i className={`fas ${service.is_active ? 'fa-ban' : 'fa-check'}`}></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDeleteService(service)}
                                                    title="Eliminar"
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="text-center py-5 text-muted">No hay servicios en esta clínica</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AdminServiceModal
                show={showModal}
                onClose={() => setShowModal(false)}
                service={selectedService}
                clinicId={parseInt(selectedClinicId)}
                editing={editing}
                onSave={handleServiceSaved}
            />
        </div>
    );
};
