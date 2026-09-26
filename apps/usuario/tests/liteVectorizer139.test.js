import assert from 'node:assert/strict';
import test from 'node:test';
import { LiteVectorizer139 } from '../src/vision/LiteVectorizer139.js';

const point = (x,y,z=0) => ({ x,y,z });
const hand = (seed) => Array.from({ length: 21 }, (_, index) => point(seed + index / 100, .4, 0));
function raw({ left = null, right = null, pose = true } = {}) { return { hands: { left, right }, pose: pose ? { nose: point(.5,.2), leftShoulder: point(.4,.5), rightShoulder: point(.6,.5) } : {} }; }
function extraction(timestamp, options = {}) { return { frameToken: timestamp, sourceTimestampMs: timestamp, raw: raw(options) }; }

test('F139 tiene layout contractual, pose y ambas presencias', () => { const result = new LiteVectorizer139().vectorize(extraction(10, { left: hand(.1), right: hand(.2) })); assert.equal(result.valid, true); assert.equal(result.vector139.length, 139); assert.equal(result.vector139[135], 1); assert.equal(result.vector139[136], 1); assert.equal(result.vector139[137], 1); assert.equal(result.vector139[138], 0); });
test('manos ausentes ocupan sus 63 ceros y flags 0', () => { const result = new LiteVectorizer139().vectorize(extraction(10)); assert.equal(result.valid, true); assert.ok(result.vector139.slice(0,126).every((value) => value === 0)); assert.equal(result.vector139[135], 0); assert.equal(result.vector139[136], 0); });
test('pose inválida, NaN o escala degenerada descartan sin F139', () => { const vectorizer = new LiteVectorizer139(); assert.equal(vectorizer.vectorize(extraction(1,{pose:false})).valid,false); assert.equal(vectorizer.vectorize({ sourceTimestampMs:2, raw:{hands:{},pose:{nose:point(.5,.2),leftShoulder:point(.5,.5),rightShoulder:point(.5,.5)}}}).reason,'escala_degenerada'); assert.equal(vectorizer.vectorize({ sourceTimestampMs:3, raw:{hands:{},pose:{nose:point(NaN,.2),leftShoulder:point(.4,.5),rightShoulder:point(.6,.5)}}}).valid,false); });
test('delta contractual inicia en cero, se normaliza y clippea', () => { const vectorizer = new LiteVectorizer139(); assert.equal(vectorizer.vectorize(extraction(100)).deltaMsNorm,0); assert.ok(Math.abs(vectorizer.vectorize(extraction(133)).deltaMsNorm-.033)<1e-6); assert.equal(vectorizer.vectorize(extraction(1633)).deltaMsNorm,1); });
test('timestamps duplicados o regresivos y frame inválido no avanzan reloj válido', () => { const vectorizer = new LiteVectorizer139(); vectorizer.vectorize(extraction(100)); assert.equal(vectorizer.vectorize(extraction(100)).valid,false); assert.equal(vectorizer.vectorize(extraction(99)).valid,false); assert.equal(vectorizer.vectorize({sourceTimestampMs:200,raw:raw({pose:false})}).valid,false); assert.equal(vectorizer.vectorize(extraction(300)).deltaMs,200); });
