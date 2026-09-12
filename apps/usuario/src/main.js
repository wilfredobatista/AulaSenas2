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
const camera = new CameraController(document.querySelector('#camera'), {
  onFrame: (frame) => recognizer.process(frame),
  onStatus: (status) => ui.setCameraStatus(status)
});
ui.bind({ camera, recognizer, translator, speech, preferences });
