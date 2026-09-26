/** Orquesta Cámara → Hands/Pose → F139 → FIFO y métricas, sin IA. */
import { CameraController } from './camera/CameraController.js';
import { LiteFrameExtractor } from './vision/LiteFrameExtractor.js';
import { LiteVectorizer139 } from './vision/LiteVectorizer139.js';
import { LiteOverlay } from './vision/LiteOverlay.js';
import { LiteFifo20 } from './temporal/LiteFifo20.js';
import { RuntimeMetrics } from './metrics/RuntimeMetrics.js';
import { UserLiteUI } from './ui/UserLiteUI.js';
import { LiteModelRuntime } from './modelo/LiteModelRuntime.js';
const video = document.querySelector('#camera'); const overlay = new LiteOverlay(document.querySelector('#overlay'), video); const ui = new UserLiteUI();
const extractor = new LiteFrameExtractor(); const vectorizer = new LiteVectorizer139(); const fifo = new LiteFifo20(); const metrics = new RuntimeMetrics();
const modelRuntime = new LiteModelRuntime({ onState: (state, error) => ui.setModelState(state, error) });
// El runtime conserva el estado `error`; este registro evita ocultar la causa de carga.
void modelRuntime.load().catch((error) => console.error('[AulaSenas Lite] Error al cargar el modelo:', error));
const SEGMENT_STATES = Object.freeze({ BACKGROUND: 'BACKGROUND', SIGN_ACTIVE: 'SIGN_ACTIVE', PENDING_END: 'PENDING_END' });
// Conteos provisionales para validación física; no representan umbrales finales del producto.
const MIN_CANDIDATE_RUN = 2;
const BACKGROUND_END_RUN = 2;
let inferenceInFlight = false;
let segmentState = SEGMENT_STATES.BACKGROUND;
let candidateClassId = null;
let candidateRunLength = 0;
let backgroundRunLength = 0;
const recognizedUnits = [];

/** Limpia solo la hipótesis temporal después de cerrar un segmento. */
function resetSegment() {
  segmentState = SEGMENT_STATES.BACKGROUND;
  candidateClassId = null;
  candidateRunLength = 0;
  backgroundRunLength = 0;
}

/** Devuelve una copia diagnóstica sin permitir mutar el estado de segmentación. */
function getSegmentStateSnapshot() {
  return Object.freeze({ segmentState, candidateClassId, candidateRunLength, backgroundRunLength, minCandidateRun: MIN_CANDIDATE_RUN, backgroundEndRun: BACKGROUND_END_RUN });
}

/**
 * Convierte hipótesis secuenciales en una unidad solo al confirmar el final por background.
 * La confianza no participa: se usan únicamente clase, continuidad y frontera de segmento.
 */
function processPredictionForText(prediction) {
  if (segmentState === SEGMENT_STATES.BACKGROUND) {
    if (prediction.background) return;
    segmentState = SEGMENT_STATES.SIGN_ACTIVE;
    candidateClassId = prediction.classId;
    candidateRunLength = 1;
    backgroundRunLength = 0;
    return;
  }

  if (segmentState === SEGMENT_STATES.SIGN_ACTIVE) {
    if (prediction.background) {
      segmentState = SEGMENT_STATES.PENDING_END;
      backgroundRunLength = 1;
    } else if (prediction.classId === candidateClassId) {
      candidateRunLength += 1;
    } else {
      candidateClassId = prediction.classId;
      candidateRunLength = 1;
    }
    return;
  }

  if (prediction.background) {
    backgroundRunLength += 1;
    if (backgroundRunLength < BACKGROUND_END_RUN) return;
    if (candidateRunLength >= MIN_CANDIDATE_RUN) {
      recognizedUnits.push(candidateClassId);
      ui.setRecognizedText(recognizedUnits.join(' '));
    }
    resetSegment();
    return;
  }

  segmentState = SEGMENT_STATES.SIGN_ACTIVE;
  backgroundRunLength = 0;
  if (prediction.classId === candidateClassId) candidateRunLength += 1;
  else { candidateClassId = prediction.classId; candidateRunLength = 1; }
}

/** Ejecuta como máximo una inferencia y deja que el FIFO continúe avanzando mientras espera. */
async function predictCurrentWindow() {
  if (!modelRuntime.ready || !fifo.ready || inferenceInFlight) return;
  inferenceInFlight = true;
  const snapshot = fifo.snapshot();
  try {
    const prediction = await modelRuntime.predict(snapshot);
    ui.setPrediction(prediction);
    processPredictionForText(prediction);
  } catch (error) {
    console.error('[AulaSenas Lite] Error durante inferencia:', error);
    ui.setModelState('error', error);
  } finally {
    inferenceInFlight = false;
  }
}
const camera = new CameraController(video, {
  async onFrame(frame, context) { metrics.cameraFrame(); metrics.pipelineFrame(); const startedAt = performance.now(); const extraction = await extractor.extract(frame, context); const result = vectorizer.vectorize(extraction); const latencyMs = performance.now() - startedAt; if (result.valid) fifo.append(result.vector139); metrics.result({ ...result, latencyMs, fifoReady: fifo.ready }); overlay.render(extraction.raw); ui.render({ raw: extraction.raw, result, fifo, metrics: metrics.report(fifo.length) }); void predictCurrentWindow(); },
  onStatus(status, error) { const active = status === 'active'; if (status === 'active' || status === 'stopped' || status === 'error') ui.setCameraActive(active); ui.setStatus(active ? 'Cámara activa · Hands + Pose Lite' : status === 'stopped' ? 'Cámara detenida' : `Error: ${error?.message ?? status}`, status === 'error' || status === 'frame_error'); },
  onStarted({ requested, actual }) { vectorizer.reset(); fifo.reset(); metrics.reset(); metrics.setCamera(requested, actual); ui.setStatus(`Cámara activa · solicitada ${requested.width}×${requested.height}@${requested.frameRate}; real ${actual.width ?? '?'}×${actual.height ?? '?'}`); },
  onStopped() { overlay.clear(); vectorizer.reset(); },
});
ui.bind({ start: () => camera.start().catch(() => {}), stop: () => camera.stop() });
globalThis.aulaSenasLiteRuntime = Object.freeze({ getMetrics: () => metrics.report(fifo.length), getFifo: () => fifo.snapshot(), resetFifo: () => fifo.reset(), getModelState: () => modelRuntime.state, getLastPrediction: () => ui.lastPrediction ?? null, getSegmentState: getSegmentStateSnapshot });
