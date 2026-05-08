import React, { useState, useEffect } from "react";
import { useGlobalReducer } from "../hooks/useGlobalReducer";
import { useNavigate } from "react-router-dom"; // Añadido para redirigir tras agendar

export const BookingView = () => {
    const { store } = useGlobalReducer();
    const navigate = useNavigate();
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [booking, setBooking] = useState({
        pet_id: "",
        service_type: "Consulta",
        date: ""
    });

    // 1. Cargamos las mascotas que el usuario ya creó
    const getMyPets = async () => {
        const token = store.token || localStorage.getItem("token");
        try {
            // CORRECCIÓN 1: Usamos la variable de entorno
            // CORRECCIÓN 2: El endpoint correcto es /api/pets
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/pets`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPets(data);
            } else {
                console.error("Error del servidor al buscar mascotas");
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
        const token = store.token || localStorage.getItem("token");

        if (!booking.pet_id || !booking.date) {
            alert("Por favor selecciona una mascota y una fecha.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/appointments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(booking)
            });

            if (response.ok) {
                alert("¡Cita solicitada con éxito!");
                setBooking({ pet_id: "", service_type: "Consulta", date: "" });
                // Redirigir al dashboard del cliente para ver la cita confirmada
                navigate("/client/dashboard");
            } else {
                const errorData = await response.json();
                alert(`Error al agendar: ${errorData.msg || 'Inténtalo de nuevo'}`);
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            alert("Error de conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card shadow border-0 p-4 rounded-4">
                        <div className="text-center mb-4">
                            <h2 className="text-primary fw-bold">📅 Agendar Cita</h2>
                            <p className="text-muted small">Programa el próximo control de tu peludo</p>
                        </div>

                        <form onSubmit={handleSumbitBooking}>

                            {/* Selector de Mascotas */}
                            <div className="mb-3">
                                <label className="form-label fw-bold">1. Selecciona tu Mascota</label>
                                {pets.length > 0 ? (
                                    <select
                                        className="form-select bg-light border-0 px-3 py-2"
                                        value={booking.pet_id}
                                        onChange={(e) => setBooking({ ...booking, pet_id: e.target.value })}
                                        required
                                    >
                                        <option value="">¿Quién asistirá?</option>
                                        {pets.map(pet => (
                                            <option key={pet.id} value={pet.id}>{pet.nombre} ({pet.especie})</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="alert alert-warning py-2 small">
                                        No tienes mascotas registradas. <a href="/mis-mascotas" className="alert-link">Registra una aquí</a>.
                                    </div>
                                )}
                            </div>

                            {/* Selector de Servicio */}
                            <div className="mb-3">
                                <label className="form-label fw-bold">2. Tipo de Servicio</label>
                                <select
                                    className="form-select bg-light border-0 px-3 py-2"
                                    value={booking.service_type}
                                    onChange={(e) => setBooking({ ...booking, service_type: e.target.value })}
                                >
                                    <option value="Consulta Médica">Consulta Médica 🩺</option>
                                    <option value="Vacunación">Vacunación 💉</option>
                                    <option value="Barbería">Peluquería / Spa ✂️</option>
                                    <option value="Emergencia">Emergencia 🚨</option>
                                </select>
                            </div>

                            {/* Selector de Fecha */}
                            <div className="mb-4">
                                <label className="form-label fw-bold">3. Fecha y Hora</label>
                                <input
                                    type="datetime-local"
                                    className="form-control bg-light border-0 px-3 py-2"
                                    value={booking.date}
                                    onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-100 py-2 fw-bold shadow-sm"
                                disabled={loading || pets.length === 0}
                            >
                                {loading ? "Procesando..." : "Confirmar Solicitud"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};