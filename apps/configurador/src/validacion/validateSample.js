/** Valida invariantes mínimos de una muestra antes de persistirla. */
export function validateSample(sample) {
  const errors = [];
  if (!sample || typeof sample !== 'object') errors.push('La muestra debe ser un objeto.');
  if (!sample?.metadata?.label) errors.push('Falta la etiqueta de la seña.');
  if (!Array.isArray(sample?.frames) || sample.frames.length === 0) errors.push('La muestra debe contener al menos un frame.');
  sample?.frames?.forEach((frame, index) => {
    if (!Number.isFinite(frame.timestampMs) || frame.timestampMs < 0) errors.push(`Timestamp inválido en frame ${index}.`);
    if (frame.landmarks == null) errors.push(`Faltan landmarks en frame ${index}.`);
  });
  return { valid: errors.length === 0, errors };
}
