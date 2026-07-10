# App Flask para Riesgo de Inundación 

Esta carpeta contiene la aplicación Flask con los resultados del Colab Riesgo de Inundación
## Datos incluidos

- Total de parroquias: **300**
- Provincias incluidas: **6**
- Santa Elena: **11 parroquias**
- Variables predictoras: **17**

## Distribución de riesgo predicho

riesgo_predicho
Bajo     155
Alto      78
Medio     67

## Distribución de riesgo histórico real

riesgo_inundacion
Bajo     164
Medio     76
Alto      60

## Archivos principales actualizados

```text
app_riesgo_inundacion_flask/
├── app.py
├── requirements.txt
├── wsgi_pythonanywhere.py
├── data/
│   ├── predicciones_finales.csv
│   ├── dataset_inundacion.csv
│   ├── parroquias_riesgo.geojson
│   ├── metricas_modelo.json
│   ├── importancia_variables_inundacion.csv
│   ├── comparacion_modelos_inundacion.csv
│   └── reporte_balance_clases.csv
├── modelo/
│   ├── modelo_riesgo_inundacion.joblib
│   ├── columnas_modelo.json
│   ├── clases_modelo.json
│   └── metricas_modelo.json
├── templates/
└── static/
```

## Instalación en PythonAnywhere

Sube este ZIP a `Files`, abre una consola Bash y ejecuta:

```bash
cd ~
unzip -o app_riesgo_inundacion_flask_santa_elena.zip
cd app_riesgo_inundacion_flask
```

Crea o activa el entorno virtual:

```bash
mkvirtualenv --python=/usr/bin/python3.10 riesgo_inundacion_env
pip install -r requirements.txt
```

Si ya creaste el entorno anteriormente:

```bash
workon riesgo_inundacion_env
cd ~/app_riesgo_inundacion_flask
pip install -r requirements.txt
```

En la pestaña **Web** configura:

```text
Source code: /home/jsarroyoIA/app_riesgo_inundacion_flask
Working directory: /home/jsarroyoIA/app_riesgo_inundacion_flask
Virtualenv: /home/jsarroyoIA/.virtualenvs/riesgo_inundacion_env
Static files:
URL: /static/
Directory: /home/jsarroyoIA/app_riesgo_inundacion_flask/static
```

En el archivo WSGI usa:

```python
import sys

path = '/home/jsarroyoIA/app_riesgo_inundacion_flask'

if path not in sys.path:
    sys.path.insert(0, path)

from app import app as application
```

Finalmente presiona **Reload** en la pestaña **Web**.

## Rutas disponibles

- `/` Dashboard principal.
- `/prediccion` Consulta por provincia, cantón, parroquia, código o riesgo.
- `/mapa` Mapa interactivo.
- `/api/predicciones` Predicciones en JSON.
- `/api/geojson` GeoJSON usado por el mapa.
- `/api/metricas` Métricas del modelo.
- `/api/predecir` Endpoint opcional POST con variables predictoras.

## Nota sobre el mapa

El archivo `parroquias_riesgo.geojson` fue simplificado para que cargue mejor en PythonAnywhere. El archivo original del Colab era muy pesado para una app web ligera.
