import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useGlobalReducer } from "../../hooks/useGlobalReducer";

export const RegisterClient = () => {
    const { actions } = useGlobalReducer();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // Capturamos el clinic_id de la URL si existe
    const clinicIdFromUrl = searchParams.get("clinic_id");

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: "",
        confirmPassword: "",
        clinic_id: clinicIdFromUrl || "" // Se pre-carga si viene de la URL
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        setLoading(true);
        // Llamamos a la acción del store
        const success = await actions.registerClient(formData);
        setLoading(false);

        if (success) {
            // Redirigir al login o dashboard con mensaje de éxito
            navigate("/login?registered=true");
        } else {
            setError("Hubo un error al registrar tu cuenta. Revisa los datos.");
        }
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <div className="card border-0 shadow-lg rounded-4">
                        <div className="card-body p-5">
                            <div className="text-center mb-4">
                                <i className="fas fa-paw fa-3x text-primary mb-3"></i>
                                <h2 className="fw-bold">Únete a PetHealth</h2>
                                <p className="text-muted small">Crea tu cuenta para gestionar la salud de tus mascotas</p>
                            </div>

                            {error && <div className="alert alert-danger py-2 small">{error}</div>}

                            <form onSubmit={handleSubmit}>
                                {/* Info de Sede Automática */}
                                {clinicIdFromUrl && (
                                    <div className="alert alert-info border-0 py-2 small d-flex align-items-center mb-4">
                                        <i className="fas fa-check-circle me-2"></i>
                                        <span>Vinculado automáticamente a esta sede</span>
                                    </div>
                                )}

                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-secondary">Nombre Completo</label>
                                    <input 
                                        type="text" name="full_name" required
                                        className="form-control bg-light border-0 px-3 py-2" 
                                        placeholder="Ej: Juan Pérez"
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-secondary">Correo Electrónico</label>
                                    <input 
                                        type="email" name="email" required
                                        className="form-control bg-light border-0 px-3 py-2" 
                                        placeholder="tu@email.com"
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="row">
                                    <div className="col-6 mb-3">
                                        <label className="form-label small fw-bold text-secondary">Contraseña</label>
                                        <input 
                                            type="password" name="password" required
                                            className="form-control bg-light border-0 px-3 py-2" 
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="col-6 mb-3">
                                        <label className="form-label small fw-bold text-secondary">Confirmar</label>
                                        <input 
                                            type="password" name="confirmPassword" required
                                            className="form-control bg-light border-0 px-3 py-2" 
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    className="btn btn-primary w-100 fw-bold py-2 mt-3 shadow-sm"
                                    disabled={loading}
                                >
                                    {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : "Crear mi Cuenta"}
                                </button>
                            </form>

                            <div className="text-center mt-4">
                                <p className="small text-muted">
                                    ¿Ya tienes cuenta? <Link to="/login" className="text-primary fw-bold">Inicia sesión</Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};