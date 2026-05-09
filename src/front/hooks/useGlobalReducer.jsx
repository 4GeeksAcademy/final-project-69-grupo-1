import { useContext, useReducer, createContext } from "react";
import storeReducer, { initialStore } from "../store";

const StoreContext = createContext();

export function StoreProvider({ children }) {
    const [store, dispatch] = useReducer(storeReducer, initialStore());

    const actions = {
        // 1. Iniciar Sesión
        login: async (email, password) => {
            try {
                const resp = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });
                if (!resp.ok) {
                    const error = await resp.json();
                    return { success: false, message: error.message };
                }
                const data = await resp.json();
                dispatch({ type: "login", payload: data });
                return { success: true, user: data.user };
            } catch (error) {
                console.error("Error en login:", error);
                return { success: false, message: "Error de conexión" };
            }
        },

        // 2. Enviar solicitud (CORREGIDO PARA ARCHIVOS/FORM-DATA)
        submitClinicRegistration: async (formData) => {
            try {
                const resp = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/submit-registration", {
                    method: "POST",
                    // IMPORTANTE: No ponemos Headers de Content-Type cuando enviamos FormData con archivos
                    body: formData
                });
                return resp.ok;
            } catch (error) {
                console.error("Error enviando solicitud:", error);
                return false;
            }
        },

        // 3. Obtener solicitudes pendientes
        getPendingRequests: async () => {
            try {
                const resp = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/admin/requests", {
                    headers: { "Authorization": "Bearer " + store.token }
                });
                const data = await resp.json();
                if (resp.ok) {
                    dispatch({ type: "set_clinic_requests", payload: data });
                }
            } catch (error) {
                console.error("Error obteniendo solicitudes:", error);
            }
        },

        // 4. Aprobar una solicitud
        approveClinicRequest: async (requestId) => {
            try {
                const resp = await fetch(import.meta.env.VITE_BACKEND_URL + `/api/admin/approve-request/${requestId}`, {
                    method: "POST",
                    headers: { "Authorization": "Bearer " + store.token }
                });
                const data = await resp.json();
                if (resp.ok) {
                    dispatch({ type: "remove_clinic_request", payload: requestId });
                    return data.temp_password;
                }
            } catch (error) {
                console.error("Error en aprobación:", error);
            }
            return null;
        },

        rejectClinicRequest: async (requestId, observaciones) => {
            try {
                const resp = await fetch(import.meta.env.VITE_BACKEND_URL + `/api/admin/reject-request/${requestId}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + (store.token || localStorage.getItem("token"))
                    },
                    body: JSON.stringify({ observaciones: observaciones })
                });

                if (resp.ok) {
                    // Eliminamos la solicitud de la lista visual
                    dispatch({ type: "remove_clinic_request", payload: requestId });
                    return true;
                }
            } catch (error) {
                console.error("Error al rechazar solicitud:", error);
            }
            return false;
        },

        // 5. Cambio de contraseña
        updatePassword: async (newPassword) => {
            try {
                const resp = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/update-password", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + store.token
                    },
                    body: JSON.stringify({ new_password: newPassword })
                });
                if (resp.ok) {
                    dispatch({ type: "update_user_locally", payload: { must_change_password: false } });
                    return true;
                }
            } catch (error) {
                console.error("Error actualizando contraseña:", error);
            }
            return false;
        },

        getStaff: async (clinicId) => {
            try {
                const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clinics/${clinicId}/staff`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + store.token
                    }
                });
                if (resp.ok) {
                    const data = await resp.json();
                    dispatch({ type: "set_staff", payload: data });
                    return true;
                }
            } catch (error) {
                console.error("Error al obtener personal:", error);
            }
            return false;
        },

        updateStaffStatus: async (userId, isActive) => {
            try {
                const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}/status`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + store.token
                    },
                    body: JSON.stringify({ is_active: isActive })
                });
                if (resp.ok) {
                    dispatch({ type: "update_staff_member_locally", payload: { id: userId, is_active: isActive } });
                    return true;
                }
            } catch (error) {
                console.error("Error al cambiar estado del usuario:", error);
            }
            return false;
        },

        uploadStaffCSV: async (formData) => {
            try {
                const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clinics/bulk-staff-upload`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${store.token}` },
                    body: formData
                });
                if (resp.ok) {
                    const data = await resp.json();
                    return { success: true, created: data.created };
                }
            } catch (error) {
                console.error("Error en carga masiva:", error);
            }
            return { success: false };
        },

        registerStaffWithCode: async (userData) => {
            try {
                // Asegúrate de que la URL coincida exactamente con tu @api.route del backend
                const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/register-with-code`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: userData.email,
                        password: userData.password,
                        first_name: userData.first_name,
                        last_name: userData.last_name,
                        role: userData.role,        // "VET" o "RECEPTIONIST"
                        staff_code: userData.staff_code
                    })
                });

                const data = await resp.json();

                if (resp.ok) {
                    // El backend devuelve 201 y un mensaje de éxito
                    return { success: true, message: data.message };
                } else {
                    // El backend devuelve 400 o 404 con un mensaje de error explicativo
                    return { success: false, message: data.message || "Error al procesar el registro" };
                }

            } catch (error) {
                console.error("Error crítico en la conexión de registro:", error);
                return { success: false, message: "No se pudo conectar con el servidor. Inténtalo más tarde." };
            }
        },

        loadReceptionAppointments: async () => {
            try {
                const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reception/appointments`, {
                    headers: { "Authorization": "Bearer " + store.token }
                });
                const data = await resp.json();
                if (resp.ok) {
                    dispatch({ type: "set_appointments", payload: data });
                }
            } catch (error) {
                console.error("Error cargando citas:", error);
            }
        },

        registerPayment: async (paymentData) => {
            try {
                const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payments`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + store.token
                    },
                    body: JSON.stringify(paymentData)
                });

                const data = await resp.json();
                if (resp.ok) {
                    dispatch({ type: "add_payment", payload: data.payment });
                    dispatch({
                        type: "update_appointment_status",
                        payload: { id: paymentData.appointment_id, status: "Completed" }
                    });
                    return { success: true };
                }
                return { success: false, message: data.message };
            } catch (error) {
                return { success: false, message: "Error de conexión" };
            }
        },

        registerClient: async (clientData) => {
            try {
                const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/register-client`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        full_name: clientData.full_name,
                        email: clientData.email,
                        password: clientData.password,
                        clinic_id: clientData.clinic_id // Este es el campo clave
                    })
                });

                if (resp.ok) {
                    return true;
                } else {
                    const data = await resp.json();
                    console.error("Error de registro:", data.message);
                    return false;
                }
            } catch (error) {
                console.error("Error en la conexión:", error);
                return false;
            }
        },

        addPet: async (petData) => {
            try {
                const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/pets`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify(petData)
                });

                if (resp.ok) {

                    return true;
                }
                return false;
            } catch (error) {
                console.error("Error al registrar mascota:", error);
                return false;
            }
        },

        getUserPets: async () => {
            // Usamos el token directamente del localStorage para asegurar que esté presente
            const token = store.token || localStorage.getItem("token");

            try {
                const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/pets`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (resp.ok) {
                    const data = await resp.json();
                    console.log("Mascotas recibidas del backend:", data); // <--- AGREGA ESTE LOG
                    dispatch({ type: "set_user_pets", payload: data });
                } else {
                    console.error("Error en la respuesta del backend:", resp.status);
                }
            } catch (error) {
                console.error("Error cargando mascotas:", error);
            }
        },

        getUserAppointments: async () => {
            try {
                const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/appointments/me`, {
                    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
                });
                if (resp.ok) {
                    const data = await resp.json();
                    dispatch({ type: "set_user_appointments", payload: data });
                }
            } catch (error) { console.error("Error cargando citas:", error); }
        },

        logout: () => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            dispatch({ type: "logout" });
        },

        // --- ACCIONES DEL DOCTOR ---

        // Para la Historia 37
        getDoctorAppointments: async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/doctor/appointments`, {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    // Esto es lo que llena el calendario:
                    dispatch({ type: "set_appointments", payload: data });
                }
            } catch (error) {
                console.error("Error en getDoctorAppointments:", error);
            }
        },

        // Para la Historia 38
        markAppointmentAsInAttention: async (appointmentId) => {
            try {
                const resp = await fetch(import.meta.env.VITE_BACKEND_URL + `/api/doctor/appointments/${appointmentId}/status`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + store.token
                    },
                    body: JSON.stringify({ status: "EN_ATENCION" }) // Usamos el valor exacto del Enum
                });
                if (resp.ok) {
                    // Actualizamos el store localmente
                    dispatch({ type: "update_appointment_status", payload: { id: appointmentId, status: "EN_ATENCION" } });
                    return true;
                }
            } catch (error) {
                console.error("Error actualizando cita:", error);
            }
            return false;
        },

        // Para la Historia 36
        submitMedicalRecord: async (appointmentId, recordData) => {
            try {
                const resp = await fetch(import.meta.env.VITE_BACKEND_URL + `/api/doctor/appointments/${appointmentId}/medical-record`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + store.token
                    },
                    body: JSON.stringify(recordData) // { diagnostico: "...", tratamiento: "..." }
                });
                if (resp.ok) {
                    // Actualizamos el estado de la cita a COMPLETADA en el store visual
                    dispatch({ type: "update_appointment_status", payload: { id: appointmentId, status: "COMPLETADA" } });
                    return true;
                }
            } catch (error) {
                console.error("Error guardando historia médica:", error);
            }
            return false;
        },
        getPetMedicalHistory: async (petId) => {
            try {
                const resp = await fetch(import.meta.env.VITE_BACKEND_URL + `/api/pets/${petId}/medical-records`, {
                    headers: { "Authorization": "Bearer " + store.token }
                });
                if (resp.ok) {
                    return await resp.json(); // Devuelve el array de historiales
                } else {
                    return null;
                }
            } catch (error) {
                console.error("Error buscando historia:", error);
                return null;
            }
        },

        searchClients: async (query) => {
            const token = store.token || localStorage.getItem("token"); // <-- Seguro de vida
            try {
                const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/doctor/search-clients?q=${query}`, {
                    headers: { "Authorization": "Bearer " + token }
                });
                if (resp.ok) {
                    const data = await resp.json();
                    console.log("Clientes encontrados:", data); // <-- Para ver si llegan
                    return data;
                } else {
                    console.error("Error del backend:", await resp.text());
                    return [];
                }
            } catch (error) {
                console.error("Error buscando clientes:", error);
                return [];
            }
        },

        scheduleAppointment: async (appointmentData) => {
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/appointments`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify(appointmentData)
                });

                const data = await response.json();

                if (response.ok) {
                    return { success: true, message: data.message };
                } else {
                    return { success: false, message: data.message || "Error al programar la cita" };
                }
            } catch (error) {
                console.error("Error en scheduleAppointment:", error);
                return { success: false, message: "Error de conexión con el servidor" };
            }
        },

    };

    return (
        <StoreContext.Provider value={{ store, dispatch, actions }}>
            {children}
        </StoreContext.Provider>
    );
}

export const useGlobalReducer = () => {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error("useGlobalReducer debe usarse dentro de un StoreProvider");
    }
    return context;
};

export default useGlobalReducer;