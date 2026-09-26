/** Punto de composición: conecta servicios independientes sin lógica de dominio. */
import { VideoSource } from './video/VideoSource.js';
import { LiteFrameExtractor } from './vision/LiteFrameExtractor.js';
import { LandmarkPreview } from './vision/LandmarkPreview.js';
import { CaptureController } from './captura/CaptureController.js';
import { ValidatedDatasetStore } from './almacenamiento/ValidatedDatasetStore.js';
import { bootstrapDataset } from './almacenamiento/DatasetBootstrap.js';
import { ContractValidator } from './validacion/ContractValidator.js';
import { SampleWorkflow } from './validacion/SampleWorkflow.js';
import { ConfiguratorUI } from './ui/ConfiguratorUI.js';
import { LandmarkOverlay } from './ui/LandmarkOverlay.js';
import { ClassCatalog } from './etiquetado/ClassCatalog.js';
import { VideoControls } from './video/VideoControls.js';
import { VideoSegmentProcessor } from './captura/VideoSegmentProcessor.js';

const documentRef = document;
const video = documentRef.getElementById('preview');
const source = new VideoSource(video);
const contracts = new ContractValidator();
const overlay = new LandmarkOverlay({ canvas: documentRef.getElementById('landmark-overlay'), video });
const extractor = new LiteFrameExtractor({
  detect: globalThis.aulaSenasLiteDetector,
  // El mismo payload canónico se dibuja y se entrega a captura/segmentación.
  onResult: (payload) => overlay.render(payload),
});
const capture = new CaptureController({ video, extractLandmarks: (currentVideo, context) => extractor.extract(currentVideo, context) });
const videoControls = new VideoControls(video);
const segmentProcessor = new VideoSegmentProcessor({ video, extractLandmarks: (currentVideo, context) => extractor.extract(currentVideo, context) });
const classCatalog = new ClassCatalog({ validator: contracts });
const datasetStore = new ValidatedDatasetStore({ contracts });
const workflow = new SampleWorkflow({ datasetStore, contracts, classResolver: (classId) => classCatalog.list().some((item) => item.classId === classId), classProvider: (classId) => classCatalog.list().find((item) => item.classId === classId) ?? null });
const ui = new ConfiguratorUI(documentRef);
const landmarkPreview = new LandmarkPreview({
  video,
  extractLandmarks: (currentVideo, context) => extractor.extract(currentVideo, context),
  // La previsualización no bloquea captura; el estado deja visible su error.
  onError: (error) => ui.status(`No se pudo actualizar landmarks: ${error.message}`, true),
});

await classCatalog.initialize();
let pendingCapture = { classId: null, frames: [], durationMs: 0, source: null };
let sampleCounts = {};
let datasetAvailable = false;
let datasetErrorMessage = null;

/**
 * Inicializa el único dataset local al abrir la aplicación y reconstruye el
 * catálogo desde sus JSON. No existe un fallback en memoria si el servicio cae.
 */
const datasetBootstrap = await bootstrapDataset({ datasetStore, classCatalog, ui });
sampleCounts = datasetBootstrap.counts;
datasetAvailable = datasetBootstrap.available;
datasetErrorMessage = datasetBootstrap.errorMessage;

