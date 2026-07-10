# App Flask para Riesgo de Inundación Parroquial Costera

Esta carpeta contiene la aplicación web desarrollada con Python y Flask para visualizar los resultados del proyecto de Clasificación Supervisada de Riesgo de Inundación por Parroquia.

## App desplegada

La aplicación web está publicada en PythonAnywhere:

https://jsarroyoIA.pythonanywhere.com

## Objetivo

Visualizar los resultados generados en Google Colab a partir del modelo de Machine Learning entrenado para clasificar el riesgo de inundación parroquial en zonas costeras del Ecuador.

La app no reentrena el modelo en PythonAnywhere. Utiliza los archivos finales exportados desde Colab:

- predicciones_finales.csv
- parroquias_riesgo.geojson
- metricas_modelo.json

## Datos incluidos

- Total de parroquias: 300
- Provincias incluidas: 6
- Provincia añadida en la versión actualizada: Santa Elena
- Parroquias de Santa Elena: 11
- Variables predictoras: 17

## Provincias incluidas

- El Oro
- Esmeraldas
- Guayas
- Los Ríos
- Manabí
- Santa Elena

## Distribución de riesgo predicho

| Riesgo predicho | Cantidad |
|---|---:|
| Bajo | 155 |
| Medio | 67 |
| Alto | 78 |

## Distribución de riesgo histórico real

| Riesgo histórico | Cantidad |
|---|---:|
| Bajo | 164 |
| Medio | 76 |
| Alto | 60 |

## Modelo utilizado

El modelo seleccionado en el Colab fue Random Forest optimizado.

Métricas principales:

| Métrica | Valor |
|---|---:|
| Accuracy | 0.64 |
| F1 macro | 0.5955 |
| AUC ROC macro | 0.8155 |

## Estructura principal

app_riesgo_inundacion_flask/
- app.py
- requirements.txt
- wsgi_pythonanywhere.py
- README.md
- data/
- templates/
- static/

## Rutas principales

| Ruta | Descripción |
|---|---|
| / | Dashboard principal |
| /prediccion | Consulta de predicciones por parroquia |
| /mapa | Mapa interactivo de riesgo de inundación |
| /api/predicciones | API técnica con predicciones en JSON |
| /api/geojson | API técnica con el GeoJSON usado por el mapa |
| /api/metricas | API técnica con métricas del modelo |

## Funcionalidades del mapa

La sección de mapa permite:

- Visualizar las parroquias del área de estudio.
- Diferenciar visualmente el riesgo mediante colores.
- Mostrar al pasar el cursor el nombre de la parroquia, cantón y provincia.
- Mostrar al hacer clic la categoría de riesgo, score del modelo y probabilidades por clase.
- Incluir simbología del nivel de riesgo.

## Simbología del mapa

| Color | Categoría |
|---|---|
| Verde | Riesgo bajo |
| Naranja | Riesgo medio |
| Rojo | Riesgo alto |
| Gris | Sin dato |

## Instalación en PythonAnywhere

Subir el archivo app_riesgo_inundacion_flask.zip a PythonAnywhere y ejecutar:

cd ~
unzip -o app_riesgo_inundacion_flask.zip
cd app_riesgo_inundacion_flask

Crear o activar el entorno virtual:

mkvirtualenv --python=/usr/bin/python3.10 riesgo_inundacion_env
workon riesgo_inundacion_env
pip install -r requirements.txt

En la pestaña Web configurar:

Source code:
/home/jsarroyoIA/app_riesgo_inundacion_flask

Working directory:
/home/jsarroyoIA/app_riesgo_inundacion_flask

Virtualenv:
/home/jsarroyoIA/.virtualenvs/riesgo_inundacion_env

Static files:

URL:
/static/

Directory:
/home/jsarroyoIA/app_riesgo_inundacion_flask/static

## Configuración WSGI

Usar este contenido en el archivo WSGI de PythonAnywhere:

import sys

path = '/home/jsarroyoIA/app_riesgo_inundacion_flask'

if path not in sys.path:
    sys.path.insert(0, path)

from app import app as application

Luego presionar Reload en la pestaña Web.

## Nota sobre el modelo

El entrenamiento y la predicción se realizan en Google Colab. PythonAnywhere se utiliza para publicar la aplicación web y visualizar los resultados.

## Nota sobre el mapa

El archivo parroquias_riesgo.geojson contiene la unión entre los límites parroquiales y las predicciones finales del modelo mediante codigo_parroquia.
