# Graph Report - AulaSenas2  (2026-09-18)

## Corpus Check
- 99 files · ~51,068 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1348 nodes · 1895 edges · 117 communities (95 shown, 22 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `01631dac`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- usuario/src/main.js
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
- INTEGRACION_RECONOCIMIENTO.md
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
- LandmarkRenderer
- geminiProxy.ps1
- server/README.md
- enum
- derecha
- visual-frame.schema.json
- slotLandmark
- diagnosticos
- TextInterpreter
- claseBase
- x-aulasenas-invariants
- ClassCatalog
- UserInterface
- properties
- landmarksMano
- landmarksPose
- ValidatedDatasetStore
- LocalLandmarkExtractor.js
- SpeechService
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
- $defs
- LandmarkOverlay
- ConfiguratorUI
- contractValidator.js
- Translator
- configurador.test.js
- pose
- required
- type
- landmarksRostro
- VideoControls
- DataStore
- archivo
- properties
- id
- dataset-manifest.schema.json
- required
- VideoSegmentProcessor.js
- createdAt
- LandmarkPreview
- configurador/src/main.js
- rostro
- MemoryStorage
- updatedAt
- capturedAt
- significados
- tipo
- classId
- glosa
- version
- datasetId
- LocalLandmarkExtractor
- dataset-server.test.js
- ContractValidator.js
- VideoSource
- CameraController

## God Nodes (most connected - your core abstractions)
1. `ConfiguratorUI` - 29 edges
2. `DatasetService` - 20 edges
3. `ClassCatalog` - 15 edges
4. `ValidatedDatasetStore` - 14 edges
5. `normalizarLandmarksMano()` - 14 edges
6. `safeChild()` - 13 edges
7. `LandmarkOverlay` - 13 edges
8. `ejecutarFotograma()` - 13 edges
9. `TextInterpreter` - 13 edges
10. `$defs` - 13 edges

## Surprising Connections (you probably didn't know these)
- `withServer()` --calls--> `createConfiguratorServer()`  [EXTRACTED]
  apps/configurador/tests/dataset-server.test.js → apps/configurador/server/localServer.js
- `camera` --calls--> `loadStreamingContracts()`  [EXTRACTED]
  apps/usuario/src/main.js → apps/usuario/src/reconocimiento/contractValidator.js
- `decodeClassId()` --calls--> `assertSafeClassId()`  [EXTRACTED]
  apps/configurador/server/localServer.js → apps/configurador/server/DatasetService.js
- `assertManifestEntry()` --calls--> `classFileName()`  [EXTRACTED]
  apps/configurador/server/DatasetService.js → apps/configurador/src/almacenamiento/DatasetFormat.js
- `createConfiguratorServer()` --calls--> `safeChild()`  [EXTRACTED]
  apps/configurador/server/localServer.js → apps/configurador/server/DatasetService.js

## Import Cycles
- None detected.

## Communities (117 total, 22 thin omitted)

### Community 0 - "usuario/src/main.js"
Cohesion: 0.13
Nodes (10): UserPreferences, diagnosticoArranque, landmarkRenderer, preferences, removeLandmarkListener, removePresenceListener, speech, translator (+2 more)

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
Cohesion: 0.18
Nodes (26): aplanarLandmarksAVector63(), calcularDistanciaEuclidiana3D(), calcularEscalaFallback(), calcularEscalaMano(), calcularFactorEscalaPalma(), calcularMagnitud3D(), calcularPromedio(), configuracionNormalizacionMano (+18 more)

### Community 8 - "gru-ctc-streaming-input.schema.json"
Cohesion: 0.09
Nodes (25): additionalProperties, description, items, maxItems, minItems, type, items, maxItems (+17 more)

### Community 10 - "gruCtcModelLoader.js"
Cohesion: 0.21
Nodes (12): cargar(), cargarJson(), cargarRecursos(), configurar(), copiar(), marcarArranque(), notificar(), obtenerEstado() (+4 more)

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
Cohesion: 0.33
Nodes (5): Documentación de Usuario, Estado de disponibilidad, Flujo, Reconocimiento, Texto, voz y preferencias

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
Cohesion: 0.33
Nodes (5): Alcance reservado, Estado actual, Modelo utilizado mientras el entrenamiento está pausado, Relación entre áreas, Training

### Community 42 - "gru-ctc-streaming-frame.schema.json"
Cohesion: 0.20
Nodes (9): description, $id, items, type, maxItems, minItems, $schema, title (+1 more)

### Community 48 - "items"
Cohesion: 0.20
Nodes (10): description, items, minItems, type, additionalProperties, required, type, classId (+2 more)

### Community 49 - "dataset-class.schema.json"
Cohesion: 0.08
Nodes (25): additionalProperties, description, $ref, description, $id, allOf, description, items (+17 more)

### Community 50 - "LandmarkRenderer"
Cohesion: 0.29
Nodes (3): FACE_CONNECTIONS, LandmarkRenderer, POSE_CONNECTIONS

### Community 51 - "geminiProxy.ps1"
Cohesion: 0.46
Nodes (7): Add-CorsHeaders(), Get-GeminiText(), Get-RequestText(), Get-UpstreamStatus(), Handle-Request(), Invoke-Gemini(), Write-JsonResponse()

### Community 53 - "enum"
Cohesion: 0.05
Nodes (41): enum, enum, diagnosticoCalidad, handednessOriginal, additionalProperties, description, properties, required (+33 more)

### Community 54 - "derecha"
Cohesion: 0.13
Nodes (15): additionalProperties, allOf, properties, type, additionalProperties, allOf, properties, type (+7 more)

### Community 55 - "visual-frame.schema.json"
Cohesion: 0.08
Nodes (24): additionalProperties, $comment, description, description, minimum, type, $id, $ref (+16 more)

### Community 56 - "slotLandmark"
Cohesion: 0.10
Nodes (21): slotLandmark, minimum, type, minLength, type, minimum, type, indiceMediaPipe (+13 more)

### Community 57 - "diagnosticos"
Cohesion: 0.11
Nodes (24): additionalProperties, properties, type, additionalProperties, properties, type, componenteObservadoPose, componenteObservadoRostro (+16 more)

### Community 58 - "TextInterpreter"
Cohesion: 0.28
Nodes (3): normalizeText(), TEXT_INTERPRETER_CONFIG, TextInterpreter

### Community 59 - "claseBase"
Cohesion: 0.25
Nodes (8): additionalProperties, type, x-aulasenas-invariants, claseBase, classId no cambia al agregar, eliminar o editar significados., glosa identifica la forma visual; los significados de una clase normal contienen interpretaciones lingüísticas del mismo nivel y no cambian la identidad reconocida por Training., Los elementos de significados son textos únicos por igualdad JSON exacta dentro de cada clase normal., Todos los elementos de significados tienen el mismo nivel semántico.

### Community 60 - "x-aulasenas-invariants"
Cohesion: 0.25
Nodes (8): x-aulasenas-invariants, Cada archivo aparece una sola vez en clases., Cada classId aparece una sola vez en clases., datasetId permanece estable entre versiones del mismo dataset., Para cada entrada clases[N], el archivo referido satisface dataset-class.schema.json y clases[N].classId === archivo.clase.classId., Training recorre manifest.json, después cada archivo listado y finalmente muestras, sin depender de la UI ni de nombres derivados de glosas., updatedAt >= createdAt., version aumenta de forma estricta al publicar un cambio de contenido o de índice.

### Community 62 - "UserInterface"
Cohesion: 0.20
Nodes (3): camera, interpreter, UserInterface

### Community 63 - "properties"
Cohesion: 0.14
Nodes (14): manoSlot, oneOf, enum, additionalProperties, allOf, description, properties, type (+6 more)

### Community 64 - "landmarksMano"
Cohesion: 0.29
Nodes (7): landmarksMano, description, items, maxItems, minItems, prefixItems, type

### Community 65 - "landmarksPose"
Cohesion: 0.29
Nodes (7): landmarksPose, description, items, maxItems, minItems, prefixItems, type

### Community 67 - "LocalLandmarkExtractor.js"
Cohesion: 0.16
Nodes (23): absentHand(), absentSlots(), buildComponent(), buildHand(), buildHands(), buildNormalized(), buildSlots(), buildVisualPayload() (+15 more)

### Community 68 - "SpeechService"
Cohesion: 0.35
Nodes (3): normalizeLanguage(), selectSpanishVoice(), SpeechService

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

### Community 81 - "$defs"
Cohesion: 0.29
Nodes (8): $defs, observacionManos, required, additionalProperties, required, type, derecha, izquierda

### Community 82 - "LandmarkOverlay"
Cohesion: 0.23
Nodes (5): extractor, HAND_CONNECTIONS, LandmarkOverlay, POSE_CONNECTIONS, project()

### Community 83 - "ConfiguratorUI"
Cohesion: 0.21
Nodes (3): ConfiguratorUI, escapeHtml(), formatTime()

### Community 84 - "contractValidator.js"
Cohesion: 0.47
Nodes (7): loadInputContract(), loadSchema(), loadStreamingContracts(), validateInputContract(), validateStreamingFrameSchema(), validateStreamingInput(), validateStreamingInputSchema()

### Community 86 - "configurador.test.js"
Cohesion: 0.18
Nodes (3): SampleWorkflow, validateSample(), validClassContract

### Community 87 - "pose"
Cohesion: 0.22
Nodes (9): observacionVisual, additionalProperties, description, properties, type, additionalProperties, $ref, type (+1 more)

### Community 88 - "required"
Cohesion: 0.40
Nodes (5): required, classId, estado, tipo, glosa

### Community 89 - "type"
Cohesion: 0.29
Nodes (7): minimum, type, null, type, indiceManoMediaPipe, integer, string

### Community 90 - "landmarksRostro"
Cohesion: 0.29
Nodes (7): landmarksRostro, description, items, maxItems, minItems, prefixItems, type

### Community 93 - "archivo"
Cohesion: 0.25
Nodes (8): description, pattern, type, description, $ref, properties, archivo, classId

### Community 94 - "properties"
Cohesion: 0.25
Nodes (8): properties, stage, version, const, description, description, minimum, type

### Community 95 - "id"
Cohesion: 0.67
Nodes (3): minLength, type, id

### Community 96 - "dataset-manifest.schema.json"
Cohesion: 0.29
Nodes (6): additionalProperties, description, $id, $schema, title, type

### Community 97 - "required"
Cohesion: 0.29
Nodes (7): required, clases, createdAt, datasetId, stage, updatedAt, version

### Community 99 - "createdAt"
Cohesion: 0.50
Nodes (4): description, format, type, createdAt

### Community 100 - "LandmarkPreview"
Cohesion: 0.31
Nodes (3): isAdvancing(), isFrameReady(), LandmarkPreview

### Community 101 - "configurador/src/main.js"
Cohesion: 0.17
Nodes (11): classCatalog, contracts, datasetStore, overlay, pendingCapture, sampleCounts, source, ui (+3 more)

### Community 102 - "rostro"
Cohesion: 0.18
Nodes (11): representacionNormalizada, description, metodo, rostro, additionalProperties, description, properties, type (+3 more)

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

### Community 111 - "datasetId"
Cohesion: 0.50
Nodes (4): description, minLength, type, datasetId

### Community 112 - "LocalLandmarkExtractor"
Cohesion: 0.22
Nodes (6): capture, landmarkPreview, segmentProcessor, createDetector(), LocalLandmarkExtractor, sampleFor()

### Community 113 - "dataset-server.test.js"
Cohesion: 0.27
Nodes (7): assertCatalog(), initializeDataset(), isRecord(), appRoot, contractsRoot, projectRoot, withServer()

## Knowledge Gaps
- **566 isolated node(s):** `name`, `private`, `version`, `type`, `check` (+561 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `$defs` connect `$defs` to `landmarksMano`, `landmarksPose`, `rostro`, `enum`, `pose`, `visual-frame.schema.json`, `slotLandmark`, `diagnosticos`, `landmarksRostro`, `properties`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `ConfiguratorUI` connect `ConfiguratorUI` to `configurador/src/main.js`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `VideoControls` connect `VideoControls` to `configurador/src/main.js`, `configurador.test.js`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _566 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `usuario/src/main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1323529411764706 - nodes in this community are weakly interconnected._
- **Should `handsDetector.js` be split into smaller, more focused modules?**
  _Cohesion score 0.059227921734531994 - nodes in this community are weakly interconnected._
- **Should `heuristicRules.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08461538461538462 - nodes in this community are weakly interconnected._