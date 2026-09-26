/**
 * Servicio autoritativo del dataset validado. Es la única capa que transforma
 * solicitudes HTTP en archivos dentro de data/ y confirma cada escritura con
 * una relectura validada antes de informar éxito al navegador.
 */
import { randomUUID } from 'node:crypto';
import { readFile, mkdir, rename, unlink, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve, sep } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { classFileName, normalizeLegacyClass } from '../src/almacenamiento/DatasetFormat.js';
import { validateSample } from '../src/validacion/validateSample.js';
import { LITE_FEATURE_CONTRACT } from '../src/vision/LiteVectorizer139.js';

/** Única cadena de schemas vigente para el dataset AulaSenas2-Lite F139. */
const SCHEMA_NAMES = ['lite-point', 'lite-hand', 'lite-raw', 'frame', 'sample-source', 'sample-time', 'sign-class', 'captured-sample', 'dataset-class', 'dataset-manifest'];

/** Error controlado que el servidor puede convertir a una respuesta 4xx. */
export class DatasetRequestError extends Error {
  constructor(message, status = 400, code = 'DATASET_REQUEST_INVALID') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Valida los schemas autorizados desde contracts/ usando Draft 2020-12.
 * La lista de nombres es cerrada: ninguna petición puede elegir un archivo.
 */
export class DatasetContractValidator {
  constructor({ contractsRoot }) {
    this.contractsRoot = contractsRoot;
    this.ready = null;
    this.ajv = null;
  }

  /** Carga todos los contratos necesarios una vez por proceso local. */
  async initialize() {
    if (this.ready) return this.ready;
    this.ready = (async () => {
      const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
      // El schema F139 delega estas posiciones indexadas a una keyword Ajv para
      // evitar una lista opaca de 135 prefixItems sin perder validación real.
      ajv.addKeyword({ keyword: 'x-aulasenas-vector139-layout', type: 'array', schemaType: 'boolean', validate: (enabled, vector) => !enabled || ([135, 136, 137].every((index) => vector[index] === 0 || vector[index] === 1) && Number.isFinite(vector[138]) && vector[138] >= 0 && vector[138] <= 1) });
      for (const name of SCHEMA_NAMES) {
        const schemaPath = safeChild(this.contractsRoot, `${name}.schema.json`);
        ajv.addSchema(JSON.parse(await readFile(schemaPath, 'utf8')), name);
      }
      this.ajv = ajv;
    })();
    return this.ready;
  }

  /** Lanza un error de solicitud si el valor no satisface el schema indicado. */
  async assert(value, schemaName) {
    await this.initialize();
    const check = this.ajv.getSchema(schemaName);
    if (!check) throw new Error(`Schema no registrado: ${schemaName}.`);
    if (check(value)) return;
    throw new DatasetRequestError(`Contrato ${schemaName} inválido: ${(check.errors ?? []).map(formatAjvError).join(' ')}`, 422, 'CONTRACT_INVALID');
  }
}

/**
 * Persiste el dataset default bajo data/validated/default. Sus dependencias
 * se inyectan para pruebas, pero producción no acepta rutas del cliente.
 */
export class DatasetService {
  constructor({ projectRoot, dataRoot = resolve(projectRoot, 'data'), contractsRoot = resolve(projectRoot, 'contracts'), datasetId = 'default', now = () => new Date().toISOString(), idFactory = () => randomUUID() } = {}) {
    if (!projectRoot) throw new Error('projectRoot es obligatorio para el servicio de dataset.');
    this.projectRoot = resolve(projectRoot);
    this.dataRoot = resolve(dataRoot);
    this.contractsRoot = resolve(contractsRoot);
    this.datasetId = datasetId;
    this.now = now;
    this.idFactory = idFactory;
    this.contracts = new DatasetContractValidator({ contractsRoot: this.contractsRoot });
    this.queue = Promise.resolve();
    this.datasetDirectory = safeChild(this.dataRoot, 'validated', datasetId);
    this.classesDirectory = safeChild(this.datasetDirectory, 'clases');
  }

