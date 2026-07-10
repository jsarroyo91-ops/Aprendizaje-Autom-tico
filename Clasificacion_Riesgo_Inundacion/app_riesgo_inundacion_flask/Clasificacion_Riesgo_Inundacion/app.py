"""
Aplicación Flask para visualizar la clasificación supervisada de riesgo de inundación.
Versión actualizada con la provincia de Santa Elena.

Diseñada para PythonAnywhere:
- Usa data/predicciones_finales.csv como fuente principal de consulta.
- Usa data/parroquias_riesgo.geojson para el mapa interactivo.
- Puede cargar opcionalmente modelo/modelo_riesgo_inundacion.joblib para predicciones vía API.
"""

from __future__ import annotations

import json
import unicodedata
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
from flask import Flask, jsonify, render_template, request

try:
    import joblib
except Exception:  # pragma: no cover
    joblib = None

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "modelo"

PREDICCIONES_CSV = DATA_DIR / "predicciones_finales.csv"
DATASET_CSV = DATA_DIR / "dataset_inundacion.csv"
GEOJSON_FILE = DATA_DIR / "parroquias_riesgo.geojson"
METRICAS_JSON = DATA_DIR / "metricas_modelo.json"
IMPORTANCIA_CSV = DATA_DIR / "importancia_variables_inundacion.csv"
BALANCE_CSV = DATA_DIR / "reporte_balance_clases.csv"

MODELO_JOBLIB = MODEL_DIR / "modelo_riesgo_inundacion.joblib"
COLUMNAS_JSON = MODEL_DIR / "columnas_modelo.json"
CLASES_JSON = MODEL_DIR / "clases_modelo.json"

app = Flask(__name__)
app.config["JSON_AS_ASCII"] = False

VARIABLES_PREDICTORAS_ESPERADAS = [
    "precipitacion_media_anual",
    "precipitacion_maxima_anual",
    "precipitacion_minima_anual",
    "altitud_media",
    "rango_altitudinal",
    "pendiente_media",
    "distancia_minima_rio_km",
    "distancia_centroide_rio_km",
    "porcentaje_area_cerca_rio_1km",
    "num_elementos_hidricos_intersectan",
    "densidad_poblacional_hab_km2",
    "porcentaje_area_urbanizada",
    "porcentaje_bosque",
    "porcentaje_agricultura_pasto",
    "porcentaje_agua",
    "porcentaje_acuicultura",
    "porcentaje_mineria",
]

COLUMNAS_IDENTIFICACION = [
    "codigo_parroquia",
    "codigo_provincia",
    "provincia",
    "canton",
    "parroquia",
]

POSIBLES_COLUMNAS_RIESGO = [
    "riesgo_predicho",
    "riesgo_inundacion_predicho",
    "riesgo_inundacion",
    "prediccion",
    "clase_predicha",
]


def _sin_acentos(texto: Any) -> str:
    texto = "" if texto is None else str(texto)
    texto = unicodedata.normalize("NFKD", texto)
    return "".join(ch for ch in texto if not unicodedata.combining(ch)).lower().strip()


def _normalizar_codigo(valor: Any) -> str:
    if pd.isna(valor):
        return ""
    texto = str(valor).strip()
    if texto.endswith(".0"):
        texto = texto[:-2]
    if texto.isdigit() and len(texto) <= 6:
        return texto.zfill(6)
    return texto


def _limpiar_nan_para_json(valor: Any) -> Any:
    if pd.isna(valor):
        return None
    return valor


def _leer_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        return pd.DataFrame()
    df = pd.read_csv(path, dtype={"codigo_parroquia": str, "codigo_provincia": str}, encoding="utf-8")
    df.columns = [str(c).strip().replace("\ufeff", "") for c in df.columns]
    if "codigo_parroquia" in df.columns:
        df["codigo_parroquia"] = df["codigo_parroquia"].apply(_normalizar_codigo)
    if "codigo_provincia" in df.columns:
        df["codigo_provincia"] = df["codigo_provincia"].apply(lambda x: _normalizar_codigo(x)[-2:] if _normalizar_codigo(x) else "")
    return df


def obtener_columna_riesgo(df: pd.DataFrame) -> Optional[str]:
    for columna in POSIBLES_COLUMNAS_RIESGO:
        if columna in df.columns:
            return columna
    return None


@lru_cache(maxsize=1)
def cargar_predicciones() -> pd.DataFrame:
    if not PREDICCIONES_CSV.exists():
        return pd.DataFrame(columns=COLUMNAS_IDENTIFICACION + ["riesgo_predicho"])

    df = _leer_csv(PREDICCIONES_CSV)

    if "provincia" not in df.columns and "provincia_modelo" in df.columns:
        df["provincia"] = df["provincia_modelo"]

    for columna in ["provincia", "provincia_modelo", "canton", "parroquia"]:
        if columna in df.columns:
            df[columna] = df[columna].fillna("Sin dato").astype(str).str.strip()

    columna_riesgo = obtener_columna_riesgo(df)
    if columna_riesgo and columna_riesgo != "riesgo_predicho":
        df["riesgo_predicho"] = df[columna_riesgo]
    elif not columna_riesgo:
        df["riesgo_predicho"] = "Sin predicción"

    df["riesgo_predicho"] = df["riesgo_predicho"].fillna("Sin predicción").astype(str).str.strip().str.title()
    if "riesgo_real" in df.columns:
        df["riesgo_real"] = df["riesgo_real"].fillna("Sin dato").astype(str).str.strip().str.title()
    return df


