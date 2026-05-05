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


 
        getDoctorAppointments: async () => {
            try {
                const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/doctor/appointments`, {
                    headers: { "Authorization": "Bearer " + store.token }
                });
                const data = await resp.json();
                if (resp.ok) {
                    dispatch({ type: "set_doctor_appointments", payload: data });
                    return { success: true, data };
                }
                return { success: false, message: data.message || "No se pudieron cargar las citas" };
            } catch (error) {
                console.error("Error cargando citas del doctor:", error);
                return { success: false, message: "Error de conexión" };
            }
        },

        getDoctorPatients: async () => {
            try {
                const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/doctor/patients`, {
                    headers: { "Authorization": "Bearer " + store.token }
                });
                const data = await resp.json();
                if (resp.ok) {
                    dispatch({ type: "set_doctor_patients", payload: data });
                    return { success: true, data };
                }
                return { success: false, message: data.message || "No se pudieron cargar los pacientes" };
            } catch (error) {
                console.error("Error cargando pacientes del doctor:", error);
                return { success: false, message: "Error de conexión" };
            }
        },

        updateDoctorAppointmentStatus: async (appointmentId, status) => {
            try {
                const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/doctor/appointments/${appointmentId}/status`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + store.token
                    },
                    body: JSON.stringify({ status })
                });
                return resp.ok;
            } catch (error) {
                console.error("Error actualizando estado de cita:", error);
                return false;
            }
        },

        saveDoctorConsultation: async (appointmentId, consultation) => {
            try {
                const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/doctor/appointments/${appointmentId}/consultation`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + store.token
                    },
                    body: JSON.stringify(consultation)
                });
                return resp.ok;
            } catch (error) {
                console.error("Error guardando consulta:", error);
                return false;
            }
        },


        createDoctorPatient: async (payload) => {
            try {
                const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/doctor/patients`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + store.token
                    },
                    body: JSON.stringify(payload)
                });
                if (!resp.ok) return { success: false };
                const data = await resp.json();
                await actions.getDoctorPatients();
                return { success: true, data };
            } catch (error) {
                console.error("Error creando paciente:", error);
                return { success: false };
            }
        },

        createDoctorAppointment: async (payload) => {
            try {
                const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/doctor/appointments`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + store.token
                    },
                    body: JSON.stringify(payload)
                });
                if (!resp.ok) return false;
                await actions.getDoctorAppointments();
                return true;
            } catch (error) {
                console.error("Error creando cita:", error);
                return false;
            }
        },
        
        logout: () => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            dispatch({ type: "logout" });
        }


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