import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DataStore } from '../src/almacenamiento/DataStore.js';
import { ClassCatalog } from '../src/etiquetado/ClassCatalog.js';
import { VideoControls } from '../src/video/VideoControls.js';
import { VideoSource } from '../src/video/VideoSource.js';
import { ConfiguratorUI, CLASS_UI_STATE, OPERATION_UI_STATE, SEGMENT_UI_STATE, sortClassesForDisplay } from '../src/ui/ConfiguratorUI.js';

/** Adaptador determinista para comprobar que el catálogo no es fuente de verdad. */
class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

/** Validador mínimo inyectado solo para aislar reglas del catálogo en esta prueba. */
const validClassContract = { validate: async (value) => ({ valid: value?.classId?.length > 0 && Array.isArray(value?.significados), complete: true, errors: [] }) };

/** DOM mínimo para comprobar transiciones de la UI sin introducir jsdom. */
class FakeElement {
  constructor(id = '') { this.id = id; this.listeners = {}; this.dataset = {}; this.classes = new Set(); this.classList = { toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name), contains: (name) => this.classes.has(name) }; this.hidden = false; this.disabled = false; this.textContent = ''; this.value = ''; this.files = []; this.children = []; }
  addEventListener(type, listener) { this.listeners[type] = listener; }
  async emit(type, event = {}) { return this.listeners[type]?.({ target: this, preventDefault() {}, ...event }); }
  setAttribute(name, value) { this[name] = value; }
  replaceChildren(...children) { this.children = children; children.forEach((child) => { child.parent = this; }); }
  append(child) { this.children.push(child); child.parent = this; }
  set innerHTML(html) { const match = /value="([^"]*)"/.exec(html); this.meaningInput = new FakeElement('meaning-input'); this.meaningInput.value = match?.[1] ?? ''; this.removeButton = new FakeElement('remove-meaning'); }
  querySelectorAll(selector) {
    if (selector === '[data-meaning-row]') return this.children;
    if (selector.includes('[data-meaning-text]')) return this.children.flatMap((child) => [child.meaningInput, child.removeButton].filter(Boolean));
    return [];
  }
  querySelector(selector) { if (selector === '[data-meaning-text]') return this.meaningInput; if (selector === '[data-remove-meaning]') return this.removeButton; return null; }
  matches(selector) { return selector === '[data-remove-meaning]' && this.id === 'remove-meaning'; }
  reset() {}
  remove() { if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this); }
}

class FakeDocument {
  constructor() {
    const ids = ['mode-camera', 'mode-video', 'camera-toggle', 'capture-toggle', 'camera-controls', 'video-controls', 'preview-stage', 'video-file-control', 'video-file', 'video-file-name', 'play-pause', 'back-quarter', 'forward-quarter', 'back-frame', 'forward-frame', 'mark-start', 'mark-end', 'process-segment', 'preview', 'delete-last', 'class-selector', 'new-class', 'edit-class', 'class-form', 'add-meaning', 'save-class', 'cancel-class', 'class-type', 'dataset-status', 'status', 'sample-summary', 'current-time', 'video-duration', 'segment-start', 'segment-end', 'segment-feedback', 'class-glosa', 'meanings', 'meanings-field'];
    this.elements = new Map(ids.map((id) => [id, new FakeElement(id)]));
    this.getElementById('class-type').value = 'normal';
  }
  getElementById(id) { return this.elements.get(id); }
  createElement() { return new FakeElement(); }
}