@lru_cache(maxsize=1)
def cargar_dataset() -> pd.DataFrame:
    return _leer_csv(DATASET_CSV)


def columnas_disponibles(df: pd.DataFrame) -> Dict[str, List[str]]:
    identificacion = [c for c in COLUMNAS_IDENTIFICACION if c in df.columns]
    predictoras = [c for c in VARIABLES_PREDICTORAS_ESPERADAS if c in df.columns]
    extra_metricas = [
        c for c in [
            "riesgo_real",
            "eventos_inundacion",
            "probabilidad_bajo",
            "probabilidad_medio",
            "probabilidad_alto",
            "confianza_prediccion",
            "prediccion_correcta",
        ] if c in df.columns
    ]
    return {"identificacion": identificacion, "predictoras": predictoras, "extra_metricas": extra_metricas}


def resumen_riesgo(df: pd.DataFrame) -> Dict[str, int]:
    if df.empty or "riesgo_predicho" not in df.columns:
        return {}
    orden = ["Alto", "Medio", "Bajo"]
    conteo = df["riesgo_predicho"].value_counts(dropna=False).to_dict()
    salida = {k: int(conteo[k]) for k in orden if k in conteo}
    for k, v in conteo.items():
        if k not in salida:
            salida[str(k)] = int(v)
    return salida


def filtrar_df(df: pd.DataFrame, provincia: str = "", canton: str = "", texto: str = "") -> pd.DataFrame:
    filtrado = df.copy()
    if provincia and "provincia" in filtrado.columns:
        filtrado = filtrado[filtrado["provincia"].map(_sin_acentos) == _sin_acentos(provincia)]
    if canton and "canton" in filtrado.columns:
        filtrado = filtrado[filtrado["canton"].map(_sin_acentos) == _sin_acentos(canton)]
    if texto:
        texto_norm = _sin_acentos(texto)
        mascaras = []
        for columna in ["codigo_parroquia", "provincia", "provincia_modelo", "canton", "parroquia", "riesgo_predicho"]:
            if columna in filtrado.columns:
                mascaras.append(filtrado[columna].astype(str).map(_sin_acentos).str.contains(texto_norm, na=False, regex=False))
        if mascaras:
            mascara_total = mascaras[0]
            for mascara in mascaras[1:]:
                mascara_total = mascara_total | mascara
            filtrado = filtrado[mascara_total]
    return filtrado


@lru_cache(maxsize=1)
def cargar_metricas() -> Dict[str, Any]:
    if not METRICAS_JSON.exists():
        return {}
    try:
        return json.loads(METRICAS_JSON.read_text(encoding="utf-8"))
    except Exception:
        return {}


@lru_cache(maxsize=1)
def cargar_importancia() -> List[Dict[str, Any]]:
    if not IMPORTANCIA_CSV.exists():
        return []
    try:
        df = pd.read_csv(IMPORTANCIA_CSV)
        return df.head(8).to_dict(orient="records")
    except Exception:
        return []


def _leer_columnas_modelo() -> List[str]:
    if COLUMNAS_JSON.exists():
        try:
            return json.loads(COLUMNAS_JSON.read_text(encoding="utf-8"))
        except Exception:
            pass
    return VARIABLES_PREDICTORAS_ESPERADAS


