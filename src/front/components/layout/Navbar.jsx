import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGlobalReducer } from "../../hooks/useGlobalReducer";
import logoImageUrl from "../../assets/img/Logo_NexPetly.png";

export const Navbar = () => {
    const { store, actions } = useGlobalReducer();
    const navigate = useNavigate();

    const handleLogout = () => {
        actions.logout();
        navigate("/login");
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm px-4 sticky-top">
            <div className="container-fluid">
                {/* Logo */}
                <Link to="/" className="navbar-brand d-flex align-items-center" style={{ textDecoration: 'none' }}>
                    <img
                        src={logoImageUrl}
                        alt="NexPetly logo"
                        style={{ height: "40px", objectFit: "contain" }}
                    />
                </Link>

                {/* Lado Derecho: Usuario y Acciones */}
                <div className="d-flex align-items-center gap-3 ms-auto">

                    {store.token && store.user && (
                        <div className="d-none d-md-flex align-items-center gap-2">
                            <span className="text-muted small fw-medium">Hola,</span>
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill fw-bold">
                                {store.user.full_name}
                            </span>
                        </div>
                    )}

                    {store.token ? (
                        <button
                            className="btn btn-outline-danger rounded-pill px-4 fw-bold shadow-sm"
                            onClick={handleLogout}
                        >
                            <i className="fas fa-sign-out-alt me-2"></i>
                            Salir
                        </button>
                    ) : (
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-light rounded-pill px-4 fw-bold border shadow-sm text-secondary"
                                onClick={() => navigate("/registro-sede")}
                            >
                                Soy Clínica
                            </button>
                            <button
                                className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm"
                                onClick={() => navigate("/login")}
                            >
                                Iniciar Sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};