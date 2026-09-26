/**
 * Reglas puras del formato persistido que comparten el cliente y el servicio
 * local. No acceden al sistema de archivos ni modifican muestras existentes.
 */

/**
 * Convierte únicamente metadata legacy de clase al formato CON-06.
 *
 * @param {object} legacy Definición histórica leída desde un JSON de clase.
 * @returns {object} Metadata compatible que conserva exactamente el classId.
 */
export function normalizeLegacyClass(legacy) {
  const tipo = legacy?.tipo ?? (legacy?.classId === 'ruido_background' ? 'ruido_background' : 'normal');
  const significados = tipo === 'ruido_background'
    ? []
    : (legacy?.significados ?? [])
      .map((item) => typeof item === 'string' ? item : item?.texto)
      .filter((item) => typeof item === 'string');

  return { classId: legacy?.classId, glosa: legacy?.glosa, significados, estado: legacy?.estado ?? 'activa', tipo };
}

/**
 * Deriva el único nombre de archivo permitido para una clase ya validada.
 * `encodeURIComponent` evita que un identificador se interprete como ruta.
 *
 * @param {string} classId Identidad estable de la clase.
 * @returns {string} Nombre de archivo relativo, sin directorios.
 */
export function classFileName(classId) {
  return `${encodeURIComponent(classId)}.json`;
}
