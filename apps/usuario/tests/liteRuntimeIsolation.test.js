import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
async function files(directory) { const entries=await readdir(directory,{withFileTypes:true}); return (await Promise.all(entries.map((entry)=>entry.isDirectory()?files(path.join(directory,entry.name)):[path.join(directory,entry.name)]))).flat(); }
test('Lite no conserva dependencias legacy canceladas', async () => { const source=await Promise.all((await files(fileURLToPath(new URL('../src/',import.meta.url)))).filter((file)=>file.endsWith('.js')).map(async(file)=>readFile(file,'utf8'))); const all=source.join('\n').toLowerCase(); for(const term of ['hol'+'istic','face'+'mesh','f319','f308','gru'+'-ctc']) assert.equal(all.includes(term),false,`No debe quedar ${term} en src/`); assert.equal(/(^|[^a-z])ctc([^a-z]|$)/.test(all),false,'No debe existir CTC funcional.'); });
