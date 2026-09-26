import { LITE_FEATURE_CONTRACT, LITE_FEATURE_COUNT, regenerateVector139 } from '../vision/LiteVectorizer139.js';

/**
 * Validación interna de FASE I para muestras Lite. Los schemas públicos siguen
 * siendo legacy hasta FASE II, por lo que esta función no afirma compatibilidad
 * con ellos: protege estructura, tiempo y reproducibilidad de F139 antes de I/O.
 */
export function validateSample(sample, { classResolver } = {}) {
  const errors = [];
  if (!sample || typeof sample !== 'object') return { valid: false, errors: ['La muestra debe ser un objeto.'] };
  if (sample.featureContract !== LITE_FEATURE_CONTRACT) errors.push('Falta el marcador contractual Lite F139.');
  if (!sample.classId) errors.push('Falta classId de la clase activa.');
  if (sample.classId && typeof classResolver === 'function' && !classResolver(sample.classId)) errors.push('classId no corresponde a una clase válida.');
  if (!Array.isArray(sample.frames) || sample.frames.length === 0) errors.push('La muestra debe contener al menos un frame válido.');
  if (!sample.fuente || !['camera', 'video'].includes(sample.fuente.tipo)) errors.push('La fuente debe ser camera o video.');
  if (!sample.tiempo || sample.tiempo.inicioMs !== 0) errors.push('El tiempo de la muestra debe iniciar en 0.');
  if (sample.tiempo && sample.tiempo.duracionMs !== sample.tiempo.finMs - sample.tiempo.inicioMs) errors.push('La duración no coincide con inicio y fin.');
  if (sample.tiempo && sample.tiempo.cantidadFrames !== sample.frames?.length) errors.push('cantidadFrames no coincide con frames.length.');
  if (sample.fuente?.tipo === 'video') {
    const video = sample.fuente.video;
    if (!video || video.finSegmentoMs <= video.inicioSegmentoMs) errors.push('El segmento de video requiere inicio < fin.');
    if (video && video.duracionSegmentoMs !== video.finSegmentoMs - video.inicioSegmentoMs) errors.push('La duración del segmento no coincide con inicio y fin.');
    if (video && sample.tiempo && sample.tiempo.duracionMs !== video.duracionSegmentoMs) errors.push('El tiempo de la muestra no coincide con la duración del segmento.');
  }
  sample.frames?.forEach((frame, index) => validateFrame(frame, index, sample, errors));
  return { valid: errors.length === 0, errors };
}

function validateFrame(frame, index, sample, errors) {
  if (!Number.isFinite(frame?.timestampMs) || frame.timestampMs < 0) errors.push(`Timestamp inválido en frame ${index}.`);
  if (frame?.frameIndex !== index) errors.push(`frameIndex inválido en frame ${index}.`);
  if (index === 0 && frame?.timestampMs !== 0) errors.push('El primer timestamp debe ser 0.');
  if (index > 0 && frame?.timestampMs <= sample.frames[index - 1].timestampMs) errors.push(`Timestamps no crecientes en frame ${index}.`);
  if (sample.tiempo && frame?.timestampMs > sample.tiempo.finMs) errors.push(`Timestamp fuera de la duración en frame ${index}.`);
  if (!frame?.raw || !Array.isArray(frame?.vector139) || frame.vector139.length !== LITE_FEATURE_COUNT || !frame.vector139.every(Number.isFinite)) errors.push(`Frame Lite incompleto en posición ${index}.`);
  const regenerated = regenerateVector139(frame, index > 0 ? sample.frames[index - 1] : null);
  if (!regenerated || !sameVector(regenerated, frame.vector139)) errors.push(`F139 no es reproducible desde raw en frame ${index}.`);
}
function sameVector(left, right) { return left.length === right.length && left.every((value, index) => Math.abs(value - right[index]) <= 1e-9); }