/** Compone una UI con dominio mutable para probar estados sin red ni archivos. */
function createUiHarness({ failUpdate = false, processGate = null, initialActiveId = 'u001' } = {}) {
  const documentRef = new FakeDocument();
  let classes = [
    { classId: 'u001', glosa: 'UNO', significados: ['uno'], estado: 'activa', tipo: 'normal' },
    { classId: 'u002', glosa: 'DOS', significados: ['dos'], estado: 'activa', tipo: 'normal' },
  ];
  let activeId = initialActiveId; const counts = { u001: 1, u002: 0 }; const savedTargets = []; let capturedClassId = null; let processCalls = 0;
  const videoControls = {
    currentMs: 0, startMs: null, endMs: null, segment: null,
    reset() { this.startMs = null; this.endMs = null; this.segment = null; }, togglePlayback: async () => true, seekBy() {}, seekFrame() {},
    markStart() { this.startMs = this.currentMs; this.endMs = null; this.segment = null; return this.startMs; },
    markEnd() { this.endMs = this.currentMs; this.segment = { startMs: this.startMs, endMs: this.endMs }; return this.endMs; },
  };
  const ui = new ConfiguratorUI(documentRef);
  ui.bind({
    onStartCamera: async () => {}, onStopCamera: async () => {}, onModeChange: async () => {}, onImport: async () => {},
    onStartCapture: async () => { capturedClassId = activeId; }, onStopCapture: async () => [{ frameIndex: 0 }],
    onProcessSegment: async () => { processCalls += 1; if (processGate) await processGate.promise; capturedClassId = activeId; return { frames: [{ frameIndex: 0 }], durationMs: 100, diagnostics: [] }; },
    onAutoSave: async () => { savedTargets.push(capturedClassId); counts[capturedClassId] = (counts[capturedClassId] ?? 0) + 1; },
    onDeleteLast: async (classId) => { const deleted = counts[classId] > 0; if (deleted) counts[classId] -= 1; return { deleted, count: counts[classId] }; },
    onSelectClass: async (classId) => { activeId = classId; },
    onCreateClass: async (data) => { const created = { classId: 'u003', ...data }; classes.push(created); counts.u003 = 0; activeId = 'u003'; return { ...created, persisted: true }; },
    onUpdateClass: async (classId, data) => { if (failUpdate) throw new Error('fallo persistente real'); classes = classes.map((item) => item.classId === classId ? { ...item, ...data, classId } : item); return { ...classes.find((item) => item.classId === classId), persisted: true }; },
    getClasses: () => classes.map((item) => structuredClone(item)), getActiveClass: () => structuredClone(classes.find((item) => item.classId === activeId) ?? null), getSampleCount: (classId) => counts[classId] ?? 0, videoControls,
  });
  return { ui, documentRef, videoControls, get activeId() { return activeId; }, get classes() { return classes; }, counts, savedTargets, get processCalls() { return processCalls; } };
}

test('app inicia sin clase activa y solo una selección explícita carga metadata', async () => {
  const harness = createUiHarness({ initialActiveId: null }); const { ui, documentRef, videoControls } = harness;
  assert.equal(ui.state.activeClassId, null); assert.equal(documentRef.getElementById('class-selector').children[0].textContent, 'Seleccione una clase');
  assert.equal(documentRef.getElementById('class-glosa').value, ''); assert.equal(documentRef.getElementById('class-type').value, ''); assert.equal(documentRef.getElementById('meanings').children.length, 0);
  ['edit-class', 'delete-last', 'capture-toggle', 'process-segment'].forEach((id) => assert.equal(documentRef.getElementById(id).disabled, true, id));
  await documentRef.getElementById('camera-toggle').emit('click'); assert.equal(ui.state.cameraActive, true); assert.equal(documentRef.getElementById('capture-toggle').disabled, true);
  await documentRef.getElementById('capture-toggle').emit('click'); assert.equal(ui.state.operationState, OPERATION_UI_STATE.IDLE);
  await documentRef.getElementById('mode-video').emit('click'); await documentRef.getElementById('video-file').emit('change', { target: { files: [{ name: 'sin-clase.mp4' }] } });
  videoControls.segment = { startMs: 0, endMs: 100 }; await documentRef.getElementById('process-segment').emit('click'); assert.equal(harness.processCalls, 0);
  documentRef.getElementById('class-selector').value = 'u001'; await documentRef.getElementById('class-selector').emit('change');
  assert.equal(ui.state.activeClassId, 'u001'); assert.equal(documentRef.getElementById('class-glosa').value, 'UNO'); assert.equal(documentRef.getElementById('class-type').value, 'normal'); assert.equal(documentRef.getElementById('meanings').children[0].meaningInput.value, 'uno'); assert.equal(documentRef.getElementById('edit-class').disabled, false);
});

test('nueva clase cancelada desde estado vacío regresa sin selección', async () => {
  const harness = createUiHarness({ initialActiveId: null }); const { ui, documentRef } = harness; const initialClasses = harness.classes.length;
  await documentRef.getElementById('new-class').emit('click'); assert.equal(ui.state.classState, CLASS_UI_STATE.CREATING); assert.equal(ui.state.activeClassId, null);
  documentRef.getElementById('class-glosa').value = 'BORRADOR'; documentRef.getElementById('meanings').children[0].meaningInput.value = 'temporal'; await documentRef.getElementById('cancel-class').emit('click');
  assert.equal(ui.state.classState, CLASS_UI_STATE.VIEWING); assert.equal(ui.state.activeClassId, null); assert.equal(harness.classes.length, initialClasses);
  assert.equal(documentRef.getElementById('class-selector').children[0].textContent, 'Seleccione una clase'); assert.equal(documentRef.getElementById('class-glosa').value, ''); assert.equal(documentRef.getElementById('class-type').value, ''); assert.equal(documentRef.getElementById('meanings').children.length, 0);
});

