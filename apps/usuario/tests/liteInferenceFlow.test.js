import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { UserLiteUI } from '../src/ui/UserLiteUI.js';

/**
 * Ejecuta el coordinador real de main.js con colaboradores controlados, sin arrancar DOM,
 * cámara ni MediaPipe. Así la prueba cubre la exclusión mutua sin duplicar su lógica.
 */
async function createHarness(predictImpl) {
  const source = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  const start = source.indexOf('const SEGMENT_STATES =');
  const end = source.indexOf('const camera =', start);
  assert.notEqual(start, -1, 'main.js debe declarar la máquina de estados.');
  assert.notEqual(end, -1, 'No se pudo aislar predictCurrentWindow().');
  const coordinator = source.slice(start, end);
  const state = { calls: 0, snapshots: 0, predictions: [], recognizedTexts: [], uiErrors: [], consoleErrors: [] };
  const context = vm.createContext({
    modelRuntime: { ready: true, async predict(snapshot) { state.calls += 1; return predictImpl(snapshot, state.calls); } },
    fifo: { ready: true, snapshot() { state.snapshots += 1; return [`snapshot-${state.snapshots}`]; } },
    ui: { setPrediction(value) { state.predictions.push(value); }, setRecognizedText(value) { state.recognizedTexts.push(value); }, setModelState(status, error) { state.uiErrors.push({ status, error }); } },
    console: { error(...args) { state.consoleErrors.push(args); } },
  });
  vm.runInContext(`${coordinator}\nglobalThis.invokePrediction = predictCurrentWindow;\nglobalThis.readSegment = getSegmentStateSnapshot;`, context);
  return { invoke: context.invokePrediction, readSegment: () => JSON.parse(JSON.stringify(context.readSegment())), source, coordinator, state };
}

const sign = (classId) => ({ classId, background: false });
const background = () => ({ classId: 'ruido_background', background: true });
async function runSequence(sequence) { const harness = await createHarness((_snapshot, call) => sequence[call - 1]); for (const _prediction of sequence) await harness.invoke(); return harness; }

test('una inferencia activa bloquea concurrencia, publica y permite una posterior', async () => {
  let resolveFirst;
  const firstResult = { classId: 'BIEN', confidence: 0.9, background: false };
  const secondResult = { classId: 'GRACIAS', confidence: 0.8, background: false };
  const pending = new Promise((resolve) => { resolveFirst = resolve; });
  const harness = await createHarness((_snapshot, call) => call === 1 ? pending : secondResult);
  const first = harness.invoke();
  await harness.invoke();
  assert.equal(harness.state.calls, 1);
  assert.equal(harness.state.snapshots, 1);
  resolveFirst(firstResult);
  await first;
  assert.deepEqual(harness.state.predictions, [firstResult]);
  await harness.invoke();
  assert.equal(harness.state.calls, 2);
  assert.equal(harness.state.snapshots, 2);
  assert.deepEqual(harness.state.predictions, [firstResult, secondResult]);
});

test('un error libera inferenceInFlight y no detiene cámara ni vacía FIFO', async () => {
  const failure = new Error('fallo de inferencia controlado');
  const recovered = { classId: 'ruido_background', confidence: 0.7, background: true };
  const harness = await createHarness((_snapshot, call) => { if (call === 1) throw failure; return recovered; });
  await harness.invoke();
  assert.equal(harness.state.uiErrors[0].status, 'error');
  assert.equal(harness.state.uiErrors[0].error, failure);
  assert.equal(harness.state.consoleErrors[0][1], failure);
  await harness.invoke();
  assert.equal(harness.state.calls, 2);
  assert.deepEqual(harness.state.predictions, [recovered]);
  assert.doesNotMatch(harness.coordinator, /fifo\.reset|camera\.stop/);
  assert.doesNotMatch(harness.source, /predictionSerial/);
  assert.ok(harness.source.indexOf('fifo.append(result.vector139)') < harness.source.indexOf('void predictCurrentWindow()'));
});

test('acepta una candidata estable únicamente tras dos background', async () => {
  const harness = await runSequence([background(), sign('GRACIAS'), sign('GRACIAS'), background(), background()]);
  assert.deepEqual(harness.state.recognizedTexts, ['GRACIAS']);
  assert.equal(harness.readSegment().segmentState, 'BACKGROUND');
});

