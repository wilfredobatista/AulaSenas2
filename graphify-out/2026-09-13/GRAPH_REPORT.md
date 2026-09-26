# Graph Report - AulaSenas2  (2026-09-12)

## Corpus Check
- 77 files · ~33,224 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 642 nodes · 872 edges · 51 communities (39 shown, 12 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.83)
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
- configurador/src/main.js
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
- captured-sample.schema.json
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
- Translator
- TextInterpreter
- LandmarkRenderer

## God Nodes (most connected - your core abstractions)
1. `normalizarLandmarksMano()` - 14 edges
2. `ejecutarFotograma()` - 13 edges
3. `TextInterpreter` - 13 edges
4. `UserInterface` - 12 edges
5. `onResults()` - 12 edges
6. `What You Must Do When Invoked` - 12 edges
7. `procesarFotograma()` - 10 edges
8. `SpeechService` - 10 edges
9. `/graphify` - 10 edges
10. `procesarFotogramaManos()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `camera` --calls--> `loadStreamingContracts()`  [EXTRACTED]
  apps/usuario/src/main.js → apps/usuario/src/reconocimiento/contractValidator.js

## Import Cycles
- None detected.

## Communities (51 total, 12 thin omitted)

### Community 0 - "usuario/src/main.js"
Cohesion: 0.06
Nodes (23): UserPreferences, camera, diagnosticoArranque, interpreter, landmarkRenderer, preferences, removeLandmarkListener, speech (+15 more)

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

### Community 12 - "configurador/src/main.js"
Cohesion: 0.06
Nodes (14): DataStore, CaptureSession, createSampleLabel(), contracts, extractLandmarks(), lastFrames, localExtractor, source (+6 more)

### Community 13 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native AGENTS.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 14 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 15 - "configurador/package.json"
Cohesion: 0.25
Nodes (7): name, private, scripts, check, test, type, version

### Community 16 - "Arquitectura de AulaSenas2"
Cohesion: 0.25
Nodes (7): Aplicación Configurador, Aplicación Usuario, Arquitectura de AulaSenas2, Contratos, Entrenamiento, Estructura, Separación

### Community 17 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 18 - "Skill común de AulaSenas2"
Cohesion: 0.50
Nodes (3): Regla de ejecución, Reglas generales, Skill común de AulaSenas2

### Community 19 - "Work Configurador"
Cohesion: 0.50
Nodes (3): Límites, Objetivo, Work Configurador

### Community 20 - "Work Contratos"
Cohesion: 0.50
Nodes (3): Límites, Objetivo, Work Contratos

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
Cohesion: 0.50
Nodes (3): Límites, Objetivo, Work Training

### Community 25 - "Work Usuario"
Cohesion: 0.50
Nodes (3): Límites, Objetivo, Work Usuario

### Community 31 - "captured-sample.schema.json"
Cohesion: 0.07
Nodes (28): additionalProperties, format, type, description, items, minItems, type, $id (+20 more)

### Community 32 - "sample-metadata.schema.json"
Cohesion: 0.11
Nodes (18): additionalProperties, description, $id, minLength, type, type, type, properties (+10 more)

### Community 33 - "landmark-point.schema.json"
Cohesion: 0.12
Nodes (16): additionalProperties, description, $id, minProperties, properties, visibility, x, y (+8 more)

### Community 34 - "frame.schema.json"
Cohesion: 0.12
Nodes (15): additionalProperties, description, $id, $ref, properties, landmarks, timestampMs, required (+7 more)

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
Nodes (5): description, $id, oneOf, $schema, title

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

### Community 49 - "TextInterpreter"
Cohesion: 0.25
Nodes (4): removePresenceListener, normalizeText(), TEXT_INTERPRETER_CONFIG, TextInterpreter

### Community 50 - "LandmarkRenderer"
Cohesion: 0.29
Nodes (3): FACE_CONNECTIONS, LandmarkRenderer, POSE_CONNECTIONS

## Knowledge Gaps
- **227 isolated node(s):** `name`, `private`, `version`, `type`, `check` (+222 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TextInterpreter` connect `TextInterpreter` to `usuario/src/main.js`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _227 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `usuario/src/main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06015037593984962 - nodes in this community are weakly interconnected._
- **Should `handsDetector.js` be split into smaller, more focused modules?**
  _Cohesion score 0.059227921734531994 - nodes in this community are weakly interconnected._
- **Should `heuristicRules.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08461538461538462 - nodes in this community are weakly interconnected._
- **Should `gru-ctc-streaming-input.schema.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09230769230769231 - nodes in this community are weakly interconnected._
- **Should `configurador/src/main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05851063829787234 - nodes in this community are weakly interconnected._