test('clase existente inicia bloqueada y Editar permite Guardar o Cancelar', async () => {
  const harness = createUiHarness(); const { ui, documentRef } = harness;
  assert.equal(ui.state.classState, CLASS_UI_STATE.VIEWING); assert.equal(documentRef.getElementById('class-glosa').disabled, true); assert.equal(documentRef.getElementById('add-meaning').disabled, true);
  assert.equal(documentRef.getElementById('save-class').hidden, true); assert.equal(documentRef.getElementById('edit-class').hidden, false);
  await documentRef.getElementById('edit-class').emit('click');
  assert.equal(ui.state.classState, CLASS_UI_STATE.EDITING); assert.equal(documentRef.getElementById('class-glosa').disabled, false); assert.equal(documentRef.getElementById('add-meaning').disabled, false);
  documentRef.getElementById('class-glosa').value = 'BORRADOR'; documentRef.getElementById('meanings').children[0].meaningInput.value = 'borrador';
  await documentRef.getElementById('cancel-class').emit('click');
  assert.equal(documentRef.getElementById('class-glosa').value, 'UNO'); assert.equal(documentRef.getElementById('meanings').children[0].meaningInput.value, 'uno'); assert.equal(documentRef.getElementById('class-glosa').disabled, true);
  await documentRef.getElementById('edit-class').emit('click'); documentRef.getElementById('class-glosa').value = 'UNO EDITADO'; documentRef.getElementById('meanings').children[0].meaningInput.value = 'unidad';
  await documentRef.getElementById('class-form').emit('submit');
  assert.equal(harness.classes[0].classId, 'u001'); assert.equal(harness.classes[0].glosa, 'UNO EDITADO'); assert.deepEqual(harness.classes[0].significados, ['unidad']);
  assert.equal(ui.state.classState, CLASS_UI_STATE.VIEWING); assert.equal(documentRef.getElementById('class-glosa').disabled, true); assert.equal(documentRef.getElementById('status').textContent, 'Clase guardada.');
});

test('Nueva clase inicia editable, persiste seleccionada y vuelve a consulta', async () => {
  const harness = createUiHarness(); const { ui, documentRef } = harness;
  await documentRef.getElementById('camera-toggle').emit('click'); assert.equal(documentRef.getElementById('capture-toggle').disabled, false);
  await documentRef.getElementById('new-class').emit('click');
  assert.equal(ui.state.classState, CLASS_UI_STATE.CREATING); assert.equal(ui.state.activeClassId, null); assert.equal(documentRef.getElementById('class-selector').children[0].textContent, 'Nueva clase'); assert.equal(documentRef.getElementById('class-selector').disabled, true);
  assert.equal(documentRef.getElementById('delete-last').disabled, true); assert.equal(documentRef.getElementById('capture-toggle').disabled, true);
  assert.equal(documentRef.getElementById('class-glosa').value, ''); assert.equal(documentRef.getElementById('meanings').children.length, 1); assert.equal(documentRef.getElementById('meanings').children[0].meaningInput.value, '');
  assert.equal(documentRef.getElementById('class-glosa').disabled, false); assert.equal(documentRef.getElementById('class-type').disabled, false);
  documentRef.getElementById('class-glosa').value = 'TRES'; documentRef.getElementById('meanings').children[0].meaningInput.value = 'tres';
  await documentRef.getElementById('class-form').emit('submit');
  assert.equal(harness.activeId, 'u003'); assert.equal(harness.counts.u003, 0); assert.equal(harness.classes.at(-1).glosa, 'TRES');
  assert.equal(ui.state.classState, CLASS_UI_STATE.VIEWING); assert.equal(ui.state.activeClassId, 'u003'); assert.equal(documentRef.getElementById('class-glosa').disabled, true); assert.equal(documentRef.getElementById('class-selector').disabled, false); assert.equal(documentRef.getElementById('capture-toggle').disabled, false);
});

test('Cancelar nueva clase restaura selección, metadata y contador sin persistir', async () => {
  const harness = createUiHarness(); const { ui, documentRef } = harness; const initialCount = harness.counts.u001; const initialClasses = harness.classes.length;
  assert.equal(documentRef.getElementById('delete-last').disabled, false); await documentRef.getElementById('new-class').emit('click');
  documentRef.getElementById('class-glosa').value = 'BORRADOR'; documentRef.getElementById('meanings').children[0].meaningInput.value = 'temporal';
  documentRef.getElementById('class-selector').value = 'u002'; await documentRef.getElementById('class-selector').emit('change'); await documentRef.getElementById('delete-last').emit('click');
  assert.equal(harness.activeId, 'u001'); assert.equal(harness.counts.u001, initialCount); assert.equal(harness.classes.length, initialClasses);
  await documentRef.getElementById('cancel-class').emit('click');
  assert.equal(ui.state.classState, CLASS_UI_STATE.VIEWING); assert.equal(ui.state.activeClassId, 'u001'); assert.equal(harness.activeId, 'u001'); assert.equal(harness.classes.length, initialClasses);
  assert.equal(documentRef.getElementById('class-glosa').value, 'UNO'); assert.equal(documentRef.getElementById('meanings').children[0].meaningInput.value, 'uno'); assert.equal(documentRef.getElementById('delete-last').disabled, false);
  assert.match(documentRef.getElementById('class-selector').children.find((option) => option.selected)?.textContent ?? '', /^UNO — 1 muestra$/);
});

