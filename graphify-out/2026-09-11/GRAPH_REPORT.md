# Graph Report - AulaSenas2  (2026-09-11)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 96 nodes · 130 edges · 10 communities (5 shown, 5 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 406 input · 25 output

## Graph Freshness
- Built from commit: `e1b9c4c5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Core Application Services
- UI State Management
- recognizer.js
- inputShape.js
- SequenceBuffer
- package.json
- UserPreferences
- CameraController
- SignRecognizer
- LandmarkExtractor

## God Nodes (most connected - your core abstractions)
1. `UserInterface` - 10 edges
2. `SequenceBuffer` - 8 edges
3. `MediaPipeAdapter` - 6 edges
4. `UserPreferences` - 6 edges
5. `CameraController` - 6 edges
6. `SignRecognizer` - 6 edges
7. `ModelLoader` - 5 edges
8. `SpeechService` - 4 edges
9. `InferenceAdapter` - 4 edges
10. `LandmarkExtractor` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (10 total, 5 thin omitted)

### Community 0 - "Core Application Services"
Cohesion: 0.10
Nodes (8): preferences, speech, translator, ui, ModelLoader, SpeechService, Translator, MediaPipeAdapter

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

## Knowledge Gaps
- **12 isolated node(s):** `preferences`, `speech`, `translator`, `ui`, `FRAME_FEATURES` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SequenceBuffer` connect `SequenceBuffer` to `recognizer.js`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `UserInterface` connect `UI State Management` to `Core Application Services`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **What connects `preferences`, `speech`, `translator` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core Application Services` be split into smaller, more focused modules?**
  _Cohesion score 0.10276679841897234 - nodes in this community are weakly interconnected._