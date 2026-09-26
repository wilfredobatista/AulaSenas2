/**
 * Mantiene el catálogo de trabajo derivado del dataset conectado.
 * Las clases, metadata e identificadores se reconstruyen desde los JSON.
 * La selección activa es deliberadamente explícita y solo dura en la sesión.
 */
export class ClassCatalog {
  /** @param {object} options Validador contractual y almacenamiento opcional de preferencia UI. */
  constructor({ validator, storage = getBrowserStorage(), activeKey = 'aulasenas.configurador.active-class.v1' } = {}) {
    this.validator = validator;
    this.storage = storage;
    this.activeKey = activeKey;
    this.classes = [];
    this.activeClassId = null;
    this.seenIds = new Set();
  }

  /** Inicia sin selección para impedir que una preferencia antigua active una clase. */
  async initialize() { this.activeClassId = null; return this; }

  /** Reemplaza el catálogo por las clases efectivamente leídas del dataset. */
  hydrate(classes) {
    this.classes = classes.map(clone);
    // Al conectar otro dataset, los IDs ajenos no deben afectar su secuencia.
    this.seenIds = new Set(this.classes.map((item) => item.classId));
    if (!this.classes.some((item) => item.classId === this.activeClassId)) this.activeClassId = null;
    this.#persistActive(this.activeClassId);
    return this.list();
  }

  /** Devuelve copias para no exponer el estado interno al DOM. */
  list() { return this.classes.map(clone); }
  /** Devuelve la clase activa o null cuando el dataset aún no contiene clases. */
  getActive() { return clone(this.classes.find((item) => item.classId === this.activeClassId) ?? null); }

  /** Selecciona una clase reconstruida del dataset o preparada en esta sesión. */
  select(classId) {
    if (!this.classes.some((item) => item.classId === classId)) throw new Error('La clase seleccionada no existe en el catálogo actual.');
    this.activeClassId = classId;
    this.#persistActive(classId);
    return this.getActive();
  }

  /** Prepara una clase validada para que el almacenamiento la materialice de inmediato. */
  async create({ glosa, significados = [], estado = 'activa', tipo = 'normal' }) {
    const classId = tipo === 'ruido_background' ? 'ruido_background' : humanClassId(glosa);
    if (this.classes.some((item) => item.classId === classId)) throw new Error('La clase ya existe en el dataset.');
    // La clase reservada tiene una glosa contractual minúscula y no admite significados.
    const candidate = { classId, glosa: tipo === 'ruido_background' ? 'ruido_background' : glosa, significados: tipo === 'ruido_background' ? [] : significados, estado, tipo };
    await this.#validate(candidate);
    this.classes.push(candidate);
    this.seenIds.add(classId);
    this.activeClassId = classId;
    this.#persistActive(classId);
    return clone(candidate);
  }

  /** Actualiza metadata sin alterar classId ni la asociación de muestras. */
  async update(classId, changes) {
    const index = this.classes.findIndex((item) => item.classId === classId);
    if (index === -1) throw new Error('La clase que se desea editar no existe.');
    if (changes?.classId !== undefined && changes.classId !== classId) throw new Error('classId es estable y no puede modificarse.');
    const current = this.classes[index];
    const candidate = { ...current, ...changes, classId, significados: current.tipo === 'ruido_background' || changes.tipo === 'ruido_background' ? [] : changes.significados ?? current.significados };
    await this.#validate(candidate);
    this.classes[index] = candidate;
    return clone(candidate);
  }

  /** Restaura un snapshot sin introducir una selección que antes no existía. */
  restore(classes) { const active = this.activeClassId; this.classes = classes.map(clone); this.classes.forEach((item) => this.seenIds.add(item.classId)); this.activeClassId = this.classes.some((item) => item.classId === active) ? active : null; }

  /** Exige validación JSON Schema completa y evita textos de significado repetidos. */
  async #validate(candidate) {
    if (!this.validator?.validate) throw new Error('Validador de contratos no disponible.');
    const result = await this.validator.validate(candidate, 'sign-class');
    const duplicates = candidate.tipo === 'normal' && new Set(candidate.significados).size !== candidate.significados.length;
    if (!result.valid || !result.complete || duplicates) throw new Error(`Clase inválida: ${duplicates ? 'Los significados deben ser únicos.' : (result.errors ?? []).join('; ') || 'validador no disponible.'}`);
  }

  /** Conserva solo una preferencia de UI; nunca serializa el catálogo localmente. */
  #persistActive(classId) { if (classId && this.storage?.setItem) this.storage.setItem(this.activeKey, classId); }
}

function getBrowserStorage() { try { return globalThis.localStorage; } catch { return null; } }
function clone(value) { return value === null ? null : JSON.parse(JSON.stringify(value)); }

/** Deriva el ID humano Lite solo al crear; editar metadata nunca lo recalcula. */
export function humanClassId(glosa) {
  const id = String(glosa ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (!id || /^U\d+$/.test(id)) throw new Error('La glosa no permite generar un classId humano válido.');
  return id;
}
