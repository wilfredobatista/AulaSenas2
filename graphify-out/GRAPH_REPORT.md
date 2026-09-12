# Graph Report - AulaSenas2  (2026-09-12)

## Corpus Check
- 47 files · ~25,602 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 284 nodes · 483 edges · 12 communities (9 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `713cc9a7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main.js
- handsDetector.reference.js
- recognizer.js
- heuristicRules.reference.js
- gruCtcStreamingRecognizer.reference.js
- package.json
- Reglas de desarrollo de AulaSenas2
- normalizer.reference.js
- gruCtcModelLoader.reference.js
- LandmarkExtractor
- handsConfig.reference.js
- INTEGRACION_RECONOCIMIENTO.md

## God Nodes (most connected - your core abstractions)
1. `normalizarLandmarksMano()` - 14 edges
2. `ejecutarFotograma()` - 12 edges
3. `onResults()` - 11 edges
4. `procesarFotograma()` - 10 edges
5. `UserInterface` - 10 edges
6. `procesarFotogramaManos()` - 9 edges
7. `extraerColeccionLandmarksManos()` - 9 edges
8. `normalizarPuntoEspacial()` - 8 edges
9. `SequenceBuffer` - 8 edges
10. `Reglas de desarrollo de AulaSenas2` - 8 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (12 total, 3 thin omitted)

### Community 0 - "main.js"
Cohesion: 0.05
Nodes (16): UserPreferences, camera, loader, preferences, recognizer, speech, translator, ui (+8 more)

### Community 1 - "handsDetector.reference.js"
Cohesion: 0.06
Nodes (55): abstraerPuntosClaveMano(), actualizarDiagnosticoResultadosManos(), calcularDistanciaPuntosMano(), configuracionExclusionMargenesCamara, configurarMaximoManosDetector(), construirBanderasExclusionDatos(), construirRepresentacionCanonicaManos(), construirSlotCanonicoMano() (+47 more)

### Community 2 - "recognizer.js"
Cohesion: 0.11
Nodes (12): acceptPrediction(), confidenceFromLogits(), greedyCtcDecode(), InferenceAdapter, FRAME_FEATURES, LANDMARK_FEATURES, TEMPORAL_LENGTH, validateTemporalInput() (+4 more)

### Community 3 - "heuristicRules.reference.js"
Cohesion: 0.08
Nodes (31): abstraerPuntoClaveMano(), abstraerPuntosClaveMano(), afirmarColeccionLandmarksTemplate(), afirmarCoordenadasPuntoTemplate(), afirmarFramesTemporalesCapturaFija(), afirmarIndicePuntoTemplate(), afirmarNombrePuntoTemplate(), afirmarPresenciaExplicitaPuntosTemplate() (+23 more)

### Community 4 - "gruCtcStreamingRecognizer.reference.js"
Cohesion: 0.17
Nodes (29): ahoraMonotonoMs(), aplicarFronteraAusenciaEstable(), cancelarCola(), classIdDesdeEtiqueta(), construirEntrada308(), construirVisual307(), copiarConteos(), detener() (+21 more)

### Community 5 - "package.json"
Cohesion: 0.25
Nodes (7): name, private, scripts, check, test, type, version

### Community 6 - "Reglas de desarrollo de AulaSenas2"
Cohesion: 0.22
Nodes (8): Aplicaciones, Dependencias, Forma de trabajo, graphify, Prohibiciones, Regla principal, Reglas de desarrollo de AulaSenas2, Ubicación obligatoria

### Community 7 - "normalizer.reference.js"
Cohesion: 0.18
Nodes (26): aplanarLandmarksAVector63(), calcularDistanciaEuclidiana3D(), calcularEscalaFallback(), calcularEscalaMano(), calcularFactorEscalaPalma(), calcularMagnitud3D(), calcularPromedio(), configuracionNormalizacionMano (+18 more)

### Community 8 - "gruCtcModelLoader.reference.js"
Cohesion: 0.22
Nodes (11): cargar(), cargarJson(), cargarRecursos(), configurar(), copiar(), notificar(), obtenerEstado(), resolverUrl() (+3 more)

## Knowledge Gaps
- **37 isolated node(s):** `Integración de reconocimiento GRU/CTC`, `ui`, `preferences`, `speech`, `translator` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `Integración de reconocimiento GRU/CTC`, `ui`, `preferences` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05224963715529753 - nodes in this community are weakly interconnected._
- **Should `handsDetector.reference.js` be split into smaller, more focused modules?**
  _Cohesion score 0.059562841530054644 - nodes in this community are weakly interconnected._
- **Should `recognizer.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10804597701149425 - nodes in this community are weakly interconnected._
- **Should `heuristicRules.reference.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08461538461538462 - nodes in this community are weakly interconnected._