  /** Crea solo los directorios operativos; un dataset vacío no tiene manifest. */
  initialize() { return this.#enqueue(async () => ({ catalog: await this.#loadCatalog(true), manifest: await this.#readManifestOptional() })); }

  /** Reconstruye clases y conteos a partir de manifest y archivos de clase. */
  load() { return this.#enqueue(async () => ({ catalog: await this.#loadCatalog(true), manifest: await this.#readManifestOptional() })); }

  /** Crea una clase persistida vacía y publica su entrada de manifest. */
  createClass(classDefinition) { return this.#enqueue(() => this.#createClass(classDefinition)); }

  /** Actualiza metadata de una clase existente sin modificar sus muestras. */
  updateClass(classId, classDefinition) { return this.#enqueue(() => this.#updateClass(classId, classDefinition)); }

  /** Añade una muestra contractual a una clase existente y confirmada. */
  appendSample(classId, classDefinition, sample) { return this.#enqueue(() => this.#appendSample(classId, classDefinition, sample)); }

  /** Borra la última muestra sin retirar la clase ni su entrada del manifest. */
  deleteLatestSample(classId) { return this.#enqueue(() => this.#deleteLatestSample(classId)); }

  async #createClass(classDefinition) {
    assertSafeClassId(classDefinition?.classId);
    assertLiteClassId(classDefinition);
    await this.contracts.assert(classDefinition, 'sign-class');
    await this.#ensureDirectories();
    const current = await this.#readManifestOptional();
    if (current?.clases.some((entry) => entry.classId === classDefinition.classId)) throw new DatasetRequestError('La clase ya existe en el dataset.', 409, 'CLASS_EXISTS');
    const name = classFileName(classDefinition.classId);
    if (await readOptionalJson(safeChild(this.classesDirectory, name))) throw new DatasetRequestError('Ya existe un archivo para la clase.', 409, 'CLASS_FILE_EXISTS');

    const document = { featureContract: LITE_FEATURE_CONTRACT, clase: classDefinition, muestras: [] };
    const manifest = this.#nextManifest(current, classDefinition.classId);
    assertLiteDocument(document, classDefinition.classId);
    await this.contracts.assert(manifest, 'dataset-manifest');
    await this.#writeAndConfirm(name, document, manifest);
    return { persisted: true, count: 0 };
  }

  async #updateClass(classId, classDefinition) {
    assertMatchingClassId(classId, classDefinition?.classId);
    await this.contracts.assert(classDefinition, 'sign-class');
    const { manifest, entry, document } = await this.#existingClass(classId);
    assertLiteDataset(document);
    const nextDocument = { ...document, clase: classDefinition };
    const nextManifest = this.#touchManifest(manifest);
    assertLiteDocument(nextDocument, classId);
    await this.contracts.assert(nextManifest, 'dataset-manifest');
    await this.#writeAndConfirm(entryFileName(entry), nextDocument, nextManifest);
    return { persisted: true, count: nextDocument.muestras.length };
  }

  async #appendSample(classId, classDefinition, sample) {
    assertMatchingClassId(classId, classDefinition?.classId);
    assertMatchingClassId(classId, sample?.classId);
    await this.contracts.assert(classDefinition, 'sign-class');
    const { manifest, entry, document } = await this.#existingClass(classId);
    assertLiteDataset(document);
    const sampleValidation = validateSample(sample, { classResolver: (candidate) => candidate === document.clase.classId });
    if (!sampleValidation.valid) throw new DatasetRequestError(`Muestra inválida: ${sampleValidation.errors.join(' ')}`, 422, 'SAMPLE_INVALID');

    const record = { ...sample, id: sample.id ?? this.idFactory(), stage: 'validated' };
    const nextDocument = { ...document, muestras: [...document.muestras, record] };
    if (nextDocument.muestras.some((item, index) => nextDocument.muestras.findIndex((candidate) => candidate.id === item.id) !== index)) throw new DatasetRequestError('La muestra ya existe en la clase.', 409, 'SAMPLE_EXISTS');
    const nextManifest = this.#touchManifest(manifest);
    assertLiteDocument(nextDocument, classId);
    await this.contracts.assert(nextManifest, 'dataset-manifest');
    await this.#writeAndConfirm(entryFileName(entry), nextDocument, nextManifest);
    return record;
  }

  async #deleteLatestSample(classId) {
    assertSafeClassId(classId);
    let existing;
    try { existing = await this.#existingClass(classId); } catch (error) {
      if (error.code === 'CLASS_NOT_FOUND') return { deleted: false, count: 0 };
      throw error;
    }
    assertLiteDataset(existing.document);
    if (!existing.document.muestras.length) return { deleted: false, count: 0 };
    const removed = existing.document.muestras.at(-1);
    const nextDocument = { ...existing.document, muestras: existing.document.muestras.slice(0, -1) };
    const nextManifest = this.#touchManifest(existing.manifest);
    assertLiteDocument(nextDocument, classId);
    await this.contracts.assert(nextManifest, 'dataset-manifest');
    await this.#writeAndConfirm(entryFileName(existing.entry), nextDocument, nextManifest);
    return { deleted: true, count: nextDocument.muestras.length, sampleId: removed.id };
  }

  /** Lee y migra metadata legacy bajo la misma cola, preservando las muestras. */
  async #loadCatalog(createDirectories) {
    if (createDirectories) await this.#ensureDirectories();
    const manifest = await this.#readManifestOptional();
    if (!manifest) return { classes: [], counts: {} };
    await this.contracts.assert(manifest, 'dataset-manifest');
    assertManifestInvariants(manifest);
    const loaded = [];
    for (const entry of manifest.clases) {
      assertManifestEntry(entry);
      const document = await readRequiredJson(safeChild(this.classesDirectory, entryFileName(entry)), 'El archivo de clase indicado por manifest no existe.');
      const normalizedClass = normalizeLegacyClass(document.clase);
      const normalizedDocument = { ...document, clase: normalizedClass };
      await this.contracts.assert(normalizedClass, 'sign-class');
      if (document.featureContract === LITE_FEATURE_CONTRACT) assertLiteDocument(normalizedDocument, entry.classId);
      else if (JSON.stringify(document.clase) === JSON.stringify(normalizedClass)) await this.contracts.assert(normalizedDocument, 'dataset-class');
      assertDocumentInvariants(normalizedDocument, entry.classId);
      loaded.push(normalizedDocument);
    }

    return { classes: loaded.map((item) => item.clase), counts: Object.fromEntries(loaded.map((item) => [item.clase.classId, item.muestras.length])) };
  }

  /** Devuelve una clase ya indexada y verifica todas las invariantes de enlace. */
  async #existingClass(classId) {
    assertSafeClassId(classId);
    await this.#ensureDirectories();
    const manifest = await this.#readManifestOptional();
    if (!manifest) throw new DatasetRequestError('Clase no encontrada en el dataset.', 404, 'CLASS_NOT_FOUND');
    await this.contracts.assert(manifest, 'dataset-manifest');
    assertManifestInvariants(manifest);
    const entry = manifest.clases.find((item) => item.classId === classId);
    if (!entry) throw new DatasetRequestError('Clase no encontrada en el dataset.', 404, 'CLASS_NOT_FOUND');
    assertManifestEntry(entry);
    const document = await readRequiredJson(safeChild(this.classesDirectory, entryFileName(entry)), 'El archivo de clase indicado por manifest no existe.');
    const normalizedClass = normalizeLegacyClass(document.clase);
    const normalizedDocument = { ...document, clase: normalizedClass };
    if (document.featureContract === LITE_FEATURE_CONTRACT) assertLiteDocument(normalizedDocument, classId);
    else if (JSON.stringify(document.clase) === JSON.stringify(normalizedClass)) await this.contracts.assert(normalizedDocument, 'dataset-class');
    assertDocumentInvariants(normalizedDocument, classId);
    return { manifest, entry, document: normalizedDocument };
  }

