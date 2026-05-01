# Documentación breve: Reestructuración `src` (API + Front)

Este documento resume los cambios aplicados durante la reestructuración del proyecto para organizar mejor backend y frontend por módulos.

## 1) Cambios en Backend (`src/api`)

### Antes

- Existía un archivo monolítico `src/api/routes.py` con gran parte de la lógica de endpoints.

### Ahora

- Se reemplazó por un paquete modular en `src/api/routes/`:
  - `base.py`: configuración compartida (`Blueprint`, CORS, Cloudinary).
  - `auth_routes.py`: login, perfil, cambio de contraseña, master setup.
  - `admin_routes.py`: solicitudes admin, CRUD de clínicas, cambio de estado de clínicas y estado de usuarios.
  - `client_routes.py`: envío de registro y operaciones de mascotas.
  - `doctor_routes.py`: creación de citas.
  - `__init__.py`: registro/importación de módulos de rutas.

### Endpoints de administración restaurados para CRUD de clínicas

- `GET /api/clinics`
- `POST /api/clinics`
- `PUT /api/clinics/<clinic_id>`
- `DELETE /api/clinics/<clinic_id>`
- `PATCH /api/clinics/<clinic_id>/status`
- `GET /api/clinics/<clinic_id>/staff`
- `PATCH /api/users/<user_id>/status`
- `PUT /api/users/<user_id>/ban`

---

## 2) Cambios en Frontend (`src/front`)

### Antes

- La carpeta `src/front/pages/` tenía páginas en un solo nivel.

### Ahora

- Se organizaron por dominio/feature:
  - `src/front/pages/admin/`
  - `src/front/pages/auth/`
  - `src/front/pages/client/`
  - `src/front/pages/public/`
- `src/front/routes.jsx` se actualizó para importar desde las nuevas ubicaciones.
- Se corrigieron imports relativos en páginas movidas (`../../hooks`, `../../components`, `../../assets`).

---

## 3) Impacto funcional

- Se mantiene el enrutamiento del frontend por URL, pero ahora con estructura de archivos más clara.
- El módulo de administración de clínicas vuelve a tener soporte completo para:
  - Registrar clínica
  - Editar clínica
  - Eliminar clínica
  - Suspender/Reactiva clínica
  - Vetar/Quitar veto a usuarios

---

## 4) Recordatorio importante para probar localmente

> **IMPORTANTE**: antes de probar, recuerden cargar las variables de entorno y poner a funcionar la base de datos.

Checklist mínimo:

1. Configurar `.env` (frontend y backend), incluyendo al menos `VITE_BACKEND_URL`, `DATABASE_URL`, `JWT_SECRET_KEY`, y credenciales de correo/cloudinary si aplican.
2. Levantar/asegurar la base de datos (PostgreSQL u otra definida en `DATABASE_URL`).
3. Ejecutar migraciones si hace falta.
4. Levantar backend y frontend.

Ejemplo rápido:

- Backend: `python src/app.py`
- Frontend: `npm run dev`

---

## 5) Validaciones ejecutadas durante la reestructuración

- `python -m compileall src/api`
- `npm run build`
