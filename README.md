# AulaSenas2-Lite

Sistema de reconocimiento de Lengua de Señas Panameña en transición controlada a un único formato de datos: `AULASENAS2_LITE_F139_V1`.

El Configurador es la parte implementada para producir el nuevo dataset:

```text
Cámara o video → MediaPipe Hands + Pose → raw Lite → F139 → data/validated/
```

Cada frame conserva hasta dos manos de 21 puntos y únicamente nariz y hombros de Pose. F139 contiene la geometría normalizada y señales temporales; las muestras mantienen su duración real, sin padding ni remuestreo.

Las clases usan IDs humanos estables como `HOLA` o `BUENOS_DIAS`. La excepción técnica es `ruido_background`.

Estado de fases:

- FASE I: Configurador Lite implementado y validado físicamente.
- FASE II: contratos y documentación Lite vigentes.
- FASE III: refundación de Usuario, pendiente.
- FASE V: Training para GRU Softmax, pendiente.

Consulta [el contrato rector](docs/AULASENAS2_LITE_CONTRATO.md), [la arquitectura](docs/ARQUITECTURA.md) y `AGENTS.md` antes de modificar el repositorio.
