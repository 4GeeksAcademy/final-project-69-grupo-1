import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { MedicalRecordModal } from "../components/modals/MedicalRecordModal";
import Swal from "sweetalert2"; // <-- Importamos SweetAlert para el aviso

export const DoctorDashboard = () => {
    const { store, actions } = useGlobalReducer();

    // Estados para el Modal y Citas
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Estado para controlar qué pestaña estamos viendo
    const [activeTab, setActiveTab] = useState("calendario");

    // Estados para el Explorador de Pacientes
    const [searchResults, setSearchResults] = useState([]);
    const [selectedPet, setSelectedPet] = useState(null);
    const [medicalHistory, setMedicalHistory] = useState([]);

    useEffect(() => {
        actions.getDoctorAppointments();
    }, []);

    // Transformamos las citas
    const events = store.appointments?.map(app => {
        if (!app || !app.date_time) return null;

        return {
            id: app.id,
            title: `${app.tipo} (ID Mascota: ${app.pet_id})`,
            start: `${app.date_time}T${app.time}`,
            backgroundColor: app.status === "EN_ATENCION" ? "#ffc107" :
                app.status === "PENDIENTE_PAGO" ? "#0dcaf0" :
                    app.status === "COMPLETADA" ? "#198754" : "#0d6efd",
            extendedProps: { ...app }
        };
    }).filter(e => e !== null) || [];

    // --- AQUÍ ESTÁ LA MAGIA DEL BLOQUEO ---
    const handleEventClick = (info) => {
        const appointmentData = info.event.extendedProps;

        // Si la cita ya fue procesada por el doctor, bloqueamos la apertura del modal.
        if (appointmentData.status === "COMPLETADA" || appointmentData.status === "PENDIENTE_PAGO") {
            Swal.fire({
                title: appointmentData.status === "COMPLETADA" ? 'Cita Completada' : 'Pago pendiente',
                html: appointmentData.status === "COMPLETADA"
                    ? `El historial médico para esta consulta ya fue registrado y cerrado.<br><br>Si deseas leer el expediente de <b>${appointmentData.pet_name || 'este paciente'}</b>, por favor utiliza la pestaña de <b>Expedientes Clínicos</b>.`
                    : `El historial médico ya está guardado, pero falta registrar el pago para finalizar la cita.`,
                icon: 'info',
                confirmButtonColor: '#0d6efd',
                confirmButtonText: 'Entendido'
            });
            return; // Evita que el código siga y abra el modal
        }

        // Si no está completada, abrimos el modal normal
        setSelectedAppointment(appointmentData);
        setShowModal(true);
    };

    return (
        <div className="container-fluid py-4">

            {/* Header del Dashboard */}
            <div className="row mb-4 align-items-center">
                <div className="col-md-7 mb-3 mb-md-0">
                    <h2 className="fw-bold text-dark mb-0">Panel Médico</h2>
                    <p className="text-muted mb-0">Gestión de consultas diarias</p>
                </div>


                <div className="col-md-5 text-md-end d-flex justify-content-md-end">
                    <div className="bg-primary-subtle border border-primary-subtle rounded-pill px-4 py-2 d-inline-flex align-items-center shadow-sm">
                        <div className="bg-primary rounded-circle d-flex justify-content-center align-items-center me-3 shadow-sm" style={{ width: "38px", height: "38px" }}>
                            <i className="fas fa-hospital text-white small"></i>
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
                </div>
            </div>

            {/* --- NAVEGACIÓN POR PESTAÑAS --- */}
            <ul className="nav nav-pills mb-4 border-bottom pb-3">
                <li className="nav-item me-2">
                    <button
                        className={`nav-link fw-bold px-4 rounded-pill ${activeTab === "calendario" ? "active shadow-sm" : "text-secondary bg-light"}`}
                        onClick={() => setActiveTab("calendario")}
                    >
                        <i className="fas fa-calendar-alt me-2"></i> Mi Agenda
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link fw-bold px-4 rounded-pill ${activeTab === "explorador" ? "active shadow-sm" : "text-secondary bg-light"}`}
                        onClick={() => setActiveTab("explorador")}
                    >
                        <i className="fas fa-folder-open me-2"></i> Expedientes Clínicos
                    </button>
                </li>
            </ul>

            {/* --- PESTAÑA 1: EL CALENDARIO Y LA AGENDA --- */}
            {activeTab === "calendario" && (
                <div className="row animate__animated animate__fadeIn">
                    <div className="col-lg-9 mb-4">
                        <div className="card shadow-sm p-3 bg-white border-0 rounded-4">
                            <FullCalendar
                                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                initialView="timeGridWeek"
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                                }}
                                events={events}
                                eventClick={handleEventClick}
                                locale="es"
                                slotMinTime="08:00:00"
                                slotMaxTime="20:00:00"
                                allDaySlot={false}
                                height="auto"
                            />
                        </div>
                    </div>

                    <div className="col-lg-3">
                        <div className="card shadow-sm border-0 p-3 rounded-4 bg-white">
                            <h5 className="fw-bold text-primary border-bottom pb-2">Agenda de Hoy</h5>
                            {events.filter(e => new Date(e.start).toDateString() === new Date().toDateString()).length > 0 ? (
                                <ul className="list-group list-group-flush">
                                    {events.filter(e => new Date(e.start).toDateString() === new Date().toDateString()).map(ev => (
                                        <li
                                            key={ev.id}
                                            className="list-group-item px-0 py-3 border-bottom"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleEventClick({ event: { extendedProps: ev.extendedProps } })}
                                        >
                                            <div className="d-flex justify-content-between w-100 mb-1">
                                                <strong className="text-dark fs-5">
                                                    {new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </strong>
                                                <span className={`badge ${ev.extendedProps.status === 'EN_ATENCION' ? 'bg-warning text-dark' : ev.extendedProps.status === 'PENDIENTE_PAGO' ? 'bg-info text-dark' : ev.extendedProps.status === 'COMPLETADA' ? 'bg-success' : 'bg-primary'} align-self-start`}>
                                                    {ev.extendedProps.status}
                                                </span>
                                            </div>
                                            <small className="text-muted fw-semibold">{ev.title}</small>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-5">
                                    <i className="fas fa-mug-hot fa-3x text-light mb-3"></i>
                                    <p className="text-muted">No tienes citas programadas para hoy.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- PESTAÑA 2: EL EXPLORADOR DE PACIENTES --- */}
            {activeTab === "explorador" && (
                <div className="row animate__animated animate__fadeIn">
                    <div className="col-12">
                        <div className="card shadow-sm border-0 p-4 bg-white rounded-4">
                            <h5 className="fw-bold text-dark border-bottom pb-3 mb-4">
                                <i className="fas fa-search text-primary me-2"></i>
                                Búsqueda de Archivo Médico
                            </h5>

                            <div className="row">
                                <div className="col-md-4 border-end pe-4">
                                    <label className="form-label small fw-bold text-muted">Nombre del Cliente o Correo</label>
                                    <div className="input-group mb-4 shadow-sm rounded">
                                        <input
                                            type="text"
                                            className="form-control border-0 bg-light py-2"
                                            placeholder="Ej: juan@test.com"
                                            id="searchInput"
                                            onKeyDown={async (e) => {
                                                if (e.key === 'Enter') {
                                                    const results = await actions.searchClients(e.target.value);
                                                    setSearchResults(results);
                                                    setSelectedPet(null);
                                                    setMedicalHistory([]);
                                                }
                                            }}
                                        />
                                        <button
                                            className="btn btn-primary px-4"
                                            onClick={async () => {
                                                const query = document.getElementById('searchInput').value;
                                                const results = await actions.searchClients(query);
                                                setSearchResults(results);
                                            }}
                                        >
                                            <i className="fas fa-search"></i>
                                        </button>
                                    </div>

                                    {searchResults && searchResults.length > 0 && (
                                        <div className="list-group">
                                            {searchResults.map(client => (
                                                <div key={client.id} className="list-group-item border border-light bg-light mb-3 rounded-4 shadow-sm p-3">
                                                    <div className="fw-bold text-dark">{client.full_name}</div>
                                                    <small className="text-muted mb-2 d-block">{client.email}</small>
                                                    <span className="small fw-bold text-secondary d-block mb-2">Mascotas Asociadas:</span>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {client.pets.map(pet => (
                                                            <button
                                                                key={pet.id}
                                                                className={`btn btn-sm rounded-pill fw-bold ${selectedPet?.id === pet.id ? 'btn-primary shadow-sm' : 'btn-outline-primary bg-white'}`}
                                                                onClick={async () => {
                                                                    setSelectedPet(pet);
                                                                    const history = await actions.getPetMedicalHistory(pet.id);
                                                                    setMedicalHistory(history || []);
                                                                }}
                                                            >
                                                                🐾 {pet.nombre}
                                                            </button>
                                                        ))}
                                                        {client.pets.length === 0 && <span className="small text-muted">Sin mascotas registradas.</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="col-md-8 ps-4">
                                    {selectedPet ? (
                                        <>
                                            <div className="d-flex justify-content-between align-items-center mb-4 bg-primary-subtle p-3 rounded-4">
                                                <h5 className="fw-bold text-primary mb-0">
                                                    Historial de {selectedPet.nombre} <span className="text-dark fs-6 fw-normal">({selectedPet.especie})</span>
                                                </h5>
                                                <span className="badge bg-white text-primary border border-primary px-3 py-2 rounded-pill shadow-sm">
                                                    {medicalHistory.length} Visitas Registradas
                                                </span>
                                            </div>

                                            {medicalHistory.length > 0 ? (
                                                <div className="accordion shadow-sm" id="historyAccordion">
                                                    {medicalHistory.map((record, index) => (
                                                        <div className="accordion-item mb-3 border-0 rounded-4 overflow-hidden" key={record.id}>
                                                            <h2 className="accordion-header">
                                                                <button className={`accordion-button ${index !== 0 ? 'collapsed' : ''} bg-light fw-bold`} type="button" data-bs-toggle="collapse" data-bs-target={`#collapse${record.id}`}>
                                                                    <div className="d-flex w-100 justify-content-between me-3">
                                                                        <span>🗓️ {new Date(record.fecha).toLocaleDateString()}</span>
                                                                        <span className="text-muted fw-normal">{record.motivo}</span>
                                                                    </div>
                                                                </button>
                                                            </h2>
                                                            <div id={`collapse${record.id}`} className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`} data-bs-parent="#historyAccordion">
                                                                <div className="accordion-body bg-white border-top">
                                                                    <div className="row mb-4">
                                                                        <div className="col-6">
                                                                            <div className="p-2 bg-light rounded text-center border">
                                                                                <small className="text-muted d-block fw-bold mb-1">Peso</small>
                                                                                <span className="fs-5 fw-semibold text-dark">{record.peso} Kg</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="col-6">
                                                                            <div className="p-2 bg-light rounded text-center border">
                                                                                <small className="text-muted d-block fw-bold mb-1">Temperatura</small>
                                                                                <span className="fs-5 fw-semibold text-dark">{record.temperatura} °C</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <h6 className="fw-bold text-secondary mb-2 border-bottom pb-1">Diagnóstico Clínico</h6>
                                                                    <p className="text-dark mb-4">{record.diagnostico}</p>

                                                                    <h6 className="fw-bold text-secondary mb-2 border-bottom pb-1">Tratamiento / Receta</h6>
                                                                    <p className="text-dark mb-4">{record.tratamiento}</p>

                                                                    {record.examenes && (
                                                                        <>
                                                                            <h6 className="fw-bold text-secondary mb-2 border-bottom pb-1">Exámenes Solicitados</h6>
                                                                            <p className="text-dark mb-4">{record.examenes}</p>
                                                                        </>
                                                                    )}
                                                                    <div className="text-end mt-3 border-top pt-2">
                                                                        <small className="text-muted"><i className="fas fa-user-md me-1"></i> Atendido por: <strong>{record.doctor_name}</strong></small>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-5 bg-light rounded-4 border">
                                                    <i className="fas fa-folder-open fa-3x mb-3 text-secondary opacity-50"></i>
                                                    <h5 className="text-muted">No hay registros médicos</h5>
                                                    <p className="small text-secondary mb-0">Esta parece ser la primera visita de {selectedPet.nombre}.</p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center d-flex flex-column justify-content-center h-100 py-5 bg-light rounded-4 border">
                                            <i className="fas fa-search-medical fa-4x mb-4 text-secondary opacity-25"></i>
                                            <h4 className="text-secondary fw-bold">Selecciona un paciente</h4>
                                            <p className="text-muted">Busca a un cliente en el panel izquierdo y selecciona a su mascota para revisar su archivo clínico.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para registrar el diagnóstico */}
            <MedicalRecordModal
                show={showModal}
                onClose={() => setShowModal(false)}
                appointment={selectedAppointment}
            />
        </div>
    );
};