test('crear clase bloquea procesamiento aunque el segmento CFG-23 siga definido', async () => {
  const harness = createUiHarness(); const { ui, documentRef, videoControls } = harness;
  await documentRef.getElementById('mode-video').emit('click'); await documentRef.getElementById('video-file').emit('change', { target: { files: [{ name: 'listo.mp4' }] } });
  videoControls.currentMs = 1000; await documentRef.getElementById('mark-start').emit('click'); videoControls.currentMs = 2000; await documentRef.getElementById('mark-end').emit('click');
  assert.equal(ui.state.segmentState, SEGMENT_UI_STATE.READY); assert.equal(documentRef.getElementById('process-segment').disabled, false);
  await documentRef.getElementById('new-class').emit('click');
  assert.equal(ui.state.segmentState, SEGMENT_UI_STATE.READY); assert.equal(documentRef.getElementById('process-segment').disabled, true); assert.equal(ui.state.activeClassId, null);
  await documentRef.getElementById('process-segment').emit('click'); assert.equal(harness.processCalls, 0);
});

test('captura bloquea destino y metadata hasta completar autoguardado', async () => {
  const harness = createUiHarness(); const { ui, documentRef } = harness;
  await documentRef.getElementById('camera-toggle').emit('click'); await documentRef.getElementById('capture-toggle').emit('click');
  assert.equal(ui.state.operationState, OPERATION_UI_STATE.CAPTURING);
  ['class-selector', 'new-class', 'edit-class', 'save-class', 'cancel-class', 'class-glosa', 'add-meaning', 'delete-last', 'mode-camera', 'mode-video'].forEach((id) => assert.equal(documentRef.getElementById(id).disabled, true, id));
  documentRef.getElementById('class-selector').value = 'u002'; await documentRef.getElementById('class-selector').emit('change'); await documentRef.getElementById('delete-last').emit('click');
  assert.equal(harness.activeId, 'u001'); assert.equal(harness.counts.u001, 1);
  await documentRef.getElementById('capture-toggle').emit('click');
  assert.deepEqual(harness.savedTargets, ['u001']); assert.equal(harness.counts.u001, 2); assert.equal(ui.state.operationState, OPERATION_UI_STATE.IDLE);
});

test('procesamiento impide doble guardado y cambio de clase descarta borrador', async () => {
  let release; const gate = { promise: new Promise((resolve) => { release = resolve; }) }; const harness = createUiHarness({ processGate: gate }); const { ui, documentRef, videoControls } = harness;
  await documentRef.getElementById('edit-class').emit('click'); documentRef.getElementById('class-glosa').value = 'NO GUARDAR'; documentRef.getElementById('class-selector').value = 'u002'; await documentRef.getElementById('class-selector').emit('change');
  assert.equal(harness.activeId, 'u002'); assert.equal(documentRef.getElementById('class-glosa').value, 'DOS'); assert.equal(ui.state.classState, CLASS_UI_STATE.VIEWING);
  await documentRef.getElementById('mode-video').emit('click'); await documentRef.getElementById('video-file').emit('change', { target: { files: [{}] } }); videoControls.segment = { startMs: 0, endMs: 100 };
  const first = documentRef.getElementById('process-segment').emit('click'); await Promise.resolve(); const second = documentRef.getElementById('process-segment').emit('click');
  assert.equal(harness.processCalls, 1); assert.equal(documentRef.getElementById('class-selector').disabled, true); release(); await Promise.all([first, second]); assert.equal(harness.savedTargets.length, 1);
});

test('error de persistencia mantiene borrador y no anuncia éxito', async () => {
  const harness = createUiHarness({ failUpdate: true }); const { ui, documentRef } = harness;
  await documentRef.getElementById('edit-class').emit('click'); documentRef.getElementById('class-glosa').value = 'NO PERSISTIDA'; await documentRef.getElementById('class-form').emit('submit');
  assert.equal(harness.classes[0].glosa, 'UNO'); assert.equal(ui.state.classState, CLASS_UI_STATE.EDITING); assert.equal(documentRef.getElementById('status').textContent, 'fallo persistente real'); assert.notEqual(documentRef.getElementById('status').textContent, 'Clase guardada.');
});

