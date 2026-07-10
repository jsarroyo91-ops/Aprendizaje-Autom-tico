import sys

path = '/home/jsarroyoIA/app_riesgo_inundacion_flask'

if path not in sys.path:
    sys.path.insert(0, path)

from app import app as application
