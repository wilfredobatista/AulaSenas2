# Integración de reconocimiento GRU/CTC

Se conservaron dentro de Usuario las implementaciones autoritativas trasladadas desde la referencia:

- `src/vision/handsDetector.reference.js`
- `src/vision/normalizer.reference.js`
- `src/reconocimiento/gruCtcModelLoader.reference.js`
- `src/reconocimiento/gruCtcStreamingRecognizer.reference.js`

La activación queda condicionada a las dependencias que el código autoritativo exige:

- `@mediapipe/hands` o `@mediapipe/holistic`, además de `camera_utils`.
- TensorFlow.js 4.22.x con `tf.loadGraphModel`.
- `configuracionManos` y `reglasHeuristicasAulaSenas`, que no están incluidos en la referencia entregada.
- El directorio del modelo exportado, que debe ubicarse posteriormente en `models/exportados/`, fuera de esta aplicación.

La referencia valida el contrato GRU/CTC de entrada `[1,1,308]`, con 307 características visuales más `deltaMs / 100`, y estado recurrente `[1,128]`. No se copiaron artefactos del modelo ni se habilitó inferencia sin esas dependencias.

No se utilizaron `normalize_dataset.py` ni `holisticSequenceAdapter.js`.
