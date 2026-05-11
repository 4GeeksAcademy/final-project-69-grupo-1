import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalReducer } from "../../hooks/useGlobalReducer";
import Swal from "sweetalert2"; // <-- Importamos SweetAlert2

export const MyPets = () => {
    const { actions } = useGlobalReducer();
    const navigate = useNavigate();

    const [petData, setPetData] = useState({
        name: "",
        specie: "Canino",
        breed: "",
        age: ""
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setPetData({ ...petData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const success = await actions.addPet(petData);
        setLoading(false);

        if (success) {
            // Modal de éxito hermoso con SweetAlert2
            await Swal.fire({
                title: '¡Registro Exitoso!',
                text: `🐾 ${petData.name} ahora forma parte de la familia NexPetly.`,
                icon: 'success',
                confirmButtonColor: '#0d6efd',
                confirmButtonText: 'Genial, ir a mi panel'
            });
            // Una vez que el usuario cierra el modal, lo llevamos al dashboard
            navigate("/client/dashboard");
        } else {
            // Modal de error
            Swal.fire({
                title: 'Ups...',
                text: 'No se pudo registrar la mascota. Verifica tus datos e intenta de nuevo.',
                icon: 'error',
                confirmButtonColor: '#dc3545',
                confirmButtonText: 'Cerrar'
            });
        }
    };

    return (
        <div className="container-fluid bg-light min-vh-100 py-5">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-6">
                        {/* Agregamos animaciones de entrada a la tarjeta */}
                        <div className="card border-0 shadow-sm rounded-4 animate__animated animate__fadeInUp">
                            <div className="card-body p-4 p-md-5">

                                <div className="text-center mb-5">
                                    <div className="bg-primary-subtle d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm" style={{ width: '80px', height: '80px' }}>
                                        <i className="fas fa-paw fa-3x text-primary"></i>
                                    </div>
                                    <h2 className="fw-bolder text-dark">Nueva Mascota</h2>
                                    <p className="text-muted">Cuéntanos un poco sobre tu mejor amigo para su expediente.</p>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                        <label className="form-label small fw-bold text-secondary text-uppercase">Nombre de la Mascota</label>
                                        <input
                                            type="text" name="name" required
                                            className="form-control form-control-lg bg-light border-0 shadow-none"
                                            placeholder="Ej: Max, Luna, Firulais..."
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label small fw-bold text-secondary text-uppercase">Especie</label>
                                        <select
                                            name="specie"
                                            className="form-select form-select-lg bg-light border-0 shadow-none"
                                            onChange={handleChange}
                                        >
                                            <option value="Canino">🐶 Canino (Perro)</option>
                                            <option value="Felino">🐱 Felino (Gato)</option>
                                            <option value="Ave">🐦 Ave</option>
                                            <option value="Roedor">🐹 Roedor / Conejo</option>
                                            <option value="Otro">🐾 Otro</option>
                                        </select>
                                    </div>

                                    <div className="row g-3 mb-5">
                                        <div className="col-md-8">
                                            <label className="form-label small fw-bold text-secondary text-uppercase">Raza / Variedad</label>
                                            <input
                                                type="text" name="breed" required
                                                className="form-control form-control-lg bg-light border-0 shadow-none"
                                                placeholder="Ej: Golden Retriever, Siamés..."
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label small fw-bold text-secondary text-uppercase">Edad (años)</label>
                                            <input
                                                type="number" name="age" required min="0" max="30"
                                                className="form-control form-control-lg bg-light border-0 shadow-none"
                                                placeholder="0"
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="d-flex flex-column flex-sm-row gap-3 border-top pt-4">
                                        <button
                                            type="button"
                                            className="btn btn-light btn-lg fw-bold w-100 rounded-pill text-secondary"
                                            onClick={() => navigate("/client/dashboard")}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary btn-lg fw-bold w-100 rounded-pill shadow-sm hover-lift"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <><span className="spinner-border spinner-border-sm me-2"></span> Guardando...</>
                                            ) : (
                                                <><i className="fas fa-save me-2"></i> Guardar Mascota</>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estilo local para el hover del botón */}
            <style>{`
                .hover-lift:hover { 
                    transform: translateY(-3px); 
                    transition: transform 0.2s ease; 
                    box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important; 
                }
            `}</style>
        </div>
    );
};