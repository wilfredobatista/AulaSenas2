/** Punto de entrada: conecta cámara con el detector y reconocedor GRU-CTC autoritativos. */
import { CameraController } from './video/camera.js';
import { Translator } from './traduccion/translator.js';
import { SpeechService } from './traduccion/speech.js';
import { UserPreferences } from './configuracion/preferences.js';
import { UserInterface } from './ui/interface.js';
import { loadStreamingContracts, validateStreamingInput } from './reconocimiento/contractValidator.js';
const ui=new UserInterface(), preferences=new UserPreferences(), speech=new SpeechService(preferences), translator=new Translator(); globalThis.validarEntradaStreaming=validateStreamingInput;
const loader=globalThis.aulaSenasGruCtcModelLoader, recognizer=globalThis.aulaSenasGruCtcStreamingRecognizer; let inputContract=null;
/** Envía frames reales al detector MediaPipe; no crea landmarks ni predicciones. */
async function processFrame(video){if(!inputContract||!loader?.obtenerEstado?.().disponible||typeof globalThis.iniciarDetectorManos!=='function')return;const detector=await globalThis.iniciarDetectorManos();await detector.send({image:video});}
const camera=new CameraController(document.querySelector('#camera'),{onFrame:processFrame,onStatus:(status,error)=>ui.setCameraStatus(status,error),onStart:async()=>{try{inputContract=await loadStreamingContracts();ui.setContractStatus('Contratos streaming cargados');await loader?.cargar?.({basePath:'/models/exportados/gru_ctc_v3'});if(loader?.obtenerEstado?.().disponible)recognizer?.iniciar?.();}catch(error){inputContract=null;ui.setContractStatus(error.message);}},onStop:()=>{inputContract=null;recognizer?.detener?.('camara_detenida')}});
/** Los scripts autoritativos publican eventos globales consumidos por la interfaz. */
globalThis.addEventListener?.('aulasenas:modelo-gru-ctc-estado',e=>ui.setModelStatus(e.detail));globalThis.addEventListener?.('aulasenas:estado-reconocimiento-holistic',e=>ui.setRecognitionStatus(e.detail?.estado));globalThis.addEventListener?.('aulasenas:prediccion-dinamica',e=>ui.addRecognition(e.detail,translator,speech,preferences));ui.bind({camera,speech,preferences});
