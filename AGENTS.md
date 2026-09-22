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

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).


DOCUMENTACIÓN DEL CÓDIGO

Todo código nuevo o modificado debe quedar suficientemente documentado para que otro desarrollador pueda entender:

- propósito del módulo;
- responsabilidad de cada función pública o compleja;
- entradas y salidas;
- estados importantes;
- decisiones no obvias;
- dependencias relevantes;
- contratos o restricciones que no sean evidentes por el código.

La documentación debe vivir lo más cerca posible del código:
- comentarios/JSDoc para funciones y módulos;
- comentarios internos solo donde la lógica no sea evidente.

No comentar línea por línea ni explicar código trivial.
Los comentarios deben explicar el POR QUÉ y el contrato de la lógica, no repetir literalmente el QUÉ.

Si una modificación cambia comportamiento, arquitectura o contrato, actualizar también la documentación externa correspondiente.

## AulaSenas2-Lite

La arquitectura vigente es AulaSenas2-Lite y su contrato rector es `docs/AULASENAS2_LITE_CONTRATO.md`. Cuando exista contradicción entre documentación legacy y dicho contrato, prevalece el contrato Lite.

La transición se ejecutará estrictamente en este orden: FASE I — modificación del Configurador; FASE II — contratos y documentación; FASE III — refundación de Usuario; FASE IV — captura del nuevo dataset; FASE V — nuevo pipeline Training/Colab; FASE VI — integración y prueba física. No se adelantará ninguna fase sin autorización explícita.

Quedan cancelados `USR-06.7`, las optimizaciones incrementales del runtime Holistic, la continuidad productiva de F319 y GRU-CTC/F308, y cualquier estrategia destinada a conservar compatibilidad con esos runtimes. El legacy se eliminará físicamente del árbol activo cuando corresponda; Git conserva su historial.
