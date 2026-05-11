import React, { useEffect, useState } from "react";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import toast from 'react-hot-toast';
import { ViewMedicalRecordModal } from "./ViewMedicalRecordModal";

export const AdminMedicalRecordsTab = () => {
    const { store } = useGlobalReducer();
    const [records, setRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [selectedClinicId, setSelectedClinicId] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    useEffect(() => {
        loadClinics();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [records, selectedClinicId, dateFrom, dateTo, searchTerm]);

    const loadClinics = async () => {
        try {
            const response = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/clinics", {
                headers: { "Authorization": `Bearer ${store.token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setClinics(data);
            }
        } catch (error) {
            console.error("Error cargando clínicas:", error);
        }
    };

    const loadMedicalRecords = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/medical-records`, {
                headers: { "Authorization": `Bearer ${store.token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setRecords(data);
            } else {
                toast.error("Error al cargar registros médicos");
            }
        } catch (error) {
            console.error("Error cargando registros:", error);
            toast.error("Error al cargar registros médicos");
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = records;

        if (selectedClinicId) {
            filtered = filtered.filter(r => r.clinic_id?.toString() === selectedClinicId);
        }

        if (dateFrom) {
            const from = new Date(dateFrom);
            filtered = filtered.filter(r => {
                const recordDate = new Date(r.fecha);
                return recordDate >= from;
            });
        }

        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59);
            filtered = filtered.filter(r => {
                const recordDate = new Date(r.fecha);
                return recordDate <= to;
            });
        }

        if (searchTerm) {
            filtered = filtered.filter(r =>
                (r.pet_name && r.pet_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (r.doctor_name && r.doctor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (r.diagnostico && r.diagnostico.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        setFilteredRecords(filtered);
    };

    const handleViewRecord = (record) => {
        setSelectedRecord(record);
        setShowModal(true);
    };

    const handleRefresh = () => {
        loadMedicalRecords();
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("es-VE");
    };

    return (
        <div className="animate__animated animate__fadeIn">
            <div className="row mb-4 g-3">
                <div className="col-md-3">
                    <label className="form-label fw-bold small text-uppercase text-muted d-block mb-2">Clínica</label>
                    <select
                        className="form-select shadow-sm border-0 bg-light"
                        value={selectedClinicId}
                        onChange={(e) => setSelectedClinicId(e.target.value)}
                    >
                        <option value="">Todas las clínicas</option>
                        {clinics.map(clinic => (
                            <option key={clinic.id} value={clinic.id}>
                                {clinic.nombre}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-md-2">
                    <label className="form-label fw-bold small text-uppercase text-muted d-block mb-2">Desde</label>
                    <input
                        type="date"
                        className="form-control shadow-sm border-0 bg-light"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                    />
                </div>
                <div className="col-md-2">
                    <label className="form-label fw-bold small text-uppercase text-muted d-block mb-2">Hasta</label>
                    <input
                        type="date"
                        className="form-control shadow-sm border-0 bg-light"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                    />
                </div>
                <div className="col-md-5">
                    <label className="form-label fw-bold small text-uppercase text-muted d-block mb-2">Buscar</label>
                    <div className="input-group shadow-sm rounded-pill overflow-hidden border">
                        <span className="input-group-text bg-white border-0"><i className="fas fa-search text-muted"></i></span>
                        <input
                            type="text"
                            className="form-control border-0"
                            placeholder="Mascota, doctor, diagnóstico..."
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4">
                <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="mb-0 fw-bold">Registros Médicos (Auditoría)</h5>
                        <small className="text-muted">Total encontrados: {filteredRecords.length}</small>
                    </div>
                    <button className="btn btn-sm btn-outline-secondary rounded-pill" onClick={handleRefresh} disabled={loading}>
                        <i className="fas fa-sync-alt"></i> {loading ? "Cargando..." : "Actualizar"}
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light text-muted small text-uppercase">
                            <tr>
                                <th className="px-4">ID</th>
                                <th>Mascota</th>
                                <th>Doctor</th>
                                <th>Fecha</th>
                                <th>Diagnóstico</th>
                                <th className="text-end px-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-4"><div className="spinner-border spinner-border-sm" role="status"><span className="visually-hidden">Cargando...</span></div></td></tr>
                            ) : filteredRecords.length > 0 ? (
                                filteredRecords.map(record => (
                                    <tr key={record.id}>
                                        <td className="px-4">
                                            <span className="badge bg-light text-dark">{record.id}</span>
                                        </td>
                                        <td>
                                            <div className="fw-bold">{record.pet_name || "N/A"}</div>
                                            <small className="text-muted">{record.pet_species || ""}</small>
                                        </td>
                                        <td>{record.doctor_name || "N/A"}</td>
                                        <td>{formatDate(record.fecha)}</td>
                                        <td>
                                            <div style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {record.diagnostico || "Sin diagnóstico"}
                                            </div>
                                        </td>
                                        <td className="text-end px-4">
                                            <button
                                                className="btn btn-sm btn-light border"
                                                onClick={() => handleViewRecord(record)}
                                                title="Ver detalles"
                                            >
                                                <i className="fas fa-eye text-primary"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="text-center py-5 text-muted">No se encontraron registros médicos con estos criterios</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ViewMedicalRecordModal
                show={showModal}
                onClose={() => setShowModal(false)}
                record={selectedRecord}
            />
        </div>
    );
};
