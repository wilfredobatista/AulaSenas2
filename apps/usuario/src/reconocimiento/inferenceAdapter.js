import { validateTemporalInput } from './inputShape.js';
export class InferenceAdapter { constructor({ loader, labels = [], onStatus = () => {} } = {}) { this.loader = loader; this.labels = labels; this.onStatus = onStatus; }
  async infer(sequence) { validateTemporalInput(sequence); if (!this.loader?.available) { this.onStatus('missing'); return null; } if (typeof this.loader.model.predict !== 'function') throw new Error('El runtime del modelo no expone predict().'); const result = await this.loader.model.predict(sequence); this.onStatus('inferred'); return { logits: result, labels: this.labels }; }
}
