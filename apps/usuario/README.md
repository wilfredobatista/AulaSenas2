# Usuario Lite

FASE III implementa exclusivamente el pipeline físico:

```text
Cámara 640×480@30 solicitada → MediaPipe Hands + Pose → raw Lite → F139 → FIFO [128,139] → overlay y métricas
```

No carga TensorFlow.js, modelos, GRU, CTC, clasificador, texto, interpretación ni voz. El FIFO conserva únicamente observaciones F139 reales y válidas; no usa padding.

La lateralidad del vector representa el lado físico del signante. El espejo CSS es solo visual y requiere validación física con una mano por vez.
