import React, { useEffect, useMemo, useState } from "react";
import { useGlobalReducer } from "../hooks/useGlobalReducer";

export const DoctorDashboard = () => {
  const { store, actions } = useGlobalReducer();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [consultation, setConsultation] = useState({ motivo: "", diagnostico_tratamiento: "" });

  const loadData = async () => {
    await Promise.all([actions.getDoctorAppointments(), actions.getDoctorPatients()]);
  };

  useEffect(() => { loadData(); }, []);

  const kpis = useMemo(() => ({
    total: store.doctorAppointments.length,
    enAtencion: store.doctorAppointments.filter(a => a.status === "EN_ATENCION").length,
    programadas: store.doctorAppointments.filter(a => a.status === "PROGRAMADA").length,
    completadas: store.doctorAppointments.filter(a => a.status === "COMPLETADA").length,
  }), [store.doctorAppointments]);

  const changeStatus = async (appointmentId, status) => {
    await actions.updateDoctorAppointmentStatus(appointmentId, status);
    loadData();
  };

  const saveConsultation = async () => {
    if (!selectedAppointment) return;
    await actions.saveDoctorConsultation(selectedAppointment.id, consultation);
    setConsultation({ motivo: "", diagnostico_tratamiento: "" });
    setSelectedAppointment(null);
    loadData();
  };

  return (
    <div className="container py-4">
      <h2 className="mb-3">Panel del Doctor</h2>
      <div className="d-flex gap-2 flex-wrap mb-4">
        {[
          ["dashboard", "Dashboard"],
          ["schedule", "Schedule"],
          ["patients", "Pacientes"],
        ].map(([id, label]) => (
          <button key={id} className={`btn ${activeTab === id ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setActiveTab(id)}>{label}</button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <div className="row g-3">
          <div className="col-6 col-md-3"><div className="card p-3"><strong>Total</strong><span>{kpis.total}</span></div></div>
          <div className="col-6 col-md-3"><div className="card p-3"><strong>Programadas</strong><span>{kpis.programadas}</span></div></div>
          <div className="col-6 col-md-3"><div className="card p-3"><strong>En atención</strong><span>{kpis.enAtencion}</span></div></div>
          <div className="col-6 col-md-3"><div className="card p-3"><strong>Completadas</strong><span>{kpis.completadas}</span></div></div>
        </div>
      )}

      {activeTab === "schedule" && (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead><tr><th>Fecha</th><th>Mascota</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {store.doctorAppointments.map(ap => (
                <tr key={ap.id}>
                  <td>{new Date(ap.date_time).toLocaleString()}</td>
                  <td>{ap.pet?.nombre}</td>
                  <td>{ap.status}</td>
                  <td className="d-flex gap-2 flex-wrap">
                    <button className="btn btn-sm btn-warning" onClick={() => changeStatus(ap.id, "EN_ATENCION")}>En atención</button>
                    <button className="btn btn-sm btn-secondary" onClick={() => changeStatus(ap.id, "CANCELADA")}>Cancelar</button>
                    <button className="btn btn-sm btn-success" onClick={() => { setSelectedAppointment(ap); setConsultation({ motivo: "", diagnostico_tratamiento: "" }); }}>Finalizar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedAppointment && (
            <div className="card p-3 mt-3">
              <h5>Finalizar consulta: {selectedAppointment.pet?.nombre}</h5>
              <input className="form-control mb-2" placeholder="Motivo" value={consultation.motivo} onChange={e => setConsultation({ ...consultation, motivo: e.target.value })} />
              <textarea className="form-control mb-2" rows="4" placeholder="Diagnóstico y tratamiento" value={consultation.diagnostico_tratamiento} onChange={e => setConsultation({ ...consultation, diagnostico_tratamiento: e.target.value })} />
              <button className="btn btn-primary" onClick={saveConsultation}>Guardar y completar</button>
            </div>
          )}
        </div>
      )}

      {activeTab === "patients" && (
        <div className="row g-3">
          {store.doctorPatients.map(p => (
            <div key={p.id} className="col-12 col-lg-6">
              <div className="card p-3 h-100">
                <h5>{p.nombre} <small className="text-muted">({p.especie})</small></h5>
                <p className="mb-2">Dueño: {p.owner_name} · {p.owner_email}</p>
                <strong>Historia clínica:</strong>
                <ul className="mb-0">
                  {p.medical_history.length === 0 ? <li>Sin registros</li> : p.medical_history.map(r => <li key={r.id}>{new Date(r.fecha).toLocaleDateString()} - {r.motivo}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
