import os
import secrets
import string
from functools import wraps
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from flask import Flask, jsonify, url_for, render_template
from api.models import db, User, RoleEnum, Clinic
from sqlalchemy.exc import ProgrammingError
from flask_mailman import EmailMessage


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

            allowed_roles_values = [r.value if isinstance(
                r, RoleEnum) else r for r in roles]

            if user_role not in allowed_roles_values:
                return jsonify({
                    "msg": f"Acceso denegado. Se requiere uno de estos roles: {allowed_roles_values}"
                }), 403

            return fn(*args, **kwargs)
        return decorator
    return wrapper


def setup_initial_admins():
    try:
        print("🚀 Verificando SuperAdmins del equipo...")

        # Variable para controlar si hubo cambios
        changes_made = False

        # Iteramos por los 3 administradores definidos en el .env
        for i in range(1, 4):
            email = os.getenv(f"ADMIN{i}_EMAIL")
            password = os.getenv(f"ADMIN{i}_PASS")
            name = os.getenv(f"ADMIN{i}_NAME")

            if email and password:
                # El query es lo que falla si la tabla no existe
                user_exists = User.query.filter_by(email=email).first()

                if not user_exists:
                    new_admin = User(
                        email=email,
                        full_name=name if name else f"Admin {i}",
                        role=RoleEnum.SUPER_ADMIN,
                        is_active=True,
                        must_change_password=False
                    )
                    
                    new_admin.password = password

                    db.session.add(new_admin)
                    changes_made = True
                    print(f"✅ Preparado para crear: {email}")
                else:
                    print(f"ℹ️ Ya existe: {email}")
                    pass

        if changes_made:
            db.session.commit()
            print("--- 🏁 Proceso de SuperAdmins finalizado con éxito ---")

    except ProgrammingError:
        # Este error ocurre cuando la tabla 'users' no existe aún
        db.session.rollback()
        print("⚠️ Tabla 'users' no detectada. Ignorando creación de admins hasta que se ejecuten las migraciones.")
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error inesperado al inicializar admins: {e}")


def generate_staff_code(clinic_name):
    prefix = clinic_name[:3].upper().replace(" ", "")
    chars = string.ascii_uppercase + string.digits
    random_part = ''.join(secrets.choice(chars) for _ in range(4))
    return f"{prefix}-{random_part}"


def generate_temp_password(length=12):
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(secrets.choice(alphabet) for i in range(length))


def generate_sitemap(app):
    links = ['/admin/']
    for rule in app.url_map.iter_rules():
        # Filter out rules we can't navigate to in a browser
        # and rules that require parameters
        if "GET" in rule.methods and has_no_empty_params(rule):
            url = url_for(rule.endpoint, **(rule.defaults or {}))
            if "/admin/" not in url:
                links.append(url)

    links_html = "".join(["<li><a href='" + y + "'>" +
                         y + "</a></li>" for y in links])
    return """
        <div style="text-align: center;">
        <img style="max-height: 80px" src='https://storage.googleapis.com/breathecode/boilerplates/rigo-baby.jpeg' />
        <h1>Rigo welcomes you to your API!!</h1>
        <p>API HOST: <script>document.write('<input style="padding: 5px; width: 300px" type="text" value="'+window.location.href+'" />');</script></p>
        <p>Start working on your project by following the <a href="https://start.4geeksacademy.com/starters/full-stack" target="_blank">Quick Start</a></p>
        <p>Remember to specify a real endpoint path like: </p>
        <ul style="text-align: left;">"""+links_html+"</ul></div>"

