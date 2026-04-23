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
import { AdminClinics } from "./pages/AdminClinics";

export const router = createBrowserRouter(
  createRoutesFromElements(
    // CreateRoutesFromElements function allows you to build route elements declaratively.
    // Create your routes here, if you want to keep the Navbar and Footer in all views, add your new routes inside the containing Route.
    // Root, on the contrary, create a sister Route, if you have doubts, try it!
    // Note: keep in mind that errorElement will be the default page when you don't get a route, customize that page to make your project more attractive.
    // Note: The child paths of the Layout element replace the Outlet component with the elements contained in the "element" attribute of these child paths.

    // Root Route: All navigation will start from here.
    <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>} >

      {/* Esta es tu página principal con el carrusel */}
      <Route path="/" element={<Home />} />

      {/* Nested Routes: Defines sub-routes within the BaseHome component. */}
      <Route path="admin/clinicas" element={<AdminClinics />} />

      {/* Estas son las nuevas páginas para tus botones del Navbar */}
      <Route path="/item2" element={<div className="container py-5 text-center"><h1>Página Item 2</h1><p>En construcción...</p></div>} />
      <Route path="/item3" element={<div className="container py-5 text-center"><h1>Página Item 3</h1><p>En construcción...</p></div>} />
      <Route path="/item4" element={<div className="container py-5 text-center"><h1>Página Item 4</h1><p>En construcción...</p></div>} />

      {/* Rutas que ya venian por defecto */}
      <Route path="/single/:theId" element={<Single />} /> {/* Dynamic route for single items */}
      <Route path="/demo" element={<Demo />} />
    </Route>
  )
);