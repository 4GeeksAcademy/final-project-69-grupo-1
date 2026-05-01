import React, { useState } from "react";
import { useGlobalReducer } from "../hooks/useGlobalReducer";

export const MedicalRecordForm = () => {
  const { store } = useGlobalReducer();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [appointmentId, setAppointmentId] = useState("");
  const [motivo, setMotivo] = useState("Consulta general");
  const [diagnostico, setDiagnostico] = useState("");
  const [tratamiento, setTratamiento] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${backendUrl}/api/appointments/${appointmentId}/medical-record`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${store.token}`
        },
        body: JSON.stringify({ motivo, diagnostico, tratamiento })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "No se pudo registrar la historia clínica");
        return;
      }

      setMessage("Diagnóstico y tratamiento registrados exitosamente.");
      setDiagnostico("");
      setTratamiento("");
      setAppointmentId("");
    } catch {
      setError("Error de conexión con el servidor");
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: "720px" }}>
      <h2 className="mb-4">Registrar historia clínica</h2>
      <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
        <div className="mb-3">
          <label className="form-label">ID de la cita</label>
          <input
            type="number"
            className="form-control"
            value={appointmentId}
            onChange={(e) => setAppointmentId(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Motivo de consulta</label>
          <input
            type="text"
            className="form-control"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Diagnóstico</label>
          <textarea
            className="form-control"
            rows="3"
            value={diagnostico}
            onChange={(e) => setDiagnostico(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Tratamiento</label>
          <textarea
            className="form-control"
            rows="3"
            value={tratamiento}
            onChange={(e) => setTratamiento(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary">Guardar historia clínica</button>

        {message && <div className="alert alert-success mt-3 mb-0">{message}</div>}
        {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
      </form>
    </div>
  );
};
