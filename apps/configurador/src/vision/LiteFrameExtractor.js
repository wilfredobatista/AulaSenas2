/** Versiones fijas para que script y assets WASM pertenezcan al mismo paquete. */
export const MEDIAPIPE_HANDS_VERSION = '0.4.1675469240';
export const MEDIAPIPE_POSE_VERSION = '0.5.1675469404';
export const MEDIAPIPE_HANDS_ROOT = `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${MEDIAPIPE_HANDS_VERSION}`;
export const MEDIAPIPE_POSE_ROOT = `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${MEDIAPIPE_POSE_VERSION}`;

/**
 * Extractor independiente de AulaSenas2-Lite. Ejecuta MediaPipe Hands y Pose
 * sobre una misma imagen y etiqueta ambos resultados con un frameToken común.
 * Los motores se crean una sola vez y su WASM se inicializa secuencialmente.
 */
export class LiteFrameExtractor {
  constructor({ detect = null, detectHands = null, detectPose = null, handsFactory = null, poseFactory = null, scriptLoader = loadScript, onResult = () => {} } = {}) {
    this.detect = detect;
    this.detectHands = detectHands;
    this.detectPose = detectPose;
    this.handsFactory = handsFactory;
    this.poseFactory = poseFactory;
    this.scriptLoader = scriptLoader;
    this.onResult = onResult;
    this.ready = null;
    this.queue = Promise.resolve();
    this.nextToken = 1;
  }

  /**
   * Captura el timestamp antes de inferencia y serializa llamadas. Tras el
   * warmup secuencial, Hands y Pose sí pueden procesar en paralelo el mismo
   * frame fuente porque ambos runtimes ya terminaron de arrancar.
   */
  extract(image, context = {}) {
    const sourceTimestampMs = Number.isFinite(context.sourceTimestampMs) ? context.sourceTimestampMs : monotonicNow();
    const frameToken = context.frameToken ?? this.nextToken++;
    const operation = this.queue.then(async () => {
      let combined;
      if (this.detect) combined = await this.detect(image, { ...context, frameToken, sourceTimestampMs });
      else {
        await this.#initialize(image);
        const [hands, pose] = await Promise.all([this.detectHands(image), this.detectPose(image)]);
        combined = { ...hands, ...pose };
      }
      const extraction = { frameToken, sourceTimestampMs, raw: buildRawLite(combined) };
      this.onResult(extraction);
      return extraction;
    });
    this.queue = operation.catch(() => {});
    return operation;
  }

  /**
   * Arranca Hands por completo antes de cargar/crear Pose. Esto evita que los
   * dos módulos Emscripten compitan por el estado global durante el primer send.
   * Si initialize() no existe, un send del frame actual actúa como warmup.
   */
  async #initialize(image) {
    if (this.ready) return this.ready;
    this.ready = (async () => {
      // Tests y hosts embebidos pueden inyectar detectores ya inicializados.
      if (typeof this.detectHands === 'function' && typeof this.detectPose === 'function') return;

      if (!this.handsFactory) {
        await this.scriptLoader(`${MEDIAPIPE_HANDS_ROOT}/hands.js`);
        this.handsFactory = globalThis.Hands;
      }
      if (!this.handsFactory) throw new Error('MediaPipe Hands no está disponible.');
      const handsRunner = createRunner(new this.handsFactory({ locateFile: (file) => `${MEDIAPIPE_HANDS_ROOT}/${file}` }), {
        maxNumHands: 2, modelComplexity: 0, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5,
      });
      try { await handsRunner.initialize(image); }
      catch (error) { throw new Error(`No se pudo inicializar MediaPipe Hands: ${errorMessage(error)}`); }
      this.detectHands = handsRunner.send;

      if (!this.poseFactory) {
        await this.scriptLoader(`${MEDIAPIPE_POSE_ROOT}/pose.js`);
        this.poseFactory = globalThis.Pose;
      }
      if (!this.poseFactory) throw new Error('MediaPipe Pose no está disponible.');
      const poseRunner = createRunner(new this.poseFactory({ locateFile: (file) => `${MEDIAPIPE_POSE_ROOT}/${file}` }), {
        modelComplexity: 0, smoothLandmarks: false, enableSegmentation: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5,
      });
      try { await poseRunner.initialize(image); }
      catch (error) { throw new Error(`No se pudo inicializar MediaPipe Pose: ${errorMessage(error)}`); }
      this.detectPose = poseRunner.send;
    })();
    return this.ready;
  }
}

/** Adapta la salida oficial de MediaPipe sin copiar ni completar landmarks ausentes. */
export function buildRawLite(result = {}) {
  const hands = { left: null, right: null };
  const landmarks = result.multiHandLandmarks ?? result.hands ?? [];
  const handedness = result.multiHandedness ?? result.handedness ?? [];
  landmarks.slice(0, 2).forEach((hand, index) => {
    const label = readHandedness(handedness[index]);
    // MediaPipe etiqueta la imagen selfie: Left corresponde al lado físico
    // derecho del signante y viceversa. El espejo CSS no toca los datos.
    const physicalSide = label === 'Left' ? 'right' : label === 'Right' ? 'left' : null;
    if (physicalSide) hands[physicalSide] = copyPoints(hand, 21);
  });
  const poseLandmarks = result.poseLandmarks ?? result.pose ?? [];
  return {
    hands,
    pose: {
      nose: copyPoint(poseLandmarks[0], true),
      leftShoulder: copyPoint(poseLandmarks[11], true),
      rightShoulder: copyPoint(poseLandmarks[12], true),
    },
  };
}

/** Encapsula callbacks de Solution y ofrece warmup explícito e inferencia. */
function createRunner(detector, options) {
  detector.setOptions(options);
  let resolveResult = null;
  detector.onResults((result) => { const resolve = resolveResult; resolveResult = null; resolve?.(result ?? {}); });
  const send = (image) => new Promise((resolve, reject) => {
    resolveResult = resolve;
    Promise.resolve(detector.send({ image })).catch((error) => { resolveResult = null; reject(error); });
  });
  const initialize = async (image) => {
    if (typeof detector.initialize === 'function') { await detector.initialize(); return; }
    // Versiones antiguas inicializan el WASM durante el primer send.
    await send(image);
  };
  return { initialize, send };
}
function readHandedness(value) { return value?.label ?? value?.classification?.[0]?.label ?? value?.[0]?.label ?? null; }
function copyPoints(points, expected) {
  if (!Array.isArray(points) || points.length !== expected || points.some((point) => !['x', 'y', 'z'].every((key) => Number.isFinite(point?.[key])))) return null;
  return points.map((point) => copyPoint(point, false));
}
function copyPoint(point, visibility) {
  if (!point) return null;
  const output = { x: Number(point.x), y: Number(point.y), z: Number(point.z) };
  if (visibility && Number.isFinite(point.visibility)) output.visibility = point.visibility;
  return output;
}
function errorMessage(error) { return error instanceof Error ? error.message : String(error); }
function monotonicNow() { return globalThis.performance?.now?.() ?? Date.now(); }
function loadScript(src) { return new Promise((resolve, reject) => { const script = document.createElement('script'); script.src = src; script.crossOrigin = 'anonymous'; script.onload = resolve; script.onerror = () => reject(new Error(`No se pudo cargar ${src}.`)); document.head.append(script); }); }
