import React, { useState } from "react";
import { useGlobalReducer } from "../../hooks/useGlobalReducer";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export const RegistrationLanding = () => {
    const { actions } = useGlobalReducer();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        tipo_solicitud: "EMPRESA",
        nombre_clinica: "", // Nombre de la Sede/Consultorio
        rif_empresa: "",
        cedula_identidad: "",
        direccion: "",
        telefono: "",
        email: "",
        nombre_admin: "" // Aquí guardaremos el nombre del Admin o del Vet Independiente
    });

    const [files, setFiles] = useState({
        file_cedula: null,
        file_rif: null,
        file_mercantil: null,
        file_sanitario: null,
        file_titulo: null
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e, key) => {
        setFiles({ ...files, [key]: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // --- VALIDACIÓN DE CAMPOS Y DOCUMENTOS ---
        if (!formData.nombre_admin) {
            toast.error("El nombre completo es obligatorio.");
            setLoading(false);
            return;
        }

        if (formData.tipo_solicitud === "EMPRESA") {
            if (!files.file_rif || !files.file_mercantil || !files.file_sanitario || !files.file_cedula) {
                toast.error("Faltan documentos obligatorios para la empresa.");
                setLoading(false);
                return;
            }
        } else {
            if (!files.file_cedula || !files.file_titulo) {
                toast.error("La Cédula y el Título Profesional son obligatorios.");
                setLoading(false);
                return;
            }
        }

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        Object.keys(files).forEach(key => {
            if (files[key]) data.append(key, files[key]);
        });

        const success = await actions.submitClinicRegistration(data);
        
        if (success) {
            toast.success("Solicitud enviada. Revisaremos tus credenciales profesionales.");
            navigate("/");
        } else {
            toast.error("Error al procesar la solicitud.");
        }
        setLoading(false);
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-lg-9">
                    <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
                        <div className="bg-primary p-4 text-white text-center">
                            <h3 className="fw-bold mb-0">Afiliación a PetHealth & Spa</h3>
                        </div>
                        
                        <div className="card-body p-4 p-md-5">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4 bg-light p-3 rounded border">
                                    <label className="form-label fw-bold text-primary">Modalidad de Trabajo</label>
                                    <select className="form-select border-primary" name="tipo_solicitud" onChange={handleChange} value={formData.tipo_solicitud}>
                                        <option value="EMPRESA">Clínica Veterinaria / Hospital</option>
                                        <option value="INDEPENDIENTE">Médico Veterinario Independiente</option>
                                    </select>
                                </div>

                                <h5 className="fw-bold mb-3 mt-4 border-bottom pb-2">Información de Identidad</h5>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold">
                                            {formData.tipo_solicitud === "EMPRESA" ? "Nombre de la Empresa" : "Nombre del Consultorio"}
                                        </label>
                                        <input type="text" name="nombre_clinica" className="form-control" onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold">
                                            {formData.tipo_solicitud === "EMPRESA" ? "Nombre del Administrador" : "Nombre Completo del Profesional"}
                                        </label>
                                        <input type="text" name="nombre_admin" className="form-control" placeholder="Ej: Dr. Juan Pérez" onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold">Cédula de Identidad</label>
                                        <input type="text" name="cedula_identidad" className="form-control" onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold">Email de Contacto</label>
                                        <input type="email" name="email" className="form-control" onChange={handleChange} required />
                                    </div>

                                    {formData.tipo_solicitud === "EMPRESA" && (
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">RIF de la Empresa</label>
                                            <input type="text" name="rif_empresa" className="form-control" placeholder="J-12345678" onChange={handleChange} required />
                                        </div>
                                    )}

                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold">Teléfono de contacto</label>
                                        <input type="text" name="telefono" className="form-control" onChange={handleChange} required />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label small fw-bold">Dirección de la Sede</label>
                                        <textarea name="direccion" className="form-control" rows="2" onChange={handleChange} required></textarea>
                                    </div>
                                </div>

                                <h5 className="fw-bold mb-3 mt-5 text-danger border-bottom pb-2">
                                    <i className="fas fa-file-signature me-2"></i>Documentación Legal Requerida
                                </h5>
                                
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold">Cédula Digitalizada *</label>
                                        <input type="file" className="form-control" onChange={(e) => handleFileChange(e, "file_cedula")} required />
                                    </div>

                                    {formData.tipo_solicitud === "EMPRESA" ? (
                                        <>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">RIF Digitalizado *</label>
                                                <input type="file" className="form-control" onChange={(e) => handleFileChange(e, "file_rif")} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Registro Mercantil *</label>
                                                <input type="file" className="form-control" onChange={(e) => handleFileChange(e, "file_mercantil")} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Permiso Sanitario *</label>
                                                <input type="file" className="form-control" onChange={(e) => handleFileChange(e, "file_sanitario")} required />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Título Profesional o Carnet del Colegio *</label>
                                            <input type="file" className="form-control" onChange={(e) => handleFileChange(e, "file_titulo")} required />
                                        </div>
                                    )}
                                </div>

                                <button type="submit" className="btn btn-primary btn-lg w-100 mt-5 fw-bold shadow" disabled={loading}>
                                    {loading ? "Enviando solicitud..." : "SOLICITAR AFILIACIÓN PROFESIONAL"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};