/** Conecta controles con servicios y preserva main.js como único orquestador. */
ui.bind({
  onStartCamera: async () => {
    await landmarkPreview.stop(); overlay.clear(); const camera = await source.startCamera(); landmarkPreview.start(); return camera;
  },
  onStopCamera: async () => {
    if (capture.active) throw new Error('Termina la captura antes de detener la cámara.');
    await landmarkPreview.stop(); source.stop(); overlay.clear();
    pendingCapture = { classId: null, frames: [], durationMs: 0, source: null };
  },
  onModeChange: async () => {
    if (capture.active) throw new Error('Termina la captura antes de cambiar de modo.');
    await landmarkPreview.stop(); source.stop(); overlay.clear(); videoControls.reset();
    pendingCapture = { classId: null, frames: [], durationMs: 0, source: null };
  },
  onImport: async (file) => {
    await landmarkPreview.stop(); overlay.clear(); const imported = source.loadFile(file); landmarkPreview.start(); return imported;
  },
  onStartCapture: async () => {
    if (!source.stream) throw new Error('Activa la cámara antes de iniciar la captura.');
    const activeClass = classCatalog.getActive();
    if (!activeClass) throw new Error('Selecciona una clase activa antes de capturar.');
    await landmarkPreview.stop();
    // El destino se fija antes del primer frame y no vuelve a consultar la
    // selección visual hasta que la muestra termine de persistirse.
    pendingCapture = { classId: activeClass.classId, frames: [], durationMs: 0, source: null };
    try { return await capture.start(); } catch (error) { pendingCapture = { classId: null, frames: [], durationMs: 0, source: null }; throw error; }
  },
  onStopCapture: async () => {
    const frames = await capture.stop();
    pendingCapture = { ...pendingCapture, frames, durationMs: capture.durationMs, source: { tipo: 'camera' } };
    landmarkPreview.start();
    return frames;
  },
  onProcessSegment: async (segment) => {
    if (!segment) throw new Error('Marca inicio y fin antes de procesar.');
    const activeClass = classCatalog.getActive();
    if (!activeClass) throw new Error('Selecciona una clase activa antes de procesar.');
    pendingCapture = { classId: activeClass.classId, frames: [], durationMs: 0, source: null };
    await landmarkPreview.stop();
    try {
      const result = await segmentProcessor.process(segment);
      pendingCapture = {
        classId: activeClass.classId,
        frames: result.frames,
        durationMs: result.durationMs,
        source: { tipo: 'video', video: { nombreArchivo: source.objectUrl ? 'video-importado' : 'video', inicioSegmentoMs: result.startMs, finSegmentoMs: result.endMs, duracionSegmentoMs: result.durationMs } },
      };
      return result;
    } finally { landmarkPreview.start(); }
  },
  onAutoSave: async () => {
    if (!datasetAvailable) throw new Error('Servicio de dataset no disponible.');
    const fixedClassId = pendingCapture.classId;
    const fixedClass = classCatalog.list().find((item) => item.classId === fixedClassId);
    if (!fixedClass) throw new Error('La clase fijada para la captura ya no existe en el catálogo.');
    if (!pendingCapture.source || pendingCapture.frames.length === 0) throw new Error('Captura o procesa un segmento antes de guardar.');
    const result = await workflow.save({ classId: fixedClassId, source: pendingCapture.source, durationMs: pendingCapture.durationMs, frames: pendingCapture.frames });
    sampleCounts[fixedClassId] = await datasetStore.countClass(fixedClassId);
    pendingCapture = { classId: null, frames: [], durationMs: 0, source: null };
    return result;
  },
  onDeleteLast: async (classId) => {
    if (!datasetAvailable) throw new Error('Servicio de dataset no disponible.');
    const result = await datasetStore.deleteLastSample(classId);
    const catalog = await reloadCatalog(classId);
    return { ...result, count: catalog.counts[classId] ?? 0 };
  },
  onSelectClass: (classId) => classCatalog.select(classId),
  onCreateClass: async (data) => {
    if (!datasetAvailable) throw new Error('Servicio de dataset no disponible.');
    const snapshot = catalogSnapshot();
    const created = await classCatalog.create(data);
    try {
      await datasetStore.createClass(created);
      const catalog = await reloadCatalog(created.classId);
      const persisted = catalog.classes.find((item) => item.classId === created.classId);
      assertPersistedClass(created, persisted);
      return { ...persisted, persisted: true };
    } catch (error) { restoreCatalogSnapshot(snapshot); throw error; }
  },
  onUpdateClass: async (classId, data) => {
    if (!datasetAvailable) throw new Error('Servicio de dataset no disponible.');
    const snapshot = catalogSnapshot();
    const updated = await classCatalog.update(classId, data);
    try {
      await datasetStore.updateClassMetadata(updated);
      const catalog = await reloadCatalog(classId);
      const persisted = catalog.classes.find((item) => item.classId === classId);
      assertPersistedClass(updated, persisted);
      return { ...persisted, persisted: true };
    } catch (error) { restoreCatalogSnapshot(snapshot); throw error; }
  },
  getClasses: () => classCatalog.list(),
  getActiveClass: () => classCatalog.getActive(),
  getSampleCount: (classId) => sampleCounts[classId] ?? 0,
  videoControls,
});

if (!datasetAvailable) ui.status(datasetErrorMessage, true);

/** Captura catálogo, selección y conteos antes de una mutación remota. */
function catalogSnapshot() { return { classes: classCatalog.list(), activeClassId: classCatalog.getActive()?.classId ?? null, counts: { ...sampleCounts } }; }

/** Restaura la vista previa local si la persistencia o su verificación falla. */
function restoreCatalogSnapshot(snapshot) {
  classCatalog.hydrate(snapshot.classes); sampleCounts = snapshot.counts;
  if (snapshot.activeClassId && snapshot.classes.some((item) => item.classId === snapshot.activeClassId)) classCatalog.select(snapshot.activeClassId);
}

/** Relee el dataset autoritativo y conserva seleccionada la clase indicada. */
async function reloadCatalog(preferredClassId) {
  const catalog = await datasetStore.loadCatalog();
  classCatalog.hydrate(catalog.classes); sampleCounts = catalog.counts;
  if (preferredClassId && catalog.classes.some((item) => item.classId === preferredClassId)) classCatalog.select(preferredClassId);
  return catalog;
}

/** Exige que la relectura contenga exactamente la metadata solicitada. */
function assertPersistedClass(expected, actual) {
  const projection = (item) => item && [item.classId, item.glosa, item.tipo, item.estado, item.significados];
  if (!actual || JSON.stringify(projection(actual)) !== JSON.stringify(projection(expected))) throw new Error('La relectura del dataset no coincide con la clase solicitada.');
}
