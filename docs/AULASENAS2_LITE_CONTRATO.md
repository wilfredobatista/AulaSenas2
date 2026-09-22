# CONTRATO DE REFUNDACIÓN Y ORDEN DE EJECUCIÓN

# AULASENAS2-LITE

## 1. Alcance y principios invariantes

Este documento establece la normativa vigente para la refundación AulaSenas2-Lite. En las fases correspondientes se eliminará físicamente del árbol activo todo código exclusivo de MediaPipe Holistic, F=319, GRU-CTC/F=308, buffers antiguos, adaptadores de compatibilidad, runtimes legacy y código zombi asociado. No se conservarán copias activas por auditoría, demostración o compatibilidad; Git es el historial oficial.

Todo módulo o función nueva documentará su responsabilidad, entradas, salidas, decisiones no obvias y relación con el contrato. Los comentarios explicarán la lógica real. Al terminar las fases funcionales se priorizará la validación física con un signante frente a la cámara. Las mediciones intermedias responderán preguntas técnicas concretas y no sustituirán indefinidamente la prueba funcional. Los contratos estructurales son rígidos; los parámetros experimentales solo cambiarán mediante decisión explícita y documentada respaldada por evidencia física.

## 2. Contrato geométrico Lite: F=139

El único vector geométrico vigente es F=139 y todos los rangos son half-open:

| Rango | Contenido |
|---|---|
| `[0:63]` | Mano izquierda física: 21 landmarks × XYZ |
| `[63:126]` | Mano derecha física: 21 landmarks × XYZ |
| `[126:132]` | Pose reducida: MP11 y MP12, 2 × XYZ |
| `[132:135]` | Cabeza real: MP0 nariz, XYZ |
| `[135:138]` | Máscaras binarias: mano izquierda, mano derecha, pose |
| `[138:139]` | `deltaMsNorm = clip(deltaMs / 1000, 0, 1)` |

El total exacto es 139 floats. Quedan prohibidos Face Mesh, MediaPipe Holistic, landmarks faciales, F319, F308 y CTC.

## 3. Detectores, correspondencia y lateralidad

El extractor utilizará MediaPipe Hands y MediaPipe Pose, nunca Holistic. Pose usará `modelComplexity: 0`; Hands usará su modalidad ligera equivalente cuando la API lo permita; el máximo será de dos manos. Hands y Pose que formen un F139 deben proceder del mismo frame fuente o estar asociados inequívocamente al mismo token o timestamp. Está prohibido combinar silenciosamente Hands(frame N) con Pose(frame N+1).

`Left` y `Right` siempre significan lado físico del signante. El efecto espejo de la cámara no modifica el contrato.

## 4. Normalización

Para cada frame válido:

```text
centro = (hombroIzq + hombroDer) / 2
escala = distancia XY entre hombro izquierdo y hombro derecho
normalizedXYZ = (pointXYZ - centerXYZ) / scale
```

El mismo centro y escala se aplican a ambas manos, ambos hombros y la nariz. La implementación usará un epsilon explícito para evitar división por cero. Si faltan hombros, hay coordenadas no finitas o la escala es degenerada, el frame no produce F139. No se interpola, copia ni inventa información.

Una mano ausente aporta 63 coordenadas cero y presencia 0. Una mano presente aporta sus coordenadas normalizadas y presencia 1. Una pose válida requiere hombros y nariz según este contrato y presencia 1. Sin anclaje corporal válido no se incorpora la observación.

## 5. Tiempo

El timestamp procede del frame fuente. El primer frame válido de una sesión tiene `deltaMs = 0`; los posteriores calculan la diferencia contra el timestamp válido anterior y `deltaMsNorm = clip(deltaMs / 1000, 0, 1)`. Un frame descartado no crea observación, fila cero, copia del anterior ni tiempo falso. Cada runtime declarará explícitamente la política de reinicio entre sesiones.

