# Skill común de AulaSenas2

## Reglas generales

- Respetar la estructura definida en `docs/ARQUITECTURA.md`.
- Respetar las reglas obligatorias de `AGENTS.md`.
- Mantener separadas las áreas Usuario, Configurador, Training, Contratos y QA.
- No colocar código dentro de `data/`.
- No colocar datos dentro de `apps/`, `training/` o `models/`.
- No mezclar la lógica de `apps/usuario/` con `apps/configurador/`.
- No modificar archivos pertenecientes a otro Work sin autorización expresa.
- Usar `contracts/` únicamente para esquemas, formatos y contratos de datos.
- Mantener el entrenamiento dentro de `training/`.
- Mantener los modelos generados dentro de `models/`.
- Consultar la documentación antes de tomar decisiones arquitectónicas.
- No crear carpetas o archivos fuera de la estructura aprobada.
- Si una tarea requiere modificar otra área, detenerse y solicitar autorización.

## Regla de ejecución

Ningún Work debe ejecutar tareas, modificar archivos, crear código, instalar dependencias, hacer commits o realizar push sin recibir una orden específica para hacerlo.