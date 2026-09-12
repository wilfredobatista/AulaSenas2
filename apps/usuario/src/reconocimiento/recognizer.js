import { SequenceBuffer } from './sequenceBuffer.js';
import { appendDeltaMsNorm } from '../vision/normalizer.js';
import { greedyCtcDecode } from './ctcDecoder.js';
import { confidenceFromLogits, acceptPrediction } from './confidence.js';
import { InferenceAdapter } from './inferenceAdapter.js';
export class SignRecognizer {
  constructor({ loader, labels = [], onStatus = () => {}, onResult = () => {}, threshold = 0.8 } = {}) { this.onStatus = onStatus; this.onResult = onResult; this.buffer = new SequenceBuffer(); this.inference = new InferenceAdapter({ loader, labels, onStatus }); this.threshold = threshold; this.lastLabel = ''; this.lastTime = performance.now(); }
  async processLandmarks(landmarks, now = performance.now()) { try { const frame = appendDeltaMsNorm(landmarks, Math.max(0, now - this.lastTime)); this.lastTime = now; if (!this.buffer.push(frame)) { this.onStatus('buffering'); return null; } const prediction = await this.inference.infer(this.buffer.toArray()); if (!prediction) return null; const confidence = confidenceFromLogits(prediction.logits); const label = greedyCtcDecode(prediction.logits, prediction.labels); if (acceptPrediction({ label, confidence, threshold: this.threshold, lastLabel: this.lastLabel })) { this.lastLabel = label; this.onResult({ label, confidence }); return { label, confidence }; } return null; } catch (error) { this.onStatus('error', error); return null; } }
  process(_frame) { this.onStatus('vision_missing'); return null; }
  reset() { this.buffer.clear(); this.lastLabel = ''; this.lastTime = performance.now(); }
}