## 6. Protección del dataset

Se adopta la Opción B: cada muestra conserva observaciones Lite crudas y el vector F139 derivado. Los datos raw conservarán únicamente información Lite necesaria para recalcular la geometría: Hands izquierda y derecha, 21 × XYZ cuando existan; Pose MP11, MP12 y MP0, además de campos crudos relevantes, incluida `visibility` cuando esté disponible. No se usarán Holistic, Face Mesh, F319 ni datos equivalentes. El raw Lite permite regenerar F139 sin recapturar cuando cambie una transformación compatible.

## 7. Nomenclatura y ruido

Se eliminan los identificadores artificiales `u001`, `u002`, etc. Las clases normales usarán identificadores humanos: mayúsculas, palabras separadas por `_`, sin códigos numéricos ni espacios. Ejemplos: `HOLA`, `BUENOS_DIAS`, `COMO_ESTAS`; sus archivos serán `HOLA.json`, etc. El metadata `glosa` conserva la forma natural. Renombrar una glosa es un cambio consciente de identidad o metadata según el contrato de dataset de FASE II.

Se preserva la clase técnica `ruido_background`, con índice 0, para reposo, movimientos no lingüísticos, transiciones, entradas y salidas de manos y secuencias que no deben reconocerse como señas. Nunca se presenta como palabra reconocida.

## 8. FIFO y paridad Training–Producción

Usuario conservará un FIFO continuo de `T=128` y `F=139`, shape `[128,139]`. No se limpia después de cada clasificación: cada observación válida se añade y se conservan las últimas 128 posiciones. No existe segmentación manual como requisito del usuario final.

Training debe diseñarse para el régimen temporal continuo de Usuario. No se asumirá que una seña aislada con padding equivale a una ventana FIFO continua con reposo y transiciones. FASE V incluirá explícitamente `ruido_background` y tensores compatibles con producción.

## 9. Cámara

El objetivo de stream es 640 × 480 a 30 FPS, entendido como stream solicitado o negociado. No implica 30 observaciones F139 por segundo. El throughput real Hands + Pose → F139 se comprobará físicamente.

## 10. Orden obligatorio de ejecución

### FASE I — Modificación del Configurador

Sustituir Holistic por Hands + Pose Lite e implementar captura F139 y raw Lite. Entregable: Configurador capaz de crear nuevas muestras bajo este contrato.

### FASE II — Contratos y documentación

Actualizar `contracts/` y la documentación base para que F139 y raw Lite sean el único esquema permitido.

### FASE III — Refundación de Usuario

Eliminar el código operativo legacy correspondiente y reconstruir cámara → Hands/Pose → vectorizador F139 → FIFO [128,139], inicialmente sin modelo IA, con throughput físico medido.

### FASE IV — Captura de datos

Generar el dataset real nuevo con Configurador Lite.

### FASE V — Training/Colab nuevo

Crear desde cero el pipeline F139, T128, GRU unidireccional, Softmax y Masking, compatible con FIFO continuo y background.

### FASE VI — Integración y prueba física

Exportar e integrar el nuevo modelo en `models/exportados/`, conectarlo al runtime Usuario Lite y realizar la prueba física. Si falla, se audita la evidencia del pipeline; si funciona, se certifica la arquitectura Lite.

## 11. Cancelaciones e historial

Quedan formalmente cancelados `USR-06.7`, nuevas optimizaciones incrementales del runtime Holistic, continuidad productiva de F319 y GRU-CTC/F308, y toda estrategia de compatibilidad con esos runtimes. Cuando una fase autorice retirar legacy, no se mantendrán carpetas `legacy/`, `old/`, `backup/` o `deprecated/` como copias. Git constituye el historial oficial.

## 12. Estado de esta tarea

Este commit es documental. No elimina todavía Holistic, no modifica Configurador, Usuario, datasets ni modelos, y no implementa F139. La FASE I no comienza con este contrato.
