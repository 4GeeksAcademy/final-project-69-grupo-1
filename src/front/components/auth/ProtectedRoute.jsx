import React from "react";
import { Navigate } from "react-router-dom";
import { useGlobalReducer } from "../../hooks/useGlobalReducer";

export const ProtectedRoute = ({ children, allowedRoles }) => {
    const { store } = useGlobalReducer();

    if (!store.token) {
        return <Navigate to="/login" />;
    }


    if (allowedRoles && !allowedRoles.includes(store.user?.role)) {
        console.warn(`Acceso denegado: Tu rol ${store.user?.role} no está en la lista permitida:`, allowedRoles);
        return <Navigate to="/" />; 
    }

    if (store.user?.is_active === false) {
        return <Navigate to="/login" />; 
    }

    return children;
};