import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export const RegisterStaff = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    const [inviteData, setInviteData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // NUEVO: Solo nombre y contraseña
    const [formData, setFormData] = useState({
        full_name: "",
        password: ""
    });

    useEffect(() => {
        const validateInvite = async () => {
            if (!token) {
                setError("No se proporcionó un token de invitación.");
                setLoading(false);
                return;
            }
            try {
                const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/validate-invite?token=${token}`);
                const data = await resp.json();

                if (resp.ok) {
                    setInviteData(data);
                } else {
                    setError(data.msg || "Token inválido o expirado");
                }
            } catch (err) {
                setError("Error de conexión con el servidor");
            } finally {
                setLoading(false);
            }
        };
        validateInvite();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clinic/register-invited`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: token,
                    full_name: formData.full_name,
                    password: formData.password
                })
            });

            const data = await resp.json();
            if (resp.ok) {
                alert("¡Cuenta creada con éxito! Ya puedes iniciar sesión.");
                navigate("/login");
            } else {
                alert(data.msg || "Error en el registro");
            }
        } catch (err) {
            alert("Error de red");
        }
    };

    if (loading) return <div className="text-center mt-5">Validando invitación...</div>;
    if (error) return <div className="container mt-5 alert alert-danger text-center">{error}</div>;

    return (
        <div className="container d-flex justify-content-center align-items-center min-vh-100">
            <div className="card shadow p-4" style={{ maxWidth: "400px", width: "100%" }}>
                <h3 className="text-center text-primary fw-bold">Unirse a {inviteData?.clinic_name}</h3>
                <p className="text-center text-muted small mb-4">Registrándote como: {inviteData?.role}</p>
                
                <form onSubmit={handleSubmit} className="d-grid gap-3">
                    <div>
                        <label className="small fw-bold">Nombre Completo</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            required
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="small fw-bold">Contraseña</label>
                        <input 
                            type="password" 
                            className="form-control" 
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary fw-bold mt-2">Finalizar Registro</button>
                </form>
            </div>
        </div>
    );
};