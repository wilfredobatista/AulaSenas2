/**
 * Cámara de Usuario Lite. Entrega un único frame fuente por turno para que
 * Hands y Pose compartan timestamp y frameToken sin colas ni resultados viejos.
 */
export class CameraController {
  constructor(video, { onFrame, onStatus = () => {}, onStarted = () => {}, onStopped = () => {} } = {}) {
    this.video = video; this.onFrame = onFrame; this.onStatus = onStatus; this.onStarted = onStarted; this.onStopped = onStopped;
    this.stream = null; this.frameInFlight = false; this.callbackId = null; this.callbackKind = null; this.session = 0; this.nextToken = 1;
  }
  /** Solicita el stream objetivo Lite; la configuración real se informa al consumidor. */
  async start() {
    if (this.stream) return;
    const session = ++this.session;
    const requested = { width: 640, height: 480, frameRate: 30, facingMode: 'user' };
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: requested, audio: false });
      this.video.srcObject = this.stream; await this.video.play();
      if (session !== this.session || !this.stream) return;
      const track = this.stream.getVideoTracks()[0];
      this.onStarted({ requested, actual: { width: this.video.videoWidth, height: this.video.videoHeight, ...track?.getSettings?.() } });
      this.onStatus('active'); this.#schedule(session);
    } catch (error) { this.#release(); this.onStatus('error', error); throw error; }
  }
  /** Detiene futuros callbacks y tracks; nunca reutiliza la sesión anterior. */
  stop() { this.session += 1; if (this.callbackId !== null) { if (this.callbackKind === 'video') this.video.cancelVideoFrameCallback?.(this.callbackId); else cancelAnimationFrame(this.callbackId); } this.callbackId = null; this.callbackKind = null; this.#release(); this.onStopped(); this.onStatus('stopped'); }
  get active() { return Boolean(this.stream); }
  #schedule(session) {
    if (!this.active || this.frameInFlight || session !== this.session) return;
    const run = (now, metadata = {}) => {
      this.callbackId = null; this.callbackKind = null; if (!this.active || this.frameInFlight || session !== this.session) return;
      this.frameInFlight = true;
      const timestampMs = Number.isFinite(metadata.mediaTime) ? metadata.mediaTime * 1000 : now;
      const context = Object.freeze({ frameToken: this.nextToken++, sourceTimestampMs: timestampMs });
      Promise.resolve(this.onFrame(this.video, context)).catch((error) => this.onStatus('frame_error', error)).finally(() => { this.frameInFlight = false; this.#schedule(session); });
    };
    if (this.video.requestVideoFrameCallback) { this.callbackKind = 'video'; this.callbackId = this.video.requestVideoFrameCallback(run); }
    else { this.callbackKind = 'animation'; this.callbackId = requestAnimationFrame((now) => run(now)); }
  }
  #release() { this.stream?.getTracks().forEach((track) => track.stop()); this.stream = null; this.video.srcObject = null; }
}
