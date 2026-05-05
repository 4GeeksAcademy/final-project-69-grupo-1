import React, { useEffect, useMemo, useState } from "react";
import { useGlobalReducer } from "../hooks/useGlobalReducer";

export const DoctorDashboard = () => {
  const { store, actions } = useGlobalReducer();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [consultation, setConsultation] = useState({ motivo: "", diagnostico_tratamiento: "" });
  const [newPatient, setNewPatient] = useState({ nombre: "", especie: "", raza: "", edad: "", owner_name: "", owner_email: "" });
  const [newAppointment, setNewAppointment] = useState({ pet_id: "", date: "", tipo: "Consulta" });

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

  const filteredAppointments = useMemo(() => {
    if (!selectedDate) return store.doctorAppointments;
    return store.doctorAppointments.filter(a => a.date_time?.startsWith(selectedDate));
  }, [selectedDate, store.doctorAppointments]);

  return <div className="container py-4">
    <h2 className="mb-3">Panel del Doctor</h2>
    <div className="d-flex gap-2 flex-wrap mb-4">{[["dashboard", "Dashboard"],["schedule", "Calendario"],["patients", "Pacientes"]].map(([id, label]) => <button key={id} className={`btn ${activeTab === id ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setActiveTab(id)}>{label}</button>)}</div>

    {activeTab === "dashboard" && <div className="row g-3">{[["Total",kpis.total],["Programadas",kpis.programadas],["En atención",kpis.enAtencion],["Completadas",kpis.completadas]].map(([l,v])=><div key={l} className="col-6 col-md-3"><div className="card p-3"><strong>{l}</strong><span>{v}</span></div></div>)}</div>}

    {activeTab === "schedule" && <div>
      <div className="card p-3 mb-3">
        <h5>Calendario de citas</h5>
        <input type="date" className="form-control" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} />
      </div>

      <div className="card p-3 mb-3">
        <h5>Nueva cita</h5>
        <div className="row g-2">
          <div className="col-12 col-md-4"><select className="form-select" value={newAppointment.pet_id} onChange={e=>setNewAppointment({...newAppointment,pet_id:e.target.value})}><option value="">Seleccionar paciente</option>{store.doctorPatients.map(p=><option key={p.id} value={p.id}>{p.nombre} - {p.owner_name}</option>)}</select></div>
          <div className="col-12 col-md-4"><input type="datetime-local" className="form-control" value={newAppointment.date} onChange={e=>setNewAppointment({...newAppointment,date:e.target.value})} /></div>
          <div className="col-12 col-md-3"><input className="form-control" value={newAppointment.tipo} onChange={e=>setNewAppointment({...newAppointment,tipo:e.target.value})} /></div>
          <div className="col-12 col-md-1"><button className="btn btn-primary w-100" onClick={async()=>{await actions.createDoctorAppointment(newAppointment);setNewAppointment({ pet_id: "", date: "", tipo: "Consulta" });}}>+</button></div>
        </div>
      </div>

      <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Fecha</th><th>Mascota</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
      {filteredAppointments.length===0 ? <tr><td colSpan="4" className="text-center text-muted">Aún no tienes citas para la fecha seleccionada.</td></tr> : filteredAppointments.map(ap => <tr key={ap.id}><td>{new Date(ap.date_time).toLocaleString()}</td><td>{ap.pet?.nombre}</td><td>{ap.status}</td><td className="d-flex gap-2 flex-wrap"><button className="btn btn-sm btn-warning" onClick={async()=>{await actions.updateDoctorAppointmentStatus(ap.id,"EN_ATENCION");loadData();}}>En atención</button><button className="btn btn-sm btn-secondary" onClick={async()=>{await actions.updateDoctorAppointmentStatus(ap.id,"CANCELADA");loadData();}}>Cancelar</button><button className="btn btn-sm btn-success" onClick={()=>setSelectedAppointment(ap)}>Finalizar</button></td></tr>)}
      </tbody></table></div>

      {selectedAppointment && <div className="card p-3 mt-3"><h5>Finalizar consulta: {selectedAppointment.pet?.nombre}</h5><input className="form-control mb-2" placeholder="Motivo" value={consultation.motivo} onChange={e=>setConsultation({ ...consultation, motivo: e.target.value })} /><textarea className="form-control mb-2" rows="4" placeholder="Diagnóstico y tratamiento" value={consultation.diagnostico_tratamiento} onChange={e=>setConsultation({ ...consultation, diagnostico_tratamiento: e.target.value })} /><button className="btn btn-primary" onClick={async()=>{await actions.saveDoctorConsultation(selectedAppointment.id, consultation);setConsultation({ motivo: "", diagnostico_tratamiento: "" });setSelectedAppointment(null);loadData();}}>Guardar y completar</button></div>}
    </div>}

    {activeTab === "patients" && <div>
      <div className="card p-3 mb-3">
        <h5>Registrar paciente</h5>
        <div className="row g-2">{[
          ["nombre","Nombre mascota"],["especie","Especie"],["raza","Raza"],["edad","Edad"],["owner_name","Nombre dueño"],["owner_email","Email dueño"]
        ].map(([k,ph])=> <div className="col-12 col-md-4" key={k}><input className="form-control" placeholder={ph} value={newPatient[k]} onChange={e=>setNewPatient({...newPatient,[k]:e.target.value})} /></div>)}
        <div className="col-12"><button className="btn btn-primary" onClick={async()=>{await actions.createDoctorPatient({...newPatient, edad:newPatient.edad?Number(newPatient.edad):null});setNewPatient({ nombre: "", especie: "", raza: "", edad: "", owner_name: "", owner_email: "" });}}>Guardar paciente</button></div></div>
      </div>

      <div className="row g-3">{store.doctorPatients.length===0 ? <div className="col-12"><div className="alert alert-info">Aún no se tienen pacientes.</div></div> : store.doctorPatients.map(p => <div key={p.id} className="col-12 col-lg-6"><div className="card p-3 h-100"><h5>{p.nombre} <small className="text-muted">({p.especie})</small></h5><p className="mb-2">Dueño: {p.owner_name} · {p.owner_email}</p><strong>Historia clínica:</strong><ul className="mb-0">{p.medical_history.length === 0 ? <li>Sin registros</li> : p.medical_history.map(r => <li key={r.id}>{new Date(r.fecha).toLocaleDateString()} - {r.motivo}</li>)}</ul></div></div>)}</div>
    </div>}
  </div>
}
