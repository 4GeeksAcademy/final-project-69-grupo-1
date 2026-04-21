import React from "react";

export const Footer = () => (
	<footer className="footer mt-auto bg-white">
		{/* Sección del Newsletter */}
		<div className="container-fluid py-5 border-top border-bottom bg-light">
			<div className="row justify-content-center align-items-center">
				<div className="col-md-3 text-center text-md-start mb-3 mb-md-0">
					<h4 className="fw-bold mb-0">Subscribe to<br />Newsletters</h4>
				</div>
				<div className="col-md-5">
					<div className="input-group">
						<input
							type="email"
							className="form-control border-secondary p-2"
							placeholder="Enter Your Email"
						/>
						<button className="btn btn-black bg-black text-white fw-bold px-4 text-uppercase" style={{ fontSize: "12px" }}>
							Subscribe Now
						</button>
					</div>
				</div>
			</div>
		</div>

		{/* Sección de Links y Redes Sociales */}
		<div className="container-fluid py-4 px-5">
			<div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
				<div className="d-flex gap-3 mb-3 mb-md-0">
					<a href="#" className="text-dark text-decoration-underline fw-bold small">About Us</a>
					<a href="#" className="text-dark text-decoration-underline fw-bold small">Features</a>
					<a href="#" className="text-dark text-decoration-underline fw-bold small">User Example</a>
					<a href="#" className="text-dark text-decoration-underline fw-bold small">Pricing</a>
					<a href="#" className="text-dark text-decoration-underline fw-bold small">Resources</a>
				</div>
				<div className="d-flex gap-4 fs-4">
					<a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-dark">
						<i className="fa-brands fa-facebook cursor-pointer"></i>
					</a>
					<a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-dark">
						<i className="fa-brands fa-x-twitter cursor-pointer"></i>
					</a>
					<a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-dark">
						<i className="fa-brands fa-instagram cursor-pointer"></i>
					</a>
					<a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-dark">
						<i className="fa-brands fa-youtube cursor-pointer"></i>
					</a>
				</div>
			</div>

			{/* Copyright */}
			<div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top text-muted" style={{ fontSize: "10px" }}>
				<p className="mb-0 uppercase">Copyright © 2026 Company name. All Rights Reserved</p>
				<div className="d-flex gap-3 text-uppercase">
					<a href="#" className="text-muted text-decoration-none">Terms of Use</a>
					<a href="#" className="text-muted text-decoration-none">Privacy Policy</a>
				</div>
			</div>
		</div>
	</footer>
);

