import { CameraController } from './video/camera.js';
import { SignRecognizer } from './reconocimiento/recognizer.js';
import { Translator } from './traduccion/translator.js';
import { SpeechService } from './traduccion/speech.js';
import { UserPreferences } from './configuracion/preferences.js';
import { UserInterface } from './ui/interface.js';
import { ModelLoader } from './reconocimiento/modelLoader.js';
import { MediaPipeAdapter } from './vision/mediapipeAdapter.js';

const ui = new UserInterface();
const preferences = new UserPreferences();
const speech = new SpeechService(preferences);
const translator = new Translator();
const loader = new ModelLoader({ onStatus: (status, error) => ui.setModelStatus(status, error) });
const recognizer = new SignRecognizer({ loader, onStatus: (status, error) => ui.setRecognitionStatus(status, error), onResult: (result) => ui.addRecognition(result) });
const vision = new MediaPipeAdapter({ onStatus: (status) => ui.setVisionStatus(status) });
globalThis.addEventListener?.('aulasenas:prediccion-dinamica', (event) => ui.addRecognition({ label: event.detail?.label, confidence: event.detail?.confianza ?? 0 }));
const camera = new CameraController(document.querySelector('#camera'), {
  onFrame: async (frame) => {
    if (typeof globalThis.iniciarDetectorManos === 'function' && globalThis.aulaSenasGruCtcModelLoader?.obtenerEstado?.().disponible === true) {
      const detector = await globalThis.iniciarDetectorManos();
      await detector.send({ image: frame });
      return;
    }
    if (globalThis.aulaSenasGruCtcModelLoader?.obtenerEstado?.().disponible !== true) return;
    recognizer.process(frame);
  },
  onStatus: (status) => ui.setCameraStatus(status),
  onStart: () => { if (globalThis.aulaSenasGruCtcStreamingRecognizer?.iniciar) globalThis.aulaSenasGruCtcStreamingRecognizer.iniciar(); },
  onStop: () => { globalThis.aulaSenasGruCtcStreamingRecognizer?.detener?.('camara_detenida'); vision.close(); recognizer.reset(); }
});
ui.bind({ camera, recognizer, translator, speech, preferences });
