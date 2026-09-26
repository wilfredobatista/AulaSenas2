/** Renderiza únicamente los landmarks Lite ya extraídos; no ejecuta detección. */
const CONNECTIONS = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
export class LiteOverlay {
  constructor(canvas, video) { this.canvas = canvas; this.video = video; this.ctx = canvas.getContext('2d'); }
  clear() { const { width, height } = this.#size(); this.ctx.clearRect(0, 0, width, height); }
  render(raw) { const size = this.#size(); this.ctx.clearRect(0, 0, size.width, size.height); this.#hand(raw?.hands?.left, '#22c55e', size); this.#hand(raw?.hands?.right, '#38bdf8', size); this.#pose(raw?.pose, size); }
  #size() { const width = this.video.clientWidth; const height = this.video.clientHeight; const ratio = devicePixelRatio || 1; if (this.canvas.width !== width * ratio || this.canvas.height !== height * ratio) { this.canvas.width = width * ratio; this.canvas.height = height * ratio; } this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0); return { width, height }; }
  #hand(points, color, size) { if (!Array.isArray(points)) return; this.ctx.strokeStyle = color; this.ctx.lineWidth = 2; CONNECTIONS.forEach(([a,b]) => this.#line(points[a], points[b], size)); this.ctx.fillStyle = color; points.forEach((point) => this.#point(point, size, 3)); }
  #pose(pose, size) { this.ctx.fillStyle = '#fbbf24'; [pose?.nose, pose?.leftShoulder, pose?.rightShoulder].forEach((point) => this.#point(point, size, 5)); this.ctx.strokeStyle = '#fbbf24'; this.ctx.lineWidth = 2; this.#line(pose?.leftShoulder, pose?.rightShoulder, size); }
  #line(a,b,size) { const p = project(a,size), q = project(b,size); if (!p || !q) return; this.ctx.beginPath(); this.ctx.moveTo(p.x,p.y); this.ctx.lineTo(q.x,q.y); this.ctx.stroke(); }
  #point(point,size,radius) { const p = project(point,size); if (!p) return; this.ctx.beginPath(); this.ctx.arc(p.x,p.y,radius,0,Math.PI*2); this.ctx.fill(); }
}
function project(point, size) { return Number.isFinite(point?.x) && Number.isFinite(point?.y) ? { x: point.x * size.width, y: point.y * size.height } : null; }
