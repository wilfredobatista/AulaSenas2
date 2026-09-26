/**
 * Solicita resultados visuales para la previsualización usando el extractor
 * inyectado ya existente. No crea detectores ni conserva frames de dataset;
 * se detiene antes de captura o segmentación para no competir por MediaPipe.
 */
export class LandmarkPreview {
  /** @param {{video: HTMLVideoElement, extractLandmarks: Function, onError?: Function}} dependencies Servicios inyectables. */
  constructor({ video, extractLandmarks, onError = () => {} }) {
    this.video = video;
    this.extractLandmarks = extractLandmarks;
    this.onError = onError;
    this.enabled = false;
    this.pending = null;
    this.callbackId = null;
    this.onReady = () => this.#processCurrentFrame();
  }

  /** Activa la observación del frame actual y de los frames presentados por la fuente. */
  start() {
    if (this.enabled) return;
    if (typeof this.extractLandmarks !== 'function') throw new Error('No hay extractor visual configurado.');
    this.enabled = true;
    this.video.addEventListener('loadeddata', this.onReady);
    this.video.addEventListener('playing', this.onReady);
    this.video.addEventListener('seeked', this.onReady);
    this.#processCurrentFrame();
  }

  /**
   * Detiene peticiones futuras y espera la extracción en curso. Esto permite
   * que CaptureController y VideoSegmentProcessor reutilicen el mismo
   * LiteFrameExtractor sin ejecuciones concurrentes.
   */
  async stop() {
    this.enabled = false;
    this.video.removeEventListener('loadeddata', this.onReady);
    this.video.removeEventListener('playing', this.onReady);
    this.video.removeEventListener('seeked', this.onReady);
    if (this.callbackId !== null) this.video.cancelVideoFrameCallback?.(this.callbackId);
    this.callbackId = null;
    await this.pending?.catch(() => {});
  }

  /** Ejecuta una extracción sobre el frame mostrado y programa la siguiente solo si la fuente avanza. */
  async #processCurrentFrame() {
    if (!this.enabled || this.pending || !isFrameReady(this.video)) return;
    const sourceTimestampMs = Number.isFinite(this.video?.currentTime) && !this.video?.srcObject ? this.video.currentTime * 1000 : undefined;
    this.pending = Promise.resolve(this.extractLandmarks(this.video, { sourceTimestampMs }));
    try { await this.pending; } catch (error) { this.onError(error); } finally { this.pending = null; }
    if (this.enabled && isAdvancing(this.video)) this.#scheduleNextFrame();
  }

  /** Espera la presentación siguiente sin usar ese callback para construir el dataset. */
  #scheduleNextFrame() {
    if (!this.enabled || this.callbackId !== null) return;
    if (typeof this.video.requestVideoFrameCallback === 'function') {
      this.callbackId = this.video.requestVideoFrameCallback(() => { this.callbackId = null; this.#processCurrentFrame(); });
      return;
    }
    globalThis.requestAnimationFrame?.(() => this.#processCurrentFrame());
  }
}

/** El video debe disponer de un frame decodificado antes de enviarlo al extractor. */
function isFrameReady(video) { return typeof video?.readyState !== 'number' || video.readyState >= 2; }
/** Cámara y video en reproducción pueden presentar un frame nuevo para inspección. */
function isAdvancing(video) { return Boolean(video?.srcObject) || !video?.paused; }
