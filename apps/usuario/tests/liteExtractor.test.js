import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRawLite } from '../src/vision/LiteFrameExtractor.js';
const points = Array.from({length:21},()=>({x:.1,y:.2,z:.3}));
test('raw Lite conserva solo manos y MP0/11/12, invirtiendo la etiqueta selfie a lado físico', () => { const pose=Array.from({length:13},()=>({x:.5,y:.5,z:0})); const raw=buildRawLite({multiHandLandmarks:[points],multiHandedness:[{label:'Left'}]},{poseLandmarks:pose}); assert.equal(raw.hands.right?.length,21); assert.equal(raw.hands.left,null); assert.ok(raw.pose.nose); assert.ok(raw.pose.leftShoulder); assert.ok(raw.pose.rightShoulder); });
