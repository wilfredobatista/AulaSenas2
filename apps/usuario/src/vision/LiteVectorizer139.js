/** Implementación local del contrato geométrico AULASENAS2_LITE_F139_V1. */
export const LITE_FEATURES = 139;
const EPSILON = 1e-6;

/**
 * Produce F139 solo si Pose ofrece nariz y hombros válidos. El reloj avanza
 * exclusivamente después de una observación válida, preservando huecos reales.
 */
export class LiteVectorizer139 {
  constructor() { this.previousTimestampMs = null; }
  reset() { this.previousTimestampMs = null; }
  vectorize(extraction) {
    const timestampMs = extraction?.sourceTimestampMs;
    if (!Number.isFinite(timestampMs) || (this.previousTimestampMs !== null && timestampMs <= this.previousTimestampMs)) return invalid('timestamp_invalido');
    const raw = extraction?.raw; const leftShoulder = raw?.pose?.leftShoulder; const rightShoulder = raw?.pose?.rightShoulder; const nose = raw?.pose?.nose;
    if (![leftShoulder, rightShoulder, nose].every(isPoint)) return invalid('pose_invalida');
    const scale = Math.hypot(leftShoulder.x - rightShoulder.x, leftShoulder.y - rightShoulder.y);
    if (!Number.isFinite(scale) || scale <= EPSILON) return invalid('escala_degenerada');
    const center = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2, z: (leftShoulder.z + rightShoulder.z) / 2 };
    const left = handVector(raw?.hands?.left, center, scale); const right = handVector(raw?.hands?.right, center, scale);
    if (!left || !right) return invalid('mano_invalida');
    const pose = [leftShoulder, rightShoulder, nose].flatMap((point) => normalize(point, center, scale));
    const deltaMs = this.previousTimestampMs === null ? 0 : timestampMs - this.previousTimestampMs;
    const vector139 = Float32Array.from([...left.values, ...right.values, ...pose, left.present, right.present, 1, Math.min(1, Math.max(0, deltaMs / 1000))]);
    if (vector139.length !== LITE_FEATURES || !vector139.every(Number.isFinite)) return invalid('vector_invalido');
    this.previousTimestampMs = timestampMs;
    return Object.freeze({ valid: true, vector139, deltaMs, deltaMsNorm: vector139[138], raw, frameToken: extraction.frameToken, timestampMs });
  }
}
function handVector(hand, center, scale) { if (hand == null) return { values: Array(63).fill(0), present: 0 }; if (!Array.isArray(hand) || hand.length !== 21 || !hand.every(isPoint)) return null; return { values: hand.flatMap((point) => normalize(point, center, scale)), present: 1 }; }
function normalize(point, center, scale) { return [(point.x - center.x) / scale, (point.y - center.y) / scale, (point.z - center.z) / scale]; }
function isPoint(point) { return ['x', 'y', 'z'].every((key) => Number.isFinite(point?.[key])); }
function invalid(reason) { return Object.freeze({ valid: false, reason }); }
