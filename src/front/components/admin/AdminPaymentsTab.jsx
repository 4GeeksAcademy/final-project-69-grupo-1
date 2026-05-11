import React, { useEffect, useState } from "react";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import toast from 'react-hot-toast';
import { AdminPaymentModal } from "./AdminPaymentModal";

export const AdminPaymentsTab = () => {
    const { store } = useGlobalReducer();
    const [payments, setPayments] = useState([]);
    const [filteredPayments, setFilteredPayments] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [selectedClinicId, setSelectedClinicId] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const paymentMethods = ["EFECTIVO", "PUNTO_DE_VENTA", "PAGO_MOVIL", "ZELLE"];

    useEffect(() => {
        loadClinics();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [payments, selectedClinicId, dateFrom, dateTo, paymentMethod]);

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

    const loadPayments = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedClinicId) params.append("clinic_id", selectedClinicId);
            if (dateFrom) params.append("date_from", dateFrom);
            if (dateTo) params.append("date_to", dateTo);

            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/payments?${params.toString()}`,
                {
                    headers: { "Authorization": `Bearer ${store.token}` }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setPayments(data);
            } else {
                toast.error("Error al cargar pagos");
            }
        } catch (error) {
            console.error("Error cargando pagos:", error);
            toast.error("Error al cargar pagos");
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = payments;

        if (paymentMethod) {
            filtered = filtered.filter(p => p.payment_method === paymentMethod);
        }

        setFilteredPayments(filtered);
    };

    const handleRefresh = () => {
        loadPayments();
    };

    const handlePaymentSaved = () => {
        toast.success("Pago registrado");
        setShowModal(false);
        loadPayments();
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
                <div className="col-md-3">
                    <label className="form-label fw-bold small text-uppercase text-muted d-block mb-2">Método de Pago</label>
                    <select
                        className="form-select shadow-sm border-0 bg-light"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                        <option value="">Todos los métodos</option>
                        {paymentMethods.map(method => (
                            <option key={method} value={method}>
                                {method}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-md-2 d-flex align-items-end gap-2">
                    <button
                        className="btn btn-primary rounded-pill px-3 shadow-sm flex-grow-1"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        <i className="fas fa-search"></i> Buscar
                    </button>
                    <button
                        className="btn btn-success rounded-pill px-3 shadow-sm"
                        onClick={() => setShowModal(true)}
                        title="Registrar pago manual"
                    >
                        <i className="fas fa-plus"></i>
                    </button>
                </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4">
                <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="mb-0 fw-bold">Registro de Pagos</h5>
                        <small className="text-muted">Total registrados: {filteredPayments.length}</small>
                    </div>
                    <button className="btn btn-sm btn-outline-secondary rounded-pill" onClick={handleRefresh} disabled={loading}>
                        <i className="fas fa-sync-alt"></i> {loading ? "Cargando..." : "Actualizar"}
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light text-muted small text-uppercase">
                            <tr>
                                <th className="px-4">ID Pago</th>
                                <th>Clínica</th>
                                <th>Cita ID</th>
                                <th className="text-end">Monto USD</th>
                                <th>Método</th>
                                <th>Fecha</th>
                                <th className="text-end px-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className="text-center py-4"><div className="spinner-border spinner-border-sm" role="status"><span className="visually-hidden">Cargando...</span></div></td></tr>
                            ) : filteredPayments.length > 0 ? (
                                filteredPayments.map(payment => (
                                    <tr key={payment.id}>
                                        <td className="px-4">
                                            <span className="badge bg-light text-dark">{payment.id}</span>
                                        </td>
                                        <td>{payment.clinic_name || "N/A"}</td>
                                        <td>{payment.appointment_id || "N/A"}</td>
                                        <td className="text-end fw-bold text-success">${payment.amount?.toFixed(2) || "0.00"}</td>
                                        <td>
                                            <span className="badge bg-info">{payment.payment_method || "N/A"}</span>
                                        </td>
                                        <td>{formatDate(payment.created_at)}</td>
                                        <td className="text-end px-4">
                                            <button className="btn btn-sm btn-light border" title="Ver detalles" disabled>
                                                <i className="fas fa-eye text-primary"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="7" className="text-center py-5 text-muted">No se encontraron pagos con estos filtros</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AdminPaymentModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onSave={handlePaymentSaved}
            />
        </div>
    );
};
