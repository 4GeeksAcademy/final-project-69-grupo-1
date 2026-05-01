"""Rutas del backend organizadas por módulos."""

from .base import api
from . import auth_routes, admin_routes, client_routes, doctor_routes

__all__ = ['api']
