/** Estados explícitos del editor de clases. */
export const CLASS_UI_STATE = Object.freeze({ VIEWING: 'VIEWING_CLASS', EDITING: 'EDITING_CLASS', CREATING: 'CREATING_CLASS' });
/** Estados operativos que bloquean cambios capaces de alterar una muestra. */
export const OPERATION_UI_STATE = Object.freeze({ IDLE: 'IDLE', CAPTURING: 'CAPTURING', PROCESSING: 'PROCESSING' });
/** Estados visibles del segmento; no alteran sus tiempos ni su procesamiento. */
export const SEGMENT_UI_STATE = Object.freeze({ EMPTY: 'SIN_MARCAS', STARTED: 'INICIO_MARCADO', READY: 'SEGMENTO_DEFINIDO', PROCESSING: 'PROCESANDO', PROCESSED: 'PROCESADO' });

/**
 * Administra DOM, mensajes y estados de presentación. La UI delega cámara,
 * validación y persistencia; sus estados solo deciden qué acciones permite.
 */
export class ConfiguratorUI {
  /** @param {Document} documentRef Documento que contiene la interfaz administrativa. */
  constructor(documentRef = document) {
    this.document = documentRef; this.$ = (id) => this.document.getElementById(id);
    this.mode = 'camera'; this.cameraActive = false; this.videoLoaded = false;
    this.classState = CLASS_UI_STATE.VIEWING; this.operationState = OPERATION_UI_STATE.IDLE;
    this.segmentState = SEGMENT_UI_STATE.EMPTY; this.segmentFeedback = null;
  }

  /** Expone una copia del estado para diagnóstico y pruebas, nunca para mutarlo. */
  get state() {
    const activeClassId = this.classState === CLASS_UI_STATE.CREATING ? null : this.getActiveClass?.()?.classId ?? null;
    return { mode: this.mode, classState: this.classState, operationState: this.operationState, segmentState: this.segmentState, activeClassId, cameraActive: this.cameraActive, videoLoaded: this.videoLoaded };
  }