def _leer_clases_modelo() -> Dict[str, Any]:
    if CLASES_JSON.exists():
        try:
            return json.loads(CLASES_JSON.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


@lru_cache(maxsize=1)
def cargar_modelo_opcional() -> Dict[str, Any]:
    resultado = {
        "modelo_disponible": False,
        "modelo": None,
        "columnas": _leer_columnas_modelo(),
        "clases": _leer_clases_modelo(),
        "mensaje": "Predicciones generadas en Colab con Random Forest optimizado. La app visualiza el CSV final con 300 parroquias y 6 provincias.",
    }

    if joblib is None:
        resultado["mensaje"] = "joblib no está instalado; se usa el CSV de predicciones finales."
        return resultado
    if not MODELO_JOBLIB.exists():
        return resultado

    try:
        resultado["modelo"] = joblib.load(MODELO_JOBLIB)
        resultado["modelo_disponible"] = True
        resultado["mensaje"] = "Modelo .joblib disponible. La visualización principal usa el CSV final."
    except Exception as exc:  # pragma: no cover
        resultado["mensaje"] = f"No se pudo cargar el modelo .joblib: {exc}. La app continúa con el CSV final."
    return resultado


def registros_json(df: pd.DataFrame, limite: Optional[int] = None) -> List[Dict[str, Any]]:
    salida = df.copy()
    if limite is not None:
        salida = salida.head(limite)
    salida = salida.where(pd.notna(salida), None)
    return salida.to_dict(orient="records")


@app.route("/")
def index():
    df = cargar_predicciones()
    provincia = request.args.get("provincia", "").strip()
    canton = request.args.get("canton", "").strip()
    texto = request.args.get("q", "").strip()

    filtrado = filtrar_df(df, provincia=provincia, canton=canton, texto=texto)
    columnas = columnas_disponibles(df)

    provincias = sorted(df["provincia"].dropna().unique().tolist()) if "provincia" in df.columns else []
    cantones = sorted(df["canton"].dropna().unique().tolist()) if "canton" in df.columns else []

    columnas_tabla = [
        c for c in [
            "codigo_parroquia", "provincia", "canton", "parroquia", "riesgo_real", "riesgo_predicho", "confianza_prediccion"
        ] if c in filtrado.columns
    ]
    tabla = registros_json(filtrado[columnas_tabla], limite=120) if columnas_tabla else []
    metricas = cargar_metricas()
    metricas_test = metricas.get("metricas_conjunto_prueba", {}) if metricas else {}

    return render_template(
        "index.html",
        total_registros=len(df),
        total_filtrado=len(filtrado),
        total_provincias=len(provincias),
        resumen=resumen_riesgo(df),
        provincias=provincias,
        cantones=cantones,
        provincia_sel=provincia,
        canton_sel=canton,
        texto=texto,
        tabla=tabla,
        columnas_tabla=columnas_tabla,
        columnas=columnas,
        modelo_info=cargar_modelo_opcional(),
        metricas=metricas,
        metricas_test=metricas_test,
        importancia=cargar_importancia(),
    )


@app.route("/prediccion", methods=["GET", "POST"])
def prediccion():
    df = cargar_predicciones()
    consulta = request.values.get("consulta", "").strip()
    resultado = None
    resultados = []
    columnas = columnas_disponibles(df)

    if consulta:
        filtrado = filtrar_df(df, texto=consulta)
        resultados = registros_json(filtrado, limite=20)
        if resultados:
            resultado = resultados[0]

    return render_template(
        "prediccion.html",
        consulta=consulta,
        resultado=resultado,
        resultados=resultados,
        columnas=columnas,
    )


@app.route("/mapa")
def mapa():
    return render_template("mapa.html", geojson_disponible=GEOJSON_FILE.exists())


@app.route("/api/predicciones")
def api_predicciones():
    df = cargar_predicciones()
    provincia = request.args.get("provincia", "").strip()
    canton = request.args.get("canton", "").strip()
    texto = request.args.get("q", "").strip()
    filtrado = filtrar_df(df, provincia=provincia, canton=canton, texto=texto)
    return jsonify(registros_json(filtrado))


@app.route("/api/geojson")
def api_geojson():
    if not GEOJSON_FILE.exists():
        return jsonify({"type": "FeatureCollection", "features": []})
    try:
        with GEOJSON_FILE.open("r", encoding="utf-8") as f:
            return jsonify(json.load(f))
    except Exception as exc:
        return jsonify({"type": "FeatureCollection", "features": [], "error": str(exc)}), 500


@app.route("/api/metricas")
def api_metricas():
    return jsonify(cargar_metricas())


@app.route("/api/predecir", methods=["POST"])
def api_predecir():
    modelo_info = cargar_modelo_opcional()
    if not modelo_info["modelo_disponible"]:
        return jsonify({"ok": False, "mensaje": modelo_info["mensaje"]}), 400

    payload = request.get_json(silent=True) or {}
    columnas_modelo = modelo_info.get("columnas") or VARIABLES_PREDICTORAS_ESPERADAS
    clases = modelo_info.get("clases") or {}
    decodificacion = clases.get("decodificacion", {})

    try:
        fila = pd.DataFrame([{col: payload.get(col, 0) for col in columnas_modelo}])
        prediccion_modelo = modelo_info["modelo"].predict(fila)[0]
        pred_txt = decodificacion.get(str(prediccion_modelo), str(prediccion_modelo))
        respuesta = {"ok": True, "prediccion": pred_txt}

        if hasattr(modelo_info["modelo"], "predict_proba"):
            probabilidades = modelo_info["modelo"].predict_proba(fila)[0]
            orden = clases.get("orden_probabilidades") or list(getattr(modelo_info["modelo"], "classes_", range(len(probabilidades))))
            respuesta["probabilidades"] = {str(clase): float(prob) for clase, prob in zip(orden, probabilidades)}
        return jsonify(respuesta)
    except Exception as exc:
        return jsonify({"ok": False, "mensaje": f"Error al predecir: {exc}"}), 500


@app.route("/healthz")
def healthz():
    return jsonify({"status": "ok", "app": "riesgo_inundacion_flask_santa_elena"})


if __name__ == "__main__":
    # En PythonAnywhere no se debe depender de app.run(); allí la app se sirve por WSGI.
    app.run(debug=True)
