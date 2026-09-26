/**
 * Presenta la carcasa visual recuperada sin apropiarse del runtime Lite.
 * Los paneles lingüísticos son placeholders hasta una fase posterior.
 */
export class UserLiteUI {
  constructor(documentRef = document) { this.doc = documentRef; this.status = this.doc.querySelector('#camera-status'); this.hands = this.doc.querySelector('#hands-status'); this.pose = this.doc.querySelector('#pose-status'); this.frame = this.doc.querySelector('#frame-status'); this.fifo = this.doc.querySelector('#fifo-status'); this.metrics = this.doc.querySelector('#metrics'); this.model = this.doc.querySelector('#model-status'); this.prediction = this.doc.querySelector('#prediction-status'); this.transcript = this.doc.querySelector('#transcript'); this.video = this.doc.querySelector('#camera'); this.placeholder = this.doc.querySelector('#camera-placeholder'); this.badge = this.doc.querySelector('#recording-badge'); this.lastPrediction = null; }
  bind({ start, stop }) { this.doc.querySelector('#camera-toggle').addEventListener('click', start); this.doc.querySelector('#stop-camera').addEventListener('click', stop); }
  setStatus(message, error = false) { this.status.textContent = `Estado: ${message}`; this.status.dataset.error = String(error); }
  /** Sincroniza únicamente la presentación de cámara con su estado real. */
  setCameraActive(active) { this.video.classList.toggle('visible', active); this.placeholder.hidden = active; this.badge.hidden = !active; }
  /** Refleja carga del modelo sin convertirla en estado de cámara o FIFO. */
  setModelState(state, error = null) { this.model.textContent = state === 'ready' ? 'Modelo: listo' : state === 'loading' ? 'Modelo: cargando' : state === 'error' ? `Modelo: error (${error?.message ?? 'desconocido'})` : 'Modelo: pendiente'; }
  /** Muestra la predicción técnica; background no se presenta como palabra. */
  setPrediction(prediction) { this.lastPrediction = prediction; const label = prediction.background ? 'ruido_background' : prediction.classId; this.prediction.textContent = `${label} · índice ${prediction.index} · confianza ${(prediction.confidence * 100).toFixed(2)}%`; }
  /** Presenta el texto reconocido recibido sin aplicar reglas de reconocimiento. */
  setRecognizedText(text) { const hasText = typeof text === 'string' && text.length > 0; this.transcript.textContent = hasText ? text : '—'; this.transcript.dataset.empty = String(!hasText); }
  render({ raw, result, fifo, metrics }) { this.hands.textContent = `Hands: izquierda ${raw?.hands?.left ? 'presente' : 'ausente'} · derecha ${raw?.hands?.right ? 'presente' : 'ausente'}`; this.pose.textContent = `Pose: ${raw?.pose?.nose && raw?.pose?.leftShoulder && raw?.pose?.rightShoulder ? 'válida' : 'incompleta'}`; this.frame.textContent = result.valid ? `F139 válido · Δ ${result.deltaMs.toFixed(1)} ms · norm ${result.deltaMsNorm.toFixed(3)}` : `F139 descartado: ${result.reason}`; this.fifo.textContent = fifo.ready ? 'FIFO READY [20,139]' : `FIFO: ${fifo.length} / 20`; this.metrics.textContent = JSON.stringify(metrics, null, 2); }
}
