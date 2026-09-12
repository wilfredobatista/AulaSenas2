# Reglas de desarrollo de AulaSenas2

## Regla principal

Respetar estrictamente la estructura del proyecto. No mover código ni crear archivos en otra carpeta sin justificarlo y actualizar `docs/ARQUITECTURA.md`.

## Aplicaciones

- `apps/usuario/` es la aplicación pública de producción.
- `apps/configurador/` es la aplicación administrativa para capturar y validar datos.
- Usuario y Configurador no deben importar lógica directamente entre sí.
- Cada aplicación tiene sus propias implementaciones de cámara, video y MediaPipe.
- La configuración de Usuario solo contiene preferencias personales; no incluye captura ni entrenamiento.

## Ubicación obligatoria

- `data/` contiene únicamente archivos de datos.
- El código que guarda o lee datos pertenece a `apps/configurador/src/almacenamiento/`.
- `training/` contiene únicamente herramientas offline de entrenamiento.
- `models/exportados/` contiene únicamente modelos finales destinados a Usuario.
- `contracts/` contiene únicamente esquemas y reglas de formato de datos.
- `tests/` contiene pruebas automáticas, no logs.
- Los logs, métricas y reportes de entrenamiento van en `training/resultados/`.
- Las instrucciones específicas para una tarea se guardan en `ordenes-agente/`.

## Dependencias

- `apps/usuario/package.json` define dependencias y scripts de Usuario.
- `apps/configurador/package.json` define dependencias y scripts del Configurador.
- `training/requirements.txt` define dependencias Python del entrenamiento.
- No crear un `package.json` en la raíz salvo que se apruebe una configuración monorepo.

## Prohibiciones

- No colocar código dentro de `data/`.
- No colocar datos dentro de `src/`.
- No colocar entrenamiento dentro de `apps/`.
- No compartir implementaciones funcionales entre Usuario y Configurador.
- No crear fachadas, aliases o wrappers para aparentar una separación que no existe.
- No modificar GRU/CTC, dataset, contratos o flujo de producción sin una tarea explícita.

## Forma de trabajo

Antes de modificar código, indicar el objetivo, archivos autorizados, archivos excluidos y prueba de aceptación. No hacer commit ni push sin autorización expresa.
