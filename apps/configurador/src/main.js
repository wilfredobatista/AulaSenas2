/** Punto de composición de la UI: conecta video, captura, etiquetado, validación y almacenamiento. */
import { VideoSource } from './video/VideoSource.js';
import { CaptureSession } from './captura/CaptureSession.js';
import { createSampleLabel } from './etiquetado/SampleLabel.js';
import { validateSample } from './validacion/validateSample.js';
import { DataStore } from './almacenamiento/DataStore.js';
import { ContractValidator } from './validacion/ContractValidator.js';
import { LocalLandmarkExtractor } from './vision/LocalLandmarkExtractor.js';

const $ = (id) => document.getElementById(id);
const source = new VideoSource($('preview')); const store = new DataStore(); const contracts = new ContractValidator();
let session; let lastFrames = [];
// El contrato de landmarks se inyecta por la aplicación integradora; no se define aquí.
// Dependencia inyectable por el integrador; no se asume un contrato de landmarks aquí.
const localExtractor = new LocalLandmarkExtractor({ detect: globalThis.aulaSenasLandmarkDetector });
const extractLandmarks = (video) => localExtractor.extract(video);
/** Publica mensajes de estado en la interfaz. */
function status(message, error = false) { $('status').textContent = message; $('status').classList.toggle('error', error); }
/** Sincroniza habilitación de controles con el estado de la fuente y la sesión. */
function refresh() { $('capture').disabled = !(source.video.srcObject || source.video.src) || Boolean(session?.timer); $('stop').disabled = !session?.timer; $('save').disabled = lastFrames.length === 0; }
$('data-folder').addEventListener('click', async () => { try { if (!window.showDirectoryPicker) throw new Error('Este navegador no permite seleccionar carpetas.'); const handle = await window.showDirectoryPicker({ mode: 'readwrite' }); store.setRoot(handle); status('Carpeta de datos conectada.'); } catch (e) { if (e.name !== 'AbortError') status(e.message, true); } });

$('camera').addEventListener('click', async () => { try { await source.startCamera(); status('Cámara activa'); refresh(); } catch (e) { status(e.message, true); } });
$('video-file').addEventListener('change', (e) => { try { source.loadFile(e.target.files[0]); status('Video importado; LocalLandmarkExtractor integrado y listo para capturar.'); refresh(); } catch (err) { status(err.message, true); } });
$('capture').addEventListener('click', async () => { try { await $('preview').play(); session = new CaptureSession({ video: $('preview'), extractLandmarks }); session.start(); status('Capturando…'); refresh(); } catch (e) { status(e.message, true); } });
$('stop').addEventListener('click', () => { lastFrames = session.stop(); $('sample-summary').textContent = `${lastFrames.length} frames capturados.`; status('Captura detenida'); refresh(); });
$('save').addEventListener('click', async () => { try { const metadata = createSampleLabel({ label: $('label').value, participant: $('participant').value, notes: $('notes').value }); const sample = { metadata, frames: lastFrames, capturedAt: new Date().toISOString() }; const basic = validateSample(sample); if (!basic.valid) throw new Error(basic.errors.join(' ')); const contract = await contracts.validate(sample, 'captured-sample'); if (!contract.valid) throw new Error(contract.errors.join(' ')); const result = await store.save(sample, 'raw'); const stored = await contracts.validate(result, 'data-stages'); if (!stored.valid) throw new Error(stored.errors.join(' ')); status('Muestra validada y guardada en raw.'); } catch (e) { status(e.message, true); } });
refresh();
