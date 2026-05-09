import React from "react";
import { Link } from "react-router-dom";

export const Footer = () => (
	<footer className="bg-white border-top pt-5 pb-3">
		<div className="container">
			<div className="row mb-4">
				{/* Branding y Descripción */}
				<div className="col-lg-4 mb-4 mb-lg-0">
					<div className="d-flex align-items-center gap-2 mb-3">
						<i className="fa-solid fa-paw text-primary fs-3"></i>
						<span className="fw-bolder text-dark fs-4">Nex<span className="text-primary">Petly</span> </span>
					</div>
					<p className="text-muted small pe-lg-5">
						Simplificando la gestión veterinaria y acercando a los dueños de mascotas a la mejor atención médica posible.
					</p>
					<div className="d-flex gap-3">
						<a href="#" className="btn btn-light rounded-circle text-primary shadow-sm"><i className="fa-brands fa-instagram"></i></a>
						<a href="#" className="btn btn-light rounded-circle text-primary shadow-sm"><i className="fa-brands fa-facebook-f"></i></a>
						<a href="#" className="btn btn-light rounded-circle text-primary shadow-sm"><i className="fa-brands fa-x-twitter"></i></a>
					</div>
				</div>

				{/* Enlaces Rápidos */}
				<div className="col-lg-2 col-md-6 mb-4 mb-lg-0">
					<h6 className="fw-bold text-dark mb-3">Plataforma</h6>
					<ul className="list-unstyled mb-0 d-flex flex-column gap-2 small">
						<li><Link to="/login" className="text-muted text-decoration-none hover-primary">Iniciar Sesión</Link></li>
						<li><Link to="/agendar-cita" className="text-muted text-decoration-none hover-primary">Agendar Cita</Link></li>
						<li><Link to="/registro-sede" className="text-muted text-decoration-none hover-primary">Soy Veterinaria</Link></li>
					</ul>
				</div>

				<div className="col-lg-2 col-md-6 mb-4 mb-lg-0">
					<h6 className="fw-bold text-dark mb-3">Legal</h6>
					<ul className="list-unstyled mb-0 d-flex flex-column gap-2 small">
						<li><a href="#" className="text-muted text-decoration-none hover-primary">Términos de Uso</a></li>
						<li><a href="#" className="text-muted text-decoration-none hover-primary">Privacidad</a></li>
						<li><a href="#" className="text-muted text-decoration-none hover-primary">Soporte</a></li>
					</ul>
				</div>
			</div>

			<hr className="text-muted opacity-25" />

			{/* Copyright */}
			<div className="text-center mt-4">
				<p className="text-muted small mb-0">
					© 2026 PetHealth & Spa. Todos los derechos reservados. <br />
					Desarrollado con ❤️ para los mejores amigos del hombre.
				</p>
			</div>
		</div>
	</footer>
);