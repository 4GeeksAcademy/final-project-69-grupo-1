import os
from functools import wraps
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from flask import jsonify, url_for
from api.models import db, User, RoleEnum

class APIException(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv

def has_no_empty_params(rule):
    defaults = rule.defaults if rule.defaults is not None else ()
    arguments = rule.arguments if rule.arguments is not None else ()
    return len(defaults) >= len(arguments)

def roles_required(*roles):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get("role")

            allowed_roles_values = [r.value if isinstance(r, RoleEnum) else r for r in roles]

            if user_role not in allowed_roles_values:
                return jsonify({
                    "msg": f"Acceso denegado. Se requiere uno de estos roles: {allowed_roles_values}"
                }), 403
            
            return fn(*args, **kwargs)
        return decorator
    return wrapper

def setup_initial_admins():
    print("🚀 Verificando SuperAdmins del equipo...")
    
    # Iteramos por los 3 administradores
    for i in range(1, 4):
        email = os.getenv(f"ADMIN{i}_EMAIL")
        password = os.getenv(f"ADMIN{i}_PASS")
        name = os.getenv(f"ADMIN{i}_NAME")

        if email and password:
            # Validamos si ya existe para no duplicar
            user_exists = User.query.filter_by(email=email).first()
            
            if not user_exists:
                new_admin = User(
                    email=email,
                    full_name=name if name else f"Admin {i}",
                    role=RoleEnum.SUPER_ADMIN,
                    is_active=True,
                    must_change_password=False
                )
                new_admin.password = password # Activa el setter y hashea
                db.session.add(new_admin)
                print(f"✅ Creado: {email}")
            else:
                print(f"ℹ️ Ya existe: {email}")

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error guardando admins: {e}")

def generate_sitemap(app):
    links = ['/admin/']
    for rule in app.url_map.iter_rules():
        # Filter out rules we can't navigate to in a browser
        # and rules that require parameters
        if "GET" in rule.methods and has_no_empty_params(rule):
            url = url_for(rule.endpoint, **(rule.defaults or {}))
            if "/admin/" not in url:
                links.append(url)

    links_html = "".join(["<li><a href='" + y + "'>" + y + "</a></li>" for y in links])
    return """
        <div style="text-align: center;">
        <img style="max-height: 80px" src='https://storage.googleapis.com/breathecode/boilerplates/rigo-baby.jpeg' />
        <h1>Rigo welcomes you to your API!!</h1>
        <p>API HOST: <script>document.write('<input style="padding: 5px; width: 300px" type="text" value="'+window.location.href+'" />');</script></p>
        <p>Start working on your project by following the <a href="https://start.4geeksacademy.com/starters/full-stack" target="_blank">Quick Start</a></p>
        <p>Remember to specify a real endpoint path like: </p>
        <ul style="text-align: left;">"""+links_html+"</ul></div>"
