const listenersLandmarksCrudos = [];
const listenersFotogramasManos = [];
const listenersExcepcionesManos = [];
const NOMBRE_EVENTO_DIAGNOSTICO_DETECTOR_MANOS = "aulasenas:diagnostico-detector-manos";
const LATERALIDADES_FISICAS_MANOS = Object.freeze(["Left", "Right"]);
const reglasHeuristicasDetectorManos = reglasHeuristicasAulaSenas;
const intervaloValidacionMatrizMs = 5000;
const intervaloReporteRendimientoMs = 5000;
const umbralPausaDetectorMs = 150;
const intervaloLogCambioResultadosMs = 1000;
const configuracionExclusionMargenesCamara =
  reglasHeuristicasDetectorManos.obtenerConfiguracionExclusionMargenesCamara();
const umbralesConfianzaDetectorManos =
  reglasHeuristicasDetectorManos.obtenerUmbralesConfianzaDetectorManos();
const nombresPuntosClaveMano = reglasHeuristicasDetectorManos.obtenerNombresPuntosClaveMano();
let detectorManos = null;
let maximoManosSolicitado = configuracionManos.maxNumHands;
let maximoManosAplicado = null;
let preparacionDetectorManosEnCurso = null;
let secuenciaInstanciasDetectorManos = 0;
let ultimaGeneracionEnvioRegistrada = null;
let ultimaFirmaResultadosDiagnostico = null;
const metadatosInstanciasDetectorManos = new WeakMap();
const diagnosticoDetectorManos = {
  generacionActiva: null,
  maximoCreacionInstanciaActiva: null,
  generacionUltimoEnvio: null,
  maximoUltimoEnvio: null,
  totalLandmarksMediaPipe: null,
  totalHandednessMediaPipe: null,
  totalManosDetectadas: null,
  ultimoEvento: "detector_no_iniciado",
};
const continuidadRepresentacionCanonica = {
  Left: null,
  Right: null,
};
let ultimaValidacionMatrizTimestamp = 0;
let ultimoMotivoValidacionMatriz = null;
let ultimaPublicacionRendimientoTimestamp = 0;
let ultimoLogCambioResultadosTimestamp = 0;
const rendimientoDetectorManos = crearEstadoRendimientoDetectorManos();
const INDICES_POSE_CAPTURA = Object.freeze([0, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24]);
const INDICES_CARA_CAPTURA = Object.freeze([
  10, 152, 234, 454, 61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291,
  78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308,
  70, 63, 105, 66, 107, 336, 296, 334, 293, 300,
  33, 160, 158, 133, 153, 144, 362, 385, 387, 263, 373, 380,
]);

function crearEstadoRendimientoDetectorManos() {
  return {
    inicioMedicionMs: null,
    ultimoEnvioInicioMs: null,
    totalEnvios: 0,
    totalResultados: 0,
    resultadosConLandmarksCrudos: 0,
    resultadosConManosValidas: 0,
    resultadosSinManosValidas: 0,
    manosDescartadasPorConfianza: 0,
    inferenciasMedidas: 0,
    tiempoInferenciaAcumuladoMs: 0,
    ultimoTiempoInferenciaMs: null,
    tiempoInferenciaMaximoMs: 0,
    tiempoListenersAcumuladoMs: 0,
    ultimoTiempoListenersMs: null,
    tiempoListenersMaximoMs: 0,
    ultimoResultadoTimestampMs: null,
    intervalosResultadosAcumuladoMs: 0,
    intervalosResultadosMedidos: 0,
    intervaloResultadoMaximoMs: 0,
    pausasDetectorDetectadas: 0,
  };
}

