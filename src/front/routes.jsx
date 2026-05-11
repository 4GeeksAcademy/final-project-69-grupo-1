import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate
} from "react-router-dom";
import { useGlobalReducer } from "./hooks/useGlobalReducer";
import { Layout } from "./pages/layout/Layout";
import { Home } from "./pages/layout/Home";
import { Single } from "./pages/legacy/Single";
import { Demo } from "./pages/legacy/Demo";
import React from "react";
import { AdminClinics } from "./pages/admin/AdminClinics";
import { Invoice } from "./pages/client/Invoice";
import { Login } from "./pages/auth/Login";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { RegistrationLanding } from "./pages/auth/RegistrationLanding";
import { ForcePasswordChange } from "./pages/auth/ForcePasswordChange";
import { SuperAdminRequests } from "./pages/admin/SuperAdminRequests";
import { MyPets } from "./pages/client/MyPets";
import { BookingView } from "./pages/client/BookingView"; // <--- AGREGADO
import { ClinicDashboard } from "./pages/clinic/ClinicDashboard";
import { RegisterStaff } from "./pages/auth/RegisterStaffNewEmployee";
import { RegisterWithCode } from "./pages/auth/RegisterWithCode";
import { ReceptionistDashboard } from "./pages/reception/ReceptionistDashboard";
import { ClinicLanding } from "./pages/auth/ClinicLanding";
import { RegisterClient } from "./pages/auth/RegisterClient";
import { ClientDashboard } from "./pages/client/ClientDashboard";
import { DoctorDashboard } from "./pages/medical/DoctorDashboard";
import { SuperAdminDashboard } from "./pages/admin/SuperAdminDashboard";

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

      {/* RUTAS ESTRICTAMENTE PÚBLICAS */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/clinic/:clinic_id" element={<ClinicLanding />} />
      <Route path="/registro-cliente" element={<RegisterClient />} />
      <Route path="/registro-sede" element={<RegistrationLanding />} />
      <Route path="/registro-empleado" element={<RegisterStaff />} />
      <Route path="/register-staff" element={<RegisterWithCode />} />
      <Route path="/reception/dashboard" element={<ReceptionistDashboard />} />

      {/* RUTA DE SEGURIDAD (Solo debe ser accedida si hay un proceso de cambio pendiente) */}
      <Route path="/change-password" element={
        <div className="container py-5 text-center">
          <h1>Cambio de Contraseña</h1>
          <p>Por seguridad, debes actualizar tu clave temporal.</p>
          <ForcePasswordChange />
        </div>
      } />

      {/* ================= RUTAS PROTEGIDAS ================= */}

      {/* Módulo de Clientes */}
      <Route path="/client/dashboard" element={<PrivateGuard allowedRoles={["CLIENTE"]}><ClientDashboard /></PrivateGuard>} />
      <Route path="/mis-mascotas" element={<PrivateGuard allowedRoles={["CLIENTE"]}><MyPets /></PrivateGuard>} />
      <Route path="/agendar-cita" element={<PrivateGuard allowedRoles={["CLIENTE"]}><BookingView /></PrivateGuard>} />
      <Route path="/invoice" element={<PrivateGuard allowedRoles={["CLIENTE"]}><Invoice /></PrivateGuard>} />

      {/* Módulo Médico y Administrativo */}
      <Route path="/mi-clinica" element={<PrivateGuard allowedRoles={["CLINIC_ADMIN", "INDEPENDENT_VET"]}><ClinicDashboard /></PrivateGuard>} />
      <Route path="/doctor/dashboard" element={<PrivateGuard allowedRoles={["DOCTOR", "INDEPENDENT_VET"]}> <DoctorDashboard /></PrivateGuard>} />

      {/* Módulo Super Admin */}
      {/*<Route path="/admin/clinicas" element={<PrivateGuard allowedRoles={["SUPER_ADMIN"]}><AdminClinics /></PrivateGuard>} />
      <Route path="/admin/solicitudes" element={<PrivateGuard allowedRoles={["SUPER_ADMIN"]}> <SuperAdminRequests /> </PrivateGuard>} />*/}
      <Route path="/admin/dashboard" element={<PrivateGuard allowedRoles={["SUPER_ADMIN"]}><SuperAdminDashboard /></PrivateGuard>} />

      {/* Vistas residuales (Recomiendo borrarlas si ya no se usan) */}
      <Route path="/single/:theId" element={<Single />} />
      <Route path="/demo" element={<Demo />} />

    </Route>
  )
);