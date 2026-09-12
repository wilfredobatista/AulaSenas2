/** Normaliza texto reconocido para presentación e interpretación básica; no inventa contenido. */
export class Translator { interpret(text) { return text ? text.trim().replace(/\s+/g, ' ') : ''; } }
