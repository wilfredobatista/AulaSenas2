# Graph Report - AulaSenas2  (2026-09-25)

## Corpus Check
- 114 files · ~6,719,253 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1046 nodes · 1523 edges · 71 communities (54 shown, 17 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0ff0b829`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- configurador.test.js
- CaptureSession
- usuario/src/vision/LiteFrameExtractor.js
- RuntimeMetrics
- LiteOverlay
- package.json
- Reglas de desarrollo de AulaSenas2
- LiteModelRuntime.js
- vectorizer.py
- usuario/src/vision/LiteVectorizer139.js
- CameraController
- DataStore
- LandmarkOverlay
- What You Must Do When Invoked
- graphify reference: extra exports and benchmark
- configurador/package.json
- lite-hand.schema.json
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
- FakeDocument
- extraction-spec.md
- MemoryStorage
- lite-point.schema.json
- frame.schema.json
- UserLiteUI
- usuario/README.md
- LiteFifo20
- run_train02.py
- AulaSeñas GRU-CTC TensorFlow.js
- Models
- Training
- ContractValidator.js
- LandmarkPreview
- usuario/src/main.js
- CaptureController
- VideoSource
- VectorizedSample
- dataset-manifest.schema.json
- dataset-class.schema.json
- liteInferenceFlow.test.js
- geminiProxy.ps1
- server/README.md
- lite-pipeline.test.js
- lite-raw.schema.json
- sample-source.schema.json
- sample-time.schema.json
- sign-class.schema.json
- DatasetService.js
- properties
- ConfiguratorUI
- FakeElement
- ClassCatalog
- VideoControls
- manifest.json
- AULASENAS2-LITE
- DatasetReader
- configurador/src/main.js
- dataset-server.test.js
- stratified_split
- test_vectorizer.py

## God Nodes (most connected - your core abstractions)
1. `ConfiguratorUI` - 41 edges
2. `DatasetService` - 19 edges
3. `ClassCatalog` - 15 edges
4. `ValidatedDatasetStore` - 14 edges
5. `run()` - 14 edges
6. `FakeElement` - 13 edges
7. `VectorizationError` - 13 edges
8. `AULASENAS2-LITE` - 13 edges
9. `safeChild()` - 12 edges
10. `VideoControls` - 12 edges

## Surprising Connections (you probably didn't know these)
- `run()` --uses--> `InvalidTorsoReferenceError`  [INFERRED]
  training/run_train02.py → training/vectorizer.py
- `run()` --uses--> `VectorizationError`  [INFERRED]
  training/run_train02.py → training/vectorizer.py
- `VectorizerTests` --uses--> `InvalidTorsoReferenceError`  [INFERRED]
  training/tests/test_vectorizer.py → training/vectorizer.py
- `VectorizerTests` --uses--> `VectorizationError`  [INFERRED]
  training/tests/test_vectorizer.py → training/vectorizer.py
- `assertLiteDocument()` --calls--> `validateSample()`  [EXTRACTED]
  apps/configurador/server/DatasetService.js → apps/configurador/src/validacion/validateSample.js

## Import Cycles
- None detected.

## Communities (71 total, 17 thin omitted)

### Community 0 - "configurador.test.js"
Cohesion: 0.14
Nodes (8): CLASS_UI_STATE, formatClock(), formatMarkerClock(), OPERATION_UI_STATE, SEGMENT_UI_STATE, sortClassesForDisplay(), createUiHarness(), validClassContract

### Community 2 - "usuario/src/vision/LiteFrameExtractor.js"
Cohesion: 0.26
Nodes (7): buildRawLite(), copyHand(), copyPoint(), isFinitePoint(), LiteFrameExtractor, makeRunner(), points

### Community 3 - "RuntimeMetrics"
Cohesion: 0.22
Nodes (4): capped(), percent(), RuntimeMetrics, stats()

### Community 4 - "LiteOverlay"
Cohesion: 0.32
Nodes (3): CONNECTIONS, LiteOverlay, project()

### Community 5 - "package.json"
Cohesion: 0.25
Nodes (7): name, private, scripts, check, test, type, version

### Community 6 - "Reglas de desarrollo de AulaSenas2"
Cohesion: 0.20
Nodes (9): Aplicaciones, AulaSenas2-Lite, Dependencias, Forma de trabajo, graphify, Prohibiciones, Regla principal, Reglas de desarrollo de AulaSenas2 (+1 more)

### Community 7 - "LiteModelRuntime.js"
Cohesion: 0.14
Nodes (8): LITE_MODEL_BASE_PATH, LITE_MODEL_CLASSES, LITE_MODEL_SHAPE, LiteModelRuntime, sameShape(), validateArtifacts(), classMapping, metadata

### Community 8 - "vectorizer.py"
Cohesion: 0.21
Nodes (19): _finite_number(), InvalidTorsoReferenceError, _landmarks(), _normalized_xyz(), _point(), Any, ValueError, Normalización torso-céntrica y vectorización contractual ``[T, 319]``. La única… (+11 more)

### Community 9 - "usuario/src/vision/LiteVectorizer139.js"
Cohesion: 0.23
Nodes (10): handVector(), invalid(), isPoint(), LITE_FEATURES, LiteVectorizer139, normalize(), extraction(), hand() (+2 more)

### Community 12 - "LandmarkOverlay"
Cohesion: 0.26
Nodes (4): extractor, HAND_CONNECTIONS, LandmarkOverlay, project()

### Community 13 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native AGENTS.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 14 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 15 - "configurador/package.json"
Cohesion: 0.17
Nodes (11): ajv, dependencies, ajv, name, private, scripts, check, configurador (+3 more)

### Community 16 - "lite-hand.schema.json"
Cohesion: 0.33
Nodes (5): description, $id, oneOf, $schema, title

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

### Community 33 - "lite-point.schema.json"
Cohesion: 0.09
Nodes (21): additionalProperties, description, $id, properties, visibility, x, y, z (+13 more)

### Community 34 - "frame.schema.json"
Cohesion: 0.06
Nodes (34): additionalProperties, description, minimum, type, anyOf, $id, type, properties (+26 more)

### Community 35 - "UserLiteUI"
Cohesion: 0.16
Nodes (5): modelRuntime, predictCurrentWindow(), processPredictionForText(), resetSegment(), UserLiteUI

### Community 38 - "run_train02.py"
Cohesion: 0.16
Nodes (18): main(), _percentile(), ProcessedSample, Path, Ejecuta TRAIN-02: lectura, vectorización, split y reporte, sin entrenar., Escribe un resultado legible, estable y terminado en nueva línea., Ejecuta el pipeline y genera los tres artefactos de TRAIN-02. Los vectores se…, Parsea rutas relativas al repositorio y ejecuta TRAIN-02. (+10 more)

### Community 39 - "AulaSeñas GRU-CTC TensorFlow.js"
Cohesion: 0.33
Nodes (5): AulaSeñas GRU-CTC TensorFlow.js, Contrato de ejecución, Decodificación CTC, Estado recurrente, Nodos reales

### Community 40 - "Models"
Cohesion: 0.33
Nodes (5): Bundle vigente, Integridad, Models, Propósito, Relación con Training y Usuario

### Community 41 - "Training"
Cohesion: 0.29
Nodes (6): Alcance reservado, Estado actual, Modelo utilizado mientras el entrenamiento está pausado, Relación entre áreas, TRAIN-02: preparación de entrada, Training

### Community 42 - "ContractValidator.js"
Cohesion: 0.27
Nodes (3): ContractValidator, formatAjvError(), registerLiteKeywords()

### Community 43 - "LandmarkPreview"
Cohesion: 0.31
Nodes (3): isAdvancing(), isFrameReady(), LandmarkPreview

### Community 44 - "usuario/src/main.js"
Cohesion: 0.17
Nodes (10): camera, extractor, fifo, metrics, overlay, recognizedUnits, SEGMENT_STATES, ui (+2 more)

### Community 47 - "VectorizedSample"
Cohesion: 0.50
Nodes (3): Secuencia variable y deltas crudos usados para diagnóstico., Devuelve T real, preservado sin padding ni remuestreo., VectorizedSample

### Community 48 - "dataset-manifest.schema.json"
Cohesion: 0.04
Nodes (48): additionalProperties, pattern, type, items, type, oneOf, format, type (+40 more)

### Community 49 - "dataset-class.schema.json"
Cohesion: 0.09
Nodes (22): additionalProperties, $ref, const, $id, allOf, featureContract, items, type (+14 more)

### Community 51 - "geminiProxy.ps1"
Cohesion: 0.46
Nodes (7): Add-CorsHeaders(), Get-GeminiText(), Get-RequestText(), Get-UpstreamStatus(), Handle-Request(), Invoke-Gemini(), Write-JsonResponse()

### Community 61 - "lite-pipeline.test.js"
Cohesion: 0.07
Nodes (33): VideoSegmentProcessor, SampleWorkflow, sameVector(), validateFrame(), validateSample(), buildRawLite(), copyPoint(), copyPoints() (+25 more)

### Community 63 - "lite-raw.schema.json"
Cohesion: 0.06
Nodes (35): additionalProperties, description, additionalProperties, properties, required, type, $id, $ref (+27 more)

### Community 69 - "sample-source.schema.json"
Cohesion: 0.25
Nodes (7): $id, oneOf, $schema, title, x-aulasenas-invariants, fuente.video.duracionSegmentoMs === finSegmentoMs - inicioSegmentoMs, fuente.video.finSegmentoMs >= fuente.video.inicioSegmentoMs

### Community 70 - "sample-time.schema.json"
Cohesion: 0.07
Nodes (26): additionalProperties, minimum, type, description, minimum, type, minimum, type (+18 more)

### Community 74 - "sign-class.schema.json"
Cohesion: 0.05
Nodes (42): additionalProperties, properties, required, type, minLength, type, pattern, type (+34 more)

### Community 76 - "DatasetService.js"
Cohesion: 0.08
Nodes (42): assertDocumentInvariants(), assertLiteClassId(), assertLiteDataset(), assertLiteDocument(), assertManifestEntry(), assertManifestInvariants(), assertMatchingClassId(), assertSafeClassId() (+34 more)

### Community 77 - "properties"
Cohesion: 0.06
Nodes (35): additionalProperties, format, type, oneOf, description, const, items, minItems (+27 more)

### Community 90 - "ClassCatalog"
Cohesion: 0.23
Nodes (3): ClassCatalog, clone(), humanClassId()

### Community 92 - "manifest.json"
Cohesion: 0.25
Nodes (7): clases, createdAt, datasetId, featureContract, stage, updatedAt, version

### Community 98 - "AULASENAS2-LITE"
Cohesion: 0.07
Nodes (26): Arquitectura AulaSenas2-Lite, Datos y contratos, Estado vigente, Estructura, Separación de aplicaciones, 10. Orden obligatorio de ejecución, 11. Cancelaciones e historial, 12. Estado de esta tarea (+18 more)

### Community 99 - "DatasetReader"
Cohesion: 0.12
Nodes (19): DatasetFormatError, DatasetReader, Any, Path, ValueError, Lectura validada y de solo lectura del dataset usado por TRAIN-02. Traduce la…, Indica que el dataset no cumple la estructura mínima requerida., Lee JSON y convierte errores de I/O/sintaxis en diagnóstico localizable. (+11 more)

### Community 101 - "configurador/src/main.js"
Cohesion: 0.11
Nodes (14): capture, classCatalog, contracts, datasetStore, landmarkPreview, overlay, pendingCapture, sampleCounts (+6 more)

### Community 102 - "dataset-server.test.js"
Cohesion: 0.11
Nodes (13): assertCatalog(), bootstrapDataset(), initializeDataset(), isRecord(), readCatalog(), ValidatedDatasetStore, reloadCatalog(), appRoot (+5 more)

### Community 111 - "stratified_split"
Cohesion: 0.10
Nodes (20): Protocol, _allocate_counts(), _class_seed(), Mapping estable y split piloto estratificado por muestras independientes., Campos mínimos del split, sin acoplarlo al vectorizador., Asignación serializable de una muestra a un único subconjunto., Aplica mayor residuo con desempate train/validation/test., Deriva semilla estable, independiente del hash aleatorio de Python. (+12 more)

### Community 117 - "test_vectorizer.py"
Cohesion: 0.15
Nodes (18): DatasetSample, Muestra independiente; ``class_id`` es la identidad de entrenamiento., _absent_landmarks(), _frame(), _landmark(), Pruebas del layout F=319 y de la política geométrica/temporal., Construye un landmark contractual sintético para una prueba aislada., Representa una ausencia sin inventar geometría. (+10 more)

## Knowledge Gaps
- **363 isolated node(s):** `name`, `private`, `version`, `type`, `check` (+358 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ConfiguratorUI` connect `ConfiguratorUI` to `configurador.test.js`, `configurador/src/main.js`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `ValidatedDatasetStore` connect `dataset-server.test.js` to `configurador/src/main.js`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `VideoControls` connect `VideoControls` to `configurador.test.js`, `configurador/src/main.js`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `run()` (e.g. with `InvalidTorsoReferenceError` and `VectorizationError`) actually correct?**
  _`run()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _363 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `configurador.test.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13725490196078433 - nodes in this community are weakly interconnected._
- **Should `LiteModelRuntime.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1437908496732026 - nodes in this community are weakly interconnected._