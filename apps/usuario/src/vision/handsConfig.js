/* Configuración autoritativa de MediaPipe Hands: una mano, complejidad 1 y umbrales heurísticos. */
const configuracionConfianzaMediaPipeManos =
  reglasHeuristicasAulaSenas.obtenerUmbralesConfianzaDetectorManos();

const configuracionManos = Object.freeze({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: configuracionConfianzaMediaPipeManos.deteccionMinima,
  minTrackingConfidence: configuracionConfianzaMediaPipeManos.seguimientoMinimo,
});
