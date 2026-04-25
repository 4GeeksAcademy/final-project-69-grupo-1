import React from "react";
import { Link, useNavigate } from "react-router-dom";

export const Navbar = () => {
    const navigate = useNavigate();

    return (
        <nav className="navbar navbar-light bg-white border-bottom px-4">
            <div className="container-fluid d-flex justify-content-between align-items-center">
                {/* Lado Izquierdo: Logo */}
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <span className="navbar-brand mb-0 h1 fw-bold text-primary">PetHealth & Spa</span>
                </Link>

                {/* Lado Derecho: Usuario y Login (Zona Roja de tu imagen) */}
                <div className="d-flex align-items-center gap-3">
                    <div className="bg-light rounded-circle d-flex align-items-center justify-content-center shadow-sm" 
                         style={{ width: "38px", height: "38px" }}>
                        <i className="fa-solid fa-user text-secondary"></i>
                    </div>
                    <button 
                        className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm"
                        onClick={() => navigate("/login")}
                    >
                        Login
                    </button>
                </div>
            </div>
        </nav>
    );
};