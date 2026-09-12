/** Preferencias exclusivamente locales del usuario; no captura ni almacena datos de entrenamiento. */
const KEY = 'aulasenas.usuario.preferences';
export class UserPreferences { constructor() { this.values = { voiceLanguage: 'es-PA', autoSpeak: false, ...this.#read() }; } #read() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } } get(name) { return this.values[name]; } set(values) { this.values = { ...this.values, ...values }; localStorage.setItem(KEY, JSON.stringify(this.values)); } }
