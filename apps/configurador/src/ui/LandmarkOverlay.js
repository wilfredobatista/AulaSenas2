/** Dibuja el raw Lite ya extraído; nunca ejecuta detección adicional. */
export class LandmarkOverlay {
  constructor({ canvas, video }) { this.canvas = canvas; this.video = video; this.context = canvas?.getContext?.('2d') ?? null; }
  /** Limpia toda observación anterior cuando la fuente o detección desaparece. */
  clear() { if (!this.context) return; const size = this.#resize(); this.context.clearRect(0, 0, size.width, size.height); }
  /** Proyecta manos y los tres anclajes de pose sin completar ausencias. */
  render(payload) {
    if (!this.context) return;
    const size = this.#resize(); this.context.clearRect(0, 0, size.width, size.height);
    const frame = this.#contentRect(size); const raw = payload?.raw;
    if (!raw) return;
    this.#drawHand(raw.hands?.left, '#4ade80', frame);
    this.#drawHand(raw.hands?.right, '#38bdf8', frame);
    this.#drawPose(raw.pose, '#fbbf24', frame);
  }
  #resize() {
    const width = this.video?.clientWidth ?? 0; const height = this.video?.clientHeight ?? 0; const ratio = globalThis.devicePixelRatio || 1;
    if (this.canvas.width !== Math.round(width * ratio) || this.canvas.height !== Math.round(height * ratio)) { this.canvas.width = Math.round(width * ratio); this.canvas.height = Math.round(height * ratio); }
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0); return { width, height };
  }
  #contentRect({ width, height }) {
    const sourceWidth = this.video?.videoWidth; const sourceHeight = this.video?.videoHeight;
    if (!sourceWidth || !sourceHeight || !width || !height) return { x: 0, y: 0, width, height };
    const scale = Math.min(width / sourceWidth, height / sourceHeight); const contentWidth = sourceWidth * scale; const contentHeight = sourceHeight * scale;
    return { x: (width - contentWidth) / 2, y: (height - contentHeight) / 2, width: contentWidth, height: contentHeight };
  }
  #drawHand(hand, color, frame) { if (!Array.isArray(hand)) return; this.#drawConnections(hand, HAND_CONNECTIONS, color, frame); this.#drawPoints(hand, color, frame, 3); }
  #drawPose(pose, color, frame) { const points = [pose?.nose, pose?.leftShoulder, pose?.rightShoulder]; this.#drawConnections(points, [[1, 2]], color, frame); this.#drawPoints(points, color, frame, 3); }
  #drawConnections(points, connections, color, frame) {
    this.context.strokeStyle = color; this.context.lineWidth = 1.5;
    connections.forEach(([from, to]) => { const start = project(points?.[from], frame); const end = project(points?.[to], frame); if (!start || !end) return; this.context.beginPath(); this.context.moveTo(start.x, start.y); this.context.lineTo(end.x, end.y); this.context.stroke(); });
  }
  #drawPoints(points, color, frame, radius) { this.context.fillStyle = color; (points ?? []).forEach((value) => { const point = project(value, frame); if (!point) return; this.context.beginPath(); this.context.arc(point.x, point.y, radius, 0, Math.PI * 2); this.context.fill(); }); }
}

const HAND_CONNECTIONS = Object.freeze([[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]]);
function project(point, frame) { return Number.isFinite(point?.x) && Number.isFinite(point?.y) ? { x: frame.x + point.x * frame.width, y: frame.y + point.y * frame.height } : null; }
