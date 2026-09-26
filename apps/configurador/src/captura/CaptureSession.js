import { LiteTemporalEncoder } from '../vision/LiteVectorizer139.js';

/** Captura observaciones Lite válidas sin solapar inferencias. */
export class CaptureSession {
  /** El extractor inyectable recibe el video y el timestamp previo a inferencia. */
  constructor({ video, extractLandmarks, intervalMs = 100 }) {
    this.video = video; this.extractLandmarks = extractLandmarks; this.intervalMs = intervalMs;
    this.frames = []; this.timer = null; this.startedAt = null; this.durationMs = 0; this.pending = null; this.encoder = new LiteTemporalEncoder();
  }
  /** Inicia una sesión nueva y elimina todo estado temporal de la anterior. */
  start() {
    if (this.timer) throw new Error('La captura ya está activa.');
    if (typeof this.extractLandmarks !== 'function') throw new Error('No hay extractor de landmarks configurado.');
    this.frames = []; this.encoder.reset(); this.startedAt = performance.now(); this.durationMs = 0; this.pending = null; this.lastError = null;
    this.timer = setInterval(() => this.#captureFrame(), this.intervalMs);
  }
  /** Detiene el muestreo, espera la inferencia actual y devuelve solo frames válidos. */
  async stop() {
    const stoppedAt = performance.now(); clearInterval(this.timer); this.timer = null;
    if (this.pending) await this.pending;
    this.durationMs = Math.max(0, Math.round(stoppedAt - this.startedAt));
    return this.frames.slice();
  }
  /** Un pending único impide inferencias simultáneas; un descarte no agrega fila. */
  async #captureFrame() {
    try {
      if (this.pending) return;
      this.pending = (async () => {
        const sourceTimestampMs = performance.now();
        const extraction = await this.extractLandmarks(this.video, { sourceTimestampMs });
        const frame = this.encoder.encode(extraction);
        if (frame) this.frames.push(frame);
      })().catch((error) => { this.lastError = error; }).finally(() => { this.pending = null; });
      await this.pending;
    } catch (error) { this.lastError = error; }
  }
}
