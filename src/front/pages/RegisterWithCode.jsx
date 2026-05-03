import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

export const RegisterWithCode = () => {
    const navigate = useNavigate();
    
    // Estado inicial del formulario
    const [formData, setFormData] = useState({
        staff_code: "",
        full_name: "",
        email: "",
        password: "",
        role: "DOCTOR" // Valor por defecto
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/register-with-code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message, { duration: 6000 });
                navigate("/login");
            } else {
                toast.error(data.message || "Error al registrarse");
            }
        } catch (error) {
            toast.error("Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5 py-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <div className="card shadow-lg border-0 rounded-4">
                        <div className="card-body p-5">
                            <div className="text-center mb-4">
                                <h2 className="fw-bold text-primary">Unirse a una Sede</h2>
                                <p className="text-muted small">Ingresa el código proporcionado por tu clínica</p>
                            </div>

                            <form onSubmit={handleSubmit}>
                                {/* Código de Staff */}
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Código de Sede</label>
                                    <input
                                        type="text"
                                        name="staff_code"
                                        className="form-control bg-light border-0"
                                        placeholder="Ej: VET-X8Y2"
                                        value={formData.staff_code}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="row">
                                    <div className="col-6 mb-3">
                                        <label className="form-label small fw-bold">Nombre completo</label>
                                        <input
                                            type="text"
                                            name="full_name"
                                            className="form-control bg-light border-0"
                                            value={formData.full_name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-control bg-light border-0"
                                        placeholder="tu@correo.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                {/* Password */}
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Contraseña</label>
                                    <input
                                        type="password"
                                        name="password"
                                        className="form-control bg-light border-0"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                {/* Rol */}
                                <div className="mb-4">
                                    <label className="form-label small fw-bold">Cargo / Rol</label>
                                    <select 
                                        name="role" 
                                        className="form-select bg-light border-0"
                                        value={formData.role}
                                        onChange={handleChange}
                                    >
                                        <option value="DOCTOR">Médico Veterinario</option>
                                        <option value="RECEPTIONIST">Recepcionista</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg w-100 fw-bold shadow-sm"
                                    disabled={loading}
                                >
                                    {loading ? "Procesando..." : "Finalizar Registro"}
                                </button>
                            </form>

                            <div className="text-center mt-4">
                                <p className="text-muted small mb-0">¿Ya tienes cuenta?</p>
                                <Link to="/login" className="text-primary fw-bold text-decoration-none small">
                                    Inicia sesión aquí
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};