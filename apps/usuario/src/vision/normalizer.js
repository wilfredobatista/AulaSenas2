/* Normalizador autoritativo de manos: traslada a muñeca, escala palma y produce vectores de 63 valores. */
const indicesNormalizacionMano = Object.freeze({
  muneca: 0,
  indiceMcp: 5,
  medioMcp: 9,
  anularMcp: 13,
  meniqueMcp: 17,
});
const totalLandmarksMano = 21;
const totalCoordenadasPorLandmark = 3;
const totalValoresVectorMano = totalLandmarksMano * totalCoordenadasPorLandmark;

const configuracionNormalizacionMano = Object.freeze({
  indiceOrigen: indicesNormalizacionMano.muneca,
  indiceBasePalma: indicesNormalizacionMano.muneca,
  indiceCentroPalma: indicesNormalizacionMano.medioMcp,
  indicesEscala: Object.freeze([
    indicesNormalizacionMano.indiceMcp,
    indicesNormalizacionMano.medioMcp,
    indicesNormalizacionMano.anularMcp,
    indicesNormalizacionMano.meniqueMcp,
  ]),
  escalaMinima: 0.000001,
});

function normalizarLandmarksMano(landmarks, opciones = {}) {
  if (!validarLandmarksParaNormalizacion(landmarks)) {
    return crearResultadoNormalizacionVacio("landmarks_invalidos");
  }

  const configuracion = crearConfiguracionNormalizacion(opciones);
  const origen = normalizarPuntoEspacial(landmarks[configuracion.indiceOrigen]);
  const landmarksTrasladados =
    configuracion.indiceOrigen === indicesNormalizacionMano.muneca
      ? trasladarLandmarksRespectoMuneca(landmarks)
      : trasladarLandmarksAlOrigen(landmarks, origen);
  const escala = calcularEscalaMano(landmarksTrasladados, configuracion);
  const landmarksNormalizados = escalarLandmarksMano(landmarksTrasladados, escala);
  const vectorCaracteristicas = aplanarLandmarksAVector63(landmarksNormalizados);
  const vectorValido = validarVectorCaracteristicas63(vectorCaracteristicas);
  const datosCrudos = construirBloqueDatosCrudos(landmarks, configuracion);
  const datosProcesados = construirBloqueDatosProcesados({
    landmarksTrasladados: landmarksTrasladados,
    landmarksNormalizados: landmarksNormalizados,
    vectorCaracteristicas: vectorCaracteristicas,
    vectorValido: vectorValido,
    origen: origen,
    escala: escala,
    configuracion: configuracion,
  });

  return {
    crudo: datosCrudos,
    procesado: datosProcesados,
    landmarks: landmarksNormalizados,
    vector: vectorCaracteristicas,
    vectorValido: vectorValido,
    origen: origen,
    escala: escala,
    valido: true,
    motivo: "normalizacion_exitosa",
  };
}

function normalizarLandmarksRespectoMuneca(landmarks) {
  return normalizarLandmarksMano(landmarks).landmarks;
}

function construirBloqueDatosCrudos(landmarks, configuracion) {
  return {
    landmarks: copiarLandmarksParaAuditoria(landmarks),
    vector: aplanarLandmarksAVector63(landmarks),
    totalLandmarks: Array.isArray(landmarks) ? landmarks.length : 0,
    vectorValido: validarVectorCaracteristicas63(aplanarLandmarksAVector63(landmarks)),
    referencia: {
      indiceOrigen: configuracion.indiceOrigen,
      indiceBasePalma: configuracion.indiceBasePalma,
      indiceCentroPalma: configuracion.indiceCentroPalma,
    },
  };
}

function construirBloqueDatosProcesados(datosNormalizacion) {
  return {
    landmarksTrasladados: datosNormalizacion.landmarksTrasladados,
    landmarksNormalizados: datosNormalizacion.landmarksNormalizados,
    vector: datosNormalizacion.vectorCaracteristicas,
    vectorValido: datosNormalizacion.vectorValido,
    totalLandmarks: datosNormalizacion.landmarksNormalizados.length,
    dimensionesVector: {
      landmarks: totalLandmarksMano,
      coordenadasPorLandmark: totalCoordenadasPorLandmark,
      totalValores: totalValoresVectorMano,
    },
    transformacion: {
      origen: datosNormalizacion.origen,
      escala: datosNormalizacion.escala,
      metodoTraslacion:
        datosNormalizacion.configuracion.indiceOrigen === indicesNormalizacionMano.muneca
          ? "resta_muneca_punto_0"
          : "resta_origen_configurado",
      metodoEscala: "distancia_euclidiana_palma_3d",
    },
  };
}

