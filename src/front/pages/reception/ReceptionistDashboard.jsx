import React, { useEffect, useState } from "react";
import { useGlobalReducer } from "../../hooks/useGlobalReducer";
import { PaymentModal } from "../../components/payments/PaymentModal"; // Importamos el modal anterior

export const ReceptionistDashboard = () => {
    const { store, actions } = useGlobalReducer();
    const [selectedApp, setSelectedApp] = useState(null); // Cita seleccionada para pagar

    useEffect(() => {
        actions.loadReceptionAppointments();
    }, []);

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            <div className="row mb-4">
                <div className="col">
                    <h2 className="fw-bold text-primary">Agenda del Día 🗓️</h2>
                    <p className="text-secondary">Gestión de turnos y cobranzas</p>
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th className="ps-4">Hora</th>
                                    <th>Paciente / Dueño</th>
                                    <th>Servicio</th>
                                    <th>Estado</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {store.appointments?.map((app) => (
                                    <tr key={app.id}>
                                        <td className="ps-4 fw-bold">{app.time}</td>
                                        <td>
                                            <div className="d-flex flex-column">
                                                <span>{app.pet_name} 🐾</span>
                                                <small className="text-muted">{app.owner_name}</small>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge bg-info text-dark">{app.service_type}</span>
                                        </td>
                                        <td>
                                            <span className={`badge ${app.status === 'COMPLETADA' ? 'bg-success' :
                                                    app.status === 'CANCELADA' ? 'bg-danger' :
                                                        app.status === 'PENDIENTE_PAGO' ? 'bg-info text-dark' :
                                                            'bg-warning text-dark'
                                                }`}>
                                                {app.status === 'COMPLETADA' ? 'Finalizada' :
                                                    app.status === 'CANCELADA' ? 'Cancelada' :
                                                        app.status === 'PENDIENTE_PAGO' ? 'Pendiente de pago' :
                                                            'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            {app.status === "PENDIENTE_PAGO" ? (
                                                <button
                                                    className="btn btn-sm btn-outline-success shadow-sm"
                                                    onClick={() => setSelectedApp(app)}
                                                >
                                                    <i className="fas fa-cash-register me-1"></i> Cobrar
                                                </button>
                                            ) : app.status === "COMPLETADA" ? (
                                                <span className="text-success small fw-bold">Pagado ✓</span>
                                            ) : (
                                                <span className="text-muted small">No disponible</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {(!store.appointments || store.appointments.length === 0) && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5 text-muted">
                                            No hay citas programadas para hoy.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Pago - Se abre solo si hay una cita seleccionada */}
            {selectedApp && (
                <PaymentModal
                    appointment={selectedApp}
                    onClose={() => {
                        setSelectedApp(null);
                        actions.loadReceptionAppointments(); // Refrescar lista tras el pago
                    }}
                />
            )}
        </div>
    );
};