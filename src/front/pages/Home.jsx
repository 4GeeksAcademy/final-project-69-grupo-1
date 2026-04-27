import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";

export const Home = () => {
    const { store } = useGlobalReducer();
    const navigate = useNavigate();
    const [activeIndex, setActiveIndex] = useState(2);

    const cards = [
        { id: 0, title: "Consulta Médica", url: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?q=80&w=600" },
        { id: 1, title: "Corte y Estilo", url: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=600" },
        { id: 2, title: "Spa Relajante", url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=600" },
        { id: 3, title: "Vacunación", url: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?q=80&w=600" },
        { id: 4, title: "Cirugía", url: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=600" },
    ];

    return (
        <div className="container-fluid bg-white py-5" style={{ overflowX: "hidden" }}>

            {/* SECCIÓN DE BOTONES */}
            <div className="container mb-5 mt-4">
                <div className="row justify-content-center gap-3">
                    <div className="col-12 col-md-3">
                        <button className="btn btn-warning w-100 fw-bold py-3 rounded-pill shadow border-0"
                            onClick={() => navigate("/registro-sede")}>
                            <i className="fa-solid fa-hospital me-2"></i> REGISTRAR CLÍNICA
                        </button>
                    </div>
                    <div className="col-12 col-md-3">
                        <button className="btn btn-warning w-100 fw-bold py-3 rounded-pill shadow border-0"
                            onClick={() => navigate("/item2")}>
                            <i className="fa-solid fa-user-doctor me-2"></i> REGISTRAR MÉDICO
                        </button>
                    </div>
                    <div className="col-12 col-md-3">
                        {/* CORRECCIÓN: Cambiado de /pedir-cita a /agendar-cita para coincidir con routes.jsx */}
                        <button className="btn btn-primary w-100 fw-bold py-3 rounded-pill shadow border-0"
                            onClick={() => navigate("/agendar-cita")}>
                            <i className="fa-solid fa-calendar-check me-2"></i> PEDIR CITA
                        </button>
                    </div>
                </div>
            </div>

            {/* CARRUSEL DE SERVICIOS */}
            <div className="row justify-content-center align-items-center position-relative" style={{ minHeight: "500px" }}>
                {cards.map((card, index) => {
                    const distance = index - activeIndex;
                    const isActive = index === activeIndex;

                    const style = {
                        width: isActive ? "380px" : "260px",
                        height: isActive ? "450px" : "360px",
                        zIndex: 10 - Math.abs(distance),
                        opacity: isActive ? 1 : 0.4,
                        left: "50%",
                        marginLeft: `${distance * 220 - (isActive ? 190 : 130)}px`,
                        transform: `rotate(${distance * 8}deg) scale(${isActive ? 1 : 0.8})`,
                        transition: "all 0.5s ease-in-out",
                        cursor: "pointer",
                        position: "absolute",
                        overflow: "hidden"
                    };

                    return (
                        <div key={card.id} className="card shadow-lg border-0 rounded-4" style={style} onClick={() => setActiveIndex(index)}>
                            <img src={card.url} alt={card.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <div className="card-img-overlay d-flex flex-column justify-content-end pb-4"
                                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}>
                                <h5 className={`text-white fw-bold mb-0 ${!isActive && 'small text-center'}`}>
                                    {card.title}
                                </h5>
                                {isActive && <p className="text-white-50 small mb-0">Servicio profesional disponible</p>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};