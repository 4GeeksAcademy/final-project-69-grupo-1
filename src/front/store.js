import React from "react";

// 1. Creamos el contexto aquí para que todos lo encuentren
export const Context = React.createContext(null);

export const initialStore = () => {
  return {
    message: null,

    // --- USUARIO CABLEADO (Lo que pidió el profe) ---
    user: {
      email: "Mauriciocaldera10@gmail.com",
      rol: "Admin",
    },
    token: "token-falso-de-prueba-123",

    clinics: [], // Aquí aterrizarán los datos del fetch

    todos: [
      { id: 1, title: "Make the bed", background: null },
      { id: 2, title: "Do my homework", background: null },
    ],
  };
};

export default function storeReducer(store, action = {}) {
  switch (action.type) {
    case "set_hello":
      return { ...store, message: action.payload };

    case "set_clinics":
      return { ...store, clinics: action.payload };

    default:
      return store;
  }
}