  /** Escribe clase y manifest, luego los relee y valida antes de confirmar éxito. */
  async #writeAndConfirm(classFile, document, manifest) {
    await atomicWriteJson(safeChild(this.classesDirectory, classFile), document);
    const confirmedClass = await readRequiredJson(safeChild(this.classesDirectory, classFile));
    assertLiteDocument(confirmedClass, confirmedClass?.clase?.classId);
    if (JSON.stringify(confirmedClass) !== JSON.stringify(document)) throw new Error('No se pudo confirmar la escritura de la clase.');
    await atomicWriteJson(this.#manifestPath(), manifest);
    await this.#confirmManifest(manifest);
  }

  async #confirmManifest(manifest) {
    const confirmed = await readRequiredJson(this.#manifestPath());
    await this.contracts.assert(confirmed, 'dataset-manifest');
    if (JSON.stringify(confirmed) !== JSON.stringify(manifest)) throw new Error('No se pudo confirmar la escritura del manifest.');
  }

  #nextManifest(current, classId) {
    const now = this.now();
    const clases = [...(current?.clases ?? []), { classId, archivo: `clases/${classFileName(classId)}` }];
    return { featureContract: LITE_FEATURE_CONTRACT, datasetId: current?.datasetId ?? this.datasetId, version: (current?.version ?? 0) + 1, stage: 'validated', createdAt: current?.createdAt ?? now, updatedAt: now, clases };
  }

  #touchManifest(manifest) { return { ...manifest, version: manifest.version + 1, updatedAt: this.now() }; }
  #manifestPath() { return safeChild(this.datasetDirectory, 'manifest.json'); }
  async #readManifestOptional() { return readOptionalJson(this.#manifestPath()); }
  async #ensureDirectories() { await mkdir(this.classesDirectory, { recursive: true }); }
  #enqueue(operation) { const next = this.queue.then(operation); this.queue = next.catch(() => {}); return next; }
}

/** Rechaza IDs que podrían convertirse en rutas, incluidos separadores Windows. */
export function assertSafeClassId(classId) {
  if (typeof classId !== 'string' || !classId || classId.length > 160 || classId === '.' || classId === '..' || /[\\/\0\r\n]/.test(classId) || /^[a-zA-Z]:/.test(classId)) {
    throw new DatasetRequestError('classId contiene una ruta o caracteres no permitidos.', 400, 'CLASS_ID_UNSAFE');
  }
}