test('descarta el prefijo compartido y acepta únicamente la candidata terminal estable', async () => {
  const harness = await runSequence([sign('LO_SIENTO'), sign('LO_SIENTO'), sign('MI_NOMBRE'), sign('MI_NOMBRE'), sign('MI_NOMBRE'), background(), background()]);
  assert.deepEqual(harness.state.recognizedTexts, ['MI_NOMBRE']);
});

test('no acepta una candidata terminal sin estabilidad mínima', async () => {
  const harness = await runSequence([sign('LO_SIENTO'), sign('MI_NOMBRE'), background(), background()]);
  assert.deepEqual(harness.state.recognizedTexts, []);
  assert.equal(harness.readSegment().segmentState, 'BACKGROUND');
});

test('un background transitorio seguido por la misma clase no cierra el segmento', async () => {
  const sequence = [sign('GRACIAS'), sign('GRACIAS'), background(), sign('GRACIAS')];
  const harness = await runSequence(sequence);
  assert.deepEqual(harness.state.recognizedTexts, []);
  assert.deepEqual(harness.readSegment(), { segmentState: 'SIGN_ACTIVE', candidateClassId: 'GRACIAS', candidateRunLength: 3, backgroundRunLength: 0, minCandidateRun: 2, backgroundEndRun: 2 });
});

test('un background transitorio seguido por otra clase actualiza la candidata', async () => {
  const harness = await runSequence([sign('LO_SIENTO'), sign('LO_SIENTO'), background(), sign('MI_NOMBRE'), sign('MI_NOMBRE'), background(), background()]);
  assert.deepEqual(harness.state.recognizedTexts, ['MI_NOMBRE']);
});

test('la misma seña puede aceptarse otra vez después de un nuevo segmento', async () => {
  const harness = await runSequence([sign('GRACIAS'), sign('GRACIAS'), background(), background(), sign('GRACIAS'), sign('GRACIAS'), background(), background()]);
  assert.deepEqual(harness.state.recognizedTexts, ['GRACIAS', 'GRACIAS GRACIAS']);
});

test('background continuo nunca modifica el texto reconocido', async () => {
  const harness = await runSequence([background(), background(), background(), background()]);
  assert.deepEqual(harness.state.recognizedTexts, []);
  assert.equal(harness.state.predictions.length, 4);
});

test('SIGN_ACTIVE conserva la hipótesis solo en diagnóstico sin escribir texto', async () => {
  const harness = await runSequence([sign('LO_SIENTO'), sign('LO_SIENTO'), sign('MI_NOMBRE')]);
  assert.deepEqual(harness.state.recognizedTexts, []);
  assert.equal(harness.state.predictions.at(-1).classId, 'MI_NOMBRE');
  assert.deepEqual(harness.readSegment(), { segmentState: 'SIGN_ACTIVE', candidateClassId: 'MI_NOMBRE', candidateRunLength: 1, backgroundRunLength: 0, minCandidateRun: 2, backgroundEndRun: 2 });
});

test('UserLiteUI mantiene separados diagnóstico, última predicción y texto reconocido', () => {
  const elements = new Map();
  const documentRef = { querySelector(selector) { if (!elements.has(selector)) elements.set(selector, { textContent: '', dataset: {}, hidden: false, classList: { toggle() {} }, addEventListener() {} }); return elements.get(selector); } };
  const ui = new UserLiteUI(documentRef);
  const prediction = { classId: 'GRACIAS', index: 7, confidence: 0.999, background: false };
  ui.setPrediction(prediction);
  assert.equal(ui.lastPrediction, prediction);
  assert.match(elements.get('#prediction-status').textContent, /^GRACIAS · índice 7/);
  assert.equal(elements.get('#transcript').textContent, '');
  ui.setRecognizedText('GRACIAS');
  assert.equal(elements.get('#transcript').textContent, 'GRACIAS');
  assert.equal(elements.get('#transcript').dataset.empty, 'false');
  ui.setRecognizedText('');
  assert.equal(elements.get('#transcript').textContent, '—');
  assert.equal(elements.get('#transcript').dataset.empty, 'true');
});

test('API diagnóstica conserva getLastPrediction y main no depende del runtime legacy', async () => {
  const source = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(source, /getLastPrediction:\s*\(\)\s*=>\s*ui\.lastPrediction\s*\?\?\s*null/);
  assert.match(source, /getSegmentState:\s*getSegmentStateSnapshot/);
  assert.doesNotMatch(source, /traduccion\/|ui\/interface|reconocimiento\//);
});
