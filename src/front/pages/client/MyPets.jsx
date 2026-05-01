import React, { useState, useEffect } from "react";

export const MyPets = () => {
    const [pets, setPets] = useState([]);
    const [newPet, setNewPet] = useState({ nombre: "", especie: "", raza: "" });
    const [editPet, setEditPet] = useState(null);

    const BACKEND_URL = "https://symmetrical-tribble-4rgjv9jxxw2q7x4-3001.app.github.dev";

    const getPets = async () => {
        const token = localStorage.getItem("token") || ""; 
        try {
            const response = await fetch(`${BACKEND_URL}/api/users/me/pets`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPets(data);
            }
        } catch (error) {
            console.error("Error al cargar mascotas:", error);
        }
    };

    useEffect(() => { getPets(); }, []);

    const handleAction = async (method, endpoint, body, isEdit = false) => {
        const token = localStorage.getItem("token") || "";
        try {
            const response = await fetch(`${BACKEND_URL}${endpoint}`, {
                method: method,
                headers: { 
                    "Content-Type": "application/json", 
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify(body)
            });
            if (response.ok) {
                await getPets();
                if (!isEdit) setNewPet({ nombre: "", especie: "", raza: "" });
                alert(isEdit ? "¡Mascota actualizada!" : "¡Mascota agregada!");
            }
        } catch (error) { console.error(error); }
    };

    // NUEVA FUNCIÓN: ELIMINAR
    const handleDelete = async (id) => {
        if (!confirm("¿Estás seguro de que quieres eliminar esta mascota?")) return;
        const token = localStorage.getItem("token") || "";
        try {
            const response = await fetch(`${BACKEND_URL}/api/pets/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                await getPets();
                alert("Mascota eliminada");
            }
        } catch (error) { console.error(error); }
    };

    return (
        <div className="container py-5">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <h2 className="text-primary fw-bold">🐾 Mis Mascotas</h2>
                <button className="btn btn-warning rounded-pill px-4 shadow-sm" data-bs-toggle="modal" data-bs-target="#addPetModal">
                    <i className="fa-solid fa-plus me-2"></i>Nueva Mascota
                </button>
            </div>

            <div className="row">
                {pets.length === 0 ? (
                    <p className="text-muted text-center">No hay mascotas registradas.</p>
                ) : (
                    pets.map(pet => (
                        <div key={pet.id} className="col-md-4 mb-4">
                            <div className="card shadow-sm border-0 border-start border-primary border-5 p-3">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <h5 className="fw-bold mb-0">{pet.nombre}</h5>
                                            <small className="text-muted">{pet.especie} - {pet.raza}</small>
                                        </div>
                                        {/* BOTÓN DE ELIMINAR */}
                                        <button className="btn btn-outline-danger btn-sm border-0" onClick={() => handleDelete(pet.id)}>
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                    <div className="mt-3">
                                        <button 
                                            className="btn btn-sm btn-outline-primary w-100 rounded-pill" 
                                            data-bs-toggle="modal" 
                                            data-bs-target="#editPetModal" 
                                            onClick={() => setEditPet(pet)}
                                        >
                                            <i className="fa-solid fa-pencil me-2"></i>Editar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* MODAL: AGREGAR */}
            <div className="modal fade" id="addPetModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0 p-4 shadow">
                        <h4 className="text-primary fw-bold mb-4">Agregar Mascota</h4>
                        <input type="text" className="form-control mb-2" placeholder="Nombre" value={newPet.nombre} onChange={e => setNewPet({...newPet, nombre: e.target.value})} />
                        <select className="form-select mb-2" value={newPet.especie} onChange={e => setNewPet({...newPet, especie: e.target.value})}>
                            <option value="">Tipo...</option>
                            <option value="Perro">Perro</option>
                            <option value="Gato">Gato</option>
                            <option value="Otro">Otro</option>
                        </select>
                        <input type="text" className="form-control mb-3" placeholder="Raza" value={newPet.raza} onChange={e => setNewPet({...newPet, raza: e.target.value})} />
                        <button className="btn btn-primary w-100 rounded-pill" onClick={() => handleAction("POST", "/api/pets", newPet)} data-bs-dismiss="modal">Guardar</button>
                    </div>
                </div>
            </div>

            {/* MODAL: EDITAR */}
            <div className="modal fade" id="editPetModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0 p-4 shadow">
                        <h4 className="text-primary fw-bold mb-4">Editar Mascota</h4>
                        {editPet && (
                            <>
                                <input type="text" className="form-control mb-2" value={editPet.nombre} onChange={e => setEditPet({...editPet, nombre: e.target.value})} />
                                <select className="form-select mb-2" value={editPet.especie} onChange={e => setEditPet({...editPet, especie: e.target.value})}>
                                    <option value="Perro">Perro</option>
                                    <option value="Gato">Gato</option>
                                    <option value="Otro">Otro</option>
                                </select>
                                <input type="text" className="form-control mb-3" value={editPet.raza} onChange={e => setEditPet({...editPet, raza: e.target.value})} />
                                <button className="btn btn-success w-100 rounded-pill" onClick={() => handleAction("PUT", `/api/pets/${editPet.id}`, editPet, true)} data-bs-dismiss="modal">Actualizar</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};