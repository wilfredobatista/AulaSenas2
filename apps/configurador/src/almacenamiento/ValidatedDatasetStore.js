/**
 * Cliente del servicio local autoritativo de datasets. Conserva la API usada
 * por el flujo de captura, pero no recibe handles, rutas ni usa File System
 * Access: toda persistencia se limita al servidor local del Configurador.
 */
export class ValidatedDatasetStore {
  /**
   * @param {object} dependencies Dependencias inyectables para pruebas HTTP.
   * @param {typeof fetch} dependencies.fetchImpl Transporte same-origin.
   * @param {string} dependencies.baseUrl Prefijo privado de la API de dataset.
   */
  constructor({ fetchImpl = globalThis.fetch, baseUrl = '/api/dataset' } = {}) {
    this.fetchImpl = fetchImpl;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /** Inicializa data/validated/default/clases y devuelve el catálogo real. */
  async initialize() {
    const response = await this.#request('/initialize', { method: 'POST' });
    return readCatalog(response);
  }

  /** Reconstruye clases y conteos desde los JSON que el servicio acaba de leer. */
  async loadCatalog() {
    return readCatalog(await this.#request(''));
  }

  /** Devuelve el manifest confirmado o null mientras el dataset está vacío. */
  async readManifest() {
    return (await this.#request('')).manifest;
  }

  /** Cuenta una clase desde la representación persistida, nunca desde sesión. */
  async countClass(classId) {
    return (await this.loadCatalog()).counts[classId] ?? 0;
  }

  /** Devuelve todos los conteos que el servidor reconstruyó desde los archivos. */
  async countClasses() {
    return (await this.loadCatalog()).counts;
  }

  /** Añade una muestra previamente validada por el flujo de captura. */
  async appendSample({ classDefinition, sample }) {
    return this.#request(`/classes/${encodeURIComponent(sample?.classId ?? '')}/samples`, {
      method: 'POST', body: { classDefinition, sample },
    });
  }

  /** Persiste una clase vacía inmediatamente para que sobreviva a un reinicio. */
  async createClass(classDefinition) {
    return this.#request('/classes', { method: 'POST', body: { classDefinition } });
  }

  /** Reemplaza solo metadata de la clase sin tocar su arreglo de muestras. */
  async updateClassMetadata(classDefinition) {
    return this.#request(`/classes/${encodeURIComponent(classDefinition?.classId ?? '')}`, {
      method: 'PUT', body: { classDefinition },
    });
  }

  /** Solicita eliminar la última muestra persistida de una clase existente. */
  async deleteLastSample(classId) {
    return this.#request(`/classes/${encodeURIComponent(classId ?? '')}/samples/latest`, { method: 'DELETE' });
  }

  /** Convierte fallos HTTP en errores visibles; nunca los presenta como éxito. */
  async #request(path, { method = 'GET', body } = {}) {
    let response;
    try {
      // Edge exige que window.fetch no reciba ValidatedDatasetStore como `this`.
      // La referencia local fuerza una invocación de función, no de método.
      const fetchImpl = this.fetchImpl;
      response = await fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers: body ? { 'content-type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new Error('Servicio de dataset no disponible.');
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error?.message ?? 'Servicio de dataset no disponible.');
    return payload;
  }
}

/**
 * Extrae el catálogo de la envoltura API. `manifest: null` se permite: indica
 * un dataset válido que aún no contiene clases, no una indisponibilidad.
 */
function readCatalog(response) {
  const catalog = response?.catalog;
  if (!catalog || !Array.isArray(catalog.classes) || typeof catalog.counts !== 'object' || catalog.counts === null || Array.isArray(catalog.counts)) {
    throw new Error('La respuesta del dataset no contiene un catálogo válido.');
  }
  return catalog;
}
