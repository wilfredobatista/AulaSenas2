/** Detector local de MediaPipe Hands; conserva la colección de puntos del contrato. */
export class LocalLandmarkExtractor {
  /** @param {object} options Dependencias y configuración del detector. */
  constructor({ detect, handsFactory, scriptLoader = loadScript } = {}) { this.detect = detect; this.handsFactory = handsFactory; this.scriptLoader = scriptLoader; this.detector = null; }
  /** Carga MediaPipe Hands si no fue inyectado y registra el callback de resultados. */
  async initialize(options = {}) {
    if (typeof this.detect === 'function') return this;
    if (!this.handsFactory) { await this.scriptLoader('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'); this.handsFactory = globalThis.Hands; }
    if (typeof this.handsFactory !== 'function') throw new Error('MediaPipe Hands no está disponible.');
    this.detector = new this.handsFactory({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
    this.detector.setOptions({ maxNumHands: options.maxNumHands ?? 1, modelComplexity: options.modelComplexity ?? 1, ...(options.minDetectionConfidence === undefined ? {} : { minDetectionConfidence: options.minDetectionConfidence }), ...(options.minTrackingConfidence === undefined ? {} : { minTrackingConfidence: options.minTrackingConfidence }) });
    this.detector.onResults((results) => { this.latestResults = results?.multiHandLandmarks ?? []; });
    return this;
  }
  /** Envía un frame al detector y devuelve landmarks en la forma del contrato. */
  async extract(video) { if (typeof this.detect === 'function') return this.detect(video); if (!this.detector) await this.initialize(); await this.detector.send({ image: video }); return this.latestResults ?? []; }
  /** Libera recursos del detector si la implementación de MediaPipe lo permite. */
  async close() { if (typeof this.detector?.close === 'function') await this.detector.close(); this.detector = null; }
}

/** Carga una dependencia JavaScript sin importar código de otra aplicación. */
function loadScript(src) { return new Promise((resolve, reject) => { const script = document.createElement('script'); script.src = src; script.onload = resolve; script.onerror = () => reject(new Error(`No se pudo cargar MediaPipe: ${src}`)); document.head.appendChild(script); }); }
