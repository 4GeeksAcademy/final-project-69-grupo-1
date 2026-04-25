import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // Aquí conectaremos luego con el flux para validar los datos
        console.log("Iniciando sesión con:", email, password);
        // Por ahora, simulamos éxito y mandamos al home
        navigate("/");
    };

    return (
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
            <div className="card shadow-lg border-0 p-4" style={{ width: "100%", maxWidth: "400px", borderRadius: "15px" }}>
                <div className="text-center mb-4">
                    <h2 className="fw-bold text-primary">PetHealth & Spa</h2>
                    <p className="text-muted">Acceso seguro para personal autorizado</p>
                </div>
                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label className="form-label fw-bold">Correo Electrónico</label>
                        <input 
                            type="email" 
                            className="form-control" 
                            placeholder="usuario@ejemplo.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                        />
                    </div>
                    <div className="mb-4">
                        <label className="form-label fw-bold">Contraseña</label>
                        <input 
                            type="password" 
                            className="form-control" 
                            placeholder="••••••••" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100 fw-bold py-2 shadow-sm">
                        Iniciar Sesión
                    </button>
                </form>
                <div className="text-center mt-3">
                    <small className="text-muted">¿Olvidaste tu contraseña? Contacta a soporte.</small>
                </div>
            </div>
        </div>
    );
};