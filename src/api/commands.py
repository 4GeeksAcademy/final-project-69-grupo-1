import click
from api.models import db, User, RoleEnum

def setup_commands(app):
    @app.cli.command("setup-team-admins")
    def setup_team_admins():
        print("Creando cuentas de Super Admin para el equipo...")
        
        team_members = [
            {"email": "admin1@pethealth.com", "password": "superpassword123", "full_name": "Admin Uno"},
            {"email": "admin2@pethealth.com", "password": "superpassword456", "full_name": "Admin Dos"},
            {"email": "admin3@pethealth.com", "password": "superpassword789", "full_name": "Admin Tres"}
        ]

        for member in team_members:
            user_exists = User.query.filter_by(email=member["email"]).first()
            if not user_exists:
                new_user = User(
                    email=member["email"],
                    full_name=member["full_name"],
                    role=RoleEnum.SUPER_ADMIN,
                    is_active=True
                )
                new_user.set_password(member["password"])
                
                db.session.add(new_user)
                print(f"✅ Usuario {member['email']} creado exitosamente.")
            else:
                print(f"⚠️ El usuario {member['email']} ya existe. Saltando...")

        try:
            db.session.commit()
            print("--- Proceso finalizado con éxito ---")
        except Exception as error:
            db.session.rollback()
            print(f"❌ Error al guardar en la base de datos: {error}")