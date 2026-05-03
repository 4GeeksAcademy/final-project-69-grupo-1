import React, { useState } from "react";
import { useGlobalReducer } from "../hooks/useGlobalReducer";

export const BulkUpload = ({ onNotify }) => {
    const { actions } = useGlobalReducer();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.name.endsWith(".csv")) {
            setFile(selectedFile);
        } else {
            onNotify("Por favor, selecciona un archivo .csv válido", "danger");
            e.target.value = null;
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        const result = await actions.uploadStaffCSV(formData);

        setUploading(false);
        if (result.success) {
            onNotify(`Éxito: ${result.created} empleados migrados.`, "success");
            setFile(null);
        } else {
            onNotify(result.message || "Error al procesar el archivo", "danger");
        }
    };

    // Función para generar y descargar el CSV
    const downloadTemplate = () => {
        // 1. Definimos el contenido
        const headers = ["email", "first_name", "last_name", "role"];
        const sampleData = ["doctor.house@ejemplo.com", "Gregory", "House", "VET"];

        // 2. Creamos el string del CSV
        const csvContent = [headers, sampleData].map(e => e.join(",")).join("\n");

        // 3. Creamos un link oculto para disparar la descarga
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "plantilla_personal_pethealth.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="card shadow-sm border-0 border-top border-success border-4">
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0">
                        <i className="fas fa-file-csv text-success me-2"></i>
                        Migración Masiva
                    </h6>
                    {/* Botón de Ayuda/Plantilla */}
                    <button
                        onClick={downloadTemplate}
                        className="btn btn-link btn-sm text-decoration-none p-0 text-success fw-bold"
                        title="Descargar formato ejemplo"
                    >
                        <i className="fas fa-download me-1"></i> Descargar Plantilla
                    </button>
                </div>

                <p className="small text-muted mb-3" style={{ fontSize: '11px' }}>
                    Sube un archivo .csv con los datos de tus empleados existentes para darles acceso rápido.
                </p>

                <div className="mb-3">
                    <label htmlFor="csvInput" className="form-label small fw-bold text-secondary">Seleccionar archivo</label>
                    <input
                        type="file"
                        id="csvInput"
                        className="form-control form-control-sm border-light bg-light"
                        accept=".csv"
                        onChange={handleFileChange}
                    />
                </div>

                <button
                    onClick={handleUpload}
                    className="btn btn-success btn-sm w-100 fw-bold shadow-sm py-2"
                    disabled={!file || uploading}
                >
                    {uploading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Procesando...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-cloud-upload-alt me-2"></i>
                            Subir y Migrar Personal
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};