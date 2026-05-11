import React from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ScrollToTop from "../../components/layout/ScrollToTop";
import { Navbar } from "../../components/layout/Navbar";
import { Footer } from "../../components/layout/Footer";

// Base component que mantiene el navbar y footer en todas las páginas.
export const Layout = () => {
    return (
        <ScrollToTop>
            {/* Toaster permite ver las notificaciones de éxito/error que instalamos antes */}
            <Toaster 
                position="top-center"
                reverseOrder={false}
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                    },
                }}
            />
            <Navbar />
            <div style={{ minHeight: "80vh" }}> 
                {/* Outlet renderiza la página que corresponda según la URL */}
                <Outlet />
            </div>
            <Footer />
        </ScrollToTop>
    );
};
