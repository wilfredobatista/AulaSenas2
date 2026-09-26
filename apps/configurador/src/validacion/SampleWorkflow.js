import { validateSample } from './validateSample.js';
import { LITE_FEATURE_CONTRACT } from '../vision/LiteVectorizer139.js';

/** Construye, valida y entrega una muestra Lite al almacenamiento autoritativo. */
export class SampleWorkflow {
  constructor({ datasetStore = null, classProvider = () => null, classResolver = () => true }) { this.datasetStore = datasetStore; this.classProvider = classProvider; this.classResolver = classResolver; }
  /** Conserva raw y F139, omite metadata ficticia y nunca usa schemas legacy. */
  async save({ classId, source = { tipo: 'camera' }, durationMs, frames }) {
    if (!classId) throw new Error('Falta classId de la clase activa.');
    if (!Number.isFinite(durationMs) || durationMs < 0) throw new Error('Falta la duración real de la captura.');
    const sample = {
      featureContract: LITE_FEATURE_CONTRACT,
      classId,
      fuente: source,
      tiempo: { inicioMs: 0, finMs: durationMs, duracionMs: durationMs, cantidadFrames: frames?.length ?? 0 },
      frames,
      capturedAt: new Date().toISOString(),
    };
    const validation = validateSample(sample, { classResolver: this.classResolver });
    if (!validation.valid) throw new Error(validation.errors.join(' '));
    if (!this.datasetStore) throw new Error('El servicio persistente Lite es obligatorio para guardar muestras.');
    const classDefinition = this.classProvider(classId);
    if (!classDefinition) throw new Error('No se pudo resolver la clase activa para el dataset.');
    return this.datasetStore.appendSample({ classDefinition, sample });
  }
}
