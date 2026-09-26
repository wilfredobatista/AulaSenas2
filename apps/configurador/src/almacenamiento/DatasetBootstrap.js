/**
 * Inicializa el catálogo en memoria desde la respuesta ya confirmada por el
 * servicio local. Un manifest nulo representa correctamente un dataset vacío:
 * el contrato no permite publicar manifest hasta que exista una primera clase.
 */

/**
 * Hidrata catálogo, conteos y estado visible a partir del resultado de
 * `ValidatedDatasetStore.initialize`. Las dependencias son inyectables para
 * verificar el bootstrap sin requerir DOM ni una conexión real.
 *
 * @param {object} dependencies Servicios ya construidos por main.js.
 * @returns {Promise<object>} Conteos reconstruidos del dataset persistido.
 */
export async function initializeDataset({ datasetStore, classCatalog, ui }) {
  const catalog = await datasetStore.initialize();
  assertCatalog(catalog);
  classCatalog.hydrate(catalog.classes);
  ui.setDatasetStatus('Dataset listo');
  return catalog.counts;
}

/**
 * Ejecuta el bootstrap completo y traduce su resultado a estado de aplicación.
 * Mantiene separados el dataset vacío válido y la indisponibilidad real.
 *
 * @param {object} dependencies Servicios usados por initializeDataset.
 * @returns {Promise<{available: boolean, counts: object, errorMessage: string|null}>}
 */
export async function bootstrapDataset(dependencies) {
  try {
    const counts = await initializeDataset(dependencies);
    return { available: true, counts, errorMessage: null };
  } catch (error) {
    const errorMessage = error?.message || 'Servicio de dataset no disponible.';
    dependencies.ui.setDatasetStatus(errorMessage, true);
    return { available: false, counts: {}, errorMessage };
  }
}

/** Distingue una respuesta API incompatible de un dataset válido sin clases. */
function assertCatalog(catalog) {
  if (!catalog || !Array.isArray(catalog.classes) || !isRecord(catalog.counts)) {
    throw new Error('La respuesta del dataset no contiene un catálogo válido.');
  }
}
function isRecord(value) { return typeof value === 'object' && value !== null && !Array.isArray(value); }
