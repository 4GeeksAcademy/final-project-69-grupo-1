import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { MedicalRecordModal } from "../components/modals/MedicalRecordModal";

// Importamos el modal que crearemos para registrar la historia médica
// import { MedicalRecordModal } from "../components/modals/MedicalRecordModal";

export const DoctorDashboard = () => {
    const { store, actions } = useGlobalReducer();
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        actions.getDoctorAppointments();
    }, []);

    // Transformamos las citas del store al formato que entiende FullCalendar
    const events = store.appointments?.map(app => ({
        id: app.id,
        title: `${app.tipo}: ${app.mascota.nombre}`,
        start: app.fecha_hora,
        backgroundColor: app.estado === "EN_ATENCION" ? "#ffc107" :
            app.estado === "COMPLETADA" ? "#198754" : "#0d6efd",
        extendedProps: { ...app }
    })) || [];

    const handleEventClick = (info) => {
        setSelectedAppointment(info.event.extendedProps);
        setShowModal(true);
    };

    return (
        <div className="container-fluid py-4">
            <div className="row">
                <div className="col-12 mb-4">
                    <h2 className="fw-bold text-dark">Panel Médico</h2>
                    <p className="text-muted">Gestión de consultas para la sede {store.user?.clinic_name}</p>
                </div>

                <div className="col-md-9">
                    <div className="card shadow-sm p-3 bg-white">
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="timeGridDay" // Vista por día para organizar la jornada
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay'
                            }}
                            events={events}
                            eventClick={handleEventClick}
                            locale="es" // Para que los días y meses salgan en español
                            slotMinTime="08:00:00" // Hora de apertura de la clínica
                            slotMaxTime="20:00:00" // Hora de cierre
                            allDaySlot={false}
                            height="auto"
                        />
                    </div>
                </div>

                <div className="col-md-3">
                    {/* Tarjeta de Agenda */}
                    <div className="card shadow-sm border-0 p-3 mb-4 rounded">
                        <h5 className="fw-bold text-primary border-bottom pb-2">Agenda de Hoy</h5>
                        {events.filter(e => new Date(e.start).toDateString() === new Date().toDateString()).length > 0 ? (
                            <ul className="list-group list-group-flush">
                                {events.filter(e => new Date(e.start).toDateString() === new Date().toDateString()).map(ev => (
                                    <li
                                        key={ev.id}
                                        className="list-group-item px-0 py-2 border-bottom"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleEventClick({ event: { extendedProps: ev.extendedProps } })}
                                    >
                                        <div className="d-flex justify-content-between w-100">
                                            <strong className="text-dark">
                                                {new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </strong>
                                            <span className={`badge ${ev.extendedProps.estado === 'EN_ATENCION' ? 'bg-warning' : ev.extendedProps.estado === 'COMPLETADA' ? 'bg-success' : 'bg-primary'}`}>
                                                {ev.extendedProps.estado}
                                            </span>
                                        </div>
                                        <small className="text-muted">{ev.title}</small>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted text-center mt-3">No hay citas para hoy.</p>
                        )}
                    </div>
                </div>

                {/* Tarjeta de Búsqueda de Historia Clínica */}
                <div className="card shadow-sm border-0 p-3 bg-light rounded">
                    <h6 className="fw-bold text-dark">Buscar Historial Paciente</h6>
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        const petId = e.target.petId.value;
                        const history = await actions.getPetMedicalHistory(petId);
                        if (history && history.length > 0) {
                            // Aquí puedes mostrar los resultados.
                            // Para algo rápido, lo mostraremos en consola, pero lo ideal 
                            // es guardarlo en un estado (setPatientHistory(history)) y abrir un modal.
                            alert(`Se encontraron ${history.length} registros para la mascota #${petId}. Revisa la consola.`);
                            console.log("Historial Médico:", history);
                        } else {
                            alert("No se encontraron registros médicos para este ID o no tienes acceso.");
                        }
                    }}>
                        <div className="input-group mt-2">
                            <input type="number" name="petId" className="form-control" placeholder="ID de la mascota..." required />
                            <button type="submit" className="btn btn-secondary">🔍</button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Aquí llamarías al modal para registrar el diagnóstico (Historia 36) */}
            <MedicalRecordModal
                show={showModal}
                onClose={() => setShowModal(false)}
                appointment={selectedAppointment}
            />
        </div>
    );
};