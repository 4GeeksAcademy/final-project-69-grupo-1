import React, { useState, useEffect } from "react";
import { useGlobalReducer } from "../../hooks/useGlobalReducer";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export const BookingView = () => {
    const { store, actions } = useGlobalReducer();
    const navigate = useNavigate();

    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [availableSlots, setAvailableSlots] = useState([]);

    const [selection, setSelection] = useState({
        pet_id: "",
        service_id: "",
        service_price_usd: 0,
        date: "",
        time: "",
        doctor_id: ""
    });

    const getMyPets = async () => {
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/pets`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPets(data);
                if (data.length > 0) setSelection(prev => ({ ...prev, pet_id: data[0].id }));
            }
        } catch (error) {
            console.error("Error al obtener mascotas:", error);
        }
    };

    const fetchSlots = async (date) => {
        if (!date) return;
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clinics/available-slots?date=${date}`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });
            const data = await response.json();
            if (response.ok) {
                setAvailableSlots(data.slots);
            } else {
                setAvailableSlots([]);
                Swal.fire("Aviso", data.message, "info");
            }
        } catch (error) {
            console.error("Error al buscar horarios:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getMyPets();
        if (store.user?.clinic_id) {
            actions.loadClinicServices(store.user.clinic_id, true);
        }
    }, [store.user?.clinic_id]);

    useEffect(() => {
        if (store.user?.clinic_id) {
            actions.loadClinicServices(store.user.clinic_id);
        }
    }, [store.user?.clinic_id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSelection(prev => ({ ...prev, [name]: value }));

        if (name === "date") {
            fetchSlots(value);
            setSelection(prev => ({ ...prev, time: "", doctor_id: "" }));
        }
    };

    const handleSumbitBooking = async (e) => {
        e.preventDefault();

        if (!selection.service_id || !selection.time || !selection.doctor_id) {
            return Swal.fire("Atención", "Debes seleccionar un servicio, un horario y un especialista.", "warning");
        }

        setLoading(true);
        const result = await actions.scheduleAppointment(selection);
        setLoading(false);

        if (result.success) {
            Swal.fire("¡Reservado!", result.message, "success");
            navigate("/client/dashboard"); // <- Redirección al panel
        } else {
            Swal.fire("Error", result.message, "error");
        }
    };

    const currentSlot = availableSlots.find(s => s.time === selection.time);

    return (
        <div className="container-fluid bg-light min-vh-100 py-5">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden animate__animated animate__fadeInUp">
                            {/* Header del Formulario */}
                            <div className="bg-primary text-white p-4 text-center">
                                <h3 className="fw-bold mb-1"><i className="fas fa-calendar-check me-2"></i> Agendar Nueva Cita</h3>
                                <p className="mb-0 opacity-75">Sigue los pasos para asegurar el cupo de tu mascota</p>
                            </div>

                            <form onSubmit={handleSumbitBooking} className="p-4 p-md-5 bg-white">

                                <div className="row g-4">
                                    {/* Paso 1 y 2 */}
                                    <div className="col-md-6">
                                        <div className="mb-4">
                                            <label className="form-label fw-bold text-secondary small text-uppercase">1. Paciente</label>
                                            <select
                                                className="form-select form-select-lg bg-light border-0 shadow-none"
                                                name="pet_id"
                                                value={selection.pet_id}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                {pets.length === 0 && <option value="">Sin mascotas registradas</option>}
                                                {pets.map(pet => <option key={pet.id} value={pet.id}>🐾 {pet.nombre} ({pet.especie})</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-4">
                                            <label className="form-label fw-bold text-secondary small text-uppercase">2. Servicio Requerido</label>
                                            <select
                                                className="form-select form-select-lg bg-light border-0 shadow-none"
                                                name="service_id"
                                                value={selection.service_id}
                                                onChange={(e) => {
                                                    const serviceId = e.target.value;
                                                    const service = store.clinicServices.find(s => String(s.id) === serviceId);
                                                    setSelection(prev => ({
                                                        ...prev,
                                                        service_id: serviceId,
                                                        service_price_usd: service ? service.price_usd : 0
                                                    }));
                                                }}
                                            >
                                                <option value="">Selecciona un servicio...</option>
                                                {store.clinicServices.map(service => (
                                                    <option key={service.id} value={service.id}>
                                                        {service.name} - ${service.price_usd.toFixed(2)}
                                                    </option>
                                                ))}
                                            </select>
                                            {store.clinicServices.length === 0 && (
                                                <small className="text-muted">No hay servicios activos en esta clínica.</small>
                                            )}
                                        </div>
                                    </div>

                                    {selection.service_id && (
                                        <div className="col-12">
                                            <div className="alert alert-secondary py-3 rounded-4">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="small text-uppercase fw-bold text-muted">Precio del Servicio</span>
                                                    <span className="fs-5 fw-bold">${Number(selection.service_price_usd).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="col-12 border-top pt-4">
                                        {/* Paso 3 */}
                                        <div className="mb-4">
                                            <label className="form-label fw-bold text-secondary small text-uppercase">3. Elige la Fecha</label>
                                            <input
                                                type="date"
                                                className="form-control form-control-lg bg-light border-0 shadow-none"
                                                name="date"
                                                min={new Date().toISOString().split("T")[0]}
                                                value={selection.date}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Paso 4 (Renderizado Condicional) */}
                                    {selection.date && (
                                        <div className="col-12 animate__animated animate__fadeIn">
                                            <label className="form-label fw-bold text-secondary small text-uppercase">4. Horarios Disponibles</label>
                                            <div className="d-flex flex-wrap gap-2 mb-4">
                                                {availableSlots.length === 0 && !loading && (
                                                    <span className="text-danger small">No hay horarios disponibles para esta fecha.</span>
                                                )}
                                                {loading && <span className="text-muted small">Cargando disponibilidad...</span>}
                                                {availableSlots.map(slot => (
                                                    <button
                                                        key={slot.time}
                                                        type="button"
                                                        disabled={slot.status !== "available"}
                                                        className={`btn rounded-pill px-4 fw-bold ${selection.time === slot.time ? 'btn-primary shadow-sm' : 'btn-outline-primary bg-white'} 
                                                            ${slot.status === 'busy' || slot.status === 'lunch' ? 'opacity-50 disabled bg-light border-light text-muted' : ''}`}
                                                        onClick={() => setSelection(prev => ({ ...prev, time: slot.time, doctor_id: "" }))}
                                                    >
                                                        <i className="far fa-clock me-1"></i> {slot.time}
                                                        {slot.status === 'lunch' && " (Receso)"}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Paso 5 (Renderizado Condicional) */}
                                    {selection.time && currentSlot && (
                                        <div className="col-12 animate__animated animate__fadeInUp">
                                            <div className="bg-primary-subtle p-4 rounded-4 border border-primary-subtle">
                                                <label className="form-label fw-bold text-primary small text-uppercase mb-3">5. Especialista Asignado</label>
                                                <select
                                                    className="form-select form-select-lg border-0 shadow-sm"
                                                    name="doctor_id"
                                                    value={selection.doctor_id}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    <option value="">Selecciona quién atenderá a tu mascota...</option>
                                                    {currentSlot.available_doctors.map(doc => (
                                                        <option key={doc.id} value={doc.id}>👨‍⚕️ Dr/Dra. {doc.full_name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* --- NUEVOS BOTONES AL ESTILO MYPETS --- */}
                                <div className="mt-5 border-top pt-4">
                                    <div className="d-flex flex-column flex-sm-row gap-3">
                                        <button
                                            type="button"
                                            className="btn btn-light btn-lg fw-bold w-100 rounded-pill text-secondary hover-lift"
                                            onClick={() => navigate("/client/dashboard")}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary btn-lg fw-bold w-100 rounded-pill shadow-sm hover-lift"
                                            disabled={loading || !selection.doctor_id}
                                        >
                                            {loading ? "Procesando..." : "Confirmar Cita Ahora"}
                                        </button>
                                    </div>
                                    <p className="small text-center text-muted mt-3 mb-0">Al confirmar, aseguras un cupo en nuestra agenda.</p>
                                </div>

                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .hover-lift:hover { transform: translateY(-3px); transition: transform 0.2s ease; box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important; }
            `}</style>
        </div>
    );
};