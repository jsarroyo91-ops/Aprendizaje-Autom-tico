# Comparación de LDA y QDA con el Wine Dataset

## Descripción del proyecto

Este proyecto compara dos modelos de clasificación supervisada:

- **Análisis Discriminante Lineal (LDA)**.
- **Análisis Discriminante Cuadrático (QDA)**.

El análisis se realiza con el **Wine Dataset** disponible en `scikit-learn`. El conjunto de datos contiene resultados de análisis químicos efectuados sobre vinos procedentes de una misma región de Italia y pertenecientes a tres cultivares diferentes.

El cuaderno fue diseñado para ejecutarse en **Google Colab** y emplea el conjunto de datos **sin tratamiento previo**. Por esta razón, no se aplican imputación, eliminación de valores atípicos, balanceo, selección de variables, reducción de dimensionalidad ni estandarización.

## Archivo principal

```text
Comparacion_LDA_QDA_Wine_Colab.ipynb
```

## Objetivo

El objetivo del proyecto es analizar y comparar el comportamiento de LDA y QDA mediante:

- exploración del conjunto de datos;
- visualización de variables;
- separación de datos de entrenamiento y prueba;
- entrenamiento de ambos modelos;
- cálculo de métricas de clasificación;
- análisis de matrices de confusión;
- comparación de fronteras de decisión.

## Descripción del conjunto de datos

El cuaderno utiliza `load_wine()` de `sklearn.datasets`.

Características principales:

| Elemento | Descripción |
|---|---|
| Observaciones | 178 vinos |
| Variables predictoras | 13 variables numéricas |
| Variable objetivo | `target` |
| Número de clases | 3 |
| Clases | `class_0`, `class_1` y `class_2` |
| Valores faltantes | 0 |

Las variables predictoras corresponden a mediciones químicas, como:

- alcohol;
- ácido málico;
- ceniza;
- alcalinidad de la ceniza;
- magnesio;
- fenoles totales;
- flavonoides;
- fenoles no flavonoides;
- proantocianinas;
- intensidad del color;
- tonalidad;
- relación OD280/OD315;
- prolina.

La distribución de las clases es:

| Clase | Observaciones |
|---|---:|
| `class_0` | 59 |
| `class_1` | 71 |
| `class_2` | 48 |

Aunque las clases no tienen exactamente el mismo tamaño, no existe un desbalance extremo.

## Requisitos

El cuaderno necesita las siguientes librerías:

```text
numpy
pandas
matplotlib
scikit-learn
```

Google Colab normalmente incluye estas dependencias de manera predeterminada, por lo que no debería ser necesario instalarlas manualmente.

## Cómo ejecutar el proyecto en Google Colab

### Opción 1: cargar el cuaderno desde el computador

1. Ingrese a Google Colab.
2. Seleccione **Archivo > Subir cuaderno**.
3. Cargue el archivo:

```text
Comparacion_LDA_QDA_Wine_Colab.ipynb
```

4. Espere a que el cuaderno se abra completamente.
5. Seleccione **Entorno de ejecución > Ejecutar todas**.
6. Revise los resultados de cada sección en el orden presentado.

### Opción 2: cargarlo desde Google Drive

1. Guarde el archivo `.ipynb` en Google Drive.
2. Haga clic derecho sobre el archivo.
3. Seleccione **Abrir con > Google Colaboratory**.
4. Ejecute las celdas mediante:

```text
Entorno de ejecución > Ejecutar todas
```

### Ejecución manual por secciones

También es posible ejecutar cada celda individualmente con el botón de reproducción ubicado a la izquierda de la celda.

Debe respetarse el orden del cuaderno porque las variables creadas en las primeras secciones son utilizadas posteriormente. Por ejemplo, los modelos no pueden entrenarse antes de cargar el dataset y separar los datos.

## Estructura del cuaderno

El proyecto contiene las siguientes secciones:

1. Importación de librerías.
2. Descripción del conjunto de datos.
3. Exploración de los datos.
4. Visualización.
5. Preparación de los datos.
6. Función auxiliar de evaluación.
7. Implementación de LDA.
8. Implementación de QDA.
9. Comparación de modelos.
10. Representación de fronteras de decisión.
11. Conclusiones.
12. Referencias.

## Preparación de los datos

La partición se realiza con:

```python
train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)
```

Esta configuración utiliza:

- **80 %** de los datos para entrenamiento;
- **20 %** para prueba;
- `random_state=42` para obtener resultados reproducibles;
- `stratify=y` para conservar aproximadamente la proporción de clases.

No se aplica estandarización porque el trabajo solicita utilizar el Wine Dataset sin tratamiento. LDA y QDA incorporan la estructura de covarianza durante la estimación; sin embargo, en otros experimentos puede resultar conveniente evaluar el efecto de la estandarización.

## Modelos implementados

### Análisis Discriminante Lineal

El modelo LDA se configura con:

```python
LinearDiscriminantAnalysis(
    solver="svd",
    store_covariance=True
)
```

LDA supone que las clases comparten una misma matriz de covarianza. Como consecuencia, genera fronteras de decisión lineales.