def send_registration_notification(new_request):
    """
    Envía la doble notificación con plantillas HTML profesionales.
    """
    frontend_url = os.getenv("VITE_FROTEND_URL", "http://localhost:3000")

    # 1. Correo para el SUPER ADMIN
    try:
        admin_body = render_template(
            "emails/admin_notification.html",
            clinic_name=new_request.nombre_clinica,
            admin_name=new_request.nombre_admin,
            user_email=new_request.email,
            admin_url=f"{frontend_url}/admin/solicitudes" # Enlace directo al panel
        )
        admin_msg = EmailMessage(
            subject="🔔 NUEVA SOLICITUD - PetHealth & Spa",
            body=admin_body,
            to=[os.getenv('MAIL_USERNAME')]
        )
        admin_msg.content_subtype = "html"
        admin_msg.send()
    except Exception as e:
        print(f"Error en mail admin: {e}")

    # 2. Correo para el CLIENTE (Confirmación)
    try:
        client_body = render_template(
            "emails/client_confirmation.html",
            admin_name=new_request.nombre_admin
        )
        client_msg = EmailMessage(
            subject="Solicitud Recibida - PetHealth & Spa",
            body=client_body,
            to=[new_request.email]
        )
        client_msg.content_subtype = "html"
        client_msg.send()
    except Exception as e:
        print(f"Error en mail cliente: {e}")

def send_approval_email(user_email, admin_name, clinic_name, temp_pw):
    body_html = render_template(
        "emails/approval.html", 
        admin_name=admin_name,
        clinic_name=clinic_name,
        user_email=user_email,
        temp_pw=temp_pw,
        login_url=f"{os.getenv('VITE_FROTEND_URL')}/login"
    )

    try:
        msg = EmailMessage(
            subject="🎉 ¡Tu clínica ha sido aprobada! - PetHealth & Spa",
            body=body_html, # Aquí pasamos el HTML ya procesado
            to=[user_email]
        )
        msg.content_subtype = "html" # Esto le dice al servidor que envíe HTML y no texto plano
        msg.send()
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

def send_rejection_email(user_email, admin_name, clinic_name, observaciones):
    """
    Envía un correo notificando el rechazo de una solicitud con feedback
    """
    try:
        body_html = render_template(
            "emails/rejection.html",
            admin_name=admin_name,
            clinic_name=clinic_name,
            observaciones=observaciones,
            signup_url=f"{os.getenv('VITE_FROTEND_URL')}/registro-sede"
        )
        
        msg = EmailMessage(
            subject="Información sobre su solicitud - PetHealth & Spa",
            body=body_html,
            to=[user_email]
        )
        msg.content_subtype = "html"
        return msg.send()
    except Exception as e:
        print(f"Error enviando correo de rechazo: {e}")
        return False

def send_staff_invitation_email(target_email, clinic_name, role_name, invite_link):
    """
    Envía el correo de invitación a un nuevo miembro del personal.
    """
    try:
        body_html = render_template(
            "emails/staff_invitation.html",
            clinic_name=clinic_name,
            role_name=role_name,
            invite_link=invite_link
        )
        
        msg = EmailMessage(
            subject=f"Invitación de {clinic_name} - PetHealth & Spa",
            body=body_html,
            to=[target_email]
        )
        msg.content_subtype = "html"
        return msg.send()
    except Exception as e:
        print(f"Error enviando mail de invitación: {e}")
        return False
    
def send_welcome_staff_email(user_email, staff_name, clinic_name, role_name, temp_pw):
    """
    Envía un correo de bienvenida con credenciales temporales al personal cargado.
    """
    try:
        body_html = render_template(
            "emails/welcome_staff.html",
            staff_name=staff_name,
            clinic_name=clinic_name,
            role_name=role_name,
            user_email=user_email,
            temp_pw=temp_pw,
            login_url=f"{os.getenv('FRONTEND_URL')}/login"
        )
        
        msg = EmailMessage(
            subject=f"Acceso a PetHealth & Spa - {clinic_name}",
            body=body_html,
            to=[user_email]
        )
        msg.content_subtype = "html"
        return msg.send()
    except Exception as e:
        print(f"Error enviando bienvenida a {user_email}: {e}")
        return False