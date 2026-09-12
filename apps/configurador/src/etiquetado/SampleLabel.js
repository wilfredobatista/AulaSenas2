/** Normaliza metadatos humanos sin alterar ni interpretar landmarks. */
export function createSampleLabel({ label, participant = '', notes = '' } = {}) {
  /** @type {{label: string, participant: string, notes: string}} */
  const cleanLabel = String(label ?? '').trim();
  if (!cleanLabel) throw new Error('La seña requiere una etiqueta.');
  return { label: cleanLabel, participant: String(participant).trim(), notes: String(notes).trim() };
}