### Análisis Discriminante Cuadrático

El modelo QDA se configura con:

```python
QuadraticDiscriminantAnalysis(
    priors=None,
    reg_param=0.0,
    store_covariance=True,
    tol=1e-4
)
```

QDA estima una matriz de covarianza diferente para cada clase. Esto le permite representar fronteras de decisión curvas o cuadráticas, aunque requiere estimar más parámetros.

## Métricas utilizadas

Los modelos se evalúan mediante:

- accuracy;
- precisión macro;
- recall macro;
- F1-score macro;
- matriz de confusión;
- reporte de clasificación;
- tiempo de entrenamiento.

Se emplea el promedio **macro** porque el problema tiene tres clases. Este promedio calcula cada métrica por separado para cada clase y después obtiene su media, sin otorgar mayor peso a la clase más frecuente.

## Principales resultados

Con la partición definida por `random_state=42`, `test_size=0.20` y `stratify=y`, se obtuvieron los siguientes resultados:

| Modelo | Accuracy | Precisión macro | Recall macro | F1 macro |
|---|---:|---:|---:|---:|
| LDA | 0.9444 | 0.9505 | 0.9429 | 0.9453 |
| QDA | 1.0000 | 1.0000 | 1.0000 | 1.0000 |

Los tiempos de entrenamiento son muy reducidos en ambos modelos. Su valor exacto puede cambiar según el computador o el entorno de ejecución.

### Matriz de confusión de LDA

```text
[[12,  0,  0],
 [ 1, 13,  0],
 [ 0,  1,  9]]
```

LDA clasificó correctamente 34 de las 36 observaciones de prueba. Los dos errores se produjeron entre clases diferentes:

- una observación de `class_1` fue clasificada como `class_0`;
- una observación de `class_2` fue clasificada como `class_1`.

### Matriz de confusión de QDA

```text
[[12,  0,  0],
 [ 0, 14,  0],
 [ 0,  0, 10]]
```

QDA clasificó correctamente las 36 observaciones del conjunto de prueba en esta partición.

## Hallazgos principales

1. **QDA obtuvo el mejor desempeño en el experimento principal.**  
   Alcanzó valores de 1.00 en accuracy, precisión macro, recall macro y F1 macro.

2. **LDA también presentó un desempeño elevado.**  
   Su accuracy fue aproximadamente 94.44 %, con únicamente dos errores de clasificación.

3. **La flexibilidad de QDA fue favorable para este conjunto de datos.**  
   Al estimar una matriz de covarianza por clase, QDA pudo adaptarse a diferencias en la dispersión y las correlaciones de los tres cultivares.

4. **Un resultado perfecto no garantiza superioridad universal.**  
   El accuracy de 1.00 corresponde a una sola partición del conjunto de datos. Para confirmar la estabilidad de QDA sería recomendable aplicar validación cruzada.

5. **LDA requiere menos parámetros.**  
   Al compartir una sola matriz de covarianza, es más simple y puede ser más estable que QDA cuando existen pocas observaciones o muchas variables.

6. **La exploración mostró escalas y distribuciones diferentes.**  
   Algunas variables presentaron asimetrías y rangos considerablemente distintos. Esto no impidió obtener un buen rendimiento, aunque debe considerarse al analizar los supuestos estadísticos.

7. **Varias variables mostraron diferencias entre las clases.**  
   Variables como `flavanoids`, `proline`, `alcohol` y `color_intensity` aportan información útil para distinguir los cultivares.

8. **Existen correlaciones importantes entre predictores.**  
   Se observaron relaciones relevantes entre `total_phenols`, `flavanoids` y `od280/od315_of_diluted_wines`, lo que influye en la estructura de las matrices de covarianza.

## Resultados con dos variables

Para visualizar las fronteras de decisión se utilizaron solamente:

```text
alcohol
color_intensity
```

Los resultados fueron:

| Modelo bidimensional | Accuracy |
|---|---:|
| LDA | 0.8333 |
| QDA | 0.8056 |

En este escenario reducido, LDA obtuvo un resultado ligeramente superior. Esto demuestra que el desempeño de un modelo puede variar según la cantidad y la selección de variables utilizadas.

Las fronteras presentan diferencias conceptuales:

- LDA genera regiones separadas mediante líneas rectas.
- QDA produce fronteras curvas debido a que cada clase posee su propia matriz de covarianza.

## Interpretación general

El experimento evidencia que QDA puede superar a LDA cuando las clases presentan estructuras de dispersión diferentes y existe suficiente información para estimar una covarianza por clase. Sin embargo, la comparación bidimensional muestra que la mayor flexibilidad de QDA no siempre produce mejores resultados.

La elección entre LDA y QDA no debe basarse únicamente en la precisión de una sola ejecución. También se deben considerar:

- tamaño del conjunto de datos;
- cantidad de variables;
- distribución de las clases;
- estabilidad de las matrices de covarianza;
- cumplimiento aproximado de los supuestos;
- resultados de validación cruzada;
- facilidad de interpretación.
