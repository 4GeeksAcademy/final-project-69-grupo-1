import React, { useState, useEffect } from "react";
import { useGlobalReducer } from "../../hooks/useGlobalReducer";

export const BookingView = () => {
    const { store } = useGlobalReducer();
    const [pets, setPets] = useState([]);
    const [booking, setBooking] = useState({
        pet_id: "",
        service_type: "Consulta", // Valor por defecto
        date: ""
    });

    // URL de tu Backend (Puerto 3001)
    const BACKEND_URL = "https://symmetrical-tribble-4rgjv9jxxw2q7x4-3001.app.github.dev";

    // 1. Cargamos las mascotas que el usuario ya creó
    const getMyPets = async () => {
        const token = localStorage.getItem("token") || "";
        try {
            const response = await fetch(`${BACKEND_URL}/api/users/me/pets`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPets(data);
            }
        } catch (error) {
            console.error("Error al obtener mascotas:", error);
        }
    };

    useEffect(() => {
        getMyPets();
    }, []);

    // 2. Función para enviar la solicitud de cita
    const handleSumbitBooking = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token") || "";

        if (!booking.pet_id || !booking.date) {
            alert("Por favor selecciona una mascota y una fecha.");
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/appointments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(booking)
            });

            if (response.ok) {
                alert("¡Cita solicitada con éxito! Estado: PENDIENTE");
                setBooking({ pet_id: "", service_type: "Consulta", date: "" });
            } else {
                alert("Error al agendar. Verifica que el backend esté listo.");
            }
        } catch (error) {
            console.error("Error de conexión:", error);
        }
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card shadow border-0 p-4">
                        <h2 className="text-primary fw-bold mb-4 text-center">📅 Agendar Cita</h2>
                        <form onSubmit={handleSumbitBooking}>
                            
                            {/* Selector de Mascotas */}
                            <div className="mb-3">
                                <label className="form-label fw-bold">1. Selecciona tu Mascota</label>
                                <select 
                                    className="form-select bg-light" 
                                    value={booking.pet_id}
                                    onChange={(e) => setBooking({...booking, pet_id: e.target.value})}
                                >
                                    <option value="">¿Quién asistirá?</option>
                                    {pets.map(pet => (
                                        <option key={pet.id} value={pet.id}>{pet.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Selector de Servicio */}
                            <div className="mb-3">
                                <label className="form-label fw-bold">2. Tipo de Servicio</label>
                                <select 
                                    className="form-select bg-light"
                                    value={booking.service_type}
                                    onChange={(e) => setBooking({...booking, service_type: e.target.value})}
                                >
                                    <option value="Consulta">Consulta Médica 🩺</option>
                                    <option value="Barbería">Barbería / Spa ✂️</option>
                                </select>
                            </div>

                            {/* Selector de Fecha */}
                            <div className="mb-4">
                                <label className="form-label fw-bold">3. Fecha y Hora</label>
                                <input 
                                    type="datetime-local" 
                                    className="form-control bg-light"
                                    value={booking.date}
                                    onChange={(e) => setBooking({...booking, date: e.target.value})}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary w-100 py-2 fw-bold rounded-pill shadow-sm">
                                Confirmar Solicitud
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};