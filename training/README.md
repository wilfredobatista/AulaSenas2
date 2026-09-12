# Training

## Estado actual

El entrenamiento está pausado. En esta etapa no se ejecutan entrenamientos, no se preparan nuevos datasets y no se modifican hiperparámetros, contratos ni arquitecturas.

El proceso de entrenamiento queda reservado para herramientas offline dentro de `training/`. Los resultados, métricas y reportes futuros deben permanecer dentro de `training/resultados/`.

## Modelo utilizado mientras el entrenamiento está pausado

El modelo que debe considerarse vigente es el bundle ya exportado en:

`models/exportados/gru_ctc_v3/`

No se crea ni se modifica un modelo desde este Work durante la pausa. La carpeta `models/exportados/` recibe únicamente artefactos finales destinados a `apps/usuario/`.

## Relación entre áreas

```text
data/                  datos de entrada, solo lectura para este Work
        |
        v
training/              preparación, entrenamiento y evaluación offline
        |
        v
models/exportados/    bundles finales listos para consumo
        |
        v
apps/usuario/          aplicación consumidora del modelo
```

`training/` puede leer datos de `data/` y producir artefactos finales en `models/exportados/`. `apps/usuario/` consume el bundle exportado; no debe importar herramientas de entrenamiento ni compartir implementaciones funcionales con este Work.

## Alcance reservado

Las subcarpetas `configuracion/`, `notebooks/`, `scripts/`, `resultados/` y `tests/` permanecen como espacios reservados para futuras herramientas offline, configuraciones, reportes y pruebas del proceso de entrenamiento. No se inventan scripts, dependencias, métricas ni modelos en esta etapa.
