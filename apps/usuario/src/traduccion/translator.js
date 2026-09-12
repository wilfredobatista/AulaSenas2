export class Translator { interpret(text) { return text ? text.trim().replace(/\s+/g, ' ') : ''; } }
