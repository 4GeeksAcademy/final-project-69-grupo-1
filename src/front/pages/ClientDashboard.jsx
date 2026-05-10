import React, { useEffect, useState } from "react";
import { useGlobalReducer } from "../hooks/useGlobalReducer";
import { useNavigate, Link } from "react-router-dom";
import { ClientHistoryModal } from "../components/modals/ClientHistoryModal";
import Swal from "sweetalert2"; // <-- Importamos SweetAlert2

export const ClientDashboard = () => {
    const { store, actions } = useGlobalReducer();
    const navigate = useNavigate();

    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedPetHistory, setSelectedPetHistory] = useState([]);
    const [activePetName, setActivePetName] = useState("");

    useEffect(() => {
        actions.getUserPets();
        actions.getUserAppointments();
    }, []);

    // --- NUEVA FUNCIÓN DE CANCELAR CON SWEETALERT2 ---
    const handleCancelAppointment = async (appointmentId) => {
        // Disparamos el modal bonito de confirmación
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción cancelará la cita y liberará el cupo para otro paciente.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545', // Rojo (danger) para la acción destructiva
            cancelButtonColor: '#6c757d', // Gris (secondary) para cancelar
            confirmButtonText: '<i class="fas fa-trash-alt me-2"></i>Sí, cancelar cita',
            cancelButtonText: 'No, mantenerla',
            reverseButtons: true // Pone el botón de cancelar a la izquierda (mejor UX)
        });

        // Si el usuario le dio al botón rojo de confirmar...
        if (result.isConfirmed) {
            // Mostramos un mensajito de carga opcional mientras el servidor responde
            Swal.fire({
                title: 'Cancelando...',
                text: 'Por favor espera un momento.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const success = await actions.cancelAppointment(appointmentId);

            if (success) {
                Swal.fire(
                    '¡Cancelada!',
                    'La cita ha sido cancelada con éxito.',
                    'success'
                );
            } else {
                Swal.fire(
                    'Error',
                    'Hubo un problema de conexión al intentar cancelar la cita.',
                    'error'
                );
            }
        }
    };

    const handleViewHistory = async (petId, petName) => {
        setActivePetName(petName);
        const history = await actions.getPetMedicalHistory(petId);
        setSelectedPetHistory(history || []);
        setShowHistoryModal(true);
    };

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            <div className="container">
                {/* Header de Bienvenida */}
                <header className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mb-5 animate__animated animate__fadeIn gap-4">
                    <div>
                        <h2 className="fw-bold text-dark mb-1">¡Hola, {store.user?.full_name?.split(' ')[0]}! 🐾</h2>
                        <p className="text-muted mb-0">Gestiona la salud y bienestar de tus mejores amigos.</p>
                    </div>

                    <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center">
                        {/* --- NUEVO RECUADRO AZUL DE LA CLÍNICA --- */}
                        <div className="bg-primary-subtle border border-primary-subtle rounded-pill px-4 py-2 d-inline-flex align-items-center shadow-sm">
                            <div className="bg-primary rounded-circle d-flex justify-content-center align-items-center me-3 shadow-sm" style={{ width: "38px", height: "38px" }}>
                                <i className="fas fa-clinic-medical text-white small"></i>
                            </div>
                            <div className="text-start pe-2">
                                <span className="d-block fw-bold text-primary" style={{ lineHeight: "1.2", fontSize: "0.95rem" }}>
                                    {store.user?.clinic_name || "Sede Principal"}
                                </span>
                                <small className="text-primary opacity-75 fw-medium" style={{ fontSize: "0.75rem" }}>
                                    <i className="fas fa-map-marker-alt me-1"></i> Caracas
                                </small>
                            </div>
                        </div>

                        {/* Línea separadora solo en pantallas medianas/grandes */}
                        <div className="d-none d-md-block border-start border-2 h-50 mx-2"></div>

                        {/* Botones de Acción */}
                        <div className="d-flex gap-2">
                            <button className="btn btn-outline-primary fw-bold px-4 rounded-pill shadow-sm" onClick={() => navigate("/agendar-cita")}>
                                <i className="fas fa-calendar-plus me-2"></i>Nueva Cita
                            </button>
                            <button className="btn btn-primary fw-bold px-4 rounded-pill shadow-sm" onClick={() => navigate("/mis-mascotas")}>
                                <i className="fas fa-plus me-2"></i>Registrar Mascota
                            </button>
                        </div>
                    </div>
                </header>

                <div className="row g-4">
                    {/* PANEL 1: MIS MASCOTAS */}
                    <div className="col-lg-5">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold"><i className="fas fa-paw text-primary me-2"></i>Mis Mascotas</h5>
                                <span className="badge bg-primary-subtle text-primary rounded-pill px-3">{store.userPets?.length || 0}</span>
                            </div>
                            <div className="card-body p-0">
                                <div className="list-group list-group-flush">
                                    {store.userPets?.length > 0 ? store.userPets.map((pet) => (
                                        <div key={pet.id} className="list-group-item list-group-item-action p-3 border-0 border-bottom">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-light rounded-circle p-3 me-3 text-primary">
                                                        <i className={`fas ${pet.especie === 'Canino' ? 'fa-dog' : 'fa-cat'} fa-lg`}></i>
                                                    </div>
                                                    <div>
                                                        <h6 className="mb-0 fw-bold">{pet.nombre}</h6>
                                                        <small className="text-muted">{pet.raza} • {pet.edad} años</small>
                                                    </div>
                                                </div>
                                                <button
                                                    className="btn btn-sm btn-outline-info rounded-pill fw-bold px-3 shadow-sm"
                                                    onClick={() => handleViewHistory(pet.id, pet.nombre)}
                                                >
                                                    <i className="fas fa-notes-medical me-1"></i> Historial
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-5 px-4">
                                            <i className="fas fa-bone fa-3x text-light mb-3"></i>
                                            <p className="text-muted">Aún no tienes mascotas registradas.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PANEL 2: MIS CITAS */}
                    <div className="col-lg-7">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-header bg-white py-3 border-bottom">
                                <h5 className="mb-0 fw-bold"><i className="fas fa-calendar-check text-primary me-2"></i>Mis Citas</h5>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light small">
                                            <tr>
                                                <th className="px-4 py-3">Mascota</th>
                                                <th>Detalles</th>
                                                <th>Estado</th>
                                                <th className="text-end px-4">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {store.userAppointments?.length > 0 ? store.userAppointments.map((app) => (
                                                <tr key={app.id}>
                                                    <td className="px-4 fw-bold text-primary">{app.pet_name}</td>
                                                    <td>
                                                        <div className="small fw-bold">{app.service_type}</div>
                                                        <div className="small text-muted">
                                                            {app.date.split('T')[0]} | {app.time}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`badge rounded-pill ${app.status === 'PROGRAMADA' ? 'bg-primary' :
                                                            app.status === 'EN_ATENCION' ? 'bg-warning text-dark' :
                                                            app.status === 'PENDIENTE_PAGO' ? 'bg-info text-dark' :
                                                            app.status === 'COMPLETADA' ? 'bg-success' : 'bg-danger'
                                                            }`}>
                                                            {app.status === 'PROGRAMADA' ? 'Programada' :
                                                             app.status === 'EN_ATENCION' ? 'En atención' :
                                                             app.status === 'PENDIENTE_PAGO' ? 'Pendiente de pago' :
                                                             app.status === 'COMPLETADA' ? 'Completada' : 'Cancelada'}
                                                        </span>
                                                    </td>
                                                    <td className="text-end px-4">
                                                        {app.status === 'PROGRAMADA' && (
                                                            <button
                                                                className="btn btn-sm btn-outline-danger fw-bold rounded-pill shadow-sm"
                                                                onClick={() => handleCancelAppointment(app.id)}
                                                            >
                                                                Cancelar
                                                            </button>
                                                        )}
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
                        </div>
                    </div>
                </div>
            </div>

            {/* Invocación del Componente Modal */}
            <ClientHistoryModal
                show={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                petName={activePetName}
                history={selectedPetHistory}
            />
        </div>
    );
};