function assertMatchingClassId(routeClassId, payloadClassId) {
  assertSafeClassId(routeClassId);
  if (routeClassId !== payloadClassId) throw new DatasetRequestError('El classId de la ruta no coincide con el contenido.', 400, 'CLASS_ID_MISMATCH');
}
function assertManifestInvariants(manifest) {
  const ids = manifest.clases.map((item) => item.classId); const files = manifest.clases.map((item) => item.archivo);
  if (new Set(ids).size !== ids.length || new Set(files).size !== files.length) throw new DatasetRequestError('El manifest contiene clases o archivos duplicados.', 422, 'MANIFEST_INVARIANT_INVALID');
}
function assertManifestEntry(entry) {
  assertSafeClassId(entry?.classId);
  const expected = `clases/${classFileName(entry.classId)}`;
  if (entry?.archivo !== expected) throw new DatasetRequestError('El manifest contiene una ruta de clase no autorizada.', 422, 'MANIFEST_PATH_INVALID');
}
function assertDocumentInvariants(document, classId) {
  if (document.clase.classId !== classId || document.muestras.some((sample) => sample.classId !== classId)) throw new DatasetRequestError('El archivo de clase no coincide con su classId contractual.', 422, 'CLASS_DOCUMENT_INVALID');
}
/** Impide crear nuevos códigos artificiales y conserva el ID técnico de ruido. */
function assertLiteClassId(classDefinition) {
  const valid = classDefinition?.tipo === 'ruido_background'
    ? classDefinition.classId === 'ruido_background'
    : /^(?!U\d+$)[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/.test(classDefinition?.classId ?? '');
  if (!valid) throw new DatasetRequestError('Las clases Lite nuevas requieren un classId humano.', 422, 'LITE_CLASS_ID_INVALID');
}
/** Rechaza cualquier mutación que intentaría mezclar el formato Lite con legacy. */
function assertLiteDataset(document) {
  if (document?.featureContract !== LITE_FEATURE_CONTRACT) throw new DatasetRequestError('El archivo de clase es legacy y no admite muestras o mutaciones Lite.', 409, 'DATASET_FORMAT_MISMATCH');
}
/** Valida el contenedor transitorio de FASE I y cada F139 reproducible. */
function assertLiteDocument(document, classId) {
  assertLiteDataset(document);
  if (!document?.clase || !Array.isArray(document?.muestras)) throw new DatasetRequestError('Documento Lite incompleto.', 422, 'LITE_DOCUMENT_INVALID');
  assertDocumentInvariants(document, classId);
  for (const sample of document.muestras) {
    const result = validateSample(sample, { classResolver: (candidate) => candidate === classId });
    if (!result.valid || typeof sample.id !== 'string' || !sample.id || sample.stage !== 'validated') throw new DatasetRequestError(`Documento Lite inválido: ${result.errors.join(' ')}`, 422, 'LITE_DOCUMENT_INVALID');
  }
}
function entryFileName(entry) { return basename(entry.archivo); }
function formatAjvError(error) { return `${error.instancePath || '/'} ${error.message ?? 'no cumple el schema'}`; }

/** Resuelve rutas internas y rechaza cualquier intento de abandonar su raíz. */
export function safeChild(root, ...segments) {
  const rootPath = resolve(root); const target = resolve(rootPath, ...segments);
  if (target !== rootPath && !target.startsWith(`${rootPath}${sep}`)) throw new DatasetRequestError('Ruta fuera del área autorizada.', 400, 'PATH_OUTSIDE_DATA');
  return target;
}
async function readOptionalJson(path) {
  try { return JSON.parse(await readFile(path, 'utf8')); } catch (error) { if (error?.code === 'ENOENT') return null; throw new DatasetRequestError('No se pudo leer un JSON del dataset.', 500, 'DATASET_READ_FAILED'); }
}
async function readRequiredJson(path, message = 'No se pudo leer un JSON del dataset.') {
  const parsed = await readOptionalJson(path);
  if (parsed === null) throw new DatasetRequestError(message, 422, 'DATASET_FILE_MISSING');
  return parsed;
}
/** Usa reemplazo atómico por archivo para no dejar JSON parcialmente escrito. */
async function atomicWriteJson(path, value) {
  const temporary = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
  try { await writeFile(temporary, JSON.stringify(value, null, 2), 'utf8'); await rename(temporary, path); } catch (error) { await unlink(temporary).catch(() => {}); throw new DatasetRequestError('No se pudo escribir el dataset.', 500, 'DATASET_WRITE_FAILED'); }
}
