import React from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ScrollToTop from "../components/ScrollToTop";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

// Base component that maintains the navbar and footer throughout the page and the scroll to top functionality.
export const Layout = () => {
    return (
        <ScrollToTop>
            {/* Toaster permite que toast.success() y toast.error() se vean en pantalla */}
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
            <div style={{ minHeight: "80vh" }}> {/* Asegura que el footer no "salte" en páginas cortas */}
                <Outlet />
            </div>
            <Footer />
        </ScrollToTop>
    );
};