function copiarLandmarksParaAuditoria(landmarks) {
  if (!Array.isArray(landmarks)) {
    return [];
  }

  return landmarks.map(function (punto, indicePunto) {
    const puntoNormalizado = normalizarPuntoEspacial(punto);

    return conservarMetadatosPunto(punto, {
      indice: Number.isInteger(punto.indice) ? punto.indice : indicePunto,
      x: puntoNormalizado.x,
      y: puntoNormalizado.y,
      z: puntoNormalizado.z,
    });
  });
}

function trasladarLandmarksRespectoMuneca(landmarks) {
  if (!validarLandmarksParaNormalizacion(landmarks)) {
    return [];
  }

  const muneca = normalizarPuntoEspacial(landmarks[indicesNormalizacionMano.muneca]);

  return landmarks.map(function (punto, indicePunto) {
    if (indicePunto === indicesNormalizacionMano.muneca) {
      return conservarMetadatosPunto(punto, {
        indice: Number.isInteger(punto.indice) ? punto.indice : indicePunto,
        x: 0,
        y: 0,
        z: 0,
      });
    }

    const puntoNormalizado = normalizarPuntoEspacial(punto);

    return conservarMetadatosPunto(punto, {
      indice: Number.isInteger(punto.indice) ? punto.indice : indicePunto,
      x: puntoNormalizado.x - muneca.x,
      y: puntoNormalizado.y - muneca.y,
      z: puntoNormalizado.z - muneca.z,
    });
  });
}

function crearConfiguracionNormalizacion(opciones) {
  return {
    indiceOrigen: Number.isInteger(opciones.indiceOrigen)
      ? opciones.indiceOrigen
      : configuracionNormalizacionMano.indiceOrigen,
    indiceBasePalma: Number.isInteger(opciones.indiceBasePalma)
      ? opciones.indiceBasePalma
      : configuracionNormalizacionMano.indiceBasePalma,
    indiceCentroPalma: Number.isInteger(opciones.indiceCentroPalma)
      ? opciones.indiceCentroPalma
      : configuracionNormalizacionMano.indiceCentroPalma,
    indicesEscala: Array.isArray(opciones.indicesEscala) && opciones.indicesEscala.length > 0
      ? opciones.indicesEscala
      : configuracionNormalizacionMano.indicesEscala,
    escalaMinima: Number.isFinite(opciones.escalaMinima)
      ? opciones.escalaMinima
      : configuracionNormalizacionMano.escalaMinima,
  };
}

function validarLandmarksParaNormalizacion(landmarks) {
  return (
    Array.isArray(landmarks) &&
    landmarks.length > 0 &&
    landmarks.every(function (punto) {
      return punto && Number.isFinite(punto.x) && Number.isFinite(punto.y);
    })
  );
}

function trasladarLandmarksAlOrigen(landmarks, origen) {
  return landmarks.map(function (punto, indicePunto) {
    const puntoNormalizado = normalizarPuntoEspacial(punto);

    return conservarMetadatosPunto(punto, {
      indice: Number.isInteger(punto.indice) ? punto.indice : indicePunto,
      x: puntoNormalizado.x - origen.x,
      y: puntoNormalizado.y - origen.y,
      z: puntoNormalizado.z - origen.z,
    });
  });
}

function calcularEscalaMano(landmarksTrasladados, configuracion = configuracionNormalizacionMano) {
  const factorEscalaPalma = calcularFactorEscalaPalma(landmarksTrasladados, configuracion);

  if (factorEscalaPalma > configuracion.escalaMinima) {
    return factorEscalaPalma;
  }

  const distanciasReferencia = configuracion.indicesEscala
    .map(function (indicePunto) {
      return landmarksTrasladados[indicePunto];
    })
    .filter(Boolean)
    .map(calcularMagnitud3D)
    .filter(function (distancia) {
      return distancia > configuracion.escalaMinima;
    });

  if (distanciasReferencia.length > 0) {
    return calcularPromedio(distanciasReferencia);
  }

  return calcularEscalaFallback(landmarksTrasladados, configuracion.escalaMinima);
}

function calcularFactorEscalaPalma(landmarksTrasladados, configuracion = configuracionNormalizacionMano) {
  const puntoBasePalma = landmarksTrasladados[configuracion.indiceBasePalma];
  const puntoCentroPalma = landmarksTrasladados[configuracion.indiceCentroPalma];

  if (!puntoBasePalma || !puntoCentroPalma) {
    return 0;
  }

  return calcularDistanciaEuclidiana3D(puntoBasePalma, puntoCentroPalma);
}

function calcularDistanciaEuclidiana3D(puntoA, puntoB) {
  const puntoNormalizadoA = normalizarPuntoEspacial(puntoA);
  const puntoNormalizadoB = normalizarPuntoEspacial(puntoB);
  const diferenciaX = puntoNormalizadoA.x - puntoNormalizadoB.x;
  const diferenciaY = puntoNormalizadoA.y - puntoNormalizadoB.y;
  const diferenciaZ = puntoNormalizadoA.z - puntoNormalizadoB.z;

  return Math.sqrt(
    diferenciaX * diferenciaX + diferenciaY * diferenciaY + diferenciaZ * diferenciaZ
  );
}

