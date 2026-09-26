/** Soluciones MediaPipe Lite: Hands y Pose independientes, sin rostro. */
const HANDS_VERSION = '0.4.1675469240';
const POSE_VERSION = '0.5.1675469404';
const HANDS_ROOT = `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${HANDS_VERSION}`;
const POSE_ROOT = `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${POSE_VERSION}`;

/**
 * Inicializa Hands y luego Pose una sola vez. Cada extract combina resultados
 * del mismo frameToken y timestamp; ante cualquier error no publica raw.
 */
export class LiteFrameExtractor {
  constructor({ handsFactory = null, poseFactory = null, scriptLoader = loadScript } = {}) {
    this.handsFactory = handsFactory; this.poseFactory = poseFactory; this.scriptLoader = scriptLoader; this.ready = null; this.hands = null; this.pose = null;
  }
  async initialize(image) {
    if (this.ready) return this.ready;
    this.ready = this.#initializeSequentially(image); return this.ready;
  }
  async extract(image, context) {
    await this.initialize(image);
    const [handsResult, poseResult] = await Promise.all([this.hands.send(image), this.pose.send(image)]);
    return Object.freeze({ frameToken: context.frameToken, sourceTimestampMs: context.sourceTimestampMs, raw: buildRawLite(handsResult, poseResult) });
  }
  async #initializeSequentially(image) {
    if (!this.handsFactory) { await this.scriptLoader(`${HANDS_ROOT}/hands.js`); this.handsFactory = globalThis.Hands; }
    if (!this.handsFactory) throw new Error('MediaPipe Hands no está disponible.');
    this.hands = makeRunner(new this.handsFactory({ locateFile: (file) => `${HANDS_ROOT}/${file}` }), { maxNumHands: 2, modelComplexity: 0, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    await this.hands.initialize(); await this.hands.warmup(image);
    if (!this.poseFactory) { await this.scriptLoader(`${POSE_ROOT}/pose.js`); this.poseFactory = globalThis.Pose; }
    if (!this.poseFactory) throw new Error('MediaPipe Pose no está disponible.');
    this.pose = makeRunner(new this.poseFactory({ locateFile: (file) => `${POSE_ROOT}/${file}` }), { modelComplexity: 0, smoothLandmarks: false, enableSegmentation: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    await this.pose.initialize(); await this.pose.warmup(image);
  }
}

/** Adapta exclusivamente los 21×XYZ de cada mano y MP0/11/12 de Pose. */
export function buildRawLite(handsResult = {}, poseResult = {}) {
  const hands = { left: null, right: null };
  const landmarks = handsResult.multiHandLandmarks ?? [];
  const handedness = handsResult.multiHandedness ?? [];
  landmarks.slice(0, 2).forEach((hand, index) => {
    const label = handedness[index]?.label ?? handedness[index]?.classification?.[0]?.label;
    // El stream entra sin espejo; la solución selfie etiqueta la imagen, por lo
    // que invertimos Left/Right para representar el lado físico del signante.
    const side = label === 'Left' ? 'right' : label === 'Right' ? 'left' : null;
    if (side) hands[side] = copyHand(hand);
  });
  const pose = poseResult.poseLandmarks ?? [];
  return Object.freeze({ hands, pose: Object.freeze({ nose: copyPoint(pose[0]), leftShoulder: copyPoint(pose[11]), rightShoulder: copyPoint(pose[12]) }) });
}
function makeRunner(detector, options) {
  detector.setOptions(options); let resolveResult = null;
  detector.onResults((result) => { const resolve = resolveResult; resolveResult = null; resolve?.(result ?? {}); });
  const send = (image) => new Promise((resolve, reject) => { resolveResult = resolve; Promise.resolve(detector.send({ image })).catch((error) => { resolveResult = null; reject(error); }); });
  return { initialize: async () => { if (detector.initialize) await detector.initialize(); }, warmup: send, send };
}
function copyHand(hand) { return Array.isArray(hand) && hand.length === 21 && hand.every(isFinitePoint) ? hand.map(copyPoint) : null; }
function copyPoint(point) { return isFinitePoint(point) ? Object.freeze({ x: point.x, y: point.y, z: point.z, ...(Number.isFinite(point.visibility) ? { visibility: point.visibility } : {}) }) : null; }
function isFinitePoint(point) { return ['x', 'y', 'z'].every((key) => Number.isFinite(point?.[key])); }
function loadScript(src) { return new Promise((resolve, reject) => { const script = document.createElement('script'); script.src = src; script.crossOrigin = 'anonymous'; script.onload = resolve; script.onerror = () => reject(new Error(`No se pudo cargar ${src}.`)); document.head.append(script); }); }
