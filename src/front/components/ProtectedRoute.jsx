import React from "react";
import { Navigate } from "react-router-dom";
import { useGlobalReducer } from "../hooks/useGlobalReducer";

export const ProtectedRoute = ({ children, roleRequired }) => {
    const { store } = useGlobalReducer();

    if (!store.token) {
        return <Navigate to="/login" />;
    }

    if (roleRequired && store.user?.role !== roleRequired) {
        console.warn(`Acceso denegado: Se requiere rol ${roleRequired}`);
        return <Navigate to="/" />;
    }

    return children;
};