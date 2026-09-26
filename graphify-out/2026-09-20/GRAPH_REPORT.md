# Graph Report - AulaSenas2  (2026-09-20)

## Corpus Check
- 135 files · ~22,896,697 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1612 nodes · 2351 edges · 132 communities (107 shown, 25 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 44 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `01631dac`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- TextInterpreter
- handsDetector.js
- inputShape.js
- heuristicRules.js
- gruCtcStreamingRecognizer.js
- package.json
- Reglas de desarrollo de AulaSenas2
- normalizer.js
- gru-ctc-streaming-input.schema.json
- LandmarkExtractor
- gruCtcModelLoader.js
- Transición al modelo piloto GRU + Softmax
- CaptureController
- What You Must Do When Invoked
- graphify reference: extra exports and benchmark
- configurador/package.json
- Arquitectura de AulaSenas2
- graphify reference: query, path, explain
- Skill común de AulaSenas2
- Work Configurador
- Work Contratos
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native AGENTS.md integration
- graphify reference: incremental update and cluster-only
- Work Training
- Work Usuario
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- Work QA
- README.md
- extraction-spec.md
- properties
- sample-metadata.schema.json
- landmark-point.schema.json
- frame.schema.json
- gru-ctc-input.schema.json
- Documentación de Usuario
- data-stages.schema.json
- landmarks.schema.json
- AulaSeñas GRU-CTC TensorFlow.js
- Models
- Training
- gru-ctc-streaming-frame.schema.json
- SequenceBuffer
- MediaPipeAdapter
- ctcDecoder.js
- handsConfig.js
- items
- dataset-class.schema.json
- handsDetectorPose.test.js
- geminiProxy.ps1
- server/README.md
- enum
- derecha
- visual-frame.schema.json
- slotLandmark
- diagnosticos
- pilotGruModelLoader.js
- claseBase
- x-aulasenas-invariants
- ClassCatalog
- configurador.test.js
- properties
- landmarksMano
- landmarksPose
- landmarksRostro
- LocalLandmarkExtractor.js
- type
- required
- sample-time.schema.json
- estado
- x-aulasenas-invariants
- properties
- sign-class.schema.json
- class-meaning.schema.json
- DatasetService.js
- captured-sample.schema.json
- required
- frames
- enum
- properties
- LandmarkOverlay
- ConfiguratorUI
- contractValidator.js
- UserInterface
- createdAt
- required
- FakeElement
- pilotParityBrowser.js
- VideoControls
- manifest.json
- archivo
- usuario/src/main.js
- id
- dataset-manifest.schema.json
- required
- DataStore
- DatasetReader
- LandmarkPreview
- configurador/src/main.js
- ValidatedDatasetStore
- SpeechService
- updatedAt
- capturedAt
- significados
- tipo
- classId
- glosa
- version
- stratified_split
- dataset-server.test.js
- VideoSegmentProcessor.js
- ContractValidator.js
- VideoSource
- CameraController
- test_vectorizer.py
- vectorizer.py
- run_train02.py
- FakeDocument
- validateSample
- MemoryStorage
- rostro
- parity/README.md
- LocalLandmarkExtractor
- pose
- Translator
- $defs
- UserPreferences
- version
- VectorizedSample

## God Nodes (most connected - your core abstractions)
1. `ConfiguratorUI` - 41 edges
2. `DatasetService` - 20 edges
3. `ClassCatalog` - 15 edges
4. `PilotGruModelLoader` - 15 edges
5. `ValidatedDatasetStore` - 14 edges
6. `run()` - 14 edges
7. `safeChild()` - 13 edges
8. `LandmarkOverlay` - 13 edges
9. `FakeElement` - 13 edges
10. `ejecutarFotograma()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `withServer()` --calls--> `createConfiguratorServer()`  [EXTRACTED]
  apps/configurador/tests/dataset-server.test.js → apps/configurador/server/localServer.js
- `createVectorizer()` --indirect_call--> `normalizarFotogramaVisual()`  [INFERRED]
  apps/usuario/tests/pilotFrameVectorizer.test.js → apps/usuario/src/vision/normalizer.js
- `run()` --uses--> `InvalidTorsoReferenceError`  [INFERRED]
  training/run_train02.py → training/vectorizer.py
- `run()` --uses--> `VectorizationError`  [INFERRED]
  training/run_train02.py → training/vectorizer.py
- `VectorizerTests` --uses--> `InvalidTorsoReferenceError`  [INFERRED]
  training/tests/test_vectorizer.py → training/vectorizer.py

## Import Cycles
- None detected.

## Communities (132 total, 25 thin omitted)

### Community 0 - "TextInterpreter"
Cohesion: 0.28
Nodes (3): normalizeText(), TEXT_INTERPRETER_CONFIG, TextInterpreter

### Community 1 - "handsDetector.js"
Cohesion: 0.06
Nodes (56): abstraerPuntosClaveMano(), actualizarDiagnosticoResultadosManos(), calcularDistanciaPuntosMano(), configuracionExclusionMargenesCamara, configurarMaximoManosDetector(), construirBanderasExclusionDatos(), construirRepresentacionCanonicaManos(), construirSlotCanonicoMano() (+48 more)

### Community 2 - "inputShape.js"
Cohesion: 0.27
Nodes (5): InferenceAdapter, FRAME_FEATURES, LANDMARK_FEATURES, TEMPORAL_LENGTH, validateTemporalInput()

### Community 3 - "heuristicRules.js"
Cohesion: 0.08
Nodes (31): abstraerPuntoClaveMano(), abstraerPuntosClaveMano(), afirmarColeccionLandmarksTemplate(), afirmarCoordenadasPuntoTemplate(), afirmarFramesTemporalesCapturaFija(), afirmarIndicePuntoTemplate(), afirmarNombrePuntoTemplate(), afirmarPresenciaExplicitaPuntosTemplate() (+23 more)

### Community 4 - "gruCtcStreamingRecognizer.js"
Cohesion: 0.17
Nodes (30): ahoraMonotonoMs(), aplicarFronteraAusenciaEstable(), cancelarCola(), classIdDesdeEtiqueta(), construirEntrada308(), construirVisual307(), copiarConteos(), detener() (+22 more)

### Community 5 - "package.json"
Cohesion: 0.25
Nodes (7): name, private, scripts, check, test, type, version

### Community 6 - "Reglas de desarrollo de AulaSenas2"
Cohesion: 0.22
Nodes (8): Aplicaciones, Dependencias, Forma de trabajo, graphify, Prohibiciones, Regla principal, Reglas de desarrollo de AulaSenas2, Ubicación obligatoria

### Community 7 - "normalizer.js"
Cohesion: 0.12
Nodes (17): discarded(), normalizeDeltaMs(), PILOT_DELTA_INDEX, PILOT_FRAME_VECTOR_SIZE, PILOT_STATIC_FEATURES, PilotFrameVectorizer, calcularReferenciaTorso(), cerosGeometricos() (+9 more)

### Community 8 - "gru-ctc-streaming-input.schema.json"
Cohesion: 0.09
Nodes (25): additionalProperties, description, items, maxItems, minItems, type, items, maxItems (+17 more)

### Community 10 - "gruCtcModelLoader.js"
Cohesion: 0.21
Nodes (12): cargar(), cargarJson(), cargarRecursos(), configurar(), copiar(), marcarArranque(), notificar(), obtenerEstado() (+4 more)

### Community 11 - "Transición al modelo piloto GRU + Softmax"
Cohesion: 0.50
Nodes (3): Carga técnica del modelo, Paridad numérica pendiente, Transición al modelo piloto GRU + Softmax

### Community 13 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native AGENTS.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 14 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 15 - "configurador/package.json"
Cohesion: 0.17
Nodes (11): ajv, dependencies, ajv, name, private, scripts, check, configurador (+3 more)

### Community 16 - "Arquitectura de AulaSenas2"
Cohesion: 0.25
Nodes (7): Aplicación Configurador, Aplicación Usuario, Arquitectura de AulaSenas2, Contratos, Entrenamiento, Estructura, Separación

### Community 17 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 18 - "Skill común de AulaSenas2"
Cohesion: 0.40
Nodes (4): Documentacion de codigo, Regla de ejecución, Reglas generales, Skill común de AulaSenas2

### Community 19 - "Work Configurador"
Cohesion: 0.40
Nodes (4): Documentacion de codigo, Límites, Objetivo, Work Configurador

### Community 20 - "Work Contratos"
Cohesion: 0.40
Nodes (4): Documentacion de codigo, Límites, Objetivo, Work Contratos

### Community 21 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 22 - "graphify reference: commit hook and native AGENTS.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native AGENTS.md integration, graphify reference: commit hook and native AGENTS.md integration

### Community 23 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 24 - "Work Training"
Cohesion: 0.40
Nodes (4): Documentacion de codigo, Límites, Objetivo, Work Training

### Community 25 - "Work Usuario"
Cohesion: 0.40
Nodes (4): Documentacion de codigo, Límites, Objetivo, Work Usuario

### Community 28 - "Work QA"
Cohesion: 0.50
Nodes (3): Documentacion de codigo, Objetivo, Work QA

### Community 31 - "properties"
Cohesion: 0.18
Nodes (11): description, $ref, $ref, description, $ref, properties, classId, fuente (+3 more)

### Community 32 - "sample-metadata.schema.json"
Cohesion: 0.12
Nodes (16): additionalProperties, description, $id, description, type, description, type, description (+8 more)

### Community 33 - "landmark-point.schema.json"
Cohesion: 0.11
Nodes (23): additionalProperties, description, $id, null, properties, visibilidad, x, y (+15 more)

### Community 34 - "frame.schema.json"
Cohesion: 0.33
Nodes (5): description, $id, $ref, $schema, title

### Community 35 - "gru-ctc-input.schema.json"
Cohesion: 0.17
Nodes (12): description, $id, items, items, maxItems, minItems, type, maxItems (+4 more)

### Community 36 - "Documentación de Usuario"
Cohesion: 0.40
Nodes (4): Documentación de Usuario, Estado de la transición del reconocimiento, Flujo visual preparado, Texto, interpretación y voz

### Community 37 - "data-stages.schema.json"
Cohesion: 0.33
Nodes (5): allOf, description, $id, $schema, title

### Community 38 - "landmarks.schema.json"
Cohesion: 0.33
Nodes (5): description, $id, $ref, $schema, title

### Community 39 - "AulaSeñas GRU-CTC TensorFlow.js"
Cohesion: 0.33
Nodes (5): AulaSeñas GRU-CTC TensorFlow.js, Contrato de ejecución, Decodificación CTC, Estado recurrente, Nodos reales

### Community 40 - "Models"
Cohesion: 0.33
Nodes (5): Bundle vigente, Integridad, Models, Propósito, Relación con Training y Usuario

### Community 41 - "Training"
Cohesion: 0.29
Nodes (6): Alcance reservado, Estado actual, Modelo utilizado mientras el entrenamiento está pausado, Relación entre áreas, TRAIN-02: preparación de entrada, Training

### Community 42 - "gru-ctc-streaming-frame.schema.json"
Cohesion: 0.20
Nodes (9): description, $id, items, type, maxItems, minItems, $schema, title (+1 more)

### Community 48 - "items"
Cohesion: 0.20
Nodes (10): description, items, minItems, type, additionalProperties, required, type, classId (+2 more)

### Community 49 - "dataset-class.schema.json"
Cohesion: 0.08
Nodes (25): additionalProperties, description, $ref, description, $id, allOf, description, items (+17 more)

### Community 50 - "handsDetectorPose.test.js"
Cohesion: 0.12
Nodes (3): FACE_CONNECTIONS, LandmarkRenderer, POSE_CONNECTIONS

### Community 51 - "geminiProxy.ps1"
Cohesion: 0.46
Nodes (7): Add-CorsHeaders(), Get-GeminiText(), Get-RequestText(), Get-UpstreamStatus(), Handle-Request(), Invoke-Gemini(), Write-JsonResponse()

### Community 53 - "enum"
Cohesion: 0.05
Nodes (41): enum, enum, diagnosticoCalidad, handednessOriginal, additionalProperties, description, properties, required (+33 more)

### Community 54 - "derecha"
Cohesion: 0.13
Nodes (16): additionalProperties, allOf, properties, type, additionalProperties, allOf, properties, type (+8 more)

### Community 55 - "visual-frame.schema.json"
Cohesion: 0.08
Nodes (24): additionalProperties, $comment, description, description, minimum, type, $id, $ref (+16 more)

### Community 56 - "slotLandmark"
Cohesion: 0.10
Nodes (21): slotLandmark, minimum, type, minLength, type, minimum, type, indiceMediaPipe (+13 more)

### Community 57 - "diagnosticos"
Cohesion: 0.11
Nodes (23): additionalProperties, properties, type, additionalProperties, properties, type, componenteObservadoPose, componenteObservadoRostro (+15 more)

### Community 58 - "pilotGruModelLoader.js"
Cohesion: 0.11
Nodes (24): fail(), fetchJson(), isObject(), joinWebPath(), normalizeKeras3FunctionalTopology(), normalizeKeras3InputLayer(), PILOT_MODEL_BASE_PATH, PILOT_MODEL_CONTRACT (+16 more)

### Community 59 - "claseBase"
Cohesion: 0.25
Nodes (8): additionalProperties, type, x-aulasenas-invariants, claseBase, classId no cambia al agregar, eliminar o editar significados., glosa identifica la forma visual; los significados de una clase normal contienen interpretaciones lingüísticas del mismo nivel y no cambian la identidad reconocida por Training., Los elementos de significados son textos únicos por igualdad JSON exacta dentro de cada clase normal., Todos los elementos de significados tienen el mismo nivel semántico.

### Community 60 - "x-aulasenas-invariants"
Cohesion: 0.25
Nodes (8): x-aulasenas-invariants, Cada archivo aparece una sola vez en clases., Cada classId aparece una sola vez en clases., datasetId permanece estable entre versiones del mismo dataset., Para cada entrada clases[N], el archivo referido satisface dataset-class.schema.json y clases[N].classId === archivo.clase.classId., Training recorre manifest.json, después cada archivo listado y finalmente muestras, sin depender de la UI ni de nombres derivados de glosas., updatedAt >= createdAt., version aumenta de forma estricta al publicar un cambio de contenido o de índice.

### Community 62 - "configurador.test.js"
Cohesion: 0.09
Nodes (8): CLASS_UI_STATE, formatClock(), formatMarkerClock(), OPERATION_UI_STATE, SEGMENT_UI_STATE, sortClassesForDisplay(), createUiHarness(), validClassContract

### Community 63 - "properties"
Cohesion: 0.14
Nodes (14): manoSlot, oneOf, enum, additionalProperties, allOf, description, properties, type (+6 more)

### Community 64 - "landmarksMano"
Cohesion: 0.29
Nodes (7): landmarksMano, description, items, maxItems, minItems, prefixItems, type

### Community 65 - "landmarksPose"
Cohesion: 0.29
Nodes (7): landmarksPose, description, items, maxItems, minItems, prefixItems, type

### Community 66 - "landmarksRostro"
Cohesion: 0.29
Nodes (7): landmarksRostro, description, items, maxItems, minItems, prefixItems, type

### Community 67 - "LocalLandmarkExtractor.js"
Cohesion: 0.15
Nodes (24): absentHand(), absentSlots(), buildComponent(), buildHand(), buildHands(), buildNormalized(), buildSlots(), buildVisualPayload() (+16 more)

### Community 68 - "type"
Cohesion: 0.29
Nodes (7): minimum, type, null, type, indiceManoMediaPipe, integer, string

### Community 69 - "required"
Cohesion: 0.05
Nodes (47): additionalProperties, description, properties, required, type, $defs, camera, video (+39 more)

### Community 70 - "sample-time.schema.json"
Cohesion: 0.05
Nodes (37): additionalProperties, description, minimum, type, description, description, minimum, type (+29 more)

### Community 71 - "estado"
Cohesion: 0.20
Nodes (16): required, required, required, required, estado, required, required, required (+8 more)

### Community 72 - "x-aulasenas-invariants"
Cohesion: 0.18
Nodes (11): x-aulasenas-invariants, classId debe coincidir con classId de una clase válida según sign-class.schema.json, frames[0].frameIndex === 0, frames[0].timestampMs === 0, frames[N].frameIndex === N para todo N, frames[N].timestampMs > frames[N - 1].timestampMs para todo N > 0, si fuente.tipo === video: fuente.video.duracionSegmentoMs === tiempo.duracionMs, tiempo.cantidadFrames === frames.length (+3 more)

### Community 73 - "properties"
Cohesion: 0.33
Nodes (6): properties, description, enum, estado, activa, inactiva

### Community 74 - "sign-class.schema.json"
Cohesion: 0.15
Nodes (12): allOf, allOf, $comment, $defs, claseNormal, claseRuidoBackground, description, examples (+4 more)

### Community 75 - "class-meaning.schema.json"
Cohesion: 0.29
Nodes (6): description, $id, minLength, $schema, title, type

### Community 76 - "DatasetService.js"
Cohesion: 0.10
Nodes (30): assertDocumentInvariants(), assertManifestEntry(), assertManifestInvariants(), assertMatchingClassId(), assertSafeClassId(), atomicWriteJson(), DatasetContractValidator, DatasetRequestError (+22 more)

### Community 77 - "captured-sample.schema.json"
Cohesion: 0.25
Nodes (7): additionalProperties, $comment, description, $id, $schema, title, type

### Community 78 - "required"
Cohesion: 0.33
Nodes (6): classId, required, capturedAt, frames, fuente, tiempo

### Community 79 - "frames"
Cohesion: 0.33
Nodes (6): description, items, minItems, type, $ref, frames

### Community 80 - "enum"
Cohesion: 0.40
Nodes (5): stage, enum, processed, raw, validated

### Community 81 - "properties"
Cohesion: 0.25
Nodes (8): description, minLength, type, properties, datasetId, stage, const, description

### Community 82 - "LandmarkOverlay"
Cohesion: 0.23
Nodes (5): extractor, HAND_CONNECTIONS, LandmarkOverlay, POSE_CONNECTIONS, project()

### Community 84 - "contractValidator.js"
Cohesion: 0.47
Nodes (7): loadInputContract(), loadSchema(), loadStreamingContracts(), validateInputContract(), validateStreamingFrameSchema(), validateStreamingInput(), validateStreamingInputSchema()

### Community 86 - "UserInterface"
Cohesion: 0.18
Nodes (4): camera, interpreter, reflectPilotModelState(), UserInterface

### Community 87 - "createdAt"
Cohesion: 0.50
Nodes (4): description, format, type, createdAt

### Community 88 - "required"
Cohesion: 0.40
Nodes (5): required, classId, estado, tipo, glosa

### Community 90 - "pilotParityBrowser.js"
Cohesion: 0.14
Nodes (17): CASE_DEFINITIONS, createParityCase(), createPilotParityCases(), PARITY_SHAPE, PARITY_VALUE_COUNT, compareParityCase(), compareRepeatedRuns(), PARITY_MAX_ABS_TOLERANCE (+9 more)

### Community 92 - "manifest.json"
Cohesion: 0.29
Nodes (6): clases, createdAt, datasetId, stage, updatedAt, version

### Community 93 - "archivo"
Cohesion: 0.25
Nodes (8): description, pattern, type, description, $ref, properties, archivo, classId

### Community 94 - "usuario/src/main.js"
Cohesion: 0.14
Nodes (12): diagnosticoArranque, landmarkRenderer, pilotFrameVectorizer, pilotModelLoader, preferences, removeLandmarkListener, removePilotFrameListener, removePresenceListener (+4 more)

### Community 95 - "id"
Cohesion: 0.67
Nodes (3): minLength, type, id

### Community 96 - "dataset-manifest.schema.json"
Cohesion: 0.29
Nodes (6): additionalProperties, description, $id, $schema, title, type

### Community 97 - "required"
Cohesion: 0.29
Nodes (7): required, clases, createdAt, datasetId, stage, updatedAt, version

### Community 99 - "DatasetReader"
Cohesion: 0.12
Nodes (19): DatasetFormatError, DatasetReader, Any, Path, ValueError, Lectura validada y de solo lectura del dataset usado por TRAIN-02. Traduce la…, Indica que el dataset no cumple la estructura mínima requerida., Lee JSON y convierte errores de I/O/sintaxis en diagnóstico localizable. (+11 more)

### Community 100 - "LandmarkPreview"
Cohesion: 0.31
Nodes (3): isAdvancing(), isFrameReady(), LandmarkPreview

### Community 101 - "configurador/src/main.js"
Cohesion: 0.13
Nodes (11): classCatalog, contracts, datasetStore, overlay, pendingCapture, sampleCounts, source, ui (+3 more)

### Community 102 - "ValidatedDatasetStore"
Cohesion: 0.24
Nodes (3): readCatalog(), ValidatedDatasetStore, reloadCatalog()

### Community 103 - "SpeechService"
Cohesion: 0.35
Nodes (3): normalizeLanguage(), selectSpanishVoice(), SpeechService

### Community 104 - "updatedAt"
Cohesion: 0.50
Nodes (4): updatedAt, description, format, type

### Community 105 - "capturedAt"
Cohesion: 0.50
Nodes (4): description, format, type, capturedAt

### Community 106 - "significados"
Cohesion: 0.40
Nodes (5): $ref, significados, description, items, type

### Community 107 - "tipo"
Cohesion: 0.40
Nodes (5): tipo, description, enum, normal, ruido_background

### Community 108 - "classId"
Cohesion: 0.50
Nodes (4): description, minLength, type, classId

### Community 109 - "glosa"
Cohesion: 0.50
Nodes (4): description, minLength, type, glosa

### Community 110 - "version"
Cohesion: 0.50
Nodes (4): version, description, minimum, type

### Community 111 - "stratified_split"
Cohesion: 0.10
Nodes (20): Protocol, _allocate_counts(), _class_seed(), Mapping estable y split piloto estratificado por muestras independientes., Campos mínimos del split, sin acoplarlo al vectorizador., Asignación serializable de una muestra a un único subconjunto., Aplica mayor residuo con desempate train/validation/test., Deriva semilla estable, independiente del hash aleatorio de Python. (+12 more)

### Community 112 - "dataset-server.test.js"
Cohesion: 0.25
Nodes (8): assertCatalog(), bootstrapDataset(), initializeDataset(), isRecord(), appRoot, contractsRoot, projectRoot, withServer()

### Community 116 - "CameraController"
Cohesion: 0.22
Nodes (3): CameraController, deferred(), onFrame()

### Community 117 - "test_vectorizer.py"
Cohesion: 0.15
Nodes (18): DatasetSample, Muestra independiente; ``class_id`` es la identidad de entrenamiento., _absent_landmarks(), _frame(), _landmark(), Pruebas del layout F=319 y de la política geométrica/temporal., Construye un landmark contractual sintético para una prueba aislada., Representa una ausencia sin inventar geometría. (+10 more)

### Community 118 - "vectorizer.py"
Cohesion: 0.21
Nodes (19): _finite_number(), InvalidTorsoReferenceError, _landmarks(), _normalized_xyz(), _point(), Any, ValueError, Normalización torso-céntrica y vectorización contractual ``[T, 319]``. La única… (+11 more)

### Community 119 - "run_train02.py"
Cohesion: 0.16
Nodes (18): main(), _percentile(), ProcessedSample, Path, Ejecuta TRAIN-02: lectura, vectorización, split y reporte, sin entrenar., Escribe un resultado legible, estable y terminado en nueva línea., Ejecuta el pipeline y genera los tres artefactos de TRAIN-02. Los vectores se…, Parsea rutas relativas al repositorio y ejecuta TRAIN-02. (+10 more)

### Community 123 - "rostro"
Cohesion: 0.18
Nodes (11): representacionNormalizada, description, metodo, rostro, additionalProperties, description, properties, type (+3 more)

### Community 125 - "LocalLandmarkExtractor"
Cohesion: 0.22
Nodes (6): capture, landmarkPreview, segmentProcessor, createDetector(), LocalLandmarkExtractor, sampleFor()

### Community 126 - "pose"
Cohesion: 0.22
Nodes (9): observacionVisual, additionalProperties, description, properties, type, additionalProperties, $ref, type (+1 more)

### Community 128 - "$defs"
Cohesion: 0.29
Nodes (8): $defs, observacionManos, required, additionalProperties, required, type, derecha, izquierda

### Community 130 - "version"
Cohesion: 0.50
Nodes (4): version, description, minimum, type

### Community 131 - "VectorizedSample"
Cohesion: 0.50
Nodes (3): Secuencia variable y deltas crudos usados para diagnóstico., Devuelve T real, preservado sin padding ni remuestreo., VectorizedSample

## Knowledge Gaps
- **590 isolated node(s):** `name`, `private`, `version`, `type`, `check` (+585 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `$defs` connect `$defs` to `landmarksMano`, `landmarksPose`, `landmarksRostro`, `enum`, `visual-frame.schema.json`, `slotLandmark`, `diagnosticos`, `rostro`, `pose`, `properties`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `ConfiguratorUI` connect `ConfiguratorUI` to `configurador/src/main.js`, `configurador.test.js`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `LocalLandmarkExtractor` connect `LocalLandmarkExtractor` to `dataset-server.test.js`, `LocalLandmarkExtractor.js`, `configurador/src/main.js`, `configurador.test.js`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _590 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `handsDetector.js` be split into smaller, more focused modules?**
  _Cohesion score 0.059227921734531994 - nodes in this community are weakly interconnected._
- **Should `heuristicRules.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08461538461538462 - nodes in this community are weakly interconnected._
- **Should `normalizer.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1164021164021164 - nodes in this community are weakly interconnected._