test('UI alterna cámara/captura, excluye modos y confirma guardado de video', async () => {
  const documentRef = new FakeDocument(); const active = { classId: 'u001', glosa: 'UNO', significados: [], tipo: 'normal' }; let count = 0; let starts = 0; let stops = 0; let saves = 0;
  const videoControls = { currentMs: 0, segment: null, reset() { this.segment = null; }, togglePlayback: async () => true, seekBy() {}, seekFrame() {}, markStart() { return 0; }, markEnd() { return 100; } };
  const ui = new ConfiguratorUI(documentRef);
  ui.bind({
    onStartCamera: async () => { starts += 1; }, onStopCamera: async () => { stops += 1; }, onModeChange: async () => {}, onImport: async () => {},
    onStartCapture: async () => {}, onStopCapture: async () => [{ frameIndex: 0 }], onProcessSegment: async () => ({ frames: [{ frameIndex: 0 }], durationMs: 100, diagnostics: [] }),
    onAutoSave: async () => { saves += 1; count += 1; }, onDeleteLast: async () => ({ deleted: false, count }), onSelectClass: async () => {}, onCreateClass: async () => {}, onUpdateClass: async () => {},
    getClasses: () => [active], getActiveClass: () => active, getSampleCount: () => count, videoControls,
  });
  await documentRef.getElementById('camera-toggle').emit('click');
  assert.equal(starts, 1); assert.equal(documentRef.getElementById('camera-toggle').textContent, 'Detener cámara');
  await documentRef.getElementById('capture-toggle').emit('click');
  assert.equal(documentRef.getElementById('capture-toggle').textContent, 'Terminar captura');
  assert.equal(documentRef.getElementById('sample-summary').textContent, 'Capturando…');
  await documentRef.getElementById('capture-toggle').emit('click');
  assert.equal(saves, 1); assert.equal(count, 1); assert.equal(documentRef.getElementById('status').textContent, 'Muestra guardada en el dataset.');
  assert.match(documentRef.getElementById('sample-summary').textContent, /^Muestra guardada/);
  await documentRef.getElementById('camera-toggle').emit('click'); assert.equal(stops, 1);
  await documentRef.getElementById('mode-video').emit('click');
  assert.equal(documentRef.getElementById('camera-controls').hidden, true); assert.equal(documentRef.getElementById('video-controls').hidden, false);
  await documentRef.getElementById('video-file').emit('change', { target: { files: [{ name: 'ejemplo.mp4' }] } }); videoControls.segment = { startMs: 0, endMs: 100 };
  assert.equal(documentRef.getElementById('video-file-name').textContent, 'ejemplo.mp4');
  await documentRef.getElementById('process-segment').emit('click');
  assert.equal(saves, 2); assert.equal(count, 2); assert.equal(documentRef.getElementById('status').textContent, 'Muestra guardada en el dataset.');
  ui.onAutoSave = async () => { throw new Error('fallo de escritura visible'); };
  await documentRef.getElementById('process-segment').emit('click');
  assert.equal(documentRef.getElementById('status').textContent, 'fallo de escritura visible');
});

test('segmentado habilita acciones solo al completar límites válidos y muestra sus marcas', async () => {
  const { ui, documentRef, videoControls } = createUiHarness();
  await documentRef.getElementById('mode-video').emit('click'); await documentRef.getElementById('video-file').emit('change', { target: { files: [{ name: 'segmento.mp4' }] } });
  assert.equal(ui.state.segmentState, SEGMENT_UI_STATE.EMPTY); assert.equal(documentRef.getElementById('process-segment').disabled, true); assert.equal(documentRef.getElementById('mark-end').disabled, true);
  videoControls.currentMs = 2350; await documentRef.getElementById('mark-start').emit('click');
  assert.equal(ui.state.segmentState, SEGMENT_UI_STATE.STARTED); assert.equal(documentRef.getElementById('mark-start').textContent, '✓ Inicio'); assert.equal(documentRef.getElementById('segment-start').textContent, '00:02.350');
  assert.equal(documentRef.getElementById('mark-end').disabled, false); assert.equal(documentRef.getElementById('process-segment').disabled, true);
  videoControls.currentMs = 2000; await documentRef.getElementById('mark-end').emit('click');
  assert.equal(documentRef.getElementById('mark-end').textContent, 'Fin inválido'); assert.equal(documentRef.getElementById('process-segment').disabled, true); assert.match(documentRef.getElementById('segment-feedback').textContent, /posterior/);
  videoControls.currentMs = 5820; await documentRef.getElementById('mark-end').emit('click');
  assert.equal(ui.state.segmentState, SEGMENT_UI_STATE.READY); assert.equal(documentRef.getElementById('mark-end').textContent, '✓ Fin'); assert.equal(documentRef.getElementById('segment-end').textContent, '00:05.820'); assert.equal(documentRef.getElementById('process-segment').disabled, false);
});

