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

        logout: () => {
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