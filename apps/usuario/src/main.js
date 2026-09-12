import { CameraController } from './video/camera.js';
import { SignRecognizer } from './reconocimiento/recognizer.js';
import { Translator } from './traduccion/translator.js';
import { SpeechService } from './traduccion/speech.js';
import { UserPreferences } from './configuracion/preferences.js';
import { UserInterface } from './ui/interface.js';

const ui = new UserInterface();
const preferences = new UserPreferences();
const speech = new SpeechService(preferences);
const translator = new Translator();
const recognizer = new SignRecognizer({ onStatus: (status) => ui.setModelStatus(status) });
const camera = new CameraController(document.querySelector('#camera'), {
  onFrame: (frame) => recognizer.process(frame),
  onStatus: (status) => ui.setCameraStatus(status)
});
ui.bind({ camera, recognizer, translator, speech, preferences });
