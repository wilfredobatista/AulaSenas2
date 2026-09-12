/** Adaptador de visión opcional; informa ausencia en vez de producir landmarks falsos. */
export class MediaPipeAdapter { constructor({ onStatus = () => {}, onLandmarks = () => {} } = {}) { this.onStatus = onStatus; this.onLandmarks = onLandmarks; this.detector = null; this.ready = false; }
  async initialize() { this.onStatus('missing'); throw new Error('MediaPipe no está instalado o configurado en Usuario.'); }
  async process(video, deltaMs) { if (!this.ready) return null; void video; void deltaMs; return null; }
  close() { this.detector?.close?.(); this.detector = null; this.ready = false; this.onStatus('stopped'); }
}
