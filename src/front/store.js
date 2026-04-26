import React from "react";

// Creamos el contexto para que todos los componentes lo encuentren
export const Context = React.createContext(null);

export const initialStore = () => {
  return {
    token: localStorage.getItem("token") || null,
    user: JSON.parse(localStorage.getItem("user")) || null,
    clinics: [],
    clinicRequests: [],
  };
};

export default function storeReducer(store, action) {
  switch (action.type) {
    // Acción para iniciar sesión y persistir el token JWT 
    case 'login':
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      return { 
        ...store, 
        token: action.payload.token, 
        user: action.payload.user 
      };

    // Acción para cerrar sesión y limpiar el almacenamiento 
    case 'logout':
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return { 
        ...store, 
        token: null, 
        user: null 
      };

    case 'set_clinics':
      return { 
        ...store, 
        clinics: action.payload 
      };

    case 'update_clinic':
      return {
        ...store,
        clinics: store.clinics.map(clinic => 
          clinic.id === action.payload.id ? action.payload : clinic)
      };
      
    case 'set_clinic_requests':
      return { ...store, clinicRequests: action.payload
      };

    case 'remove_clinic_request':
      return {
        ...store,
        clinicRequests: store.clinicRequests.filter(req => req.id !== action.payload)
      };

    case 'update_user_locally':
      const updatedUser = { ...store.user, ...action.payload };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return { ...store, user: updatedUser 
      };

    default:
      return store;
  }
}