test('procesamiento bloquea controles y conserva éxito con advertencias', async () => {
  let release; const gate = new Promise((resolve) => { release = resolve; }); const { ui, documentRef, videoControls } = createUiHarness();
  await documentRef.getElementById('mode-video').emit('click'); await documentRef.getElementById('video-file').emit('change', { target: { files: [{ name: 'salto.mp4' }] } });
  videoControls.currentMs = 1000; await documentRef.getElementById('mark-start').emit('click'); videoControls.currentMs = 3000; await documentRef.getElementById('mark-end').emit('click');
  ui.onProcessSegment = async () => { await gate; return { frames: [{}], diagnostics: [{ code: 'frames_omitidos', omittedFrames: 1 }] }; };
  const processing = documentRef.getElementById('process-segment').emit('click'); await Promise.resolve();
  assert.equal(ui.state.segmentState, SEGMENT_UI_STATE.PROCESSING); ['mark-start', 'mark-end', 'process-segment'].forEach((id) => assert.equal(documentRef.getElementById(id).disabled, true, id)); assert.match(documentRef.getElementById('segment-feedback').textContent, /Procesando/);
  release(); await processing;
  assert.equal(ui.state.segmentState, SEGMENT_UI_STATE.PROCESSED); assert.equal(documentRef.getElementById('process-segment').textContent, '✓ Procesado'); assert.equal(documentRef.getElementById('process-segment').disabled, true);
  assert.match(documentRef.getElementById('segment-feedback').textContent, /✓ Segmento procesado/); assert.match(documentRef.getElementById('segment-feedback').textContent, /frames_omitidos \(1\)/); assert.equal(documentRef.getElementById('segment-feedback').classList.contains('segment-warning'), true);
  await documentRef.getElementById('video-file').emit('change', { target: { files: [{ name: 'nuevo.mp4' }] } });
  assert.equal(ui.state.segmentState, SEGMENT_UI_STATE.EMPTY); assert.equal(ui.state.activeClassId, 'u001'); assert.equal(documentRef.getElementById('video-file-name').textContent, 'nuevo.mp4');
  assert.equal(documentRef.getElementById('segment-start').textContent, '00:00.000'); assert.equal(documentRef.getElementById('segment-end').textContent, '00:00.000'); assert.equal(documentRef.getElementById('process-segment').disabled, true);
  assert.equal(documentRef.getElementById('segment-feedback').textContent, 'Sin segmento'); assert.equal(documentRef.getElementById('segment-feedback').classList.contains('segment-warning'), false);
});

test('error permite reintentar y nuevo inicio o archivo limpian el segmento anterior', async () => {
  const { ui, documentRef, videoControls } = createUiHarness();
  await documentRef.getElementById('mode-video').emit('click'); await documentRef.getElementById('video-file').emit('change', { target: { files: [{ name: 'primero.mp4' }] } });
  videoControls.currentMs = 1000; await documentRef.getElementById('mark-start').emit('click'); videoControls.currentMs = 2000; await documentRef.getElementById('mark-end').emit('click');
  ui.onProcessSegment = async () => { throw new Error('fallo real de procesamiento'); }; await documentRef.getElementById('process-segment').emit('click');
  assert.equal(ui.state.segmentState, SEGMENT_UI_STATE.READY); assert.doesNotMatch(documentRef.getElementById('process-segment').textContent, /Procesado/); assert.equal(documentRef.getElementById('process-segment').disabled, false); assert.equal(documentRef.getElementById('segment-feedback').textContent, 'fallo real de procesamiento');
  ui.onProcessSegment = async () => ({ frames: [{}], diagnostics: [] }); await documentRef.getElementById('process-segment').emit('click'); assert.equal(ui.state.segmentState, SEGMENT_UI_STATE.PROCESSED);
  videoControls.currentMs = 4000; await documentRef.getElementById('mark-start').emit('click');
  assert.equal(ui.state.segmentState, SEGMENT_UI_STATE.STARTED); assert.equal(documentRef.getElementById('segment-end').textContent, '00:00.000'); assert.equal(documentRef.getElementById('process-segment').disabled, true); assert.doesNotMatch(documentRef.getElementById('segment-feedback').textContent, /procesado/i);
  videoControls.currentMs = 5000; await documentRef.getElementById('mark-end').emit('click'); await documentRef.getElementById('video-file').emit('change', { target: { files: [{ name: 'segundo.mp4' }] } });
  assert.equal(ui.state.segmentState, SEGMENT_UI_STATE.EMPTY); assert.equal(documentRef.getElementById('segment-start').textContent, '00:00.000'); assert.equal(documentRef.getElementById('segment-end').textContent, '00:00.000'); assert.equal(documentRef.getElementById('process-segment').disabled, true);
  await documentRef.getElementById('mode-camera').emit('click'); assert.equal(documentRef.getElementById('video-controls').hidden, true);
});

test('detener la fuente libera las pistas y desconecta el video', () => {
  let stopped = 0; const video = { pause() {}, load() {}, removeAttribute() {}, srcObject: {} }; const source = new VideoSource(video);
  source.stream = { getTracks: () => [{ stop: () => { stopped += 1; } }] }; source.stop();
  assert.equal(stopped, 1); assert.equal(source.stream, null); assert.equal(video.srcObject, null);
});

