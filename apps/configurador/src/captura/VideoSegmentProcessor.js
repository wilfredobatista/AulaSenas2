import { LiteTemporalEncoder } from '../vision/LiteVectorizer139.js';

/**
 * Procesa frames presentados de un segmento importado de forma secuencial.
 * No calcula posiciones por FPS: la marca temporal de cada frame procede de
 * requestVideoFrameCallback y se conserva como timestamp relativo de muestra.
 * Deuda CFG-DT-002: la fidelidad frame-exacta de video importado no está
 * garantizada por HTMLVideoElement; los saltos de presentedFrames se reportan.
 */
export class VideoSegmentProcessor {
  /** @param {object} options Video, extractor y adaptadores inyectables para pruebas. */
  constructor({ video, extractLandmarks, seek = seekVideo, nextFrame = nextPresentedFrame } = {}) { this.video = video; this.extractLandmarks = extractLandmarks; this.seek = seek; this.nextFrame = nextFrame; this.processing = false; }

  /**
   * Recorre el segmento frame presentado por frame presentado.
   * @returns {Promise<{frames: object[], startMs: number, endMs: number, durationMs: number}>}
   * Frames cuyo mediaTime queda fuera del intervalo nunca se incorporan.
   */
  async process({ startMs, endMs }) {
    if (this.processing) throw new Error('Ya hay un segmento en procesamiento.');
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs < 0 || endMs <= startMs) throw new Error('El segmento requiere inicio < fin.');
    if (typeof this.extractLandmarks !== 'function') throw new Error('No hay extractor visual configurado.');
    if (typeof this.video?.requestVideoFrameCallback !== 'function' && this.nextFrame === nextPresentedFrame) throw new Error('Este navegador no permite recorrer frames reales de video.');
    this.processing = true;
    try {
      this.video.pause?.();
      await this.seek(this.video, startMs);
      const frames = [];
      const encoder = new LiteTemporalEncoder();
      let previousMediaMs = null;
      let previousPresentedFrames = null;
      const diagnostics = [];
      while (this.processing) {
        const metadata = await this.nextFrame(this.video);
        if (Number.isFinite(metadata.presentedFrames)) {
          if (Number.isFinite(previousPresentedFrames) && metadata.presentedFrames - previousPresentedFrames > 1) {
            diagnostics.push({ code: 'frames_omitidos', previousPresentedFrames, presentedFrames: metadata.presentedFrames, omittedFrames: metadata.presentedFrames - previousPresentedFrames - 1 });
          }
          previousPresentedFrames = metadata.presentedFrames;
        }
        const mediaMs = metadata.mediaTime * 1000;
        if (!Number.isFinite(mediaMs)) throw new Error('El navegador no entregó mediaTime para el frame de video.');
        if (mediaMs < startMs) continue;
        if (mediaMs > endMs) break;
        // Un callback repetido no representa un nuevo frame del archivo y no se duplica.
        if (previousMediaMs !== null && mediaMs <= previousMediaMs) continue;
        previousMediaMs = mediaMs;
        const extraction = await this.extractLandmarks(this.video, { sourceTimestampMs: mediaMs, mediaTime: metadata.mediaTime });
        const frame = encoder.encode(extraction);
        if (frame) frames.push(frame);
        if (mediaMs === endMs) break;
      }
      return { frames, startMs, endMs, durationMs: endMs - startMs, diagnostics };
    } finally { this.video.pause?.(); this.processing = false; }
  }
}

/** Busca el inicio solicitado antes de pedir el primer frame presentado. */
function seekVideo(video, positionMs) { return new Promise((resolve, reject) => { const onSeeked = () => { video.removeEventListener('seeked', onSeeked); resolve(); }; video.addEventListener('seeked', onSeeked, { once: true }); video.addEventListener('error', () => reject(new Error('No se pudo navegar al inicio del segmento.')), { once: true }); video.currentTime = positionMs / 1000; }); }

/**
 * Solicita un único frame presentado, pausa antes de resolver y evita que
 * MediaPipe lento permita que el visor avance durante su propia inferencia.
 */
function nextPresentedFrame(video) { return new Promise((resolve, reject) => { let callbackId = null; const onFrame = (_now, metadata) => { video.pause(); resolve(metadata); }; callbackId = video.requestVideoFrameCallback(onFrame); Promise.resolve(video.play()).catch((error) => { if (callbackId !== null) video.cancelVideoFrameCallback?.(callbackId); reject(error); }); }); }
