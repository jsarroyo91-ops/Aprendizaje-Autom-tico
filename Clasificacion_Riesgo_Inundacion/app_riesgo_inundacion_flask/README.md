# App Flask para Riesgo de Inundación Parroquial Costera

## App web desplegada

La aplicación web se encuentra disponible en el siguiente enlace:

https://jsarroyoia.pythonanywhere.com/

---

## Descripción del proyecto

Esta aplicación web fue desarrollada en Flask para visualizar los resultados de un modelo de clasificación supervisada aplicado al riesgo de inundación por parroquia en zonas costeras del Ecuador.

La app utiliza los resultados generados previamente en Google Colab y permite:

- Consultar el riesgo predicho por parroquia.
- Revisar una muestra de las predicciones finales.
- Visualizar las parroquias en un mapa interactivo.
- Identificar el nivel de riesgo mediante colores.

---

## Alcance del dataset

La aplicación usa los datos de 6 provincias:

- El Oro
- Esmeraldas
- Guayas
- Los Ríos
- Manabí
- Santa Elena

Datos principales:

- Total de parroquias: 300
- Provincias incluidas: 6
- Santa Elena: 11 parroquias
- Variables predictoras utilizadas en el modelo: 17

---

## Distribución de riesgo predicho

| Riesgo predicho | Cantidad |
|---|---:|
| Bajo | 155 |
| Alto | 78 |
| Medio | 67 |

---

## Distribución de riesgo histórico real

| Riesgo histórico | Cantidad |
|---|---:|
| Bajo | 164 |
| Medio | 76 |
| Alto | 60 |

---

## Archivos principales

```text
app_riesgo_inundacion_flask/
├── app.py
├── requirements.txt
├── wsgi_pythonanywhere.py
├── README.md
├── data/
│   ├── predicciones_finales.csv
│   ├── dataset_inundacion.csv
│   ├── parroquias_riesgo.geojson
│   ├── metricas_modelo.json
│   ├── importancia_variables_inundacion.csv
│   ├── comparacion_modelos_inundacion.csv
│   └── reporte_balance_clases.csv
├── templates/
│   ├── base.html
│   ├── index.html
│   ├── prediccion.html
│   └── mapa.html
└── static/
    ├── css/
    │   └── estilos.css
    └── js/
        └── mapa.js
```

---

## Funcionalidades de la aplicación

### Inicio

Muestra un resumen general del proyecto, métricas principales, alcance del dataset y una muestra de hasta 120 registros de las predicciones finales.

### Consultar parroquia

Permite buscar información específica por provincia, cantón, parroquia, código parroquial o categoría de riesgo.

### Mapa interactivo

Permite visualizar las parroquias costeras del Ecuador clasificadas según el riesgo predicho de inundación.

La simbología del mapa utiliza:

- Verde: riesgo bajo
- Naranja: riesgo medio
- Rojo: riesgo alto

Al pasar el cursor sobre una parroquia se muestra su ubicación. Al hacer clic se muestra la categoría de riesgo predicho y la certeza de la clasificación.

---

## Modelo utilizado

Las predicciones fueron generadas previamente en Google Colab mediante un modelo de Random Forest optimizado.

En PythonAnywhere, la aplicación no reentrena el modelo ni ejecuta el archivo `.joblib`. La app web se encarga de visualizar los resultados finales almacenados en archivos CSV, JSON y GeoJSON.

---

## Ejecución local

Para ejecutar la aplicación en un entorno local, seguir estos pasos:

### 1. Clonar o descargar el repositorio

```bash
git clone https://github.com/jsarroyo91-ops/Aprendizaje-Autom-tico.git
cd Aprendizaje-Autom-tico/Clasificacion_Riesgo_Inundacion/app_riesgo_inundacion_flask
```

### 2. Crear un entorno virtual

En Windows:

```bash
python -m venv venv
venv\Scripts\activate
```

En Linux, macOS o PythonAnywhere Bash:

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Ejecutar la aplicación

```bash
python app.py
```

### 5. Abrir en el navegador

Ingresar a:

```text
http://127.0.0.1:5000/
```

---

## Despliegue en PythonAnywhere

Para desplegar la app en PythonAnywhere, subir la carpeta o archivo ZIP de la aplicación y seguir estos pasos.

### 1. Descomprimir la aplicación

```bash
cd ~
unzip -o app_riesgo_inundacion_flask.zip
cd app_riesgo_inundacion_flask
```

### 2. Crear o activar entorno virtual

Crear el entorno virtual:

```bash
mkvirtualenv --python=/usr/bin/python3.10 riesgo_inundacion_env
pip install -r requirements.txt
```

Si el entorno ya existe:

```bash
workon riesgo_inundacion_env
cd ~/app_riesgo_inundacion_flask
pip install -r requirements.txt
```

### 3. Configurar la aplicación en la pestaña Web

En PythonAnywhere, ir a la pestaña **Web** y configurar:

```text
Source code:
/home/jsarroyoIA/app_riesgo_inundacion_flask

Working directory:
/home/jsarroyoIA/app_riesgo_inundacion_flask

Virtualenv:
/home/jsarroyoIA/.virtualenvs/riesgo_inundacion_env
```

### 4. Configurar archivos estáticos

En la sección **Static files**:

```text
URL:
/static/

Directory:
/home/jsarroyoIA/app_riesgo_inundacion_flask/static
```

### 5. Configurar archivo WSGI

En el archivo WSGI usar:

```python
import sys

path = '/home/jsarroyoIA/app_riesgo_inundacion_flask'

if path not in sys.path:
    sys.path.insert(0, path)

from app import app as application
```

### 6. Recargar la aplicación

Finalmente, presionar **Reload** en la pestaña **Web**.

La aplicación quedará disponible en:

```text
https://jsarroyoia.pythonanywhere.com/
```

---

## Rutas principales

| Ruta | Descripción |
|---|---|
| `/` | Dashboard principal |
| `/prediccion` | Consulta por provincia, cantón, parroquia, código o riesgo |
| `/mapa` | Mapa interactivo de riesgo de inundación |

---

## Nota sobre el mapa

El archivo `parroquias_riesgo.geojson` contiene las geometrías parroquiales integradas con las predicciones finales del modelo.

El mapa fue preparado para funcionar como una visualización ligera en PythonAnywhere, mostrando colores por nivel de riesgo y un panel informativo para facilitar la consulta de parroquias.

---

## Estado del proyecto

La aplicación se encuentra desplegada en PythonAnywhere y el código fuente está disponible en GitHub como parte del repositorio de Aprendizaje Automático.