test('la UI ya no muestra selector de carpeta ni metadata heredada', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /data-folder|showDirectoryPicker|id="label"|id="participant"|id="notes"|id="save"/);
  assert.match(html, /id="dataset-status"/);
  assert.match(html, /id="landmark-overlay"/);
  assert.match(html, /id="camera-toggle"/); assert.match(html, /id="capture-toggle"/);
  assert.doesNotMatch(html, /id="camera"|id="capture"|id="stop"/);
  assert.ok(html.indexOf('id="delete-last"') > html.indexOf('class="class-panel"'));
  assert.doesNotMatch(html, /Muestras persistidas|id="class-count"/);
  assert.match(html, /class="capture-heading"/); assert.match(html, /class="catalog-heading"/); assert.match(html, /class="active-class-row"/); assert.match(html, /class="class-fields"/);
  assert.equal((html.match(/id="sample-summary"/g) ?? []).length, 1); assert.match(html, /id="camera-controls"[\s\S]+id="sample-summary"/);
  const controls = ['back-quarter', 'back-frame', 'play-pause', 'forward-quarter', 'forward-frame'].map((id) => html.indexOf(`id="${id}"`));
  assert.deepEqual(controls, [...controls].sort((left, right) => left - right));
});

test('layout compacto agrupa dataset, acciones de clase y borrado sin filas redundantes', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const catalogHeader = html.match(/<div class="catalog-heading">([\s\S]*?)<\/div>\s*<\/div>/)?.[1] ?? '';
  assert.match(catalogHeader, /id="dataset-status"/); assert.match(catalogHeader, /id="new-class"/); assert.match(catalogHeader, /id="edit-class"/);
  const activeRow = html.match(/<div class="active-class-row">([\s\S]*?)<\/div>/)?.[1] ?? '';
  assert.match(activeRow, /id="class-selector"/); assert.match(activeRow, /id="delete-last"/);
  assert.match(html, /aspect-ratio:\s*16\s*\/\s*9/); assert.doesNotMatch(html, /class-delete-row|class-toolbar/);
  assert.match(html, /preview-stage:not\(\.camera-mirrored\)[^}]+max-height:\s*calc\(100vh - 19rem\)/);
  assert.match(html, /<legend>Posibles significados<\/legend><div class="meanings-box">/);
});

test('selector de video vive solo en la cabecera y sigue el modo activo', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal((html.match(/id="video-file"/g) ?? []).length, 1); assert.doesNotMatch(html, />Importar video</);
  assert.match(html, /capture-heading[\s\S]+id="video-file-control"[\s\S]+id="video-file-name"/);
  assert.match(html, /grid-template-columns:\s*minmax\(0, 2fr\)\s+minmax\(300px, 1fr\)/);
  assert.match(html, /grid-template-columns:\s*1fr 1fr 1\.2fr 1fr 1fr/);
  const harness = createUiHarness(); const picker = harness.documentRef.getElementById('video-file-control');
  assert.equal(picker.hidden, true); await harness.documentRef.getElementById('mode-video').emit('click'); assert.equal(picker.hidden, false);
  await harness.documentRef.getElementById('mode-camera').emit('click'); assert.equal(picker.hidden, true);
});

test('selector muestra un solo contador y la duración total se presenta compacta', async () => {
  const harness = createUiHarness(); const selector = harness.documentRef.getElementById('class-selector');
  assert.equal(selector.children[0].textContent, 'DOS — 0 muestras'); assert.equal(selector.children[1].textContent, 'UNO — 1 muestra');
  harness.documentRef.getElementById('preview').duration = 125; await harness.documentRef.getElementById('preview').emit('loadedmetadata');
  assert.equal(harness.documentRef.getElementById('video-duration').textContent, '02:05');
});

test('vista espejo es solo CSS de cámara y se retira en modo video', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /camera-mirrored[^}]+transform:\s*scaleX\(-1\)/s);
  const harness = createUiHarness(); assert.equal(harness.documentRef.getElementById('preview-stage').classList.contains('camera-mirrored'), true);
  await harness.documentRef.getElementById('mode-video').emit('click');
  assert.equal(harness.documentRef.getElementById('preview-stage').classList.contains('camera-mirrored'), false);
});

