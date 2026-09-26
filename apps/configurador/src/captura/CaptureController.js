import { CaptureSession } from './CaptureSession.js';

/** Coordina el ciclo de captura sin conocer etiquetas, contratos ni persistencia. */
export class CaptureController {
  /** @param {object} options Dependencias de video y extracción inyectables. */
  constructor({ video, extractLandmarks, intervalMs = 100 }) { this.video = video; this.extractLandmarks = extractLandmarks; this.intervalMs = intervalMs; this.session = null; this.lastFrames = []; }
  /** Inicia la reproducción y una sesión nueva sobre el video actual. */
  async start() { if (this.active) throw new Error('La captura ya está activa.'); this.lastFrames = []; this.lastDurationMs = 0; await this.video.play(); this.session = new CaptureSession({ video: this.video, extractLandmarks: this.extractLandmarks, intervalMs: this.intervalMs }); this.session.start(); }
  /** Detiene la sesión activa y conserva los frames para el siguiente paso del flujo. */
  async stop() { if (!this.session) return []; this.lastFrames = await this.session.stop(); this.lastDurationMs = this.session.durationMs; return this.frames; }
  /** Indica si existe un temporizador de captura activo. */
  get active() { return Boolean(this.session?.timer); }
  /** Devuelve una copia de los frames capturados. */
  get frames() { return this.lastFrames.slice(); }
  /** Devuelve la duración real medida desde el inicio hasta la finalización manual. */
  get durationMs() { return this.lastDurationMs ?? 0; }
}