function calcularEscalaFallback(landmarksTrasladados, escalaMinima) {
  const mayorMagnitud = landmarksTrasladados.reduce(function (magnitudActual, punto) {
    return Math.max(magnitudActual, calcularMagnitud3D(punto));
  }, 0);

  return mayorMagnitud > escalaMinima ? mayorMagnitud : 1;
}

function escalarLandmarksMano(landmarksTrasladados, escala) {
  const escalaSegura = escala > configuracionNormalizacionMano.escalaMinima ? escala : 1;

  return landmarksTrasladados.map(function (punto) {
    return conservarMetadatosPunto(punto, {
      indice: punto.indice,
      x: punto.x / escalaSegura,
      y: punto.y / escalaSegura,
      z: punto.z / escalaSegura,
    });
  });
}

function convertirLandmarksAVectorCaracteristicas(landmarks) {
  return aplanarLandmarksAVector63(landmarks);
}

function aplanarLandmarksAVector63(landmarks) {
  if (!Array.isArray(landmarks)) {
    return crearVectorCaracteristicasVacio();
  }

  const vectorCaracteristicas = [];

  for (let indicePunto = 0; indicePunto < totalLandmarksMano; indicePunto += 1) {
    const puntoNormalizado = normalizarPuntoEspacial(landmarks[indicePunto]);

    vectorCaracteristicas.push(
      convertirAFlotanteSeguro(puntoNormalizado.x),
      convertirAFlotanteSeguro(puntoNormalizado.y),
      convertirAFlotanteSeguro(puntoNormalizado.z)
    );
  }

  return vectorCaracteristicas;
}

function validarVectorCaracteristicas63(vectorCaracteristicas) {
  return (
    Array.isArray(vectorCaracteristicas) &&
    vectorCaracteristicas.length === totalValoresVectorMano &&
    vectorCaracteristicas.every(function (valor) {
      return Number.isFinite(valor);
    })
  );
}

function crearVectorCaracteristicasVacio() {
  return Array.from({ length: totalValoresVectorMano }, function () {
    return 0;
  });
}

function convertirAFlotanteSeguro(valor) {
  return Number.isFinite(valor) ? parseFloat(valor) : 0;
}

function normalizarPuntoEspacial(punto) {
  return {
    x: Number.isFinite(punto?.x) ? punto.x : 0,
    y: Number.isFinite(punto?.y) ? punto.y : 0,
    z: Number.isFinite(punto?.z) ? punto.z : 0,
  };
}

function conservarMetadatosPunto(puntoOriginal, coordenadas) {
  return {
    indice: coordenadas.indice,
    nombre: puntoOriginal.nombre || null,
    x: coordenadas.x,
    y: coordenadas.y,
    z: coordenadas.z,
    visibilidad: Number.isFinite(puntoOriginal.visibilidad) ? puntoOriginal.visibilidad : 0,
  };
}

function calcularMagnitud3D(punto) {
  const puntoNormalizado = normalizarPuntoEspacial(punto);

  return Math.sqrt(
    puntoNormalizado.x * puntoNormalizado.x +
      puntoNormalizado.y * puntoNormalizado.y +
      puntoNormalizado.z * puntoNormalizado.z
  );
}

function calcularPromedio(valores) {
  const suma = valores.reduce(function (total, valor) {
    return total + valor;
  }, 0);

  return suma / valores.length;
}

function crearResultadoNormalizacionVacio(motivo) {
  const vectorVacio = crearVectorCaracteristicasVacio();

  return {
    crudo: {
      landmarks: [],
      vector: vectorVacio,
      totalLandmarks: 0,
      vectorValido: false,
      referencia: {
        indiceOrigen: configuracionNormalizacionMano.indiceOrigen,
        indiceBasePalma: configuracionNormalizacionMano.indiceBasePalma,
        indiceCentroPalma: configuracionNormalizacionMano.indiceCentroPalma,
      },
    },
    procesado: {
      landmarksTrasladados: [],
      landmarksNormalizados: [],
      vector: vectorVacio,
      vectorValido: false,
      totalLandmarks: 0,
      dimensionesVector: {
        landmarks: totalLandmarksMano,
        coordenadasPorLandmark: totalCoordenadasPorLandmark,
        totalValores: totalValoresVectorMano,
      },
      transformacion: {
        origen: null,
        escala: 1,
        metodoTraslacion: null,
        metodoEscala: null,
      },
    },
    landmarks: [],
    vector: vectorVacio,
    vectorValido: false,
    origen: null,
    escala: 1,
    valido: false,
    motivo: motivo,
  };
}
