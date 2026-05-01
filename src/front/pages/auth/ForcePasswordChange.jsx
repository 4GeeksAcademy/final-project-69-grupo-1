import React, { useState, useEffect } from "react";
import { useGlobalReducer } from "../../hooks/useGlobalReducer";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export const ForcePasswordChange = () => {
    const { actions } = useGlobalReducer();
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Estado para los requisitos visuales
    const [validations, setValidations] = useState({
        minLength: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSpecial: false,
    });

    useEffect(() => {
        setValidations({
            minLength: password.length >= 8,
            hasUpper: /[A-Z]/.test(password),
            hasLower: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecial: /[@$!%*?&]/.test(password),
        });
    }, [password]);

    const isAllValid = Object.values(validations).every(v => v);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isAllValid) {
            toast.error("La contraseña no cumple con todos los requisitos de seguridad.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Las contraseñas no coinciden.");
            return;
        }

        setLoading(true);
        const success = await actions.updatePassword(password);
        setLoading(false);

        if (success) {
            toast.success("¡Contraseña actualizada! Bienvenido al sistema.");
            navigate("/");
        } else {
            toast.error("Error de conexión. Intenta de nuevo.");
        }
    };

    // Componente pequeño para mostrar cada requisito
    const ValidationItem = ({ isValid, text }) => (
        <div className={`small ${isValid ? "text-success" : "text-muted"}`}>
            <i className={`fas ${isValid ? "fa-check-circle" : "fa-circle"} me-2`}></i>
            {text}
        </div>
    );

    return (
        <div className="container d-flex justify-content-center align-items-center py-5" style={{ minHeight: "80vh" }}>
            <div className="card shadow-lg border-0 p-4" style={{ maxWidth: "450px", width: "100%" }}>
                <div className="text-center mb-4">
                    <div className="bg-primary bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                        <i className="fas fa-shield-alt text-primary fa-2x"></i>
                    </div>
                    <h3 className="fw-bold">Seguridad de la Cuenta</h3>
                    <p className="text-muted small">Crea una contraseña fuerte para proteger tus datos médicos.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label fw-bold small">Nueva Contraseña</label>
                        <input
                            type="password"
                            className="form-control form-control-lg bg-light"
                            placeholder="Introduce tu clave"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {/* Guía de validación visual */}
                    <div className="p-3 bg-light rounded border mb-4">
                        <h6 className="small fw-bold mb-2">La contraseña debe tener:</h6>
                        <ValidationItem isValid={validations.minLength} text="Mínimo 8 caracteres" />
                        <ValidationItem isValid={validations.hasUpper} text="Una mayúscula (A, B...)" />
                        <ValidationItem isValid={validations.hasLower} text="Una minúscula (a, b...)" />
                        <ValidationItem isValid={validations.hasNumber} text="Un número (1, 2...)" />
                        <ValidationItem isValid={validations.hasSpecial} text="Un símbolo (@, $, !...)" />
                    </div>

                    <div className="mb-4">
                        <label className="form-label fw-bold small">Confirmar Contraseña</label>
                        <input
                            type="password"
                            className={`form-control form-control-lg ${confirmPassword && (password === confirmPassword ? "is-valid" : "is-invalid")}`}
                            placeholder="Repite tu clave"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary btn-lg w-100 fw-bold"
                        disabled={loading || !isAllValid}
                    >
                        {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : "Activar Cuenta"}
                    </button>
                </form>
            </div>
        </div>
    );
};