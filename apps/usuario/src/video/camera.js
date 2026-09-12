export class CameraController {
  constructor(video, { onFrame, onStatus }) { this.video = video; this.onFrame = onFrame; this.onStatus = onStatus; this.stream = null; this.timer = null; }
  async start() { try { if (!navigator.mediaDevices?.getUserMedia) throw new Error('La captura de cámara no está disponible en este navegador o contexto.'); this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false }); this.video.srcObject = this.stream; await this.video.play(); this.onStatus('active'); this.timer = setInterval(() => this.onFrame(this.video), 100); } catch (error) { this.onStatus('error', error); throw error; } }
  stop() { clearInterval(this.timer); this.timer = null; this.stream?.getTracks().forEach((track) => track.stop()); this.stream = null; this.video.srcObject = null; this.onStatus('stopped'); }
  get active() { return Boolean(this.stream); }
}
