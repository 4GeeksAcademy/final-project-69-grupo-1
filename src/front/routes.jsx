import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Single } from "./pages/Single";
import { Demo } from "./pages/Demo";
import React from "react";

export const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>} >

        {/* Esta es tu página principal con el carrusel */}
        <Route path="/" element={<Home />} />

        {/* Estas son las nuevas páginas para tus botones del Navbar */}
        <Route path="/item2" element={<div className="container py-5 text-center"><h1>Página Item 2</h1><p>En construcción...</p></div>} />
        <Route path="/item3" element={<div className="container py-5 text-center"><h1>Página Item 3</h1><p>En construcción...</p></div>} />
        <Route path="/item4" element={<div className="container py-5 text-center"><h1>Página Item 4</h1><p>En construcción...</p></div>} />

        {/* Rutas que ya venían por defecto */}
        <Route path="/single/:theId" element={<Single />} />
        <Route path="/demo" element={<Demo />} />
        
      </Route>
    )
);