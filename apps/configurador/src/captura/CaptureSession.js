/** Muestrea un video y conserva frames con timestamp y landmarks externos. */
export class CaptureSession {
  /**
   * @param {object} options Opciones de captura.
   * @param {HTMLVideoElement} options.video Video en reproducción.
   * @param {(video: HTMLVideoElement) => Promise<unknown>|unknown} options.extractLandmarks
   * Extractor inyectable; su forma de salida pertenece a landmarks.schema.json.
   * @param {number} [options.intervalMs=100] Periodo de muestreo.
   */
  constructor({ video, extractLandmarks, intervalMs = 100 }) {
    this.video = video; this.extractLandmarks = extractLandmarks; this.intervalMs = intervalMs;
    this.frames = []; this.timer = null; this.startedAt = null;
  }
  /** Inicia el temporizador de muestreo y reinicia los frames de la sesión. */
  start() {
    if (this.timer) throw new Error('La captura ya está activa.');
    if (typeof this.extractLandmarks !== 'function') throw new Error('No hay extractor de landmarks configurado.');
    this.frames = []; this.startedAt = performance.now();
    this.timer = setInterval(() => this.#captureFrame(), this.intervalMs);
  }
  /** Detiene el muestreo y devuelve una copia de los frames capturados. */
  stop() { clearInterval(this.timer); this.timer = null; return this.frames.slice(); }
  /** Ejecuta una extracción; los errores quedan en lastError y no detienen la sesión. */
  async #captureFrame() {
    try {
      const landmarks = await this.extractLandmarks(this.video);
      if (landmarks == null) return;
      this.frames.push({ timestampMs: Math.round(performance.now() - this.startedAt), landmarks });
    } catch (error) { this.lastError = error; }
  }
}
