import React, { useEffect } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx"; // Usamos el hook oficial de tu proyecto

export const AdminClinics = () => {
    // Sacamos el store (para leer) y el dispatch (para enviar acciones)
    const { store, dispatch } = useGlobalReducer();

    // Función para traer los datos del backend
    const loadClinics = async () => {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const response = await fetch(backendUrl + "/api/organizations");

            if (response.ok) {
                const data = await response.json();
                dispatch({ type: "set_clinics", payload: data });
            } else {
                console.error("Error en la respuesta del servidor");
            }
        } catch (error) {
            console.error("Error haciendo el fetch de clínicas:", error);
        }
    };

    useEffect(() => {
        loadClinics();
    }, []);

    return (
        <div className="container mt-5 py-4" style={{ backgroundColor: "#F8F9FA", borderRadius: "10px" }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 style={{ color: "#212529" }}>Gestión de Clínicas</h2>
                    <p className="text-muted">Administrador: <strong>{store.user?.email}</strong></p>
                </div>
                <button className="btn btn-primary shadow-sm" style={{ backgroundColor: "#0D6EFD" }}>
                    + Registrar Clínica
                </button>
            </div>

            <div className="card shadow-sm border-0">
                <table className="table table-hover mb-0 text-center align-middle">
                    <thead className="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Nombre de la Clínica</th>
                            <th>RIF</th>
                            <th>Estado</th>
                            <th>Suscripción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Mapeamos la lista real que viene de la base de datos */}
                        {store.clinics && store.clinics.length > 0 ? (
                            store.clinics.map(clinic => (
                                <tr key={clinic.id}>
                                    <td className="fw-bold text-muted">#{clinic.id}</td>
                                    <td className="fw-semibold text-start">{clinic.name}</td>
                                    <td>{clinic.rif_nit}</td>
                                    <td>
                                        {/* Renderizado condicional basado en el estado */}
                                        {clinic.is_active ? (
                                            <span className="badge bg-success">Activa</span>
                                        ) : (
                                            <span className="badge bg-danger">Suspendida</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className="badge bg-secondary">{clinic.subscription_plan}</span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-muted">
                                    <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                    Cargando clínicas o no hay registros...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};