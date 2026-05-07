import React, { useEffect } from "react";
import { useGlobalReducer } from "../hooks/useGlobalReducer";
import { useNavigate, Link } from "react-router-dom";

export const ClientDashboard = () => {
    const { store, actions } = useGlobalReducer();
    const navigate = useNavigate();

    useEffect(() => {
        actions.getUserPets();
        actions.getUserAppointments();
    }, []);

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            <div className="container">
                {/* Header de Bienvenida */}
                <header className="d-flex justify-content-between align-items-center mb-5 animate__animated animate__fadeIn">
                    <div>
                        <h2 className="fw-bold text-dark mb-1">¡Hola, {store.user?.full_name?.split(' ')[0]}! 🐾</h2>
                        <p className="text-muted mb-0">Gestiona la salud y bienestar de tus mejores amigos.</p>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-outline-primary fw-bold px-4 rounded-pill shadow-sm" onClick={() => navigate("/agendar-cita")}>
                            <i className="fas fa-calendar-plus me-2"></i>Nueva Cita
                        </button>
                        <button className="btn btn-primary fw-bold px-4 rounded-pill shadow-sm" onClick={() => navigate("/mis-mascotas")}>
                            <i className="fas fa-plus me-2"></i>Registrar Mascota
                        </button>
                    </div>
                </header>

                <div className="row g-4">
                    {/* PANEL 1: MIS MASCOTAS */}
                    <div className="col-lg-5">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold"><i className="fas fa-paw text-primary me-2"></i>Mis Mascotas</h5>
                                <span className="badge bg-soft-primary text-primary rounded-pill px-3">{store.userPets?.length || 0}</span>
                            </div>
                            <div className="card-body p-0">
                                <div className="list-group list-group-flush">
                                    {store.userPets?.length > 0 ? store.userPets.map((pet) => (
                                        <div key={pet.id} className="list-group-item list-group-item-action p-3 border-0 border-bottom">
                                            <div className="d-flex align-items-center">
                                                <div className="bg-light rounded-circle p-3 me-3 text-primary">
                                                    <i className={`fas ${pet.especie === 'Canino' ? 'fa-dog' : 'fa-cat'} fa-lg`}></i>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h6 className="mb-0 fw-bold">{pet.nombre}</h6>
                                                    <small className="text-muted">{pet.raza} • {pet.edad} años</small>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-5 px-4">
                                            <i className="fas fa-bone fa-3x text-light mb-3"></i>
                                            <p className="text-muted">Aún no tienes mascotas registradas.</p>
                                            <button className="btn btn-link text-primary p-0 fw-bold" onClick={() => navigate("/mis-mascotas")}>Comenzar aquí</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PANEL 2: CITAS Y ACTIVIDAD */}
                    <div className="col-lg-7">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-header bg-white py-3 border-bottom">
                                <h5 className="mb-0 fw-bold"><i className="fas fa-notes-medical text-primary me-2"></i>Próximas Citas y Actividad</h5>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light small">
                                            <tr>
                                                <th className="px-4 py-3">Mascota</th>
                                                <th>Servicio</th>
                                                <th>Fecha / Hora</th>
                                                <th className="text-end px-4">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {store.userAppointments?.length > 0 ? store.userAppointments.map((app) => (
                                                <tr key={app.id}>
                                                    <td className="px-4 fw-bold text-primary">{app.pet_name}</td>
                                                    <td>
                                                        <span className="small fw-bold">
                                                            {app.service_type === 'BARBER' ? '✂️ Barbería' : '🩺 Consulta'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="small mb-0">{app.date}</div>
                                                        <div className="text-muted x-small">{app.time}</div>
                                                    </td>
                                                    <td className="text-end px-4">
                                                        <span className={`badge rounded-pill ${
                                                            app.status === 'PENDING' ? 'bg-warning text-dark' : 
                                                            app.status === 'COMPLETED' ? 'bg-success' : 'bg-light text-muted'
                                                        }`}>
                                                            {app.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-5 text-muted">
                                                        No tienes citas agendadas actualmente.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {store.userAppointments?.length > 0 && (
                                <div className="card-footer bg-white border-top-0 text-center py-3">
                                    <Link to="/invoice" className="text-decoration-none small fw-bold">
                                        Ver todas mis facturas <i className="fas fa-chevron-right ms-1"></i>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};