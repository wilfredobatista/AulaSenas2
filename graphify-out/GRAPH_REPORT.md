# Graph Report - AulaSenas2  (2026-09-11)

## Corpus Check
- 40 files · ~14,217 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 105 nodes · 138 edges · 11 communities (6 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c04d8b6c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main.js
- UI State Management
- recognizer.js
- inputShape.js
- SequenceBuffer
- package.json
- Reglas de desarrollo de AulaSenas2
- CameraController
- SignRecognizer
- LandmarkExtractor
- MediaPipeAdapter

## God Nodes (most connected - your core abstractions)
1. `UserInterface` - 10 edges
2. `Reglas de desarrollo de AulaSenas2` - 8 edges
3. `SequenceBuffer` - 8 edges
4. `MediaPipeAdapter` - 6 edges
5. `UserPreferences` - 6 edges
6. `CameraController` - 6 edges
7. `SignRecognizer` - 6 edges
8. `ModelLoader` - 5 edges
9. `SpeechService` - 4 edges
10. `InferenceAdapter` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (11 total, 5 thin omitted)

### Community 0 - "main.js"
Cohesion: 0.11
Nodes (8): UserPreferences, preferences, speech, translator, ui, ModelLoader, SpeechService, Translator

### Community 1 - "UI State Management"
Cohesion: 0.21
Nodes (4): loader, recognizer, vision, UserInterface

### Community 2 - "recognizer.js"
Cohesion: 0.35
Nodes (5): acceptPrediction(), confidenceFromLogits(), greedyCtcDecode(), appendDeltaMsNorm(), normalizeLandmarks()

### Community 3 - "inputShape.js"
Cohesion: 0.27
Nodes (5): InferenceAdapter, FRAME_FEATURES, LANDMARK_FEATURES, TEMPORAL_LENGTH, validateTemporalInput()

### Community 5 - "package.json"
Cohesion: 0.25
Nodes (7): name, private, scripts, check, test, type, version

### Community 6 - "Reglas de desarrollo de AulaSenas2"
Cohesion: 0.22
Nodes (8): Aplicaciones, Dependencias, Forma de trabajo, graphify, Prohibiciones, Regla principal, Reglas de desarrollo de AulaSenas2, Ubicación obligatoria

## Knowledge Gaps
- **19 isolated node(s):** `Regla principal`, `Aplicaciones`, `Ubicación obligatoria`, `Dependencias`, `Prohibiciones` (+14 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SequenceBuffer` connect `SequenceBuffer` to `recognizer.js`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `UserInterface` connect `UI State Management` to `main.js`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `MediaPipeAdapter` connect `MediaPipeAdapter` to `main.js`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **What connects `Regla principal`, `Aplicaciones`, `Ubicación obligatoria` to the rest of the system?**
  _19 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1067193675889328 - nodes in this community are weakly interconnected._