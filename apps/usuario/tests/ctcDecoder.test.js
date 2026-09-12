import test from 'node:test';
import assert from 'node:assert/strict';
import { greedyCtcDecode } from '../src/reconocimiento/ctcDecoder.js';
test('decodifica repetición y blank CTC', () => assert.equal(greedyCtcDecode([[0, 4, 0], [0, 4, 0], [3, 0, 0], [0, 0, 0]], ['_', 'A', 'B']), 'A'));
test('rechaza logits incompatibles', () => assert.throws(() => greedyCtcDecode([[1, 2]], ['_']), /dimensiones/));
