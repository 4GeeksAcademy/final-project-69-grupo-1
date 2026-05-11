import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import useGlobalReducer from "../../hooks/useGlobalReducer"; // Importamos para usar datos reales

export const Invoice = () => {
    const { store } = useGlobalReducer();

    const handleDownload = async () => {
        const element = document.getElementById("invoice-capture");
        
        // 1. Captura con alta calidad (Scale 3) para evitar que se vea borroso
        const canvas = await html2canvas(element, { 
            scale: 3, 
            useCORS: true,
            backgroundColor: "#ffffff" // Asegura fondo blanco
        });
        
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");

        // 2. Cálculo de dimensiones para evitar el estiramiento
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        
        // Calculamos el alto proporcional al ancho de la hoja A4
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // 3. Agregamos la imagen (Posición X: 0, Posición Y: 10 para dejar margen arriba)
        pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);
        pdf.save("recibo-orbital-express.pdf");
    };

    return (
        <div className="container py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-light">Generar Recibo</h2>
                <button onClick={handleDownload} className="btn btn-primary shadow-sm px-4">
                    <i className="fas fa-download me-2"></i> Descargar PDF
                </button>
            </div>

            {/* Este ID es el que captura el código de arriba */}
            <div id="invoice-capture" className="bg-white p-5 shadow-lg border rounded mx-auto" style={{ maxWidth: "800px" }}>
                <div className="row mb-5">
                    <div className="col-8">
                        <h3 className="fw-bold mb-0 text-primary">ORBITAL EXPRESS</h3>
                        <p className="text-muted small">Distribución y Logística Especializada</p>
                    </div>
                    <div className="col-4 text-end">
                        <h5 className="mb-0">RECIBO</h5>
                        {/* Aquí puedes usar un ID de la base de datos si lo tienes */}
                        <p className="text-muted small">#ORD-2026-{Math.floor(Math.random() * 1000)}</p>
                    </div>
                </div>

                <div className="row mb-4">
                    <div className="col-6 text-start">
                        <p className="mb-1 text-muted text-uppercase small fw-bold">Cliente</p>
                        {/* Ejemplo de uso de datos dinámicos del Store */}
                        <p className="mb-0 fw-bold">{store.user?.name || "Usuario Autorizado"}</p>
                        <p className="text-muted small">Email: {store.user?.email || "usuario@ejemplo.com"}</p>
                    </div>
                    <div className="col-6 text-end">
                        <p className="mb-1 text-muted text-uppercase small fw-bold">Fecha</p>
                        <p className="mb-0">Abril 24, 2026</p>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="table table-borderless border-top border-bottom">
                        <thead>
                            <tr className="text-muted small text-uppercase">
                                <th className="text-start">Descripción del Servicio</th>
                                <th className="text-end">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="py-3 text-start">Gestión de Logística y Paquetería Orbital</td>
                                <td className="py-3 text-end fw-bold">$120.00</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="row justify-content-end mt-4">
                    <div className="col-4 text-end">
                        <div className="d-flex justify-content-between mb-2 small">
                            <span className="text-muted">Subtotal:</span>
                            <span>$120.00</span>
                        </div>
                        <div className="d-flex justify-content-between fw-bold border-top pt-2">
                            <span>Total:</span>
                            <span className="text-primary">$120.00</span>
                        </div>
                    </div>
                </div>

                <div className="mt-5 pt-5 border-top text-center text-muted small">
                    <p>Gracias por confiar en Orbital Express. Este es un recibo generado automáticamente.</p>
                </div>
            </div>
        </div>
    );
};