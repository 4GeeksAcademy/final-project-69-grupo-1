import React from "react";
import { Link } from "react-router-dom";

export const Navbar = () => {
	return (
		<nav className="navbar navbar-light bg-white border-bottom px-4">
			<div className="container-fluid flex-nowrap">
				<div className="d-flex align-items-center gap-4">
					<Link to="/" className="navbar-brand mb-0 h1 text-dark fw-bold">Company Logo</Link>
					<div className="d-none d-md-flex gap-3 text-secondary" style={{ fontSize: "14px" }}>
						
						<Link to="/" className="text-secondary text-decoration-none cursor-pointer">Home</Link>
						<span className="text-muted">|</span>
						<Link to="/item2" className="text-primary text-decoration-underline cursor-pointer">Nav Item 2</Link>
						<span className="text-muted">|</span>
						<Link to="/item3" className="text-primary text-decoration-underline cursor-pointer">Nav Item 3</Link>
						<span className="text-muted">|</span>
						<Link to="/item4" className="text-primary text-decoration-underline cursor-pointer">Nav Item 4</Link>
					</div>
				</div>
				<div className="d-flex align-items-center gap-3">
					<button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2">
						<i className="fa-solid fa-upload"></i> Share
					</button>
					<i className="fa-regular fa-bell fs-5 text-secondary cursor-pointer"></i>
					<div className="bg-light rounded-full d-flex align-items-center justify-content-center" style={{ width: "35px", height: "35px", borderRadius: "50%" }}>
						<i className="fa-solid fa-user text-secondary"></i>
					</div>
				</div>
			</div>
		</nav>
	);
};

