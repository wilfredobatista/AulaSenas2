/** Ventana FIFO temporal: conserva exactamente 32 vectores de 308 características. */
export class SequenceBuffer {
  constructor({ length = 32, features = 308 } = {}) { if (!Number.isInteger(length) || length < 1) throw new Error('La longitud temporal debe ser positiva.'); this.length = length; this.features = features; this.frames = []; }
  push(frame) { validateFrame(frame, this.features); this.frames.push(Array.from(frame)); if (this.frames.length > this.length) this.frames.shift(); return this.ready; }
  clear() { this.frames = []; }
  get ready() { return this.frames.length === this.length; }
  toArray() { if (!this.ready) throw new Error(`Faltan frames: ${this.length - this.frames.length}.`); return this.frames.map((frame) => Array.from(frame)); }
}
export function validateFrame(frame, features = 308) { if (!Array.isArray(frame) && !ArrayBuffer.isView(frame)) throw new TypeError('Cada frame debe ser un vector numérico.'); if (frame.length !== features) throw new Error(`Dimensión inválida: se esperaban ${features} características y se recibieron ${frame.length}.`); if (Array.from(frame).some((value) => !Number.isFinite(value))) throw new Error('El frame contiene valores no finitos.'); return true; }
