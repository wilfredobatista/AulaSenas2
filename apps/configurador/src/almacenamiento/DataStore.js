/** Persistencia por etapas; el formato de landmarks se conserva opacamente. */
export class DataStore {
  /** @param {FileSystemDirectoryHandle|null} rootHandle Carpeta data/ autorizada por el usuario. */
  constructor(rootHandle = null) { this.rootHandle = rootHandle; this.memory = new Map(); }
  /** Cambia la carpeta raíz de persistencia sin copiar ni transformar datos. */
  setRoot(rootHandle) { this.rootHandle = rootHandle; }
  /**
   * Guarda una muestra como JSON bajo raw, processed o validated.
   * @param {object} sample Muestra con metadata y frames.
   * @param {'raw'|'processed'|'validated'} stage Etapa destino.
   * @returns {Promise<object>} Registro con id y etapa.
   * @sideeffect Escribe en data/<stage>/<id>.json o en el adaptador en memoria.
   */
  async save(sample, stage = 'raw') {
    if (!['raw', 'processed', 'validated'].includes(stage)) throw new Error('Etapa de datos inválida.');
    const id = sample.id ?? crypto.randomUUID(); const record = { ...sample, id, stage };
    if (this.rootHandle?.getDirectoryHandle) {
      const dir = await this.rootHandle.getDirectoryHandle(stage, { create: true });
      const file = await dir.getFileHandle(`${id}.json`, { create: true });
      const writable = await file.createWritable(); await writable.write(JSON.stringify(record, null, 2)); await writable.close();
    } else this.memory.set(`${stage}/${id}`, record);
    return record;
  }
  /** Lista JSON de una etapa, o registros del adaptador en memoria. */
  async list(stage = 'raw') {
    if (!this.rootHandle?.getDirectoryHandle) return [...this.memory.values()].filter((item) => item.stage === stage);
    const dir = await this.rootHandle.getDirectoryHandle(stage, { create: true }); const result = [];
    for await (const entry of dir.values()) if (entry.kind === 'file' && entry.name.endsWith('.json')) result.push(JSON.parse(await (await entry.getFile()).text()));
    return result;
  }
}
