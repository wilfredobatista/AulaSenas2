/** Contrato GRU/CTC de Usuario: 307 características visuales + deltaMsNorm. */
export const TEMPORAL_LENGTH = 32;
export const LANDMARK_FEATURES = 307;
export const FRAME_FEATURES = 308;
export function validateTemporalInput(sequence, { time = TEMPORAL_LENGTH, features = FRAME_FEATURES } = {}) { if (!Array.isArray(sequence) || sequence.length !== time) throw new Error(`Entrada temporal inválida: se esperaban ${time} frames.`); if (sequence.some((frame) => !Array.isArray(frame) || frame.length !== features)) throw new Error(`Cada frame debe tener ${features} características ([T, ${features}]).`); return true; }
