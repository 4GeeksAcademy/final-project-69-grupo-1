import React, { useEffect, useState } from "react";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { AdminUserModal } from "./AdminUserModal";

export const AdminUsersTab = () => {
    const { store, actions } = useGlobalReducer();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        const filtered = users.filter(u =>
            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredUsers(filtered);
    }, [searchTerm, users]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/users", {
                headers: { "Authorization": `Bearer ${store.token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                toast.error("Error al cargar usuarios");
            }
        } catch (error) {
            console.error("Error cargando usuarios:", error);
            toast.error("Error al cargar usuarios");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = () => {
        setSelectedUser(null);
        setEditing(false);
        setShowModal(true);
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setEditing(true);
        setShowModal(true);
    };

    const handleToggleUserStatus = async (user) => {
        const confirmed = await Swal.fire({
            title: `¿${user.is_active ? 'Desactivar' : 'Activar'} usuario?`,
            text: `${user.full_name} (${user.email})`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: user.is_active ? '#dc3545' : '#198754',
            confirmButtonText: `Sí, ${user.is_active ? 'desactivar' : 'activar'}`
        });

        if (confirmed.isConfirmed) {
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/${user.id}/status`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${store.token}`
                    },
                    body: JSON.stringify({ is_active: !user.is_active })
                });

                if (response.ok) {
                    const updatedUser = { ...user, is_active: !user.is_active };
                    setUsers(users.map(u => u.id === user.id ? updatedUser : u));
                    toast.success(`Usuario ${user.is_active ? 'desactivado' : 'activado'}`);
                } else {
                    toast.error("Error al cambiar estado del usuario");
                }
            } catch (error) {
                console.error("Error:", error);
                toast.error("Error al cambiar estado");
            }
        }
    };

    const handleUserSaved = async (newUser) => {
        toast.success(editing ? "Usuario actualizado" : "Usuario creado");
        setShowModal(false);
        loadUsers();
    };

    return (
        <div className="animate__animated animate__fadeIn">
            <div className="row mb-3 g-3">
                <div className="col-md-6">
                    <div className="input-group shadow-sm rounded-pill overflow-hidden border">
                        <span className="input-group-text bg-white border-0"><i className="fas fa-search text-muted"></i></span>
                        <input
                            type="text"
                            className="form-control border-0"
                            placeholder="Buscar por email o nombre..."
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-6 text-md-end">
                    <button
                        className="btn btn-primary rounded-pill px-4 shadow-sm"
                        onClick={handleCreateUser}
                    >
                        + Crear Usuario
                    </button>
                </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4">
                <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between">
                    <h5 className="mb-0 fw-bold">Usuarios del Sistema</h5>
                    <button className="btn btn-sm btn-outline-secondary rounded-pill" onClick={loadUsers} disabled={loading}>
                        <i className="fas fa-sync-alt"></i> {loading ? "Cargando..." : "Actualizar"}
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light text-muted small text-uppercase">
                            <tr>
                                <th className="px-4">Email</th>
                                <th>Nombre</th>
                                <th>Rol</th>
                                <th>Clínica</th>
                                <th className="text-center">Estado</th>
                                <th className="text-end px-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-4"><div className="spinner-border spinner-border-sm" role="status"><span className="visually-hidden">Cargando...</span></div></td></tr>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <tr key={user.id}>
                                        <td className="px-4">
                                            <div className="fw-bold text-primary">{user.email}</div>
                                        </td>
                                        <td>{user.full_name || "N/A"}</td>
                                        <td>
                                            <span className={`badge rounded-pill ${user.role === 'SUPER_ADMIN' ? 'bg-danger' :
                                                    user.role === 'CLINIC_ADMIN' ? 'bg-primary' :
                                                        user.role === 'DOCTOR' ? 'bg-info' :
                                                            user.role === 'RECEPTIONIST' ? 'bg-success' :
                                                                'bg-secondary'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>{user.clinic_name || "N/A"}</td>
                                        <td className="text-center">
                                            <span className={`badge rounded-pill ${user.is_active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                                {user.is_active ? 'ACTIVO' : 'INACTIVO'}
                                            </span>
                                        </td>
                                        <td className="text-end px-4">
                                            <div className="d-flex justify-content-end gap-2">
                                                <button
                                                    className="btn btn-sm btn-light border"
                                                    onClick={() => handleEditUser(user)}
                                                    title="Editar"
                                                >
                                                    <i className="fas fa-edit text-primary"></i>
                                                </button>
                                                <button
                                                    className={`btn btn-sm ${user.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                    onClick={() => handleToggleUserStatus(user)}
                                                    title={user.is_active ? "Desactivar" : "Activar"}
                                                >
                                                    <i className={`fas ${user.is_active ? 'fa-ban' : 'fa-check'}`}></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="text-center py-5 text-muted">No hay usuarios.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AdminUserModal
                show={showModal}
                onClose={() => setShowModal(false)}
                user={selectedUser}
                editing={editing}
                onSave={handleUserSaved}
            />
        </div>
    );
};