function obtenerTiempoMonotonoMs() {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

function reiniciarDiagnosticoRendimientoDetectorManos() {
  Object.assign(rendimientoDetectorManos, crearEstadoRendimientoDetectorManos());
  ultimaPublicacionRendimientoTimestamp = 0;
  return obtenerRendimientoDetectorManos();
}

function obtenerRendimientoDetectorManos() {
  const ahora = obtenerTiempoMonotonoMs();
  const tiempoMedicionMs = Number.isFinite(rendimientoDetectorManos.inicioMedicionMs)
    ? Math.max(0, ahora - rendimientoDetectorManos.inicioMedicionMs)
    : 0;
  const segundosMedicion = tiempoMedicionMs / 1000;
  const totalResultados = rendimientoDetectorManos.totalResultados;

  return {
    tiempoMedicionMs: Math.round(tiempoMedicionMs),
    totalEnvios: rendimientoDetectorManos.totalEnvios,
    totalResultados: totalResultados,
    fpsEnviados: segundosMedicion > 0
      ? Number((rendimientoDetectorManos.totalEnvios / segundosMedicion).toFixed(2))
      : 0,
    fpsProcesados: segundosMedicion > 0
      ? Number((totalResultados / segundosMedicion).toFixed(2))
      : 0,
    inferenciaMediaMs: rendimientoDetectorManos.inferenciasMedidas > 0
      ? Number((
          rendimientoDetectorManos.tiempoInferenciaAcumuladoMs /
          rendimientoDetectorManos.inferenciasMedidas
        ).toFixed(2))
      : 0,
    ultimoTiempoInferenciaMs: rendimientoDetectorManos.ultimoTiempoInferenciaMs,
    tiempoInferenciaMaximoMs: rendimientoDetectorManos.tiempoInferenciaMaximoMs,
    listenersMediaMs: totalResultados > 0
      ? Number((rendimientoDetectorManos.tiempoListenersAcumuladoMs / totalResultados).toFixed(2))
      : 0,
    ultimoTiempoListenersMs: rendimientoDetectorManos.ultimoTiempoListenersMs,
    tiempoListenersMaximoMs: rendimientoDetectorManos.tiempoListenersMaximoMs,
    intervaloResultadoMedioMs: rendimientoDetectorManos.intervalosResultadosMedidos > 0
      ? Number((
          rendimientoDetectorManos.intervalosResultadosAcumuladoMs /
          rendimientoDetectorManos.intervalosResultadosMedidos
        ).toFixed(2))
      : 0,
    intervaloResultadoMaximoMs: rendimientoDetectorManos.intervaloResultadoMaximoMs,
    pausasDetectorDetectadas: rendimientoDetectorManos.pausasDetectorDetectadas,
    umbralPausaDetectorMs: umbralPausaDetectorMs,
    resultadosConLandmarksCrudos: rendimientoDetectorManos.resultadosConLandmarksCrudos,
    resultadosConManosValidas: rendimientoDetectorManos.resultadosConManosValidas,
    resultadosSinManosValidas: rendimientoDetectorManos.resultadosSinManosValidas,
    manosDescartadasPorConfianza: rendimientoDetectorManos.manosDescartadasPorConfianza,
    listenersFotogramasActivos: listenersFotogramasManos.length,
  };
}

function registrarResultadoRendimientoDetectorManos(results, fotogramaProcesado) {
  const ahora = obtenerTiempoMonotonoMs();
  const totalLandmarksCrudos = Array.isArray(results?.multiHandLandmarks)
    ? results.multiHandLandmarks.length
    : 0;

  rendimientoDetectorManos.totalResultados += 1;
  if (Number.isFinite(rendimientoDetectorManos.ultimoResultadoTimestampMs)) {
    const intervaloResultadoMs = Math.max(
      0,
      ahora - rendimientoDetectorManos.ultimoResultadoTimestampMs
    );
    rendimientoDetectorManos.intervalosResultadosAcumuladoMs += intervaloResultadoMs;
    rendimientoDetectorManos.intervalosResultadosMedidos += 1;
    rendimientoDetectorManos.intervaloResultadoMaximoMs = Math.max(
      rendimientoDetectorManos.intervaloResultadoMaximoMs,
      Number(intervaloResultadoMs.toFixed(2))
    );
    if (intervaloResultadoMs >= umbralPausaDetectorMs) {
      rendimientoDetectorManos.pausasDetectorDetectadas += 1;
      console.warn(
        `[MediaPipe pausa] intervalo entre resultados=${Number(intervaloResultadoMs.toFixed(2))} ms`
      );
    }
  }
  rendimientoDetectorManos.ultimoResultadoTimestampMs = ahora;
  if (totalLandmarksCrudos > 0) {
    rendimientoDetectorManos.resultadosConLandmarksCrudos += 1;
  }
  if (fotogramaProcesado?.hayManos) {
    rendimientoDetectorManos.resultadosConManosValidas += 1;
  } else {
    rendimientoDetectorManos.resultadosSinManosValidas += 1;
  }
  rendimientoDetectorManos.manosDescartadasPorConfianza += (
    fotogramaProcesado?.manosDescartadas || []
  ).filter(function (manoDescartada) {
    return manoDescartada?.motivo === "confianza_insuficiente";
  }).length;

  if (Number.isFinite(rendimientoDetectorManos.ultimoEnvioInicioMs)) {
    const tiempoInferenciaMs = Math.max(
      0,
      ahora - rendimientoDetectorManos.ultimoEnvioInicioMs
    );
    rendimientoDetectorManos.inferenciasMedidas += 1;
    rendimientoDetectorManos.tiempoInferenciaAcumuladoMs += tiempoInferenciaMs;
    rendimientoDetectorManos.ultimoTiempoInferenciaMs = Number(tiempoInferenciaMs.toFixed(2));
    rendimientoDetectorManos.tiempoInferenciaMaximoMs = Math.max(
      rendimientoDetectorManos.tiempoInferenciaMaximoMs,
      Number(tiempoInferenciaMs.toFixed(2))
    );
    rendimientoDetectorManos.ultimoEnvioInicioMs = null;
  }

  if (ultimaPublicacionRendimientoTimestamp === 0) {
    ultimaPublicacionRendimientoTimestamp = ahora;
  } else if (
    ahora - ultimaPublicacionRendimientoTimestamp >= intervaloReporteRendimientoMs
  ) {
    ultimaPublicacionRendimientoTimestamp = ahora;
    const resumen = obtenerRendimientoDetectorManos();
    console.info(
      `[MediaPipe rendimiento] entrada=${resumen.fpsEnviados} FPS, ` +
      `procesados=${resumen.fpsProcesados} FPS, inferencia=${resumen.inferenciaMediaMs} ms, ` +
      `conMano=${resumen.resultadosConManosValidas}, sinMano=${resumen.resultadosSinManosValidas}, ` +
      `descartesConfianza=${resumen.manosDescartadasPorConfianza}, ` +
      `listeners=${resumen.listenersMediaMs} ms`
    );
    publicarDiagnosticoDetectorManos();
  }
}

async function iniciarDetectorManos() {
  while (!detectorManos || maximoManosAplicado !== maximoManosSolicitado) {
    if (!preparacionDetectorManosEnCurso) {
      const maximoObjetivo = maximoManosSolicitado;
      preparacionDetectorManosEnCurso = prepararInstanciaDetectorManos(maximoObjetivo)
        .finally(function () {
          preparacionDetectorManosEnCurso = null;
        });
    }

    await preparacionDetectorManosEnCurso;
  }

  return detectorManos;
}

async function prepararInstanciaDetectorManos(maximoObjetivo) {
  if (typeof Hands !== "function") {
    throw new Error("MediaPipe Hands no esta disponible. Verifica la carga del CDN en index.html.");
  }

  const detectorAnterior = detectorManos;
  const metadatosDetectorAnterior = detectorAnterior
    ? metadatosInstanciasDetectorManos.get(detectorAnterior)
    : null;
  detectorManos = null;
  maximoManosAplicado = null;

  if (detectorAnterior) {
    diagnosticoDetectorManos.generacionActiva = null;
    diagnosticoDetectorManos.maximoCreacionInstanciaActiva = null;
    diagnosticoDetectorManos.ultimoEvento =
      `destruyendo_instancia_${metadatosDetectorAnterior?.generacion || "desconocida"}`;
    console.info(
      `[Diagnostico manos] destruyendo instancia #${metadatosDetectorAnterior?.generacion || "?"} ` +
      `(maxNumHands=${metadatosDetectorAnterior?.maxNumHands || "?"})`
    );
    publicarDiagnosticoDetectorManos();

    if (typeof detectorAnterior.close === "function") {
      await detectorAnterior.close();
    }
  }

  const generacionNuevaInstancia = ++secuenciaInstanciasDetectorManos;
  const ConstructorDetector = typeof Holistic === "function" ? Holistic : Hands;
  const nuevaInstancia = new ConstructorDetector({
    locateFile: function (archivo) {
      const paquete = typeof Holistic === "function" && ConstructorDetector === Holistic
        ? "holistic"
        : "hands";
      return `https://cdn.jsdelivr.net/npm/@mediapipe/${paquete}/${archivo}`;
    },
  });
  metadatosInstanciasDetectorManos.set(nuevaInstancia, {
    generacion: generacionNuevaInstancia,
    maxNumHands: maximoObjetivo,
  });

  nuevaInstancia.setOptions(crearOpcionesDetectorManos(maximoObjetivo));
  nuevaInstancia.onResults(onResults);
  console.info(
    `[Diagnostico manos] creando instancia #${generacionNuevaInstancia} ` +
    `(maxNumHands=${maximoObjetivo})`
  );

  if (typeof nuevaInstancia.initialize === "function") {
    await nuevaInstancia.initialize();
  }

  detectorManos = nuevaInstancia;
  maximoManosAplicado = maximoObjetivo;
  diagnosticoDetectorManos.generacionActiva = generacionNuevaInstancia;
  diagnosticoDetectorManos.maximoCreacionInstanciaActiva = maximoObjetivo;
  diagnosticoDetectorManos.ultimoEvento =
    `instancia_${generacionNuevaInstancia}_activa_max_${maximoObjetivo}`;
  publicarDiagnosticoDetectorManos();
}

function configurarMaximoManosDetector(maximoSolicitado = 1) {
  const maximoNormalizado = Number(maximoSolicitado) === 2 ? 2 : 1;

  if (maximoNormalizado === maximoManosSolicitado) {
    return maximoManosSolicitado;
  }

  maximoManosSolicitado = maximoNormalizado;
  diagnosticoDetectorManos.totalLandmarksMediaPipe = null;
  diagnosticoDetectorManos.totalHandednessMediaPipe = null;
  diagnosticoDetectorManos.totalManosDetectadas = null;
  diagnosticoDetectorManos.ultimoEvento = `solicitado_max_${maximoNormalizado}`;
  console.info(`[Diagnostico manos] maxNumHands solicitado=${maximoNormalizado}`);
  publicarDiagnosticoDetectorManos();
  return maximoManosSolicitado;
}

function obtenerMaximoManosDetector() {
  return maximoManosSolicitado;
}

function obtenerMaximoManosAplicadoDetector() {
  return maximoManosAplicado;
}

function obtenerDiagnosticoDetectorManos() {
  return {
    maximoManosSolicitado: maximoManosSolicitado,
    maximoManosAplicado: maximoManosAplicado,
    generacionActiva: diagnosticoDetectorManos.generacionActiva,
    maximoCreacionInstanciaActiva:
      diagnosticoDetectorManos.maximoCreacionInstanciaActiva,
    generacionUltimoEnvio: diagnosticoDetectorManos.generacionUltimoEnvio,
    maximoUltimoEnvio: diagnosticoDetectorManos.maximoUltimoEnvio,
    totalLandmarksMediaPipe: diagnosticoDetectorManos.totalLandmarksMediaPipe,
    totalHandednessMediaPipe: diagnosticoDetectorManos.totalHandednessMediaPipe,
    totalManosDetectadas: diagnosticoDetectorManos.totalManosDetectadas,
    ultimoEvento: diagnosticoDetectorManos.ultimoEvento,
    rendimiento: obtenerRendimientoDetectorManos(),
  };
}

function registrarEnvioDetectorManos(instanciaDetector) {
  const metadatosInstancia = metadatosInstanciasDetectorManos.get(instanciaDetector);

  if (!Number.isFinite(rendimientoDetectorManos.inicioMedicionMs)) {
    rendimientoDetectorManos.inicioMedicionMs = obtenerTiempoMonotonoMs();
  }
  rendimientoDetectorManos.totalEnvios += 1;
  rendimientoDetectorManos.ultimoEnvioInicioMs = obtenerTiempoMonotonoMs();

  if (!metadatosInstancia) {
    diagnosticoDetectorManos.ultimoEvento = "send_instancia_desconocida";
    publicarDiagnosticoDetectorManos();
    return null;
  }

  diagnosticoDetectorManos.generacionUltimoEnvio = metadatosInstancia.generacion;
  diagnosticoDetectorManos.maximoUltimoEnvio = metadatosInstancia.maxNumHands;
  diagnosticoDetectorManos.ultimoEvento =
    `send_instancia_${metadatosInstancia.generacion}_max_${metadatosInstancia.maxNumHands}`;

  if (ultimaGeneracionEnvioRegistrada !== metadatosInstancia.generacion) {
    ultimaGeneracionEnvioRegistrada = metadatosInstancia.generacion;
    console.info(
      `[Diagnostico manos] send() usa instancia #${metadatosInstancia.generacion} ` +
      `(maxNumHands=${metadatosInstancia.maxNumHands})`
    );
    publicarDiagnosticoDetectorManos();
  }

  return metadatosInstancia.generacion;
}

function crearOpcionesDetectorManos(maximoObjetivo = maximoManosSolicitado) {
  if (typeof Holistic === "function") {
    return {
      modelComplexity: configuracionManos.modelComplexity,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      refineFaceLandmarks: false,
      minDetectionConfidence: configuracionManos.minDetectionConfidence,
      minTrackingConfidence: configuracionManos.minTrackingConfidence,
    };
  }
  return {
    ...configuracionManos,
    maxNumHands: maximoObjetivo,
  };
}

function onResults(results) {
  const resultadosNormalizados = normalizarResultadosDeteccion(results);
  const fotogramaProcesado = procesarFotogramaManos(resultadosNormalizados);

  registrarResultadoRendimientoDetectorManos(resultadosNormalizados, fotogramaProcesado);
  actualizarDiagnosticoResultadosManos(resultadosNormalizados, fotogramaProcesado);

  gestionarAusenciaManos(fotogramaProcesado);
  gestionarExclusionDatosManos(fotogramaProcesado);
  validarRecepcionMatrizTridimensional(fotogramaProcesado);
  enviarFotogramaManos(fotogramaProcesado);
  recibirResultadosManos(resultadosNormalizados, fotogramaProcesado);
}

function normalizarResultadosDeteccion(resultados) {
  if (Array.isArray(resultados?.multiHandLandmarks)) return resultados;
  const manos = [
    { landmarks: resultados?.leftHandLandmarks, label: "Right" },
    { landmarks: resultados?.rightHandLandmarks, label: "Left" },
  ].filter(function (entrada) { return Array.isArray(entrada.landmarks); });
  return {
    ...resultados,
    multiHandLandmarks: manos.map(function (entrada) { return entrada.landmarks; }),
    multiHandedness: manos.map(function (entrada) {
      return { classification: [{ label: entrada.label, score: 1 }] };
    }),
  };
}

function actualizarDiagnosticoResultadosManos(results, fotogramaProcesado) {
  const ahora = obtenerTiempoMonotonoMs();
  const totalLandmarks = Array.isArray(results?.multiHandLandmarks)
    ? results.multiHandLandmarks.length
    : 0;
  const totalHandedness = Array.isArray(results?.multiHandedness)
    ? results.multiHandedness.length
    : 0;
  const totalManosDetectadas = Array.isArray(fotogramaProcesado?.manosDetectadas)
    ? fotogramaProcesado.manosDetectadas.length
    : 0;
  const firmaResultados = [
    diagnosticoDetectorManos.generacionUltimoEnvio,
    totalLandmarks,
    totalHandedness,
    totalManosDetectadas,
  ].join(":");

  diagnosticoDetectorManos.totalLandmarksMediaPipe = totalLandmarks;
  diagnosticoDetectorManos.totalHandednessMediaPipe = totalHandedness;
  diagnosticoDetectorManos.totalManosDetectadas = totalManosDetectadas;
  diagnosticoDetectorManos.ultimoEvento =
    `onResults_landmarks_${totalLandmarks}_detectadas_${totalManosDetectadas}`;

  if (
    firmaResultados !== ultimaFirmaResultadosDiagnostico &&
    ahora - ultimoLogCambioResultadosTimestamp >= intervaloLogCambioResultadosMs
  ) {
    ultimaFirmaResultadosDiagnostico = firmaResultados;
    ultimoLogCambioResultadosTimestamp = ahora;
    console.info(
      `[Diagnostico manos] onResults instancia #${diagnosticoDetectorManos.generacionUltimoEnvio || "?"}: ` +
      `landmarks=${totalLandmarks}, handedness=${totalHandedness}, ` +
      `manosDetectadas=${totalManosDetectadas}`
    );
  }

}

function publicarDiagnosticoDetectorManos() {
  if (
    typeof globalThis.dispatchEvent !== "function" ||
    typeof globalThis.CustomEvent !== "function"
  ) {
    return;
  }

  globalThis.dispatchEvent(
    new globalThis.CustomEvent(NOMBRE_EVENTO_DIAGNOSTICO_DETECTOR_MANOS, {
      detail: obtenerDiagnosticoDetectorManos(),
    })
  );
}

function registrarListenerLandmarksCrudos(listener) {
  if (typeof listener !== "function") {
    throw new TypeError("El listener de landmarks debe ser una funcion.");
  }

  listenersLandmarksCrudos.push(listener);

  return function removerListenerLandmarksCrudos() {
    const indiceListener = listenersLandmarksCrudos.indexOf(listener);

    if (indiceListener >= 0) {
      listenersLandmarksCrudos.splice(indiceListener, 1);
    }
  };
}

function registrarListenerFotogramasManos(listener) {
  if (typeof listener !== "function") {
    throw new TypeError("El listener de fotogramas debe ser una funcion.");
  }

  listenersFotogramasManos.push(listener);

  return function removerListenerFotogramasManos() {
    const indiceListener = listenersFotogramasManos.indexOf(listener);

    if (indiceListener >= 0) {
      listenersFotogramasManos.splice(indiceListener, 1);
    }
  };
}

function registrarListenerExcepcionesManos(listener) {
  if (typeof listener !== "function") {
    throw new TypeError("El listener de excepciones debe ser una funcion.");
  }

  listenersExcepcionesManos.push(listener);

  return function removerListenerExcepcionesManos() {
    const indiceListener = listenersExcepcionesManos.indexOf(listener);

    if (indiceListener >= 0) {
      listenersExcepcionesManos.splice(indiceListener, 1);
    }
  };
}

function procesarFotogramaManos(resultados) {
  const evaluacionManos = extraerColeccionLandmarksManos(resultados);
  const manosDetectadas = evaluacionManos.manosValidas;
  const representacionCanonicaManos = construirRepresentacionCanonicaManos(manosDetectadas);
  const landmarksPorMano = manosDetectadas.map(function (mano) {
    return mano.puntosClave;
  });
  const clasificacionManos = resultados?.multiHandedness || [];
  const exclusionDatos = construirBanderasExclusionDatos(manosDetectadas);

  return {
    imagen: resultados?.image || null,
    manosDetectadas: manosDetectadas,
    representacionCanonicaManos: representacionCanonicaManos,
    matricesTridimensionales: extraerMatricesTridimensionales(manosDetectadas),
    landmarksPorMano: landmarksPorMano,
    clasificacionManos: clasificacionManos,
    manosDescartadas: evaluacionManos.manosDescartadas,
    exclusionDatos: exclusionDatos,
    umbralesConfianza: {
      deteccionMinima: umbralesConfianzaDetectorManos.deteccionMinima,
      seguimientoMinimo: umbralesConfianzaDetectorManos.seguimientoMinimo,
      clasificacionMinima: umbralesConfianzaDetectorManos.clasificacionMinima,
    },
    hayManos: landmarksPorMano.length > 0,
    totalManos: landmarksPorMano.length,
    estadoDeteccion: resolverEstadoDeteccionManos(landmarksPorMano, evaluacionManos.manosDescartadas),
    pose: extraerPoseCaptura(resultados?.poseLandmarks),
    cara: extraerCaraCaptura(resultados?.faceLandmarks),
    timestamp: Date.now(),
  };
}

function extraerPoseCaptura(landmarks) {
  return INDICES_POSE_CAPTURA.map(function (indice) {
    const punto = landmarks?.[indice];
    return punto && Number.isFinite(punto.x) ? [punto.x, punto.y, punto.z || 0] : null;
  });
}

function extraerCaraCaptura(landmarks) {
  return INDICES_CARA_CAPTURA.map(function (indice) {
    const punto = landmarks?.[indice];
    return punto && Number.isFinite(punto.x) ? [punto.x, punto.y, punto.z || 0] : null;
  });
}

function extraerMatricesTridimensionales(manosDetectadas) {
  return manosDetectadas.map(function (manoDetectada) {
    return {
      indiceMano: manoDetectada.indiceMano,
      handedness: manoDetectada.handedness,
      confianza: manoDetectada.confianza,
      exclusionDatos: manoDetectada.exclusionDatos,
      matriz: manoDetectada.puntosClave.map(function (punto) {
        return [punto.x, punto.y, punto.z];
      }),
    };
  });
}

function extraerColeccionLandmarksManos(resultados) {
  const coleccionLandmarks = resultados?.multiHandLandmarks || [];
  const clasificacionManos = resultados?.multiHandedness || [];

  return coleccionLandmarks.reduce(function (evaluacionManos, landmarks, indiceMano) {
    const handedness = normalizarMetricaHandednessMano(clasificacionManos[indiceMano], indiceMano);

    if (!reglasHeuristicasDetectorManos.cumpleTotalPuntosClaveMano(landmarks)) {
      evaluacionManos.manosDescartadas.push(
        crearDescarteMano(indiceMano, "landmarks_incompletos", handedness)
      );
      return evaluacionManos;
    }

    if (!cumpleUmbralConfianzaMano(handedness)) {
      evaluacionManos.manosDescartadas.push(
        crearDescarteMano(indiceMano, "confianza_insuficiente", handedness)
      );
      return evaluacionManos;
    }

    const exclusionDatos = evaluarExclusionMargenesPerimetralesMano(landmarks, indiceMano);

    evaluacionManos.manosValidas.push({
      indiceMano: indiceMano,
      handedness: handedness,
      lateralidadFisica: convertirHandednessMediaPipeALateralidadFisica(
        handedness.label
      ),
      confianza: {
        score: handedness.score,
        umbralMinimo: umbralesConfianzaDetectorManos.clasificacionMinima,
        cumpleUmbral: true,
      },
      exclusionDatos: exclusionDatos,
      puntosClave: abstraerPuntosClaveMano(landmarks),
    });

    return evaluacionManos;
  }, crearEvaluacionManosVacia());
}

function construirRepresentacionCanonicaManos(manosDetectadas) {
  const seleccionadas = new Set();
  const manosPorLateralidad = LATERALIDADES_FISICAS_MANOS.reduce(function (
    resultado,
    lateralidadFisica
  ) {
    const candidatas = manosDetectadas
      .map(function (mano, indice) {
        return { mano: mano, indice: indice };
      })
      .filter(function (candidata) {
        return (
          !seleccionadas.has(candidata.indice) &&
          candidata.mano.lateralidadFisica === lateralidadFisica
        );
      })
      .sort(function (candidataA, candidataB) {
        const referencia = continuidadRepresentacionCanonica[lateralidadFisica];

        if (referencia) {
          const distanciaA = calcularDistanciaPuntosMano(
            candidataA.mano.puntosClave[0],
            referencia
          );
          const distanciaB = calcularDistanciaPuntosMano(
            candidataB.mano.puntosClave[0],
            referencia
          );

          if (distanciaA !== distanciaB) {
            return distanciaA - distanciaB;
          }
        }

        return candidataB.mano.handedness.score - candidataA.mano.handedness.score;
      });
    const seleccionada = candidatas[0] || null;

    if (seleccionada) {
      seleccionadas.add(seleccionada.indice);
      continuidadRepresentacionCanonica[lateralidadFisica] = copiarPuntoMano(
        seleccionada.mano.puntosClave[0]
      );
      resultado[lateralidadFisica] = seleccionada.mano;
    }

    return resultado;
  }, {});

  return {
    izquierda: construirSlotCanonicoMano("Left", manosPorLateralidad.Left),
    derecha: construirSlotCanonicoMano("Right", manosPorLateralidad.Right),
  };
}

function construirSlotCanonicoMano(lateralidadFisica, manoDetectada = null) {
  const nombreLateralidad = lateralidadFisica === "Left" ? "izquierda" : "derecha";

  if (!manoDetectada) {
    return {
      identidadTemporal: `mano_${nombreLateralidad}`,
      lateralidadFisica: lateralidadFisica,
      presente: false,
      landmarks: [],
      handedness: null,
      exclusionDatos: null,
      indiceManoFuente: null,
    };
  }

  return {
    identidadTemporal: `mano_${nombreLateralidad}`,
    lateralidadFisica: lateralidadFisica,
    presente: true,
    landmarks: manoDetectada.puntosClave.map(copiarPuntoMano),
    handedness: {
      label: manoDetectada.handedness.label,
      score: manoDetectada.handedness.score,
    },
    exclusionDatos: manoDetectada.exclusionDatos,
    indiceManoFuente: manoDetectada.indiceMano,
  };
}

function convertirHandednessMediaPipeALateralidadFisica(etiquetaMediaPipe) {
  if (etiquetaMediaPipe === "Left") {
    return "Right";
  }

  if (etiquetaMediaPipe === "Right") {
    return "Left";
  }

  return null;
}

function calcularDistanciaPuntosMano(puntoA, puntoB) {
  if (!puntoA || !puntoB) {
    return Number.POSITIVE_INFINITY;
  }

  const diferenciaX = puntoA.x - puntoB.x;
  const diferenciaY = puntoA.y - puntoB.y;
  const diferenciaZ = puntoA.z - puntoB.z;

  return Math.sqrt(
    diferenciaX * diferenciaX +
      diferenciaY * diferenciaY +
      diferenciaZ * diferenciaZ
  );
}

function copiarPuntoMano(punto) {
  return {
    x: punto.x,
    y: punto.y,
    z: punto.z,
  };
}

function crearEvaluacionManosVacia() {
  return {
    manosValidas: [],
    manosDescartadas: [],
  };
}

function normalizarMetricaHandednessMano(handedness, indiceMano) {
  const clasificacionPrincipal = Array.isArray(handedness?.classification)
    ? handedness.classification[0]
    : handedness;
  const score = Number.isFinite(clasificacionPrincipal?.score) ? clasificacionPrincipal.score : 0;

  return {
    indiceMano: indiceMano,
    label: clasificacionPrincipal?.label || handedness?.label || "sin_clasificacion",
    score: score,
    raw: handedness || null,
  };
}

function cumpleUmbralConfianzaMano(handedness) {
  return reglasHeuristicasDetectorManos.cumpleUmbralConfianzaMano(
    handedness,
    umbralesConfianzaDetectorManos
  );
}

function crearDescarteMano(indiceMano, motivo, handedness) {
  return {
    indiceMano: indiceMano,
    motivo: motivo,
    handedness: handedness,
    confianza: {
      score: handedness.score,
      umbralMinimo: umbralesConfianzaDetectorManos.clasificacionMinima,
      cumpleUmbral: false,
    },
  };
}

function evaluarExclusionMargenesPerimetralesMano(landmarks, indiceMano) {
  return reglasHeuristicasDetectorManos.evaluarExclusionMargenesPerimetralesMano(
    landmarks,
    indiceMano,
    configuracionExclusionMargenesCamara
  );
}

function construirBanderasExclusionDatos(manosDetectadas) {
  return reglasHeuristicasDetectorManos.construirBanderasExclusionDatos(
    manosDetectadas,
    configuracionExclusionMargenesCamara
  );
}

function resolverEstadoDeteccionManos(landmarksPorMano, manosDescartadas) {
  return reglasHeuristicasDetectorManos.resolverEstadoDeteccionManos(
    landmarksPorMano,
    manosDescartadas
  );
}

function abstraerPuntosClaveMano(landmarks) {
  return reglasHeuristicasDetectorManos.abstraerPuntosClaveMano(landmarks);
}

function gestionarAusenciaManos(fotogramaProcesado) {
  if (fotogramaProcesado.hayManos) {
    return;
  }

  if (fotogramaProcesado.estadoDeteccion === "confianza_insuficiente_mediapipe") {
    enviarExcepcionManos({
      tipo: "confianza_insuficiente_mediapipe",
      mensaje: "MediaPipe descarto la mano porque su score nativo no alcanzo el umbral minimo.",
      umbralesConfianza: fotogramaProcesado.umbralesConfianza,
      manosDescartadas: fotogramaProcesado.manosDescartadas,
      timestamp: fotogramaProcesado.timestamp,
    });
    return;
  }

  enviarExcepcionManos({
    tipo: "sin_mano_en_encuadre",
    mensaje: "No se detecto ninguna mano dentro del encuadre.",
    timestamp: fotogramaProcesado.timestamp,
  });
}

function gestionarExclusionDatosManos(fotogramaProcesado) {
  if (!fotogramaProcesado.exclusionDatos?.excluir) {
    return;
  }

  enviarExcepcionManos({
    tipo: "margenes_perimetrales_comprometidos",
    mensaje: "Se marcaron puntos clave para exclusion porque rozan o exceden los margenes de la camara.",
    exclusionDatos: fotogramaProcesado.exclusionDatos,
    timestamp: fotogramaProcesado.timestamp,
  });
}

function validarRecepcionMatrizTridimensional(fotogramaProcesado) {
  if (!fotogramaProcesado.hayManos) {
    return;
  }

  fotogramaProcesado.matricesTridimensionales.forEach(function (matrizMano) {
    const matrizValida = validarMatrizTridimensionalMano(matrizMano.matriz);
    const etiquetaMano = matrizMano.handedness?.label || "sin_clasificacion";
    const confianzaMano = Number.isFinite(matrizMano.confianza?.score)
      ? matrizMano.confianza.score.toFixed(3)
      : "sin_score";
    const exclusionDatos = matrizMano.exclusionDatos?.excluir ? "excluir_datos" : "datos_validos";
    const motivoLog = `${matrizValida ? "matriz_valida" : "matriz_invalida"}_${exclusionDatos}`;

    if (!debeRegistrarValidacionMatriz(fotogramaProcesado.timestamp, motivoLog)) {
      return;
    }

    console.debug(
      `[MediaPipe Hands] matriz 3D recibida - mano ${matrizMano.indiceMano} (${etiquetaMano}) - score: ${confianzaMano} - ${exclusionDatos} - valida: ${matrizValida}`
    );

    if (globalThis.AULASENAS_DIAGNOSTICO_MATRIZ_MEDIAPIPE === true) {
      console.table(
        matrizMano.matriz.map(function (coordenadas, indicePunto) {
          return {
            punto: indicePunto,
            nombre: nombresPuntosClaveMano[indicePunto],
            x: coordenadas[0],
            y: coordenadas[1],
            z: coordenadas[2],
          };
        })
      );
    }
  });
}

function debeRegistrarValidacionMatriz(timestamp, motivo) {
  const motivoCambio = motivo !== ultimoMotivoValidacionMatriz;

  if (!motivoCambio && timestamp - ultimaValidacionMatrizTimestamp < intervaloValidacionMatrizMs) {
    return false;
  }

  ultimaValidacionMatrizTimestamp = timestamp;
  ultimoMotivoValidacionMatriz = motivo;
  return true;
}

function validarMatrizTridimensionalMano(matriz) {
  return reglasHeuristicasDetectorManos.validarMatrizTridimensionalMano(matriz);
}

function recibirResultadosManos(resultados, fotogramaProcesado = procesarFotogramaManos(resultados)) {
  fotogramaProcesado.manosDetectadas.forEach(function (manoDetectada) {
    enviarLandmarksCrudos({
      landmarks: manoDetectada.puntosClave,
      handedness: manoDetectada.handedness,
      confianza: manoDetectada.confianza,
      exclusionDatos: manoDetectada.exclusionDatos,
      indiceMano: manoDetectada.indiceMano,
      timestamp: fotogramaProcesado.timestamp,
    });
  });
}

function enviarFotogramaManos(fotogramaProcesado) {
  const inicioListeners = obtenerTiempoMonotonoMs();
  listenersFotogramasManos.forEach(function (listener) {
    listener(fotogramaProcesado);
  });
  const tiempoListenersMs = Math.max(0, obtenerTiempoMonotonoMs() - inicioListeners);
  rendimientoDetectorManos.tiempoListenersAcumuladoMs += tiempoListenersMs;
  rendimientoDetectorManos.ultimoTiempoListenersMs = Number(tiempoListenersMs.toFixed(2));
  rendimientoDetectorManos.tiempoListenersMaximoMs = Math.max(
    rendimientoDetectorManos.tiempoListenersMaximoMs,
    Number(tiempoListenersMs.toFixed(2))
  );
}

function enviarExcepcionManos(excepcion) {
  listenersExcepcionesManos.forEach(function (listener) {
    listener(excepcion);
  });
}

function enviarLandmarksCrudos(datosLandmarks) {
  listenersLandmarksCrudos.forEach(function (listener) {
    listener(datosLandmarks);
  });
}
