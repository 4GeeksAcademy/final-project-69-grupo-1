import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGlobalReducer } from "../hooks/useGlobalReducer"; // Importamos el hook global

export const Navbar = () => {
    const { store, actions } = useGlobalReducer(); // Accedemos al estado y las acciones
    const navigate = useNavigate();

    const handleLogout = () => {
        actions.logout(); // Ejecuta la limpieza de localStorage y store
        navigate("/login");
    };

    return (
        <nav className="navbar navbar-light bg-white border-bottom px-4">
            <div className="container-fluid d-flex justify-content-between align-items-center">
                {/* Lado Izquierdo: Logo */}
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <span className="navbar-brand mb-0 h1 fw-bold text-primary">PetHealth & Spa</span>
                </Link>

                {/* Lado Derecho: Usuario y Login/Logout */}
                <div className="d-flex align-items-center gap-3">
                    
                    {/* Mostramos el nombre si el usuario está logueado */}
                    {store.token && store.user && (
                        <div className="text-end me-2 d-none d-md-block">
                            <span className="badge bg-light text-primary border fw-bold">
                                {store.user.full_name}
                            </span>
                        </div>
                    )}

                    <div className="bg-light rounded-circle d-flex align-items-center justify-content-center shadow-sm" 
                         style={{ width: "38px", height: "38px" }}>
                        <i className="fa-solid fa-user text-secondary"></i>
                    </div>

                    {/* Lógica Condicional del Botón */}
                    {store.token ? (
                        <button 
                            className="btn btn-outline-danger rounded-pill px-4 fw-bold shadow-sm"
                            onClick={handleLogout}
                        >
                            <i className="fas fa-sign-out-alt me-2"></i>
                            Logout
                        </button>
                    ) : (
                        <button 
                            className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm"
                            onClick={() => navigate("/login")}
                        >
                            Login
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};