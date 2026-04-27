import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Importamos Link
import { useGlobalReducer } from "../hooks/useGlobalReducer";
import toast from "react-hot-toast"; 

export const Login = () => {
    const { dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                dispatch({ 
                    type: "login", 
                    payload: { token: data.token, user: data.user } 
                });
                
                toast.success(`¡Bienvenido, ${data.user.full_name}!`);

                if (data.user.role === "SUPER_ADMIN") {
                    navigate("/admin/solicitudes");
                } 
                else if (data.user.must_change_password) {
                    navigate("/change-password");
                } 
                else {
                    navigate("/admin/clinicas");
                }

            } else {
                setError(data.message || "Credenciales incorrectas");
                toast.error(data.message || "Credenciales incorrectas");
            }
        } catch (err) {
            setError("Error de conexión con el servidor");
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5 py-5">
            <div className="row justify-content-center">
                <div className="col-md-5 col-lg-4">
                    <div className="card shadow-lg border-0 rounded-4">
                        <div className="card-body p-5">
                            <div className="text-center mb-4">
                                <h2 className="fw-bold text-primary">PetHealth</h2>
                                <p className="text-muted small">Panel de Gestión Profesional</p>
                            </div>
                            
                            {error && (
                                <div className="alert alert-danger py-2 text-center small" role="alert">
                                    <i className="fas fa-exclamation-triangle me-2"></i>{error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        className="form-control form-control-lg bg-light border-0"
                                        placeholder="admin@pethealth.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label small fw-bold">Contraseña</label>
                                    <input
                                        type="password"
                                        className="form-control form-control-lg bg-light border-0"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary btn-lg w-100 fw-bold shadow-sm"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span><span className="spinner-border spinner-border-sm me-2"></span>Entrando...</span>
                                    ) : "Iniciar Sesión"}
                                </button>
                            </form>

                            {/* --- SECCIÓN AGREGADA: ENLACE A REGISTRO --- */}
                            <div className="text-center mt-4">
                                <p className="text-muted small mb-0">¿Eres un profesional médico?</p>
                                <Link to="/signup" className="text-primary fw-bold text-decoration-none small">
                                    Registra tu sede aquí
                                </Link>
                            </div>
                            {/* ------------------------------------------ */}
                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};