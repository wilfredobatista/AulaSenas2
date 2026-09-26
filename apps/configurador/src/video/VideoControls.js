/** Controla navegación y marcadores de un video importado, sin extraer landmarks. */
export class VideoControls {
  /** @param {HTMLVideoElement} video Video importado que se controla. */
  constructor(video) { this.video = video; this.startMs = null; this.endMs = null; }
  /** Alterna reproducción y pausa del video. */
  async togglePlayback() { if (this.video.paused) await this.video.play(); else this.video.pause(); return !this.video.paused; }
  /** Avanza o retrocede una cantidad exacta de milisegundos, limitada al video. */
  seekBy(deltaMs) { const duration = Number.isFinite(this.video.duration) ? this.video.duration * 1000 : Number.POSITIVE_INFINITY; this.video.currentTime = Math.max(0, Math.min(duration, this.video.currentTime * 1000 + deltaMs)) / 1000; return this.currentMs; }
  /** Avanza o retrocede aproximadamente un frame usando la tasa declarada o 30 FPS. */
  seekFrame(direction) { return this.seekBy((direction < 0 ? -1 : 1) * 1000 / (this.video.frameRate || 30)); }
  /** Marca el inicio del segmento en la línea temporal del archivo. */
  markStart() { this.startMs = this.currentMs; return this.startMs; }
  /** Marca el fin y pausa después, conservando exactamente el tiempo registrado. */
  markEnd() { this.endMs = this.currentMs; this.video.pause(); return this.endMs; }
  /** Borra marcadores para evitar reutilizar límites de otro video. */
  reset() { this.startMs = null; this.endMs = null; }
  /** Tiempo actual del elemento en milisegundos. */
  get currentMs() { return Math.max(0, Math.round((this.video.currentTime || 0) * 1000)); }
  /** Devuelve límites válidos o informa qué marcador falta. */
  get segment() { if (!Number.isFinite(this.startMs) || !Number.isFinite(this.endMs)) return null; return { startMs: this.startMs, endMs: this.endMs }; }
}
