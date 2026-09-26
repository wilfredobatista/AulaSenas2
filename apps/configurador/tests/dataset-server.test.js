/** Integración del API loopback y persistencia transitoria Lite de FASE I. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createConfiguratorServer } from '../server/localServer.js';
import { ValidatedDatasetStore } from '../src/almacenamiento/ValidatedDatasetStore.js';
import { bootstrapDataset } from '../src/almacenamiento/DatasetBootstrap.js';
import { LITE_FEATURE_CONTRACT, LiteTemporalEncoder } from '../src/vision/LiteVectorizer139.js';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = resolve(appRoot, '..', '..');
const contractsRoot = resolve(projectRoot, 'contracts');

async function withServer(run) {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'aulasenas-configurador-')); const dataRoot = join(temporaryRoot, 'data');
  const server = createConfiguratorServer({ projectRoot, appRoot, contractsRoot, dataRoot });
  await new Promise((ok, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', ok); });
  try { await run({ baseUrl: `http://127.0.0.1:${server.address().port}`, dataRoot }); }
  finally { await new Promise((ok) => server.close(ok)); await rm(temporaryRoot, { recursive: true, force: true }); }
}
async function request(baseUrl, path, { method = 'GET', body } = {}) { const response = await fetch(`${baseUrl}${path}`, { method, headers: body ? { 'content-type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined }); return { response, payload: await response.json() }; }
function raw({ left = null, right = null } = {}) { return { hands: { left, right }, pose: { nose: { x: .5, y: .2, z: 0, visibility: .9 }, leftShoulder: { x: .3, y: .5, z: 0, visibility: .8 }, rightShoulder: { x: .7, y: .5, z: 0, visibility: .85 } } }; }
function hand(offset = 0) { return Array.from({ length: 21 }, (_, index) => ({ x: offset + index / 100, y: .4 + index / 200, z: index / 300 })); }
function sampleFor(classId, tipo = 'camera') {
  const frame = new LiteTemporalEncoder().encode({ frameToken: 1, sourceTimestampMs: 1000, raw: raw({ left: hand(.1) }) });
  const durationMs = tipo === 'video' ? 100 : 0; const fuente = tipo === 'video' ? { tipo, video: { nombreArchivo: 'segmento.mp4', inicioSegmentoMs: 200, finSegmentoMs: 300, duracionSegmentoMs: 100 } } : { tipo };
  return { featureContract: LITE_FEATURE_CONTRACT, classId, fuente, tiempo: { inicioMs: 0, finMs: durationMs, duracionMs: durationMs, cantidadFrames: 1 }, frames: [frame], capturedAt: '2026-09-18T00:00:00.000Z' };
}

test('bootstrap acepta dataset vacío como listo', async () => {
  const response = { catalog: { classes: [], counts: {} }, manifest: null }; const statuses = [];
  const result = await bootstrapDataset({ datasetStore: new ValidatedDatasetStore({ fetchImpl: async () => ({ ok: true, json: async () => response }) }), classCatalog: { hydrate() {} }, ui: { setDatasetStatus: (...args) => statuses.push(args) } });
  assert.deepEqual(result, { available: true, counts: {}, errorMessage: null }); assert.deepEqual(statuses, [['Dataset listo']]);
});
test('bootstrap distingue API no disponible', async () => { const statuses = []; const result = await bootstrapDataset({ datasetStore: { initialize: async () => { throw new Error('offline'); } }, classCatalog: { hydrate() {} }, ui: { setDatasetStatus: (...args) => statuses.push(args) } }); assert.equal(result.available, false); assert.deepEqual(statuses, [['offline', true]]); });
test('dataset vacío no crea manifest', async () => { await withServer(async ({ baseUrl, dataRoot }) => { const result = await request(baseUrl, '/api/dataset/initialize', { method: 'POST' }); assert.equal(result.response.status, 200); assert.equal(result.payload.manifest, null); await assert.rejects(() => readFile(join(dataRoot, 'validated', 'default', 'manifest.json'))); }); });
test('crea clase humana vacía con marcador Lite', async () => { await withServer(async ({ baseUrl, dataRoot }) => { const clase = { classId: 'BUENOS_DIAS', glosa: 'Buenos días', significados: ['saludo'], estado: 'activa', tipo: 'normal' }; const result = await request(baseUrl, '/api/dataset/classes', { method: 'POST', body: { classDefinition: clase } }); assert.equal(result.response.status, 201); assert.deepEqual(JSON.parse(await readFile(join(dataRoot, 'validated', 'default', 'clases', 'BUENOS_DIAS.json'))), { featureContract: LITE_FEATURE_CONTRACT, clase, muestras: [] }); }); });
test('autoguarda cámara y conserva raw más F139', async () => { await withServer(async ({ baseUrl, dataRoot }) => { const clase = { classId: 'HOLA', glosa: 'Hola', significados: ['hola'], estado: 'activa', tipo: 'normal' }; await request(baseUrl, '/api/dataset/classes', { method: 'POST', body: { classDefinition: clase } }); const result = await request(baseUrl, '/api/dataset/classes/HOLA/samples', { method: 'POST', body: { classDefinition: clase, sample: sampleFor('HOLA') } }); assert.equal(result.response.status, 201, JSON.stringify(result.payload)); const stored = JSON.parse(await readFile(join(dataRoot, 'validated', 'default', 'clases', 'HOLA.json'))); assert.equal(stored.muestras[0].frames[0].vector139.length, 139); assert.ok(stored.muestras[0].frames[0].raw); }); });
test('autoguarda video y reconstruye conteos', async () => { await withServer(async ({ baseUrl }) => { const clase = { classId: 'GRACIAS', glosa: 'Gracias', significados: ['gracias'], estado: 'activa', tipo: 'normal' }; await request(baseUrl, '/api/dataset/classes', { method: 'POST', body: { classDefinition: clase } }); await request(baseUrl, '/api/dataset/classes/GRACIAS/samples', { method: 'POST', body: { classDefinition: clase, sample: sampleFor('GRACIAS', 'video') } }); assert.deepEqual((await request(baseUrl, '/api/dataset')).payload.catalog.counts, { GRACIAS: 1 }); }); });
test('borrar última conserva clase Lite a cero', async () => { await withServer(async ({ baseUrl }) => { const clase = { classId: 'CASA', glosa: 'Casa', significados: ['casa'], estado: 'activa', tipo: 'normal' }; await request(baseUrl, '/api/dataset/classes', { method: 'POST', body: { classDefinition: clase } }); await request(baseUrl, '/api/dataset/classes/CASA/samples', { method: 'POST', body: { classDefinition: clase, sample: sampleFor('CASA') } }); const deleted = await request(baseUrl, '/api/dataset/classes/CASA/samples/latest', { method: 'DELETE' }); assert.equal(deleted.payload.count, 0); assert.equal((await request(baseUrl, '/api/dataset')).payload.catalog.classes[0].classId, 'CASA'); }); });
test('rechaza uNNN para clases nuevas', async () => { await withServer(async ({ baseUrl }) => { const result = await request(baseUrl, '/api/dataset/classes', { method: 'POST', body: { classDefinition: { classId: 'u001', glosa: 'Hola', significados: ['hola'], estado: 'activa', tipo: 'normal' } } }); assert.equal(result.response.status, 422); assert.equal(result.payload.error.code, 'LITE_CLASS_ID_INVALID'); }); });
test('legacy queda rechazado por el contrato Lite sin reescribirlo', async () => { await withServer(async ({ baseUrl, dataRoot }) => { const dataset = join(dataRoot, 'validated', 'default'); const classes = join(dataset, 'clases'); await mkdir(classes, { recursive: true }); const clase = { classId: 'LEGACY_UUID', glosa: 'Legacy', significados: ['legacy'], estado: 'activa', tipo: 'normal' }; const legacy = { clase, muestras: [] }; await writeFile(join(dataset, 'manifest.json'), JSON.stringify({ datasetId: 'default', version: 1, stage: 'validated', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', clases: [{ classId: 'LEGACY_UUID', archivo: 'clases/LEGACY_UUID.json' }] })); await writeFile(join(classes, 'LEGACY_UUID.json'), JSON.stringify(legacy)); assert.equal((await request(baseUrl, '/api/dataset')).response.status, 422); assert.deepEqual(JSON.parse(await readFile(join(classes, 'LEGACY_UUID.json'))), legacy); }); });
test('ruido_background usa el mismo documento Lite', async () => { await withServer(async ({ baseUrl }) => { const clase = { classId: 'ruido_background', glosa: 'ruido_background', significados: [], estado: 'activa', tipo: 'ruido_background' }; assert.equal((await request(baseUrl, '/api/dataset/classes', { method: 'POST', body: { classDefinition: clase } })).response.status, 201); assert.equal((await request(baseUrl, '/api/dataset/classes/ruido_background/samples', { method: 'POST', body: { classDefinition: clase, sample: sampleFor('ruido_background') } })).response.status, 201); }); });
