import React from "react";

// Creamos el contexto para que todos los componentes lo encuentren
export const Context = React.createContext(null);

export const initialStore = () => {
  return {
    token: localStorage.getItem("token") || null,
    user: JSON.parse(localStorage.getItem("user")) || null,
    clinics: [],
    clinicRequests: [],
    staff: [],
    clinicServices: [],
    payments: [],
    userPets: [],
    userAppointments: [],
    appointments: [],
    exchangeRates: 0,
    users: [],
    services: [],
    medicalRecords: [],
  };
};

export default function storeReducer(store, action) {
  switch (action.type) {
    // Acción para iniciar sesión y persistir el token JWT
    case "login":
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      return {
        ...store,
        token: action.payload.token,
        user: action.payload.user,
      };

    // Acción para cerrar sesión y limpiar el almacenamiento
    case "logout":
      return {
        ...store,
        token: null,
        user: null,
      };

    case "set_staff":
      return {
        ...store,
        staff: action.payload,
      };

    case "set_clinic_services":
      return {
        ...store,
        clinicServices: action.payload,
      };

    case "add_clinic_service":
      return {
        ...store,
        clinicServices: [...store.clinicServices, action.payload],
      };

    case "update_clinic_service":
      return {
        ...store,
        clinicServices: store.clinicServices.map((service) =>
          service.id === action.payload.id ? action.payload : service,
        ),
      };

    case "remove_clinic_service":
      return {
        ...store,
        clinicServices: store.clinicServices.filter(
          (service) => service.id !== action.payload,
        ),
      };

    case "update_staff_member_locally":
      const updatedStaff = store.staff.map((member) =>
        member.id === action.payload.id
          ? { ...member, is_active: action.payload.is_active }
          : member,
      );
      return {
        ...store,
        staff: updatedStaff,
      };

    case "set_clinics":
      return {
        ...store,
        clinics: action.payload,
      };

    case "update_clinic":
      return {
        ...store,
        clinics: store.clinics.map((clinic) =>
          clinic.id === action.payload.id ? action.payload : clinic,
        ),
      };

    case "set_clinic_requests":
      return { ...store, clinicRequests: action.payload };

    case "remove_clinic_request":
      return {
        ...store,
        clinicRequests: store.clinicRequests.filter(
          (req) => req.id !== action.payload,
        ),
      };

    case "update_user_locally":
      const updatedUser = { ...store.user, ...action.payload };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return { ...store, user: updatedUser };

    case "add_payment":
      return { ...store, payments: [...store.payments, action.payload] };

    case "update_appointment_status":
      return {
        ...store,
        appointments: store.appointments.map((app) =>
          app.id === action.payload.id
            ? { ...app, status: action.payload.status }
            : app,
        ),
      };
    case "set_appointments":
      return {
        ...store,
        appointments: action.payload,
      };

    case "set_user_pets":
      return {
        ...store,
        userPets: action.payload,
      };
    case "set_user_appointments":
      return {
        ...store,
        userAppointments: action.payload,
      };

    case "set_exchange_rate":
      return {
        ...store,
        exchangeRate: action.payload,
      };

    case "set_users":
      return {
        ...store,
        users: action.payload,
      };

    case "set_services":
      return {
        ...store,
        services: action.payload,
      };

    case "set_medical_records":
      return {
        ...store,
        medicalRecords: action.payload,
      };

    default:
      return store;
  }
}
