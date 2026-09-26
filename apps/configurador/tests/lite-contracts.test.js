/** Contratos compartidos FASE II: rechazan formatos legacy y aceptan solo Lite F139. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatasetContractValidator } from '../server/DatasetService.js';
import { LITE_FEATURE_CONTRACT, LiteTemporalEncoder } from '../src/vision/LiteVectorizer139.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const contracts = new DatasetContractValidator({ contractsRoot: resolve(projectRoot, 'contracts') });
const point = (x = .5, y = .5, z = 0) => ({ x, y, z });
const hand = () => Array.from({ length: 21 }, (_, index) => point(index / 100, .4, 0));
const raw = (left = hand(), right = null) => ({ hands: { left, right }, pose: { nose: point(.5, .2), leftShoulder: point(.3, .5), rightShoulder: point(.7, .5) } });
function sample(classId = 'HOLA', tipo = 'camera') {
  const frame = new LiteTemporalEncoder().encode({ frameToken: 'f0', sourceTimestampMs: 0, raw: raw() });
  return { featureContract: LITE_FEATURE_CONTRACT, classId, fuente: tipo === 'video' ? { tipo, video: { nombreArchivo: 'x.mp4', inicioSegmentoMs: 1, finSegmentoMs: 2, duracionSegmentoMs: 1 } } : { tipo }, tiempo: { inicioMs: 0, finMs: 0, duracionMs: 0, cantidadFrames: 1 }, frames: [frame], capturedAt: '2026-09-22T00:00:00.000Z' };
}
async function valid(value, schema) { await contracts.assert(value, schema); }
async function invalid(value, schema) { await assert.rejects(() => contracts.assert(value, schema), /Contrato/); }

test('contrato Lite acepta muestra F139, cámara y video', async () => { await valid(sample(), 'captured-sample'); await valid(sample('HOLA', 'video'), 'captured-sample'); });
test('marcador Lite es obligatorio y exacto', async () => { const missing = sample(); delete missing.featureContract; await invalid(missing, 'captured-sample'); const wrong = sample(); wrong.featureContract = 'F319'; await invalid(wrong, 'captured-sample'); });
test('F139 exige exactamente 139 valores finitos', async () => { const short = sample(); short.frames[0].vector139.pop(); await invalid(short, 'frame'); const long = sample(); long.frames[0].vector139.push(0); await invalid(long, 'frame'); const nan = sample(); nan.frames[0].vector139[0] = Number.NaN; await invalid(nan, 'frame'); const infinity = sample(); infinity.frames[0].vector139[0] = Infinity; await invalid(infinity, 'frame'); });
test('F139 restringe presence flags y delta', async () => { const flags = sample(); flags.frames[0].vector139[135] = 2; await invalid(flags, 'frame'); const delta = sample(); delta.frames[0].vector139[138] = 2; await invalid(delta, 'frame'); });
test('raw exige dos manos completas o null y pose mínima', async () => { await valid(raw(hand(), hand()), 'lite-raw'); await valid(raw(null, null), 'lite-raw'); const partial = raw(hand().slice(0, 20)); await invalid(partial, 'lite-raw'); const nose = raw(); delete nose.pose.nose; await invalid(nose, 'lite-raw'); const shoulders = raw(); delete shoulders.pose.leftShoulder; await invalid(shoulders, 'lite-raw'); });
test('classId humano es válido; uNNN y ruido inválido se rechazan', async () => { await valid({ classId: 'BUENOS_DIAS', glosa: 'Buenos días', estado: 'activa', tipo: 'normal' }, 'sign-class'); await invalid({ classId: 'u001', glosa: 'Hola', estado: 'activa', tipo: 'normal' }, 'sign-class'); await valid({ classId: 'ruido_background', glosa: 'ruido_background', estado: 'activa', tipo: 'ruido_background', significados: [] }, 'sign-class'); });
test('fuentes desconocidas, F319, F308 y propiedades Holistic no son Lite', async () => { const unknown = sample(); unknown.fuente = { tipo: 'stream' }; await invalid(unknown, 'captured-sample'); const f319 = sample(); f319.frames[0].vector319 = Array(319).fill(0); await invalid(f319, 'frame'); const f308 = sample(); f308.frames[0].vector308 = Array(308).fill(0); await invalid(f308, 'frame'); const holistic = sample(); holistic.frames[0].raw.face = []; await invalid(holistic, 'frame'); });
test('manifest Lite exige marcador y classId humano', async () => { const manifest = { featureContract: LITE_FEATURE_CONTRACT, datasetId: 'default', version: 1, stage: 'validated', createdAt: '2026-09-22T00:00:00.000Z', updatedAt: '2026-09-22T00:00:00.000Z', clases: [{ classId: 'HOLA', archivo: 'clases/HOLA.json' }] }; await valid(manifest, 'dataset-manifest'); const legacyId = structuredClone(manifest); legacyId.clases[0] = { classId: 'u001', archivo: 'clases/u001.json' }; await invalid(legacyId, 'dataset-manifest'); delete manifest.featureContract; await invalid(manifest, 'dataset-manifest'); });
