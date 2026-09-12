/** Valida muestras con Ajv y los esquemas JSON Schema 2020-12 del proyecto. */
export class ContractValidator {
  /** @param {object} options Dependencias opcionales para pruebas y fallback controlado. */
  constructor({ loadSchema = loadContractSchema, ajvFactory = loadAjv } = {}) { this.loadSchema = loadSchema; this.ajvFactory = ajvFactory; this.ajv = null; this.ready = null; }
  /** Carga Ajv y todos los esquemas referenciados antes de validar cualquier muestra. */
  async initialize() {
    if (this.ready) return this.ready;
    this.ready = (async () => { const Ajv2020 = await this.ajvFactory(); this.ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false }); const names = ['landmark-point', 'landmarks', 'frame', 'sample-metadata', 'captured-sample', 'data-stages']; for (const name of names) this.ajv.addSchema(await this.loadSchema(name), name); return this; })().catch((error) => { this.ready = null; this.error = error; return this; });
    return this.ready;
  }
  /** Valida un valor contra un esquema registrado; `complete` identifica validación Ajv real. */
  async validate(value, schemaName) { await this.initialize(); if (!this.ajv) return { valid: false, complete: false, errors: [`Validador JSON Schema no disponible: ${this.error?.message ?? 'error desconocido'}.`] }; const check = this.ajv.getSchema(schemaName) ?? this.ajv.compile(await this.loadSchema(schemaName)); const valid = check(value); return { valid: Boolean(valid), complete: true, errors: valid ? [] : (check.errors ?? []).map(formatAjvError) }; }
}

/** Carga Ajv 2020-12 sin acoplar el Configurador a Usuario ni a un bundler. */
async function loadAjv() { const module = await import('https://esm.sh/ajv@8.17.1/dist/2020.js'); return module.default; }
/** Lee el esquema autoritativo desde contracts/; nunca lo replica ni lo modifica. */
async function loadContractSchema(name) { const response = await fetch(new URL(`../../../contracts/${name}.schema.json`, import.meta.url)); if (!response.ok) throw new Error(`No se pudo cargar contracts/${name}.schema.json`); return response.json(); }
/** Convierte errores Ajv en mensajes útiles para la interfaz sin ocultar rutas. */
function formatAjvError(error) { return `${error.instancePath || '/'} ${error.message ?? 'no cumple el esquema'}`; }
