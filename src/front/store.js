import React from "react";

// Creamos el contexto para que todos los componentes lo encuentren
export const Context = React.createContext(null);

export const initialStore = () => {
  return {
    message: null,

    // --- USUARIO CABLEADO (Simulando la respuesta del backend)
    user: {
      id: 1,
      email: "Mauriciocaldera10@gmail.com",
      full_name: "Mauricio Javier Caldera Morales",
      role: "SUPER_ADMIN", // Usamos el rol exacto del RoleEnum de SQLAlchemy
      clinic_id: null, // Null porque el Super Admin no pertenece a una sola clínica
    },

    token: "token-falso-de-prueba-123",

    // --- ESTADOS DE LA APLICACIÓN
    clinics: [], // Aquí aterrizarán los datos del fetch de clínicas
  };
};

export default function storeReducer(store, action = {}) {
  switch (action.type) {
    case "set_hello":
      return { ...store, message: action.payload };

    case "set_clinics":
      // Actualiza la lista global de clínicas
      return { ...store, clinics: action.payload };

    default:
      return store;
  }
}
