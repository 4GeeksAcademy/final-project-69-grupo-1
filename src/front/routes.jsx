import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate
} from "react-router-dom";
import { useGlobalReducer } from "./hooks/useGlobalReducer";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Single } from "./pages/Single";
import { Demo } from "./pages/Demo";
import React from "react";
import { AdminClinics } from "./pages/AdminClinics";
import { Invoice } from "./pages/Invoice";
import { Login } from "./pages/Login";
import { RegistrationLanding } from "./pages/RegistrationLanding";
import { ForcePasswordChange } from "./pages/ForcePasswordChange";
import { SuperAdminRequests } from "./pages/SuperAdminRequests";
import { MyPets } from "./pages/MyPets";
import { BookingView } from "./pages/BookingView"; // <--- AGREGADO
import { ClinicDashboard } from "./pages/ClinicDashboard";
import { RegisterStaff } from "./pages/RegisterStaffNewEmployee";
import { RegisterWithCode } from "./pages/RegisterWithCode";

const PrivateGuard = ({ children, allowedRoles }) => {
  const { store } = useGlobalReducer();

  // Si no hay token, al login
  if (!store.token) return <Navigate to="/login" />;

  // Si el usuario aún no carga en el store, mostramos un cargando para evitar rebotes falsos
  if (!store.user) return <div className="text-center mt-5">Cargando perfil...</div>;

  // MURO DE SEGURIDAD: Si debe cambiar clave, no lo dejes pasar a ninguna ruta privada
  if (store.user.must_change_password) {
    console.log("Guard detectó cambio de clave obligatorio");
    return <Navigate to="/change-password" />;
  }

  // VALIDACIÓN DE ROL:
  if (allowedRoles && !allowedRoles.includes(store.user.role)) {
    console.warn(`Acceso denegado: Rol ${store.user.role} no está en ${allowedRoles}`);
    return <Navigate to="/" />;
  }

  return children;
};

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>} >

      {/* RUTAS PÚBLICAS */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro-sede" element={<RegistrationLanding />} />
      <Route path="/registro-empleado" element={<RegisterStaff />} />
      <Route path="register-staff" element={<RegisterWithCode />} />
      <Route path="/invoice" element={<Invoice />} />

      {/* RUTA DE MIS MASCOTAS (PÚBLICA para desarrollo) */}
      <Route path="/mis-mascotas" element={<MyPets />} />

      {/* RUTA DE AGENDAR CITA (PÚBLICA para desarrollo) */}
      <Route path="/agendar-cita" element={<BookingView />} /> {/* <--- AGREGADO */}

      {/* RUTA DE SEGURIDAD (Obligatoria para primer login) */}
      <Route path="/change-password" element={
        <div className="container py-5 text-center">
          <h1>Cambio de Contraseña</h1>
          <p>Por seguridad, debes actualizar tu clave temporal.</p>
          <ForcePasswordChange />
        </div>
      } />

      {/* RUTAS PROTEGIDAS */}
      <Route path="admin/clinicas" element={<PrivateGuard allowedRoles={["SUPER_ADMIN"]}><AdminClinics /></PrivateGuard>} />
      <Route path="/admin/solicitudes" element={<PrivateGuard allowedRoles={["SUPER_ADMIN"]}> <SuperAdminRequests /> </PrivateGuard>} />
      <Route path="/clinic/admin" element={<PrivateGuard allowedRoles={["CLINIC_ADMIN","INDEPENDENT_VET"]}><ClinicDashboard /></PrivateGuard>} />

      <Route path="/item2" element={<div className="container py-5 text-center"><h1>Página Item 2</h1><p>En construcción...</p></div>} />
      <Route path="/item3" element={<div className="container py-5 text-center"><h1>Página Item 3</h1><p>En construcción...</p></div>} />
      <Route path="/item4" element={<div className="container py-5 text-center"><h1>Página Item 4</h1><p>En construcción...</p></div>} />

      <Route path="/single/:theId" element={<Single />} />
      <Route path="/demo" element={<Demo />} />

    </Route>
  )
);