import React from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalReducer } from "../hooks/useGlobalReducer";

export const Home = () => {
    const { store } = useGlobalReducer();
    const navigate = useNavigate();

    const services = [
        { id: 1, icon: "fa-stethoscope", title: "Consulta Médica", desc: "Atención preventiva y diagnóstico para mantener a tu mascota sana." },
        { id: 2, icon: "fa-syringe", title: "Vacunación", desc: "Esquemas de vacunación completos y desparasitación al día." },
        { id: 3, icon: "fa-scissors", title: "Peluquería y Spa", desc: "Baños relajantes, cortes de raza y cuidado estético profesional." },
        { id: 4, icon: "fa-heart-pulse", title: "Emergencias", desc: "Atención prioritaria para casos críticos y cirugías." },
    ];

    // Validación de acceso: Solo usuarios logueados pueden ir a agendar
    const handleBookingClick = () => {
        if (store.token) {
            navigate("/agendar-cita");
        } else {
            navigate("/login");
        }
    };

    return (
        <div className="bg-white" style={{ overflowX: "hidden" }}>

            {/* --- SECCIÓN HERO --- */}
            <div className="container-fluid bg-primary-subtle py-5">
                <div className="container py-5 mt-4 mb-5">
                    <div className="row align-items-center">
                        {/* Texto y Botones */}
                        <div className="col-lg-6 mb-5 mb-lg-0 text-center text-lg-start">
                            <span className="badge bg-white text-primary px-3 py-2 rounded-pill fw-bold mb-3 shadow-sm border">
                                🌟 La mejor plataforma veterinaria
                            </span>
                            <h1 className="fw-bolder text-dark mb-3" style={{ fontSize: "3.5rem", lineHeight: "1.2" }}>
                                Cuidamos de tu mejor amigo como si fuera <span className="text-primary">nuestro.</span>
                            </h1>
                            <p className="lead text-secondary mb-4">
                                Gestiona la salud de tu mascota, agenda citas fácilmente y accede a su historial médico en cualquier momento.
                            </p>
                            <div className="d-flex flex-column flex-sm-row justify-content-center justify-content-lg-start gap-3">
                                <button
                                    className="btn btn-primary btn-lg rounded-pill px-5 fw-bold shadow hover-lift"
                                    onClick={handleBookingClick}
                                >
                                    <i className="fa-solid fa-calendar-check me-2"></i> Agendar Cita
                                </button>

                                <button
                                    className="btn btn-outline-primary bg-white btn-lg rounded-pill px-5 fw-bold shadow-sm hover-lift"
                                    onClick={() => navigate("/registro-sede")}
                                >
                                    <i className="fa-solid fa-hospital me-2"></i> Unir mi Clínica
                                </button>
                            </div>
                        </div>

                        {/* --- COLLAGE DINÁMICO DE MASCOTAS --- */}
                        <div className="col-lg-6 position-relative text-center mt-5 mt-lg-0" style={{ height: "500px" }}>

                            {/* Círculo decorativo de fondo */}
                            <div className="position-absolute rounded-circle bg-white opacity-50 shadow-sm"
                                style={{ width: "380px", height: "380px", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 0 }}>
                            </div>

                            {/* Perro */}
                            <img
                                src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80"
                                alt="Perro"
                                className="img-fluid rounded-circle shadow-lg border border-5 border-white position-absolute hover-scale"
                                style={{ width: "260px", height: "260px", objectFit: "cover", top: "10%", left: "10%", zIndex: 3 }}
                            />

                            {/* Gato */}
                            <img
                                src="https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=600&q=80"
                                alt="Gato"
                                className="img-fluid rounded-circle shadow-lg border border-5 border-white position-absolute hover-scale"
                                style={{ width: "200px", height: "200px", objectFit: "cover", top: "40%", right: "10%", zIndex: 4 }}
                            />

                            {/* Conejo */}
                            <img
                                src="https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&w=600&q=80"
                                alt="Conejo"
                                className="img-fluid rounded-circle shadow-lg border border-4 border-white position-absolute hover-scale"
                                style={{ width: "160px", height: "160px", objectFit: "cover", bottom: "5%", left: "25%", zIndex: 2 }}
                            />

                            {/* Pájaro */}
                            <img
                                src="https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=600&q=80"
                                alt="Pájaro"
                                className="img-fluid rounded-circle shadow-lg border border-4 border-white position-absolute hover-scale"
                                style={{ width: "130px", height: "130px", objectFit: "cover", top: "0%", right: "25%", zIndex: 1 }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN DE SERVICIOS --- */}
            <div className="container py-5 my-5">
                <div className="text-center mb-5">
                    <h2 className="fw-bold text-dark mb-2">Todo lo que tu mascota necesita</h2>
                    <p className="text-muted">Servicios integrales para el bienestar animal</p>
                </div>

                <div className="row g-4">
                    {services.map(service => (
                        <div className="col-md-6 col-lg-3" key={service.id}>
                            <div className="card h-100 border-0 shadow-sm rounded-4 text-center p-4 hover-lift" style={{ transition: "all 0.3s ease" }}>
                                <div className="card-body">
                                    <div className="bg-primary-subtle rounded-circle d-inline-flex align-items-center justify-content-center mb-4 shadow-inner" style={{ width: "70px", height: "70px" }}>
                                        <i className={`fa-solid ${service.icon} fs-2 text-primary`}></i>
                                    </div>
                                    <h5 className="fw-bold text-dark">{service.title}</h5>
                                    <p className="text-muted small mb-0">{service.desc}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Estilos locales para efectos visuales */}
            <style>{`
                .hover-lift:hover { 
                    transform: translateY(-10px); 
                    box-shadow: 0 1rem 3rem rgba(0,0,0,.175) !important; 
                }
                .hover-scale:hover { 
                    transform: scale(1.1); 
                    z-index: 10 !important; 
                    transition: all 0.3s ease; 
                    cursor: pointer; 
                }
                .shadow-inner { 
                    box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.06); 
                }
            `}</style>
        </div>
    );
};