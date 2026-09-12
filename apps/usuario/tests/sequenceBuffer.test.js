import test from 'node:test';
import assert from 'node:assert/strict';
import { SequenceBuffer } from '../src/reconocimiento/sequenceBuffer.js';
test('mantiene una ventana deslizante de 32 frames de 308 características', () => { const buffer = new SequenceBuffer(); for (let i = 0; i < 32; i++) assert.equal(buffer.push(Array(308).fill(i)), i === 31); assert.equal(buffer.toArray().length, 32); buffer.push(Array(308).fill(99)); assert.equal(buffer.toArray()[0][0], 1); });
test('rechaza dimensiones de frame incorrectas', () => assert.throws(() => new SequenceBuffer().push(Array(307)), /308/));
