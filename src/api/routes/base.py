import os
import cloudinary
from flask import Blueprint
from flask_cors import CORS

api = Blueprint('api', __name__)
CORS(api)

cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET'),
    secure=True,
)
