/** Administra la fuente de video del configurador, sin extraer landmarks. */
export class VideoSource {
  /** @param {HTMLVideoElement} video Elemento que mostrará cámara o archivo. */
  constructor(video) { this.video = video; this.stream = null; this.objectUrl = null; }
  /**
   * Solicita cámara al navegador y conecta su stream al video.
   * @param {MediaStreamConstraints} constraints Restricciones inyectables del dispositivo.
   * @returns {Promise<HTMLVideoElement>} Video listo para reproducirse.
   * @throws {Error} Si la API no existe o el permiso/dispositivo falla.
   */
  async startCamera(constraints = { video: true, audio: false }) {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('La cámara no está disponible en este navegador.');
    this.stop(); this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.video.srcObject = this.stream; await this.video.play(); return this.video;
  }
  /** Carga un archivo de video local; crea un Object URL y reemplaza el stream actual. */
  loadFile(file) {
    if (!(file instanceof File) || !file.type.startsWith('video/')) throw new Error('Selecciona un archivo de video válido.');
    this.stop(); this.objectUrl = URL.createObjectURL(file); this.video.srcObject = null; this.video.src = this.objectUrl;
    this.video.controls = true; this.video.load(); return this.video;
  }
  /** Detiene pistas de cámara, libera el Object URL y desconecta la fuente. */
  stop() {
    this.stream?.getTracks().forEach((track) => track.stop()); this.stream = null;
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl); this.objectUrl = null;
    this.video.pause(); this.video.srcObject = null;
  }
}
