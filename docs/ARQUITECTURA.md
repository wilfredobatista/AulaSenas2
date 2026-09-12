# Arquitectura de AulaSenas2

## Estructura

```text
AulaSenas2/
├─ apps/
│  ├─ usuario/
│  │  ├─ index.html
│  │  ├─ package.json
│  │  ├─ src/
│  │  │  ├─ video/
│  │  │  ├─ vision/
│  │  │  ├─ reconocimiento/
│  │  │  ├─ traduccion/
│  │  │  ├─ configuracion/
│  │  │  └─ ui/
│  │  └─ tests/
│  └─ configurador/
│     ├─ index.html
│     ├─ package.json
│     ├─ src/
│     │  ├─ video/
│     │  ├─ vision/
│     │  ├─ captura/
│     │  ├─ etiquetado/
│     │  ├─ validacion/
│     │  ├─ almacenamiento/
│     │  └─ ui/
│     └─ tests/
├─ contracts/
├─ data/
│  ├─ raw/
│  ├─ processed/
│  └─ validated/
├─ training/
│  ├─ scripts/
│  ├─ notebooks/
│  ├─ configuracion/
│  ├─ resultados/
│  ├─ tests/
│  └─ requirements.txt
├─ models/
│  └─ exportados/
├─ docs/
├─ AGENTS.md
├─ ordenes-agente/
├─ README.md
└─ .gitignore
```

## Aplicación Usuario

Es la aplicación pública. Su flujo es:

```text
Cámara → MediaPipe → landmarks → GRU/CTC → texto → interpretación → voz
```

No captura muestras ni ejecuta entrenamiento.

## Aplicación Configurador

Es la aplicación administrativa. Su flujo es:

```text
Cámara/video → MediaPipe → landmarks → etiquetado → validación → data/
```

El código de almacenamiento está en `apps/configurador/src/almacenamiento/`; los archivos generados están en `data/`.

## Entrenamiento

`training/` trabaja fuera de las aplicaciones web:

```text
data/validated/ → scripts de entrenamiento → métricas → models/exportados/
```

El modelo exportado se incorpora a la aplicación Usuario.

## Contratos

`contracts/` define únicamente el formato que deben respetar los datos, por ejemplo frames, muestras y datasets. No contiene código de cámara, MediaPipe, captura ni entrenamiento.

## Separación

Usuario y Configurador son aplicaciones independientes. No importan lógica entre sí. Cada una implementa sus propias dependencias funcionales y solo debe respetar los contratos de datos establecidos.
