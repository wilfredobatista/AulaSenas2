# Documentación de Usuario

## Flujo

`index.html` presenta exclusivamente la vista pública. `main.js` crea los servicios y conecta sus callbacks:

```text
cámara → MediaPipe/landmarks → normalización → [32,308] → GRU/CTC → etiqueta → texto → interpretación → voz
```

La cámara (`src/video/camera.js`) solicita video con `getUserMedia`, entrega un frame a la vez y detiene tracks/timers al cerrar. `src/vision/mediapipeAdapter.js` y `landmarks.js` son puntos de integración y reportan `missing` mientras no exista el runtime de visión. `src/vision/normalizer.js` valida el vector visual de 307 valores y agrega `deltaMsNorm` como valor 308.

## Reconocimiento

El reconocedor streaming activo conserva la secuencia temporal, valida el contrato, ejecuta `model.execute()`, mantiene el estado GRU, aplica CTC y emite etiquetas. Las utilidades auxiliares `sequenceBuffer.js`, `inputShape.js`, `inferenceAdapter.js`, `ctcDecoder.js` y `confidence.js` documentan y prueban las invariantes de datos; no existen loaders o reconocedores alternativos activos.

Los archivos activos `handsConfig.js`, `heuristicRules.js`, `handsDetector.js`, `normalizer.js`, `gruCtcModelLoader.js` y `gruCtcStreamingRecognizer.js` contienen la implementación autoritativa trasladada desde la referencia. Son scripts clásicos que publican APIs en `globalThis`; por eso `index.html` los carga antes del módulo principal. Sus dependencias son MediaPipe, TensorFlow.js, la configuración de manos, las reglas heurísticas y el modelo exportado. No se copian modelos en esta aplicación.

## Texto, voz y preferencias

`translator.js` normaliza el texto existente; no inventa traducciones. `speech.js` usa `SpeechSynthesis` con el idioma de `preferences.js`. Las preferencias se guardan en `localStorage` y son únicamente personales. `ui/interface.js` actualiza controles, estados, texto, confianza y errores; `styles.css` define la presentación responsive.

## Estado de disponibilidad

Activos sin modelo: interfaz, cámara (en contexto seguro y con permiso), buffer, validaciones, traducción básica, preferencias y voz. Dependientes de recursos externos: MediaPipe, landmarks reales, TensorFlow.js, GraphModel GRU/CTC, vocabulario y artefactos exportados. Sin ellos el sistema permanece en `modelo no disponible` y no produce predicciones.
