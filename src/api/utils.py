import os
import resend
import secrets
import string
from functools import wraps
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from flask import Flask, jsonify, url_for, render_template
from api.models import db, User, RoleEnum, Clinic
from sqlalchemy.exc import ProgrammingError


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


resend.api_key = os.getenv("RESEND_API_KEY")


def send_resend_email(to, subject, html_body):
    """
    Función auxiliar para centralizar el envío a través de Resend.
    """
    try:
        params = {
            # IMPORTANTE: Cambia 'tu-dominio.com' por tu dominio verificado
            "from": "NexPetly <notificaciones@nexpetly.site>",
            "to": [to],
            "subject": subject,
            "html": html_body,
        }
        email = resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"❌ Error enviando correo vía Resend: {e}")
        return False


def send_registration_notification(clinic_data, admin_data):
    """
    Maneja la notificación múltiple tras el registro de una clínica.
    1. Notifica a los 3 Super Admins definidos en el .env.
    2. Confirma al solicitante (Clinic Admin).
    """

    # 1. Lista de correos de Super Admins desde el .env
    superadmin_emails = [
        os.getenv("ADMIN1_EMAIL"),
        os.getenv("ADMIN2_EMAIL"),
        os.getenv("ADMIN3_EMAIL")
    ]

    # Preparamos el contenido para los Super Admins (se renderiza una sola vez por eficiencia)
    body_superadmin = render_template(
        "emails/admin_notification.html",
        clinic_name=clinic_data.get("name"),
        admin_name=admin_data.get("full_name"),
        admin_email=admin_data.get("email"),
        review_url=f"{os.getenv('VITE_FROTEND_URL')}/superadmin/dashboard"
    )

    # Enviamos a cada Super Admin que tenga un correo configurado
    for email in superadmin_emails:
        if email:  # Solo envía si la variable no está vacía en el .env
            send_resend_email(
                to=email,
                subject="🔔 Alerta: Nueva solicitud de clínica registrada",
                html_body=body_superadmin
            )

    # 2. Notificación de confirmación al Administrador de la Clínica (solicitante)
    body_client = render_template(
        "emails/client_confirmation.html",
        admin_name=admin_data.get("full_name"),
        clinic_name=clinic_data.get("name")
    )

    return send_resend_email(
        to=admin_data.get("email"),
        subject="🐾 Recibimos tu solicitud - NexPetly",
        html_body=body_client
    )


def send_approval_email(user_email, admin_name, clinic_name, temp_pw):
    body_html = render_template(
        "emails/approval.html",
        admin_name=admin_name,
        clinic_name=clinic_name,
        user_email=user_email,
        temp_pw=temp_pw,
        login_url=f"{os.getenv('VITE_FROTEND_URL')}/login"
    )
    return send_resend_email(user_email, "🎉 ¡Tu clínica ha sido aprobada! - NexPetly", body_html)


def send_password_reset_email(user_email, full_name, temp_pw):
    body_html = render_template(
        "emails/password_reset.html",
        full_name=full_name,
        temp_pw=temp_pw,
        login_url=f"{os.getenv('VITE_FROTEND_URL')}/login"
    )
    return send_resend_email(user_email, "Recuperación de contraseña - NexPetly", body_html)


def send_rejection_email(user_email, admin_name, clinic_name, observaciones):
    """
    Notifica al solicitante que su solicitud de clínica ha sido rechazada.
    Incluye el motivo para que el usuario sepa qué corregir.
    """
    try:
        # Renderizamos la plantilla con los datos del rechazo
        body_html = render_template(
            "emails/rejection.html",
            admin_name=admin_name,
            clinic_name=clinic_name,
            observaciones=observaciones
        )

        return send_resend_email(
            to=user_email,
            subject="Actualización sobre tu solicitud de sede - NexPetly",
            html_body=body_html
        )
    except Exception as e:
        print(f"❌ Error en send_rejection_email: {e}")
        return False


def send_staff_invitation_email(target_email, clinic_name, role_name, invite_link):
    """
    Envía el correo de invitación a un nuevo miembro del personal usando Resend.
    """
    body_html = render_template(
        "emails/staff_invitation.html",
        clinic_name=clinic_name,
        role_name=role_name,
        invite_link=invite_link
    )
    return send_resend_email(target_email, f"Invitación de {clinic_name} - NexPetly", body_html)


def send_welcome_staff_email(user_email, staff_name, clinic_name, role_name, temp_pw):
    """
    Envía bienvenida con credenciales temporales al personal cargado masivamente.
    """
    body_html = render_template(
        "emails/welcome_staff.html",
        staff_name=staff_name,
        clinic_name=clinic_name,
        role_name=role_name,
        user_email=user_email,
        temp_pw=temp_pw,
        login_url=f"{os.getenv('VITE_FROTEND_URL')}/login"
    )
    return send_resend_email(user_email, f"Acceso a NexPetly - {clinic_name}", body_html)
