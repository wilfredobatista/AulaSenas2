/** Métricas físicas de Usuario Lite; no deduce throughput desde el FPS solicitado. */
export class RuntimeMetrics {
  constructor(clock = () => performance.now()) { this.clock = clock; this.reset(); }
  reset() { this.cameraObserved = 0; this.pipelineSent = 0; this.valid = 0; this.discarded = 0; this.latencies = []; this.deltas = []; this.left = 0; this.right = 0; this.both = 0; this.pose = 0; this.startedAt = null; this.fifoStartedAt = null; this.fifoReadyMs = null; }
  /** Conserva lo solicitado y negociado para comparar stream con throughput real. */
  setCamera(requested, actual) { this.camera = { requested: { ...requested }, actual: { ...actual } }; }
  cameraFrame() { this.cameraObserved += 1; }
  pipelineFrame() { this.pipelineSent += 1; }
  result({ valid, deltaMs, vector139, latencyMs, fifoReady }) { if (Number.isFinite(latencyMs)) capped(this.latencies, latencyMs); if (!valid) { this.discarded += 1; return; } const now = this.clock(); if (this.startedAt === null) this.startedAt = now; this.valid += 1; capped(this.deltas, deltaMs); const left = vector139[135] === 1; const right = vector139[136] === 1; if (left) this.left += 1; if (right) this.right += 1; if (left && right) this.both += 1; if (vector139[137] === 1) this.pose += 1; if (fifoReady && this.fifoReadyMs === null) this.fifoReadyMs = now - this.startedAt; }
  report(fifoLength) { const elapsed = this.startedAt === null ? 0 : Math.max(0, this.clock() - this.startedAt); return { camera: this.camera ?? null, cameraObserved: this.cameraObserved, pipelineSent: this.pipelineSent, validF139: this.valid, discardedF139: this.discarded, f139PerSecond: elapsed ? this.valid * 1000 / elapsed : 0, latency: stats(this.latencies), delta: stats(this.deltas), presence: { leftPercent: percent(this.left, this.valid), rightPercent: percent(this.right, this.valid), bothPercent: percent(this.both, this.valid), poseValidPercent: percent(this.pose, this.valid) }, fifo: { length: fifoLength, capacity: 20, ready: fifoLength === 20, timeToReadyMs: this.fifoReadyMs } }; }
}
function capped(values, value) { values.push(value); if (values.length > 512) values.shift(); }
function percent(value, total) { return total ? value * 100 / total : 0; }
function stats(values) { if (!values.length) return { count: 0, meanMs: null, medianMs: null, p95Ms: null, maxMs: null }; const ordered = [...values].sort((a, b) => a - b); const meanMs = values.reduce((sum, value) => sum + value, 0) / values.length; const at = (ratio) => ordered[Math.ceil(ordered.length * ratio) - 1]; return { count: values.length, meanMs, medianMs: at(.5), p95Ms: at(.95), maxMs: ordered.at(-1) }; }
