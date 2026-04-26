import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalReducer } from "../hooks/useGlobalReducer";

export const Login = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    
    // ESTADO EXISTENTE: Manejo local del formulario
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    
    // A INCLUIR: Estado para feedback al usuario
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // MODIFICACIÓN: Lógica de envío conectada al Backend
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // MODIFICACIÓN: Se guarda en el store global y localStorage (vía reducer)
                dispatch({ 
                    type: "login", 
                    payload: { token: data.token, user: data.user } 
                });
                
                // ÉPICA 0: Redirección inteligente según el rol si fuera necesario
                navigate("/admin/clinicas"); 
            } else {
                setError(data.message || "Credenciales incorrectas");
            }
        } catch (err) {
            setError("Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-4">
                    <div className="card shadow border-0">
                        <div className="card-body p-4">
                            <h2 className="text-center mb-4">PetHealth Login</h2>
                            
                            {error && (
                                <div className="alert alert-danger p-2 text-center" role="alert">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label text-secondary">Email</label>
                                    <input
                                        type="email"
                                        className="form-control bg-light"
                                        placeholder="correo@ejemplo.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label text-secondary">Contraseña</label>
                                    <input
                                        type="password"
                                        className="form-control bg-light"
                                        placeholder="********"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary w-100 py-2"
                                    disabled={loading}
                                >
                                    {loading ? "Cargando..." : "Entrar"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};