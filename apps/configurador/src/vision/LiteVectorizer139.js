/** Identificador transitorio de FASE I para impedir mezclar muestras Lite con documentos legacy. */
export const LITE_FEATURE_CONTRACT = 'AULASENAS2_LITE_F139_V1';
export const LITE_FEATURE_COUNT = 139;
export const LITE_SCALE_EPSILON = 1e-6;

/**
 * Convierte una observación raw Lite en el vector geométrico F139.
 * El raw nunca se modifica: ambas manos, hombros y nariz comparten centro de
 * torso y escala XY. Un anclaje o una mano detectada incompletos invalidan el
 * frame completo; una mano realmente ausente se representa con ceros y mask 0.
 */
export function vectorizeLiteRaw(raw, { deltaMs = 0, epsilon = LITE_SCALE_EPSILON } = {}) {
  const leftShoulder = raw?.pose?.leftShoulder;
  const rightShoulder = raw?.pose?.rightShoulder;
  const nose = raw?.pose?.nose;
  if (![leftShoulder, rightShoulder, nose].every(isFinitePoint)) return null;
  const scale = Math.hypot(leftShoulder.x - rightShoulder.x, leftShoulder.y - rightShoulder.y);
  if (!Number.isFinite(scale) || scale <= epsilon) return null;
  const center = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
    z: (leftShoulder.z + rightShoulder.z) / 2,
  };
  const left = normalizeHand(raw?.hands?.left, center, scale);
  const right = normalizeHand(raw?.hands?.right, center, scale);
  if (!left || !right) return null;
  const pose = [leftShoulder, rightShoulder, nose].map((point) => normalizePoint(point, center, scale));
  if (pose.flat().some((value) => !Number.isFinite(value))) return null;
  const vector139 = [
    ...left.coordinates,
    ...right.coordinates,
    ...pose[0],
    ...pose[1],
    ...pose[2],
    left.present,
    right.present,
    1,
    clip(Number(deltaMs) / 1000, 0, 1),
  ];
  return vector139.length === LITE_FEATURE_COUNT && vector139.every(Number.isFinite) ? vector139 : null;
}

/**
 * Mantiene el reloj de una sola captura. Los descartes no avanzan el timestamp
 * válido previo, por lo que el delta siguiente conserva el hueco temporal real.
 */
export class LiteTemporalEncoder {
  constructor({ epsilon = LITE_SCALE_EPSILON } = {}) { this.epsilon = epsilon; this.reset(); }
  /** Reinicia toda referencia temporal entre muestras independientes. */
  reset() { this.firstTimestampMs = null; this.previousTimestampMs = null; this.nextFrameIndex = 0; }
  /** Devuelve un frame persistible o null cuando la observación/timestamp no es válido. */
  encode(extraction) {
    const sourceTimestampMs = extraction?.sourceTimestampMs;
    if (!Number.isFinite(sourceTimestampMs)) return null;
    if (this.previousTimestampMs !== null && sourceTimestampMs <= this.previousTimestampMs) return null;
    const deltaMs = this.previousTimestampMs === null ? 0 : sourceTimestampMs - this.previousTimestampMs;
    const vector139 = vectorizeLiteRaw(extraction?.raw, { deltaMs, epsilon: this.epsilon });
    if (!vector139) return null;
    if (this.firstTimestampMs === null) this.firstTimestampMs = sourceTimestampMs;
    const frame = {
      frameIndex: this.nextFrameIndex,
      timestampMs: sourceTimestampMs - this.firstTimestampMs,
      frameToken: extraction.frameToken,
      raw: clone(extraction.raw),
      vector139,
    };
    this.previousTimestampMs = sourceTimestampMs;
    this.nextFrameIndex += 1;
    return frame;
  }
}

/** Regenera F139 desde raw y el delta persistido, útil para comprobar reproducibilidad. */
export function regenerateVector139(frame, previousFrame = null) {
  const deltaMs = previousFrame ? frame.timestampMs - previousFrame.timestampMs : 0;
  return vectorizeLiteRaw(frame?.raw, { deltaMs });
}

function normalizeHand(hand, center, scale) {
  if (hand === null || hand === undefined) return { coordinates: Array(63).fill(0), present: 0 };
  if (!Array.isArray(hand) || hand.length !== 21 || !hand.every(isFinitePoint)) return null;
  return { coordinates: hand.flatMap((point) => normalizePoint(point, center, scale)), present: 1 };
}
function normalizePoint(point, center, scale) { return [(point.x - center.x) / scale, (point.y - center.y) / scale, (point.z - center.z) / scale]; }
function isFinitePoint(point) { return point && ['x', 'y', 'z'].every((key) => Number.isFinite(point[key])); }
function clip(value, minimum, maximum) { return Math.min(maximum, Math.max(minimum, value)); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
