import assert from 'node:assert/strict';
import test from 'node:test';
import { LiteFifo20 } from '../src/temporal/LiteFifo20.js';
const frame = (value) => new Float32Array(139).fill(value);
test('FIFO T20 inicia vacío y no inventa padding', () => { const fifo = new LiteFifo20(); assert.equal(fifo.length,0); assert.deepEqual(fifo.snapshot(),[]); });
test('FIFO conserva exactamente las últimas 20 observaciones', () => { const fifo = new LiteFifo20(); for(let i=0;i<21;i+=1) fifo.append(frame(i)); const values=fifo.snapshot(); assert.equal(fifo.length,20); assert.equal(fifo.ready,true); assert.equal(values[0][0],1); assert.equal(values.at(-1)[0],20); });
test('FIFO rechaza capacidad distinta, dimensiones inválidas y permite reset', () => { assert.throws(()=>new LiteFifo20(128)); const fifo=new LiteFifo20(); assert.throws(()=>fifo.append(new Float32Array(138))); fifo.append(frame(1)); fifo.reset(); assert.equal(fifo.length,0); });
