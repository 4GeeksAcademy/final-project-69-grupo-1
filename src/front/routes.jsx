import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate,
} from "react-router-dom";
import { useGlobalReducer } from "./hooks/useGlobalReducer";
import { Layout } from "./pages/public/Layout";
import { Home } from "./pages/public/Home";
import { Single } from "./pages/public/Single";
import { Demo } from "./pages/public/Demo";
import React from "react";
import { AdminClinics } from "./pages/admin/AdminClinics";
import { Invoice } from "./pages/public/Invoice";
import { Login } from "./pages/auth/Login";
import { RegistrationLanding } from "./pages/auth/RegistrationLanding";
import { ForcePasswordChange } from "./pages/auth/ForcePasswordChange";
import { SuperAdminRequests } from "./pages/admin/SuperAdminRequests";
import { MyPets } from "./pages/client/MyPets";
import { BookingView } from "./pages/client/BookingView"; // <--- AGREGADO

const PrivateGuard = ({ children, allowedRoles }) => {
  const { store } = useGlobalReducer();

  if (!store.token) return <Navigate to="/login" />;

  if (store.user?.must_change_password) {
    return <Navigate to="/change-password" />;
  }

  if (allowedRoles && !allowedRoles.includes(store.user?.role)) {
    console.warn(`Acceso denegado: Rol ${store.user?.role} no autorizado.`);
    return <Navigate to="/" />;
  }
  return children;
};

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>}>
      {/* RUTAS PÚBLICAS */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro-sede" element={<RegistrationLanding />} />
      <Route path="/invoice" element={<Invoice />} />
      {/* RUTA DE MIS MASCOTAS (PÚBLICA para desarrollo) */}
      <Route path="/mis-mascotas" element={<MyPets />} />
      {/* RUTA DE AGENDAR CITA (PÚBLICA para desarrollo) */}
      <Route path="/agendar-cita" element={<BookingView />} />{" "}
      {/* <--- AGREGADO */}
      {/* RUTA DE SEGURIDAD (Obligatoria para primer login) */}
      <Route
        path="/change-password"
        element={
          <div className="container py-5 text-center">
            <h1>Cambio de Contraseña</h1>
            <p>Por seguridad, debes actualizar tu clave temporal.</p>
            <ForcePasswordChange />
          </div>
        }
      />
      {/* RUTAS PROTEGIDAS */}
      <Route
        path="admin/clinicas"
        element={
          <PrivateGuard allowedRoles={["SUPER_ADMIN"]}>
            <AdminClinics />
          </PrivateGuard>
        }
      />
      <Route
        path="/admin/solicitudes"
        element={
          <PrivateGuard allowedRoles={["SUPER_ADMIN"]}>
            {" "}
            <SuperAdminRequests />{" "}
          </PrivateGuard>
        }
      />
      <Route
        path="/item2"
        element={
          <div className="container py-5 text-center">
            <h1>Página Item 2</h1>
            <p>En construcción...</p>
          </div>
        }
      />
      <Route
        path="/item3"
        element={
          <div className="container py-5 text-center">
            <h1>Página Item 3</h1>
            <p>En construcción...</p>
          </div>
        }
      />
      <Route
        path="/item4"
        element={
          <div className="container py-5 text-center">
            <h1>Página Item 4</h1>
            <p>En construcción...</p>
          </div>
        }
      />
      <Route path="/single/:theId" element={<Single />} />
      <Route path="/demo" element={<Demo />} />
    </Route>,
  ),
);
