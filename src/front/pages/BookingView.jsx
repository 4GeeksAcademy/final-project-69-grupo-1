import React, { useState, useEffect } from "react";
import { useGlobalReducer } from "../hooks/useGlobalReducer";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export const BookingView = () => {
    const { store, actions } = useGlobalReducer();
    const navigate = useNavigate();
    
    // Estados locales
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [availableSlots, setAvailableSlots] = useState([]);
    
    // Estado del formulario
    const [selection, setSelection] = useState({
        pet_id: "",
        service_type: "Consulta Médica",
        date: "",
        time: "",
        doctor_id: ""
    });

    // 1. Cargar mascotas al inicio
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

    // 2. Cargar horarios disponibles cuando cambie la fecha
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
    }, []);

    // Manejador de cambios en los inputs
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSelection(prev => ({ ...prev, [name]: value }));
        
        // Si cambia la fecha, buscamos horarios
        if (name === "date") {
            fetchSlots(value);
            setSelection(prev => ({ ...prev, time: "", doctor_id: "" })); // Limpiamos selección previa
        }
    };

    // 3. Confirmar la cita
    const handleSumbitBooking = async (e) => {
        e.preventDefault();
        
        if (!selection.time || !selection.doctor_id) {
            return Swal.fire("Error", "Debes seleccionar un horario y un médico", "warning");
        }

        setLoading(true);
        const result = await actions.scheduleAppointment(selection);
        setLoading(false);

        if (result.success) {
            Swal.fire("¡Reservado!", result.message, "success");
            navigate("/client/dashboard"); // Ajusta la ruta a tu dashboard
        } else {
            Swal.fire("Error", result.message, "error");
        }
    };

    // Encontrar médicos disponibles para la hora seleccionada
    const currentSlot = availableSlots.find(s => s.time === selection.time);

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    <div className="card border-0 shadow-lg p-4">
                        <h2 className="text-center mb-4 fw-bold text-primary">Solicitar Cita 🐾</h2>
                        
                        <form onSubmit={handleSumbitBooking}>
                            {/* Selección de Mascota */}
                            <div className="mb-3">
                                <label className="form-label fw-bold">1. Selecciona tu Mascota</label>
                                <select 
                                    className="form-select" 
                                    name="pet_id" 
                                    value={selection.pet_id} 
                                    onChange={handleInputChange} 
                                    required
                                >
                                    {pets.length === 0 && <option>No tienes mascotas registradas</option>}
                                    {pets.map(pet => <option key={pet.id} value={pet.id}>{pet.nombre} ({pet.especie})</option>)}
                                </select>
                            </div>

                            {/* Selección de Servicio */}
                            <div className="mb-3">
                                <label className="form-label fw-bold">2. Tipo de Servicio</label>
                                <select 
                                    className="form-select" 
                                    name="service_type" 
                                    value={selection.service_type} 
                                    onChange={handleInputChange}
                                >
                                    <option value="Consulta Médica">Consulta Médica 🩺</option>
                                    <option value="Barbería">Peluquería / Spa ✂️</option>
                                    <option value="Vacunación">Vacunación 💉</option>
                                </select>
                            </div>

                            {/* Selección de Fecha */}
                            <div className="mb-3">
                                <label className="form-label fw-bold">3. Fecha de la Cita</label>
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    name="date" 
                                    min={new Date().toISOString().split("T")[0]} // No permite fechas pasadas
                                    value={selection.date} 
                                    onChange={handleInputChange} 
                                    required 
                                />
                            </div>

                            {/* Grid de Horarios (Slots) */}
                            {selection.date && (
                                <div className="mb-3">
                                    <label className="form-label fw-bold">4. Horarios Disponibles</label>
                                    <div className="d-flex flex-wrap gap-2">
                                        {availableSlots.map(slot => (
                                            <button
                                                key={slot.time}
                                                type="button"
                                                disabled={slot.status !== "available"}
                                                className={`btn btn-sm ${selection.time === slot.time ? 'btn-primary' : 'btn-outline-secondary'} 
                                                    ${slot.status === 'busy' ? 'opacity-50' : ''}`}
                                                onClick={() => setSelection(prev => ({ ...prev, time: slot.time, doctor_id: "" }))}
                                            >
                                                {slot.time}
                                                {slot.status === 'lunch' && " (Receso)"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Selección de Médico (Solo si hay hora seleccionada) */}
                            {selection.time && currentSlot && (
                                <div className="mb-4 animate__animated animate__fadeIn">
                                    <label className="form-label fw-bold">5. Médico Disponible</label>
                                    <select 
                                        className="form-select border-primary" 
                                        name="doctor_id" 
                                        value={selection.doctor_id} 
                                        onChange={handleInputChange} 
                                        required
                                    >
                                        <option value="">Selecciona un especialista...</option>
                                        {currentSlot.available_doctors.map(doc => (
                                            <option key={doc.id} value={doc.id}>{doc.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary w-100 py-3 fw-bold shadow mt-3"
                                disabled={loading || !selection.doctor_id}
                            >
                                {loading ? "Procesando..." : "Confirmar Cita Ahora"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};