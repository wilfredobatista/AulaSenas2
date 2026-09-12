export class ModelLoader { constructor({ onStatus = () => {} } = {}) { this.onStatus = onStatus; this.model = null; }
  async load({ url, runtime } = {}) { if (!url || !runtime?.load) { this.onStatus('missing'); return false; } try { this.model = await runtime.load(url); this.onStatus('ready'); return true; } catch (error) { this.model = null; this.onStatus('error', error); return false; } }
  get available() { return Boolean(this.model); }
}
