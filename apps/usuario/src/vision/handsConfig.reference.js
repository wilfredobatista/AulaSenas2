const configuracionConfianzaMediaPipeManos =
  reglasHeuristicasAulaSenas.obtenerUmbralesConfianzaDetectorManos();

const configuracionManos = Object.freeze({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: configuracionConfianzaMediaPipeManos.deteccionMinima,
  minTrackingConfidence: configuracionConfianzaMediaPipeManos.seguimientoMinimo,
});
