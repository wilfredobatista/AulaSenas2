/** FIFO continuo del modelo Lite: conserva exactamente las últimas 20 filas F139. */
export class LiteFifo20 {
  constructor(capacity = 20) { if (capacity !== 20) throw new RangeError('El contrato Lite requiere T=20.'); this.capacity = capacity; this.frames = []; }
  /** Añade una observación real; no genera padding ni copia frames faltantes. */
  append(vector139) { if (!(vector139 instanceof Float32Array) || vector139.length !== 139 || !vector139.every(Number.isFinite)) throw new TypeError('FIFO Lite requiere Float32Array[139] finito.'); if (this.frames.length === this.capacity) this.frames.shift(); this.frames.push(new Float32Array(vector139)); return this.length; }
  reset() { this.frames = []; }
  get length() { return this.frames.length; }
  get ready() { return this.length === this.capacity; }
  /** Devuelve copias independientes en orden temporal, shape lógico [20,139]. */
  snapshot() { return this.frames.map((frame) => new Float32Array(frame)); }
}
