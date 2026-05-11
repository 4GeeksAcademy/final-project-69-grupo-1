import React from "react";

export const ViewClinicDetailsModal = ({ show, onClose, clinic, onToggleUserBan }) => {
    if (!show || !clinic) return null;

    // Asumimos que el backend nos enviará un arreglo 'users' dentro del objeto clinic
    const users = clinic.users || [];

    return (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered modal-xl">
                <div className="modal-content">
                    <div className="modal-header bg-info text-white">
                        <h5 className="modal-title">Detalles de la Clínica: {clinic.nombre}</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <div className="row mb-4">
                            <div className="col-md-4"><strong>RIF:</strong> {clinic.rif}</div>
                            <div className="col-md-4"><strong>Teléfono:</strong> {clinic.telefono || "N/A"}</div>
                            <div className="col-md-4"><strong>Correo:</strong> {clinic.correo || "N/A"}</div>
                        </div>

                        <h6 className="fw-bold border-bottom pb-2">Personal y Usuarios (Doctores / Clientes)</h6>
                        <div className="table-responsive">
                            <table className="table table-sm table-striped text-center align-middle">
                                <thead className="table-secondary">
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Email</th>
                                        <th>Rol</th>
                                        <th>Estado</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length > 0 ? (
                                        users.map(user => (
                                            <tr key={user.id}>
                                                <td>{user.full_name}</td>
                                                <td>{user.email}</td>
                                                <td><span className="badge bg-secondary">{user.role}</span></td>
                                                <td>
                                                    {user.is_active ?
                                                        <span className="badge bg-success">Activo</span> :
                                                        <span className="badge bg-danger">Vetado</span>
                                                    }
                                                </td>
                                                <td>
                                                    <button
                                                        className={`btn btn-sm ${user.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                                                        onClick={() => onToggleUserBan(clinic.id, user.id, !user.is_active)}
                                                    >
                                                        {user.is_active ? "Vetar" : "Quitar Veto"}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5" className="py-3">No hay usuarios registrados en esta clínica aún.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="modal-footer justify-content-center">
                        <button className="btn btn-secondary" onClick={onClose}>Cerrar Panel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};