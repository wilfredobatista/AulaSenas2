# Models

## Propósito

Esta área conserva los modelos destinados al consumo de `apps/usuario/`. El Work Training puede generar o mantener artefactos aquí, pero no modifica el flujo de producción de la aplicación consumidora.

## Bundle vigente

El bundle vigente es:

`models/exportados/gru_ctc_v3/`

Corresponde a un modelo TensorFlow.js GraphModel GRU-CTC de inferencia streaming. Su contrato y su manifiesto son la fuente de verdad para formato, nombres de entradas y salidas, clases y archivos requeridos.

El bundle contiene:

- `model.json`
- `group1-shard1of1.bin`
- `input_contract_gru_ctc_one_step_tfjs.json`
- `class_map_gru_ctc.json`
- `release_manifest.json`
- `parity_report_tfjs.json`
- `README_RUNTIME.md`

No se modifica el modelo vigente ni se sustituyen sus artefactos como parte de esta organización documental.

## Relación con Training y Usuario

- `training/` prepara datos, entrena y evalúa offline cuando el proceso sea reactivado.
- `models/exportados/` contiene el resultado final exportado para consumo.
- `apps/usuario/` carga y ejecuta el bundle según sus contratos.

Los artefactos exportados no son un lugar para código de entrenamiento, datos crudos ni dependencias inventadas. Las implementaciones de cámara, visión e inferencia permanecen bajo responsabilidad de `apps/usuario/`.

## Integridad

La completitud del bundle se verifica contra los archivos enumerados por `release_manifest.json`. En la revisión actual, los seis archivos enumerados por el manifiesto existen y sus tamaños y hashes SHA-256 coinciden. El propio `release_manifest.json` también está presente en el directorio.
