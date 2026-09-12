import test from 'node:test';
import assert from 'node:assert/strict';
import { createSampleLabel } from '../src/etiquetado/SampleLabel.js';
import { validateSample } from '../src/validacion/validateSample.js';
import { DataStore } from '../src/almacenamiento/DataStore.js';

test('crea etiquetas limpias y exige una seña', () => { assert.equal(createSampleLabel({ label: '  hola ' }).label, 'hola'); assert.throws(() => createSampleLabel()); });
test('valida una muestra sin inventar la forma de landmarks', () => { const sample = { metadata: { label: 'hola' }, frames: [{ timestampMs: 0, landmarks: { contrato: 'externo' } }] }; assert.deepEqual(validateSample(sample), { valid: true, errors: [] }); });
test('rechaza muestras sin frames', () => { assert.equal(validateSample({ metadata: { label: 'hola' }, frames: [] }).valid, false); });
test('guarda y lista muestras en el adaptador de prueba', async () => { const store = new DataStore(); await store.save({ metadata: { label: 'hola' }, frames: [] }); assert.equal((await store.list('raw')).length, 1); });
// Pruebas de invariantes de etiquetado, validación y persistencia aisladas del navegador.
