import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export const ClinicLanding = () => {
    const { clinic_id } = useParams();
    const navigate = useNavigate();
    const [clinic, setClinic] = useState(null);

    useEffect(() => {
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        fetch(`${backendUrl}/api/clinics/${clinic_id}/public`)
            .then(res => {
                if (!res.ok) throw new Error("Clínica no encontrada");
                return res.json();
            })
            .then(data => setClinic(data))
            .catch(err => console.error(err));
    }, [clinic_id]);

    // 🚩 ESTE BLOQUE ES VITAL: Si clinic es null, se detiene aquí y muestra el spinner
    if (!clinic) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status"></div>
                <span className="ms-2">Cargando datos de la sede...</span>
            </div>
        );
    }
    return (
        <div className="clinic-landing animate__animated animate__fadeIn">
            {/* Hero Section */}
            <section className="bg-primary text-white text-center py-5 shadow-sm">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-8">
                            <i className="fas fa-clinic-medical fa-3x mb-3 text-info"></i>
                            <h1 className="display-4 fw-bold mb-2">{clinic.name}</h1>
                            <p className="lead opacity-75 mb-4">
                                <i className="fas fa-map-marker-alt me-2"></i>{clinic.address}
                            </p>
                            <button
                                className="btn btn-info btn-lg px-5 py-3 fw-bold shadow hover-up"
                                onClick={() => navigate(`/registro-cliente?clinic_id=${clinic.id}`)}
                            >
                                <i className="fas fa-user-plus me-2"></i>Registrarme y Pedir Cita
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="container py-5">
                <div className="row g-4">
                    <div className="col-md-4 text-center">
                        <div className="p-4 border-0 card h-100 shadow-sm bg-white rounded-4">
                            <i className="fas fa-paw fa-2x text-primary mb-3"></i>
                            <h5>Perfil de Mascotas</h5>
                            <p className="text-muted small">Lleva el historial médico de tus peludos siempre contigo.</p>
                        </div>
                    </div>
                    <div className="col-md-4 text-center">
                        <div className="p-4 border-0 card h-100 shadow-sm bg-white rounded-4">
                            <i className="fas fa-calendar-check fa-2x text-primary mb-3"></i>
                            <h5>Citas Online</h5>
                            <p className="text-muted small">Agenda consultas o peluquería en segundos desde tu móvil.</p>
                        </div>
                    </div>
                    <div className="col-md-4 text-center">
                        <div className="p-4 border-0 card h-100 shadow-sm bg-white rounded-4">
                            <i className="fas fa-file-invoice-dollar fa-2x text-primary mb-3"></i>
                            <h5>Gestión de Pagos</h5>
                            <p className="text-muted small">Recibe tus facturas digitales y mantén tus cuentas al día.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};