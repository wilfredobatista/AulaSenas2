export class SignRecognizer {
  constructor({ onStatus }) { this.onStatus = onStatus; this.model = null; this.ready = false; this.onSign = null; this.onStatus('missing'); }
  async load(modelUrl) { if (!modelUrl) { this.onStatus('missing'); return false; } try { const response = await fetch(modelUrl); if (!response.ok) throw new Error('Modelo exportado no disponible'); this.model = await response.json(); this.ready = true; this.onStatus('ready'); return true; } catch { this.onStatus('missing'); return false; } }
  process(frame) { if (!this.ready || !this.onSign) return; /* Pendiente: landmarks de MediaPipe y tensor compatible con el modelo exportado. */ void frame; }
}
