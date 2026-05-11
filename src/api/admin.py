import os
import inspect
from flask_admin import Admin
from . import models
from .models import db, User # Importamos User específicamente
from flask_admin.contrib.sqla import ModelView
from flask_admin.theme import Bootstrap4Theme
from wtforms.fields import PasswordField # Necesario para el campo de clave

# Creamos una vista personalizada para el modelo User
class UserAdminView(ModelView):
    # Columnas que se mostrarán en la lista
    column_list = ('email', 'full_name', 'role', 'is_active', 'must_change_password')
    
    # Definimos el campo 'password' como un PasswordField de WTForms
    form_extra_fields = {
        'password': PasswordField('Password')
    }
    
    # Ocultamos la columna 'password_hash' y mostramos el campo virtual 'password'
    form_columns = ('email', 'full_name', 'role', 'is_active', 'password', 'must_change_password', 'clinic_id')

def setup_admin(app):
    app.secret_key = os.environ.get('FLASK_APP_KEY', 'sample key')
    admin = Admin(app, name='4Geeks Admin', theme=Bootstrap4Theme(swatch='cerulean'))

    for name, obj in inspect.getmembers(models):
        if inspect.isclass(obj) and issubclass(obj, db.Model):
            # Si el modelo es User, usamos nuestra vista personalizada
            if name == 'User':
                admin.add_view(UserAdminView(obj, db.session))
            else:
                # Para los demás modelos, seguimos usando la vista genérica
                admin.add_view(ModelView(obj, db.session))