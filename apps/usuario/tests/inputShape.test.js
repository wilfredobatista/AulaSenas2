import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTemporalInput } from '../src/reconocimiento/inputShape.js';
test('valida entrada temporal [32, 308]', () => assert.equal(validateTemporalInput(Array.from({ length: 32 }, () => Array(308).fill(0))), true));
test('rechaza secuencias que no cumplen [T, 308]', () => assert.throws(() => validateTemporalInput(Array.from({ length: 32 }, () => Array(307).fill(0))), /308/));
