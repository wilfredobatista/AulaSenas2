export class LandmarkExtractor {
  constructor() { this.ready = false; }
  async initialize() { throw new Error('MediaPipe no está instalado; se requiere un extractor de landmarks para habilitar el reconocimiento.'); }
  extract(_videoFrame) { if (!this.ready) return null; return null; }
}
