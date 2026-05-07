import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalReducer } from "../hooks/useGlobalReducer";

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
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setPetData({ ...petData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const success = await actions.addPet(petData);
        setLoading(false);

        if (success) {
            // Volvemos al dashboard para ver la nueva mascota en la lista
            navigate("/client/dashboard");
        } else {
            setError("No se pudo registrar la mascota. Intenta de nuevo.");
        }
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-body p-5">
                            <div className="text-center mb-4">
                                <div className="bg-primary-subtle d-inline-block p-3 rounded-circle mb-3">
                                    <i className="fas fa-paw fa-2x text-primary"></i>
                                </div>
                                <h2 className="fw-bold">Nueva Mascota</h2>
                                <p className="text-muted">Cuéntanos un poco sobre tu mejor amigo.</p>
                            </div>

                            {error && <div className="alert alert-danger p-2 small">{error}</div>}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Nombre de la Mascota</label>
                                    <input 
                                        type="text" name="name" required
                                        className="form-control bg-light border-0 px-3 py-2" 
                                        placeholder="Ej: Max, Luna..."
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Especie</label>
                                    <select 
                                        name="specie" 
                                        className="form-select bg-light border-0 px-3 py-2"
                                        onChange={handleChange}
                                    >
                                        <option value="Canino">🐶 Canino (Perro)</option>
                                        <option value="Felino">🐱 Felino (Gato)</option>
                                        <option value="Otro">🐰 Otro</option>
                                    </select>
                                </div>

                                <div className="row">
                                    <div className="col-md-8 mb-3">
                                        <label className="form-label small fw-bold">Raza / Variedad</label>
                                        <input 
                                            type="text" name="breed" required
                                            className="form-control bg-light border-0 px-3 py-2" 
                                            placeholder="Ej: Golden Retriever"
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label small fw-bold">Edad (años)</label>
                                        <input 
                                            type="number" name="age" required min="0" max="30"
                                            className="form-control bg-light border-0 px-3 py-2" 
                                            placeholder="0"
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 d-flex gap-2">
                                    <button 
                                        type="button" 
                                        className="btn btn-light w-100 fw-bold py-2 border"
                                        onClick={() => navigate("/client/dashboard")}
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary w-100 fw-bold py-2 shadow-sm"
                                        disabled={loading}
                                    >
                                        {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : "Guardar Mascota"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};