import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useGlobalReducer } from "../../hooks/useGlobalReducer";
import toast from "react-hot-toast";

export const ForgotPassword = () => {
    const { actions } = useGlobalReducer();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setLoading(true);

        const result = await actions.requestPasswordReset(email.trim());
        setLoading(false);

        if (result.success) {
            setMessage(result.message || "Si el correo existe en el sistema, recibirás un mensaje de recuperación.");
            toast.success("Solicitud enviada. Revisa tu correo.");
        } else {
            setError(result.message || "No se pudo procesar la solicitud.");
            toast.error(result.message || "No se pudo procesar la solicitud.");
        }
    };

    return (
        <div className="container mt-5 py-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <div className="card shadow-lg border-0 rounded-4">
                        <div className="card-body p-5">
                            <div className="text-center mb-4">
                                <h2 className="fw-bold text-primary">Recuperar Contraseña</h2>
                                <p className="text-muted small">Ingresa tu correo y te enviaremos una clave temporal.</p>
                            </div>

                            {message && (
                                <div className="alert alert-success py-2 text-center small" role="alert">
                                    {message}
                                </div>
                            )}

                            {error && (
                                <div className="alert alert-danger py-2 text-center small" role="alert">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
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
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg w-100 fw-bold shadow-sm"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span><span className="spinner-border spinner-border-sm me-2"></span>Enviando...</span>
                                    ) : "Enviar instrucciones"}
                                </button>
                            </form>

                            <div className="text-center mt-4">
                                <p className="small text-muted mb-1">¿Recordaste tu clave?</p>
                                <Link to="/login" className="text-primary fw-bold text-decoration-none small">
                                    Volver al inicio de sesión
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
