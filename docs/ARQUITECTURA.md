# Arquitectura AulaSenas2-Lite

## Estado vigente

La única representación formal vigente es `AULASENAS2_LITE_F139_V1`. `contracts/` define esa representación; no contiene implementación de cámara ni entrenamiento.

```text
Configurador (implementado)
  cámara / video
  → Hands + Pose Lite
  → raw Lite
  → vector F139
  → validación contractual
  → data/validated/<dataset>/
```

`raw Lite` conserva manos izquierda y derecha (21 puntos XYZ cuando están presentes) y pose mínima: nariz, hombro izquierdo y hombro derecho. El vector F139 se deriva con centro en el punto medio de hombros, escala de distancia XY entre hombros y epsilon `1e-6`. Sus últimos valores son `presenceLeft`, `presenceRight`, `presencePose` y `deltaMsNorm`.

Las muestras son secuencias de longitud variable. El Configurador no interpola observaciones, no crea filas cero ni impone una duración, FPS o tensor de modelo.

## Datos y contratos

```text
data/validated/<dataset>/manifest.json
└─ clases/<classId>.json
```

El manifest y cada archivo de clase declaran `featureContract: "AULASENAS2_LITE_F139_V1"`. Las clases normales usan IDs humanos en mayúsculas separados por `_`; `ruido_background` es la única excepción reservada. `data/` contiene únicamente archivos de datos; el código de lectura y escritura vive en `apps/configurador/src/almacenamiento/` y su servicio local.

## Separación de aplicaciones

`apps/configurador/` y `apps/usuario/` son independientes y no importan lógica funcional entre sí. Configurador implementa la captura Lite actual. Usuario implementa el runtime físico Hands + Pose → F139 → FIFO continuo `[20,139]`, con overlay, métricas y el LayersModel stateless autorizado de FASE VI.

Training permanece fuera de las aplicaciones. En FASE V consumirá el dataset Lite y producirá un modelo GRU Softmax. No hay un pipeline de entrenamiento vigente descrito como implementado en este documento.

## Estructura

```text
apps/configurador/  captura, validación y almacenamiento administrativo
apps/usuario/       aplicación pública Lite: cámara, Hands/Pose, F139, FIFO T20, métricas y modelo LayersModel
contracts/          JSON Schema y formatos AULASENAS2-Lite
data/               archivos de dataset
training/           herramientas offline, pendiente de FASE V
models/exportados/  modelos finales para Usuario
docs/               normativa y arquitectura
```