test('selector ordena normales por glosa sin alterar IDs ni catálogo', () => {
  const classes = [{ classId: 'u017', glosa: 'CASA', tipo: 'normal' }, { classId: 'ruido_background', glosa: 'RUIDO_BACKGROUND', tipo: 'ruido_background' }, { classId: 'u002', glosa: 'ADIÓS', tipo: 'normal' }, { classId: 'u043', glosa: 'ABUELA', tipo: 'normal' }];
  const original = structuredClone(classes); const visible = sortClassesForDisplay(classes);
  assert.deepEqual(visible.map((item) => item.glosa), ['ABUELA', 'ADIÓS', 'CASA', 'RUIDO_BACKGROUND']);
  assert.deepEqual(visible.map((item) => item.classId), ['u043', 'u002', 'u017', 'ruido_background']); assert.deepEqual(classes, original);
});

test('DataStore permanece aislado y no sustituye el servicio de dataset', async () => {
  const store = new DataStore();
  await assert.rejects(() => store.save({ frames: [] }), /carpeta persistente/);
});

test('el catálogo genera ID humano desde glosa y solo guarda preferencia UI', async () => {
  const storage = new MemoryStorage(); const catalog = new ClassCatalog({ storage, validator: validClassContract }); await catalog.initialize();
  catalog.hydrate([{ classId: 'u001', glosa: 'UNO', significados: ['uno'], estado: 'activa', tipo: 'normal' }, { classId: 'u005', glosa: 'CINCO', significados: ['cinco'], estado: 'activa', tipo: 'normal' }]);
  assert.equal((await catalog.create({ glosa: 'Buenos días', significados: ['saludo'] })).classId, 'BUENOS_DIAS');
  assert.equal(storage.getItem('aulasenas.configurador.classes.v1'), null);
});

test('catálogo ignora selección recordada y no activa automáticamente la primera clase', async () => {
  const storage = new MemoryStorage(); storage.setItem('aulasenas.configurador.active-class.v1', 'u005');
  const catalog = new ClassCatalog({ storage, validator: validClassContract }); await catalog.initialize();
  catalog.hydrate([{ classId: 'u001', glosa: 'UNO', significados: ['uno'], estado: 'activa', tipo: 'normal' }, { classId: 'u005', glosa: 'CINCO', significados: ['cinco'], estado: 'activa', tipo: 'normal' }]);
  assert.equal(catalog.getActive(), null); catalog.select('u005'); assert.equal(catalog.getActive().classId, 'u005');
  catalog.hydrate(catalog.list()); assert.equal(catalog.getActive().classId, 'u005');
});

test('rollback de creación conserva el estado sin clase activa', async () => {
  const catalog = new ClassCatalog({ validator: validClassContract }); await catalog.initialize();
  const original = [{ classId: 'u001', glosa: 'UNO', significados: ['uno'], estado: 'activa', tipo: 'normal' }]; catalog.hydrate(original);
  await catalog.create({ glosa: 'DOS', significados: ['dos'] }); assert.equal(catalog.getActive().classId, 'DOS');
  catalog.restore(original); assert.equal(catalog.getActive(), null); assert.deepEqual(catalog.list(), original);
});

test('ruido_background conserva ID reservado y ningún significado', async () => {
  const catalog = new ClassCatalog({ validator: validClassContract }); await catalog.initialize();
  assert.deepEqual(await catalog.create({ glosa: 'RUIDO_BACKGROUND', tipo: 'ruido_background' }), { classId: 'ruido_background', glosa: 'ruido_background', significados: [], estado: 'activa', tipo: 'ruido_background' });
});

test('main comparte una sola instancia del extractor con preview, captura y video', async () => {
  const source = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.equal((source.match(/new LiteFrameExtractor/g) ?? []).length, 1);
  assert.equal((source.match(/extractor\.extract\(currentVideo, context\)/g) ?? []).length, 3);
});

test('main guarda con el classId fijado al iniciar y no con la selección final', async () => {
  const source = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(source, /pendingCapture = \{ classId: activeClass\.classId/);
  assert.match(source, /const fixedClassId = pendingCapture\.classId/);
  assert.match(source, /workflow\.save\(\{ classId: fixedClassId/);
});

test('controles de video mantienen navegación administrativa aproximada', () => {
  const video = { currentTime: 1, duration: 10, paused: true, play: async function () { this.paused = false; }, pause: function () { this.paused = true; } };
  const controls = new VideoControls(video); assert.equal(controls.seekBy(250), 1250); assert.equal(controls.seekFrame(-1), 1217);
  assert.equal(controls.markStart(), 1217); video.currentTime = 2; assert.equal(controls.markEnd(), 2000); assert.deepEqual(controls.segment, { startMs: 1217, endMs: 2000 });
});

test('marcar fin registra el tiempo antes de pausar y no mueve el playhead', () => {
  let pauses = 0; const video = { currentTime: 3.456, paused: false, pause() { pauses += 1; this.paused = true; } };
  const controls = new VideoControls(video); const endMs = controls.markEnd();
  assert.equal(endMs, 3456); assert.equal(controls.endMs, 3456); assert.equal(pauses, 1); assert.equal(video.paused, true); assert.equal(video.currentTime, 3.456);
});