  /** Conecta controles a callbacks sin trasladar dominio a la interfaz. */
  bind(dependencies) {
    Object.assign(this, dependencies);
    this.$('mode-camera').addEventListener('click', () => this.#changeMode('camera'));
    this.$('mode-video').addEventListener('click', () => this.#changeMode('video'));
    this.$('camera-toggle').addEventListener('click', () => this.#toggleCamera());
    this.$('capture-toggle').addEventListener('click', () => this.#toggleCapture());
    this.$('video-file').addEventListener('change', (event) => this.#import(event.target.files[0]));
    this.$('play-pause').addEventListener('click', () => this.#playPause());
    this.$('back-quarter').addEventListener('click', () => this.#seek(-250)); this.$('forward-quarter').addEventListener('click', () => this.#seek(250));
    this.$('back-frame').addEventListener('click', () => this.#seekFrame(-1)); this.$('forward-frame').addEventListener('click', () => this.#seekFrame(1));
    this.$('mark-start').addEventListener('click', () => this.#mark('start')); this.$('mark-end').addEventListener('click', () => this.#mark('end'));
    this.$('process-segment').addEventListener('click', () => this.#processSegment());
    this.$('preview').addEventListener('timeupdate', () => this.#updateTime()); this.$('preview').addEventListener('loadedmetadata', () => this.#updateTime());
    this.$('delete-last').addEventListener('click', () => this.#deleteLast()); this.$('class-selector').addEventListener('change', () => this.#selectClass());
    this.$('new-class').addEventListener('click', () => this.#newClass()); this.$('edit-class').addEventListener('click', () => this.#editClass());
    this.$('class-form').addEventListener('submit', (event) => this.#saveClass(event)); this.$('add-meaning').addEventListener('click', () => this.#addMeaning());
    this.$('cancel-class').addEventListener('click', () => this.#cancelClass()); this.$('class-type').addEventListener('change', () => this.#syncMeaningAvailability(true));
    this.#resetSegmentState(); this.renderClasses();
  }

  /** Mantiene compatibilidad con actualizaciones externas de fuente/captura. */
  refresh({ hasSource, capturing } = {}) {
    if (typeof hasSource === 'boolean') { if (this.mode === 'camera') this.cameraActive = hasSource; else this.videoLoaded = hasSource; }
    if (capturing === true) this.operationState = OPERATION_UI_STATE.CAPTURING;
    if (capturing === false && this.operationState === OPERATION_UI_STATE.CAPTURING) this.operationState = OPERATION_UI_STATE.IDLE;
    this.#syncControls();
  }

  /** Publica estado normal o de error en la interfaz. */
  status(message, error = false) { this.$('status').textContent = message; this.$('status').classList.toggle('error', error); }
  /** Refleja la disponibilidad del servicio local. */
  setDatasetStatus(message, error = false) { const status = this.$('dataset-status'); status.textContent = message; status.classList.toggle('error', error); }

  /** Renderiza catálogo y carga la clase activa en modo de solo consulta. */
  renderClasses() {
    const classes = sortClassesForDisplay(this.getClasses?.() ?? []); const active = this.getActiveClass?.(); const selector = this.$('class-selector');
    if (this.classState === CLASS_UI_STATE.CREATING) {
      const creating = this.document.createElement('option'); creating.value = ''; creating.textContent = 'Nueva clase'; creating.selected = true; selector.replaceChildren(creating); this.#syncControls(); return;
    }
    const options = classes.map((item) => { const option = this.document.createElement('option'); const count = this.getSampleCount?.(item.classId) ?? 0; option.value = item.classId; option.textContent = `${item.glosa} — ${count} ${count === 1 ? 'muestra' : 'muestras'}`; option.selected = item.classId === active?.classId; return option; });
    if (!active) { const empty = this.document.createElement('option'); empty.value = ''; empty.textContent = classes.length ? 'Seleccione una clase' : 'Sin clases'; empty.selected = true; options.unshift(empty); }
    selector.replaceChildren(...options);
    if (active) this.#fillClassForm(active); else this.#clearClassForm();
    this.#syncControls();
  }

  /** Cambia entre fuentes excluyentes desactivando primero la fuente anterior. */
  async #changeMode(mode) {
    if (mode === this.mode || this.#isOperating()) return;
    this.operationState = OPERATION_UI_STATE.PROCESSING; this.#syncControls();
    try {
      await this.onModeChange(mode); this.mode = mode; this.cameraActive = false; this.videoLoaded = false;
      this.#resetSegmentState(); this.status(mode === 'camera' ? 'Modo cámara listo.' : 'Modo video listo; importa un archivo.');
    } catch (error) { this.status(error.message, true); }
    finally { this.operationState = OPERATION_UI_STATE.IDLE; this.#syncControls(); }
  }

  /** Alterna una única cámara entre activa y detenida. */
  async #toggleCamera() {
    if (this.#isOperating()) return;
    this.operationState = OPERATION_UI_STATE.PROCESSING; this.#syncControls();
    try {
      if (this.cameraActive) { await this.onStopCamera(); this.cameraActive = false; this.status('Cámara detenida.'); }
      else { await this.onStartCamera(); this.cameraActive = true; this.status('Cámara activa.'); }
    } catch (error) { this.status(error.message, true); }
    finally { this.operationState = OPERATION_UI_STATE.IDLE; this.#syncControls(); }
  }

  /** Al terminar captura mantiene bloqueos hasta persistir y releer el conteo. */
  async #toggleCapture() {
    if (this.operationState === OPERATION_UI_STATE.PROCESSING) return;
    if (this.operationState !== OPERATION_UI_STATE.CAPTURING) {
      if (this.classState !== CLASS_UI_STATE.VIEWING || !this.getActiveClass?.()) return;
      this.operationState = OPERATION_UI_STATE.PROCESSING; this.#syncControls();
      try { await this.onStartCapture(); this.operationState = OPERATION_UI_STATE.CAPTURING; this.$('sample-summary').textContent = 'Capturando…'; this.status('Capturando…'); }
      catch (error) { this.operationState = OPERATION_UI_STATE.IDLE; this.status(error.message, true); }
      this.#syncControls(); return;
    }
    this.operationState = OPERATION_UI_STATE.PROCESSING; this.#syncControls(); let stopped = false;
    try {
      const frames = await this.onStopCapture(); stopped = true; this.$('sample-summary').textContent = 'Procesando…'; this.status('Validando y guardando captura…');
      await this.onAutoSave(); this.renderClasses(); this.$('sample-summary').textContent = `Muestra guardada · ${frames.length} frames`; this.status('Muestra guardada en el dataset.');
    } catch (error) { this.$('sample-summary').textContent = stopped ? 'Guardado fallido' : 'Capturando…'; this.status(error.message, true); }
    finally { this.operationState = stopped ? OPERATION_UI_STATE.IDLE : OPERATION_UI_STATE.CAPTURING; this.#syncControls(); }
  }

  /** Carga un archivo y mantiene bloqueadas las mutaciones mientras cambia la fuente. */
  async #import(file) {
    if (this.#isOperating()) return;
    this.#resetSegmentState();
    this.operationState = OPERATION_UI_STATE.PROCESSING; this.#syncControls();
    try {
      await this.onImport(file); this.videoLoaded = true; this.#updateTime();
      const fileName = file?.name || 'Video seleccionado'; this.$('video-file-name').textContent = fileName; this.$('video-file-name').title = fileName;
      this.status('Video importado; marca inicio y fin para procesar el segmento.');
    }
    catch (error) { this.videoLoaded = false; this.status(error.message, true); }
    finally { this.operationState = OPERATION_UI_STATE.IDLE; this.#syncControls(); }
  }

  /** Procesa, valida, persiste y relee sin permitir un segundo guardado. */
  async #processSegment() {
    if (this.#isOperating()) return;
    if (this.classState !== CLASS_UI_STATE.VIEWING || !this.getActiveClass?.()) return;
    if (!this.#hasValidSegment()) { this.segmentFeedback = { text: 'Define un inicio y un fin posterior.', tone: 'error' }; this.#syncControls(); return; }
    this.operationState = OPERATION_UI_STATE.PROCESSING; this.segmentState = SEGMENT_UI_STATE.PROCESSING; this.segmentFeedback = null; this.#syncControls();
    try {
      const segment = this.videoControls.segment;
      this.status('Procesando segmento frame por frame…'); const result = await this.onProcessSegment(segment);
      this.status('Validando y guardando segmento…'); await this.onAutoSave(); this.renderClasses();
      const warning = result.diagnostics?.length ? result.diagnostics.map((item) => `${item.code} (${item.omittedFrames})`).join(', ') : '';
      this.segmentState = SEGMENT_UI_STATE.PROCESSED; this.segmentFeedback = { text: warning ? `✓ Segmento procesado · Advertencia: ${warning}` : '✓ Segmento procesado', tone: warning ? 'warning' : 'success' };
      this.status(`Muestra guardada en el dataset.${warning ? ` Advertencia: ${warning}.` : ''}`);
    } catch (error) {
      this.segmentState = this.#hasValidSegment() ? SEGMENT_UI_STATE.READY : (this.#hasSegmentStart() ? SEGMENT_UI_STATE.STARTED : SEGMENT_UI_STATE.EMPTY);
      this.segmentFeedback = { text: error.message, tone: 'error' }; this.status(error.message, true);
    }
    finally { this.operationState = OPERATION_UI_STATE.IDLE; this.#syncControls(); }
  }

  /** Cambiar de clase descarta de forma explícita cualquier borrador local. */
  async #selectClass() {
    if (this.#isOperating() || this.classState === CLASS_UI_STATE.CREATING) return;
    const discarded = this.classState !== CLASS_UI_STATE.VIEWING;
    try {
      await this.onSelectClass(this.$('class-selector').value); this.classState = CLASS_UI_STATE.VIEWING; this.renderClasses();
      this.status(discarded ? 'Cambios sin guardar descartados; clase activa seleccionada.' : 'Clase activa seleccionada.');
    } catch (error) { this.status(error.message, true); }
  }

  /** Abre un borrador nuevo editable; no persiste hasta Guardar. */
  #newClass() {
    if (this.#isOperating() || this.classState !== CLASS_UI_STATE.VIEWING) return;
    this.classState = CLASS_UI_STATE.CREATING; this.$('class-form').reset(); this.$('class-form').dataset.classId = ''; this.$('class-glosa').value = ''; this.$('class-type').value = 'normal'; this.$('meanings').replaceChildren(); this.#addMeaning();
    const creating = this.document.createElement('option'); creating.value = ''; creating.textContent = 'Nueva clase'; creating.selected = true; this.$('class-selector').replaceChildren(creating);
    this.status('Nueva clase: completa los datos y pulsa Guardar.'); this.#syncControls();
  }

  /** Habilita edición solo tras una intención explícita. */
  #editClass() {
    if (this.#isOperating() || this.classState !== CLASS_UI_STATE.VIEWING) return;
    const active = this.getActiveClass?.(); if (!active) return;
    this.classState = CLASS_UI_STATE.EDITING; this.#fillClassForm(active); this.status('Editando clase activa.'); this.#syncControls();
  }

  /** Valida mediante dominio, persiste, relee y solo entonces vuelve a consulta. */
  async #saveClass(event) {
    event.preventDefault();
    if (this.#isOperating() || this.classState === CLASS_UI_STATE.VIEWING) return;
    const previousState = this.classState; const tipo = this.$('class-type').value;
    const data = { glosa: this.$('class-glosa').value, significados: tipo === 'ruido_background' ? [] : this.#readMeanings(), estado: 'activa', tipo };
    // Mantiene la única metadata permitida para la clase técnica reservada Lite.
    if (tipo === 'ruido_background') data.glosa = 'ruido_background';
    const id = this.$('class-form').dataset.classId;
    this.operationState = OPERATION_UI_STATE.PROCESSING; this.#syncControls();
    try {
      const saved = id ? await this.onUpdateClass(id, data) : await this.onCreateClass(data);
      if (!saved?.persisted) throw new Error('El dataset no confirmó la persistencia de la clase.');
      this.classState = CLASS_UI_STATE.VIEWING; this.operationState = OPERATION_UI_STATE.IDLE; this.renderClasses(); this.status('Clase guardada.');
    } catch (error) { this.classState = previousState; this.operationState = OPERATION_UI_STATE.IDLE; this.status(error.message, true); this.#syncControls(); }
  }

  /** Restaura la metadata autoritativa sin escribir el borrador. */
  #cancelClass() {
    if (this.#isOperating() || this.classState === CLASS_UI_STATE.VIEWING) return;
    this.classState = CLASS_UI_STATE.VIEWING; const active = this.getActiveClass?.(); if (active) this.#fillClassForm(active); else this.#clearClassForm();
    this.renderClasses(); this.status('Edición cancelada; no se escribieron cambios.');
  }

  /** Elimina con bloqueo global y actualiza el conteo releído por el orquestador. */
  async #deleteLast() {
    if (this.#isOperating() || this.classState !== CLASS_UI_STATE.VIEWING) return;
    const active = this.getActiveClass?.(); if (!active) { this.status('Selecciona una clase activa antes de eliminar.', true); return; }
    this.operationState = OPERATION_UI_STATE.PROCESSING; this.#syncControls();
    try { const result = await this.onDeleteLast(active.classId); this.operationState = OPERATION_UI_STATE.IDLE; this.renderClasses(); this.status(result.deleted ? 'Última muestra eliminada.' : 'La clase no tiene muestras persistidas.'); }
    catch (error) { this.status(error.message, true); }
    finally { this.operationState = OPERATION_UI_STATE.IDLE; this.#syncControls(); }
  }

  /** Centraliza todos los bloqueos para evitar combinaciones contradictorias. */
  #syncControls() {
    const operating = this.#isOperating(); const capturing = this.operationState === OPERATION_UI_STATE.CAPTURING;
    const editable = this.classState !== CLASS_UI_STATE.VIEWING; const creating = this.classState === CLASS_UI_STATE.CREATING;
    const catalogActive = this.getActiveClass?.(); const active = creating ? null : catalogActive; const cameraMode = this.mode === 'camera'; const noise = this.$('class-type').value === 'ruido_background';
    this.$('camera-controls').hidden = !cameraMode; this.$('video-controls').hidden = cameraMode; this.$('video-file-control').hidden = cameraMode;
    // El espejo pertenece solo a la composición visual; extractor y JSON
    // continúan recibiendo las coordenadas originales de MediaPipe.
    this.$('preview-stage').classList.toggle('camera-mirrored', cameraMode);
    this.$('mode-camera').setAttribute('aria-pressed', String(cameraMode)); this.$('mode-video').setAttribute('aria-pressed', String(!cameraMode));
    this.$('mode-camera').classList.toggle('active', cameraMode); this.$('mode-video').classList.toggle('active', !cameraMode);
    this.$('mode-camera').disabled = operating; this.$('mode-video').disabled = operating;
    this.$('camera-toggle').textContent = this.cameraActive ? 'Detener cámara' : 'Activar cámara'; this.$('camera-toggle').disabled = operating;
    this.$('capture-toggle').textContent = capturing ? 'Terminar captura' : 'Iniciar captura';
    this.$('capture-toggle').disabled = this.operationState === OPERATION_UI_STATE.PROCESSING || (!capturing && (!this.cameraActive || !active || editable));
    const videoDisabled = operating || !this.videoLoaded || editable || !active;
    ['play-pause', 'back-quarter', 'forward-quarter', 'back-frame', 'forward-frame'].forEach((id) => { this.$(id).disabled = videoDisabled; });
    this.$('mark-start').disabled = videoDisabled; this.$('mark-end').disabled = videoDisabled || !this.#hasSegmentStart();
    this.$('process-segment').disabled = videoDisabled || this.segmentState !== SEGMENT_UI_STATE.READY || !this.#hasValidSegment();
    this.$('video-file').disabled = operating; this.$('class-selector').disabled = operating || creating; this.$('new-class').disabled = operating || editable;
    this.$('edit-class').hidden = editable; this.$('edit-class').disabled = operating || !active;
    this.$('save-class').hidden = !editable; this.$('cancel-class').hidden = !editable; this.$('save-class').disabled = operating; this.$('cancel-class').disabled = operating;
    this.$('class-glosa').disabled = operating || !editable; this.$('class-type').disabled = operating || !creating;
    this.$('meanings-field').disabled = operating || !editable || noise; this.$('add-meaning').disabled = operating || !editable || noise;
    [...this.$('meanings').querySelectorAll('[data-meaning-text], [data-remove-meaning]')].forEach((control) => { control.disabled = operating || !editable || noise; if (control.matches?.('[data-remove-meaning]')) control.hidden = !editable; });
    this.$('delete-last').disabled = operating || editable || (this.getSampleCount?.(active?.classId) ?? 0) < 1;
    this.#renderSegmentState();
  }

  #isOperating() { return this.operationState !== OPERATION_UI_STATE.IDLE; }
  #readMeanings() { return [...this.$('meanings').querySelectorAll('[data-meaning-row]')].map((row) => row.querySelector('[data-meaning-text]').value.trim()).filter(Boolean); }
  #addMeaning(meaning = '') { if (this.classState === CLASS_UI_STATE.VIEWING || this.#isOperating()) return; const row = this.document.createElement('div'); row.dataset.meaningRow = ''; row.innerHTML = `<input data-meaning-text required placeholder="Significado" value="${escapeHtml(meaning)}"><button data-remove-meaning type="button" class="secondary">Eliminar</button>`; this.$('meanings').append(row); row.querySelector('[data-remove-meaning]').addEventListener('click', () => { if (!this.#isOperating() && this.classState !== CLASS_UI_STATE.VIEWING) row.remove(); }); this.#syncControls(); }
  #fillClassForm(classItem) { this.$('class-form').dataset.classId = classItem.classId; this.$('class-glosa').value = classItem.glosa; this.$('class-type').value = classItem.tipo; this.$('meanings').replaceChildren(); (classItem.significados ?? []).forEach((meaning) => this.#appendMeaningRow(meaning)); }
  #appendMeaningRow(meaning) { const row = this.document.createElement('div'); row.dataset.meaningRow = ''; row.innerHTML = `<input data-meaning-text required placeholder="Significado" value="${escapeHtml(meaning)}"><button data-remove-meaning type="button" class="secondary">Eliminar</button>`; this.$('meanings').append(row); row.querySelector('[data-remove-meaning]').addEventListener('click', () => { if (!this.#isOperating() && this.classState !== CLASS_UI_STATE.VIEWING) row.remove(); }); }
  #clearClassForm() { this.$('class-form').reset(); this.$('class-form').dataset.classId = ''; this.$('class-glosa').value = ''; this.$('class-type').value = ''; this.$('meanings').replaceChildren(); }
  /** Al elegir ruido elimina significados solo por una acción editable del usuario. */
  #syncMeaningAvailability(fromUser = false) { if (fromUser && this.classState !== CLASS_UI_STATE.VIEWING && this.$('class-type').value === 'ruido_background') this.$('meanings').replaceChildren(); this.#syncControls(); }
  async #playPause() { try { const playing = await this.videoControls.togglePlayback(); const button = this.$('play-pause'); button.textContent = playing ? '⏸' : '▶'; button.setAttribute('aria-label', playing ? 'Pausar' : 'Reproducir'); button.title = playing ? 'Pausar' : 'Reproducir'; } catch (error) { this.status(error.message, true); } }
  #seek(deltaMs) { this.videoControls.seekBy(deltaMs); this.#updateTime(); }
  #seekFrame(direction) { this.videoControls.seekFrame(direction); this.#updateTime(); }
  #mark(which) {
    let value;
    if (which === 'start') {
      this.videoControls.reset(); value = this.videoControls.markStart(); this.segmentState = SEGMENT_UI_STATE.STARTED; this.segmentFeedback = null;
      this.$('segment-end').textContent = '00:00.000';
    } else {
      value = this.videoControls.markEnd();
      if (this.#hasValidSegment()) { this.segmentState = SEGMENT_UI_STATE.READY; this.segmentFeedback = null; }
      else { this.segmentState = SEGMENT_UI_STATE.STARTED; this.segmentFeedback = { text: 'El fin debe ser posterior al inicio.', tone: 'error' }; }
    }
    this.$(`segment-${which}`).textContent = formatMarkerClock(value);
    // Marcar fin pausa el elemento sin mover el playhead; la UI debe reflejarlo.
    if (which === 'end') { const button = this.$('play-pause'); button.textContent = '▶'; button.setAttribute('aria-label', 'Reproducir'); button.title = 'Reproducir'; }
    this.#syncControls();
  }
  /** Reinicia únicamente el estado temporal visible al cambiar fuente o archivo. */
  #resetSegmentState() {
    this.videoControls.reset(); this.segmentState = SEGMENT_UI_STATE.EMPTY; this.segmentFeedback = null;
    this.$('segment-start').textContent = '00:00.000'; this.$('segment-end').textContent = '00:00.000';
    const button = this.$('play-pause'); button.textContent = '▶'; button.setAttribute('aria-label', 'Reproducir'); button.title = 'Reproducir'; this.#renderSegmentState(); this.#updateTime();
  }
  #hasSegmentStart() { return Number.isFinite(this.videoControls.startMs) || Number.isFinite(this.videoControls.segment?.startMs); }
  #hasSegmentEnd() { return Number.isFinite(this.videoControls.endMs) || Number.isFinite(this.videoControls.segment?.endMs); }
  #hasValidSegment() { const segment = this.videoControls.segment; return Number.isFinite(segment?.startMs) && Number.isFinite(segment?.endMs) && segment.endMs > segment.startMs; }
  /** Deriva textos, iconos y tonos del estado sin depender exclusivamente del color. */
  #renderSegmentState() {
    const start = this.#hasSegmentStart(); const end = this.#hasSegmentEnd(); const valid = this.#hasValidSegment();
    const startButton = this.$('mark-start'); const endButton = this.$('mark-end'); const processButton = this.$('process-segment');
    startButton.textContent = start ? '✓ Inicio' : 'Marcar inicio'; endButton.textContent = end ? (valid ? '✓ Fin' : 'Fin inválido') : 'Marcar fin';
    startButton.setAttribute('aria-pressed', String(start)); endButton.setAttribute('aria-pressed', String(end && valid));
    startButton.classList.toggle('segment-selected', start); endButton.classList.toggle('segment-selected', end && valid); endButton.classList.toggle('segment-invalid', end && !valid);
    processButton.textContent = this.segmentState === SEGMENT_UI_STATE.PROCESSING ? 'Procesando…' : this.segmentState === SEGMENT_UI_STATE.PROCESSED ? '✓ Procesado' : 'Procesar segmento';
    processButton.classList.toggle('segment-selected', this.segmentState === SEGMENT_UI_STATE.PROCESSED);
    const defaults = { [SEGMENT_UI_STATE.EMPTY]: 'Sin segmento', [SEGMENT_UI_STATE.STARTED]: 'Inicio marcado; selecciona el fin', [SEGMENT_UI_STATE.READY]: 'Segmento listo para procesar', [SEGMENT_UI_STATE.PROCESSING]: 'Procesando segmento…', [SEGMENT_UI_STATE.PROCESSED]: '✓ Segmento procesado' };
    const feedback = this.segmentFeedback ?? { text: defaults[this.segmentState], tone: this.segmentState === SEGMENT_UI_STATE.PROCESSED ? 'success' : '' }; const output = this.$('segment-feedback'); output.textContent = feedback.text;
    ['success', 'warning', 'error'].forEach((tone) => output.classList.toggle(`segment-${tone}`, feedback.tone === tone));
  }
  #updateTime() { const durationMs = Number.isFinite(this.$('preview').duration) ? this.$('preview').duration * 1000 : 0; this.$('current-time').textContent = formatClock(this.videoControls.currentMs); this.$('video-duration').textContent = formatClock(durationMs); }
}

/** Escapa valores antes de insertarlos en atributos del editor dinámico. */
function escapeHtml(value) { return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }
/** Presenta tiempos de navegación de forma compacta sin cambiar su valor interno. */
function formatClock(value) { const totalSeconds = Math.floor(Math.max(0, Number(value) || 0) / 1000); return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`; }
/** Presenta los límites con milisegundos sin alterar el valor temporal guardado. */
function formatMarkerClock(value) { const totalMs = Math.max(0, Math.round(Number(value) || 0)); const minutes = Math.floor(totalMs / 60000); const seconds = Math.floor((totalMs % 60000) / 1000); return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(totalMs % 1000).padStart(3, '0')}`; }

/** Ordena solo la presentación por glosa y deja ruido_background al final. */
export function sortClassesForDisplay(classes) {
  const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });
  return [...classes].sort((left, right) => {
    const leftNoise = left.tipo === 'ruido_background'; const rightNoise = right.tipo === 'ruido_background';
    if (leftNoise !== rightNoise) return leftNoise ? 1 : -1;
    return collator.compare(left.glosa, right.glosa);
  });
}
