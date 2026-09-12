/* Reglas autoritativas de confianza, márgenes, validación y abstracción de landmarks. */
(function (global) {
  const NOMBRES_PUNTOS_CLAVE_MANO = Object.freeze([
    "muneca",
    "pulgar_cmc",
    "pulgar_mcp",
    "pulgar_ip",
    "pulgar_punta",
    "indice_mcp",
    "indice_pip",
    "indice_dip",
    "indice_punta",
    "medio_mcp",
    "medio_pip",
    "medio_dip",
    "medio_punta",
    "anular_mcp",
    "anular_pip",
    "anular_dip",
    "anular_punta",
    "menique_mcp",
    "menique_pip",
    "menique_dip",
    "menique_punta",
  ]);
  const TOTAL_PUNTOS_CLAVE_MANO = NOMBRES_PUNTOS_CLAVE_MANO.length;
  const COORDENADAS_REQUERIDAS_LANDMARK = Object.freeze(["x", "y", "z"]);
  const CONFIGURACION_FILTRO_VARIANZA_FIJA = Object.freeze({
    minFrames: 6,
    varianzaPromedioMaxima: 0.00014,
    varianzaPuntoMaxima: 0.0007,
    desplazamientoCentroideMaximo: 0.05,
    // Tolerancia para ruido normal de MediaPipe: subir este valor si una mano quieta se rechaza como movimiento.
    toleranciaMicroMovimientoLandmark: 0.04,
  });
  const CONFIGURACION_EXCLUSION_MARGENES_CAMARA = Object.freeze({
    margenPerimetralNormalizado: 0.04,
    limiteMinimoNormalizado: 0,
    limiteMaximoNormalizado: 1,
  });
  const CONFIGURACION_CONFIANZA_BASE =
    typeof configuracionConfianzaMediaPipeManos === "object"
      ? configuracionConfianzaMediaPipeManos
      : {};
  const CONFIGURACION_CONFIANZA_DETECTOR_MANOS = crearConfiguracionConfianzaDetectorManos(
    CONFIGURACION_CONFIANZA_BASE
  );

  function obtenerNombresPuntosClaveMano() {
    return NOMBRES_PUNTOS_CLAVE_MANO;
  }

  function obtenerCoordenadasRequeridasLandmark() {
    return COORDENADAS_REQUERIDAS_LANDMARK;
  }

  function obtenerConfiguracionFiltroVarianzaFija() {
    return CONFIGURACION_FILTRO_VARIANZA_FIJA;
  }

  function obtenerConfiguracionExclusionMargenesCamara(opciones = {}) {
    return crearConfiguracionExclusionMargenesCamara(opciones);
  }

  function obtenerUmbralesConfianzaDetectorManos(opciones = {}) {
    return crearConfiguracionConfianzaDetectorManos({
      deteccionMinima: Number.isFinite(opciones.deteccionMinima)
        ? opciones.deteccionMinima
        : CONFIGURACION_CONFIANZA_DETECTOR_MANOS.deteccionMinima,
      seguimientoMinimo: Number.isFinite(opciones.seguimientoMinimo)
        ? opciones.seguimientoMinimo
        : CONFIGURACION_CONFIANZA_DETECTOR_MANOS.seguimientoMinimo,
      clasificacionMinima: Number.isFinite(opciones.clasificacionMinima)
        ? opciones.clasificacionMinima
        : CONFIGURACION_CONFIANZA_DETECTOR_MANOS.clasificacionMinima,
    });
  }

  function validarLandmarksTemplate(landmarks) {
    afirmarColeccionLandmarksTemplate(landmarks);
    afirmarPresenciaExplicitaPuntosTemplate(landmarks);
  }

  function evaluarFiltroVarianzaTemporalCapturaFija(framesLandmarksNormalizados, opciones = {}) {
    const configuracion = crearConfiguracionFiltroVarianzaFija(opciones);

    afirmarFramesTemporalesCapturaFija(framesLandmarksNormalizados);

    if (framesLandmarksNormalizados.length < configuracion.minFrames) {
      return crearResultadoFiltroVarianzaFija({
        estable: false,
        motivo: "fotogramas_insuficientes",
        totalFrames: framesLandmarksNormalizados.length,
        configuracion: configuracion,
      });
    }

    framesLandmarksNormalizados.forEach(validarLandmarksTemplate);

    const landmarksReferencia = calcularLandmarksPromedioTemporalTemplate(framesLandmarksNormalizados);
    const metricas = calcularMetricasVarianzaTemporalTemplate(
      framesLandmarksNormalizados,
      landmarksReferencia,
      configuracion
    );
    const estable =
      metricas.varianzaPromedio <= configuracion.varianzaPromedioMaxima &&
      metricas.varianzaPuntoMaxima <= configuracion.varianzaPuntoMaxima &&
      metricas.desplazamientoCentroideMaximo <= configuracion.desplazamientoCentroideMaximo;

    return crearResultadoFiltroVarianzaFija({
      estable: estable,
      motivo: estable ? "mano_inmovil" : "movimiento_detectado",
      totalFrames: framesLandmarksNormalizados.length,
      configuracion: configuracion,
      metricas: metricas,
      landmarksReferencia: landmarksReferencia,
    });
  }

  function crearConfiguracionFiltroVarianzaFija(opciones = {}) {
    return {
      minFrames: Number.isInteger(opciones.minFrames)
        ? opciones.minFrames
        : CONFIGURACION_FILTRO_VARIANZA_FIJA.minFrames,
      varianzaPromedioMaxima: Number.isFinite(opciones.varianzaPromedioMaxima)
        ? opciones.varianzaPromedioMaxima
        : CONFIGURACION_FILTRO_VARIANZA_FIJA.varianzaPromedioMaxima,
      varianzaPuntoMaxima: Number.isFinite(opciones.varianzaPuntoMaxima)
        ? opciones.varianzaPuntoMaxima
        : CONFIGURACION_FILTRO_VARIANZA_FIJA.varianzaPuntoMaxima,
      desplazamientoCentroideMaximo: Number.isFinite(opciones.desplazamientoCentroideMaximo)
        ? opciones.desplazamientoCentroideMaximo
        : CONFIGURACION_FILTRO_VARIANZA_FIJA.desplazamientoCentroideMaximo,
      toleranciaMicroMovimientoLandmark: Number.isFinite(opciones.toleranciaMicroMovimientoLandmark)
        ? opciones.toleranciaMicroMovimientoLandmark
        : CONFIGURACION_FILTRO_VARIANZA_FIJA.toleranciaMicroMovimientoLandmark,
    };
  }

  function afirmarFramesTemporalesCapturaFija(framesLandmarksNormalizados) {
    if (!Array.isArray(framesLandmarksNormalizados)) {
      throw new TypeError("El filtro temporal de captura fija requiere un arreglo de fotogramas.");
    }
  }

  function calcularLandmarksPromedioTemporalTemplate(framesLandmarksNormalizados) {
    return NOMBRES_PUNTOS_CLAVE_MANO.map(function (nombrePunto, indicePunto) {
      const puntoPromedio = calcularPuntoPromedioTemporalTemplate(
        framesLandmarksNormalizados,
        indicePunto
      );

      return {
        indice: indicePunto,
        nombre: nombrePunto,
        x: puntoPromedio.x,
        y: puntoPromedio.y,
        z: puntoPromedio.z,
        visibilidad: puntoPromedio.visibilidad,
      };
    });
  }

  function calcularPuntoPromedioTemporalTemplate(framesLandmarksNormalizados, indicePunto) {
    const totales = framesLandmarksNormalizados.reduce(
      function (acumulado, landmarksFrame) {
        const punto = landmarksFrame[indicePunto];

        acumulado.x += punto.x;
        acumulado.y += punto.y;
        acumulado.z += punto.z;
        acumulado.visibilidad += Number.isFinite(punto.visibilidad) ? punto.visibilidad : 0;

        return acumulado;
      },
      { x: 0, y: 0, z: 0, visibilidad: 0 }
    );

    return {
      x: totales.x / framesLandmarksNormalizados.length,
      y: totales.y / framesLandmarksNormalizados.length,
      z: totales.z / framesLandmarksNormalizados.length,
      visibilidad: totales.visibilidad / framesLandmarksNormalizados.length,
    };
  }

  function calcularMetricasVarianzaTemporalTemplate(
    framesLandmarksNormalizados,
    landmarksReferencia,
    configuracion = CONFIGURACION_FILTRO_VARIANZA_FIJA
  ) {
    const toleranciaMicroMovimiento = normalizarToleranciaMicroMovimientoLandmark(configuracion);
    const varianzasPorPunto = landmarksReferencia.map(function (puntoReferencia, indicePunto) {
      const sumaDistanciasCuadradas = framesLandmarksNormalizados.reduce(function (
        suma,
        landmarksFrame
      ) {
        return (
          suma +
          calcularDistanciaCuadradaConToleranciaTemplate(
            landmarksFrame[indicePunto],
            puntoReferencia,
            toleranciaMicroMovimiento
          )
        );
      }, 0);

      return sumaDistanciasCuadradas / framesLandmarksNormalizados.length;
    });
    const varianzaPromedio =
      varianzasPorPunto.reduce(function (suma, varianzaPunto) {
        return suma + varianzaPunto;
      }, 0) / varianzasPorPunto.length;
    const varianzaPuntoMaxima = Math.max(...varianzasPorPunto);

    return {
      varianzaPromedio: varianzaPromedio,
      varianzaPuntoMaxima: varianzaPuntoMaxima,
      desplazamientoCentroideMaximo: calcularDesplazamientoCentroideMaximoTemplate(
        framesLandmarksNormalizados
      ),
      toleranciaMicroMovimientoLandmark: toleranciaMicroMovimiento,
      varianzasPorPunto: varianzasPorPunto,
    };
  }

  function normalizarToleranciaMicroMovimientoLandmark(configuracion) {
    return Number.isFinite(configuracion.toleranciaMicroMovimientoLandmark)
      ? Math.max(0, configuracion.toleranciaMicroMovimientoLandmark)
      : 0;
  }

  function calcularDistanciaCuadradaConToleranciaTemplate(puntoA, puntoB, tolerancia) {
    const distancia = Math.sqrt(calcularDistanciaCuadradaPuntosTemplate(puntoA, puntoB));
    const distanciaAjustada = Math.max(0, distancia - tolerancia);

    return distanciaAjustada * distanciaAjustada;
  }

  function calcularDistanciaCuadradaPuntosTemplate(puntoA, puntoB) {
    const diferenciaX = puntoA.x - puntoB.x;
    const diferenciaY = puntoA.y - puntoB.y;
    const diferenciaZ = puntoA.z - puntoB.z;

    return diferenciaX * diferenciaX + diferenciaY * diferenciaY + diferenciaZ * diferenciaZ;
  }

  function calcularDesplazamientoCentroideMaximoTemplate(framesLandmarksNormalizados) {
    const centroides = framesLandmarksNormalizados.map(calcularCentroideLandmarksTemplate);
    const centroideReferencia = centroides[0];

    return centroides.reduce(function (desplazamientoMaximo, centroideActual) {
      const desplazamiento = Math.sqrt(
        calcularDistanciaCuadradaPuntosTemplate(centroideActual, centroideReferencia)
      );

      return Math.max(desplazamientoMaximo, desplazamiento);
    }, 0);
  }

  function calcularCentroideLandmarksTemplate(landmarks) {
    const totales = landmarks.reduce(
      function (acumulado, punto) {
        acumulado.x += punto.x;
        acumulado.y += punto.y;
        acumulado.z += punto.z;

        return acumulado;
      },
      { x: 0, y: 0, z: 0 }
    );

    return {
      x: totales.x / landmarks.length,
      y: totales.y / landmarks.length,
      z: totales.z / landmarks.length,
    };
  }

  function crearResultadoFiltroVarianzaFija(datosFiltro) {
    return {
      estable: datosFiltro.estable,
      motivo: datosFiltro.motivo,
      totalFrames: datosFiltro.totalFrames,
      minFrames: datosFiltro.configuracion.minFrames,
      umbrales: {
        varianzaPromedioMaxima: datosFiltro.configuracion.varianzaPromedioMaxima,
        varianzaPuntoMaxima: datosFiltro.configuracion.varianzaPuntoMaxima,
        desplazamientoCentroideMaximo: datosFiltro.configuracion.desplazamientoCentroideMaximo,
        toleranciaMicroMovimientoLandmark:
          datosFiltro.configuracion.toleranciaMicroMovimientoLandmark,
      },
      metricas: datosFiltro.metricas || {
        varianzaPromedio: null,
        varianzaPuntoMaxima: null,
        desplazamientoCentroideMaximo: null,
        toleranciaMicroMovimientoLandmark:
          datosFiltro.configuracion.toleranciaMicroMovimientoLandmark,
        varianzasPorPunto: [],
      },
      landmarksReferencia: datosFiltro.landmarksReferencia || [],
    };
  }

  function afirmarColeccionLandmarksTemplate(landmarks) {
    if (!Array.isArray(landmarks)) {
      throw new TypeError("Los landmarks del template deben ser un arreglo.");
    }

    if (landmarks.length !== TOTAL_PUNTOS_CLAVE_MANO) {
      throw new Error(
        `Los landmarks del template deben contener explicitamente ${TOTAL_PUNTOS_CLAVE_MANO} puntos; se recibieron ${landmarks.length}.`
      );
    }
  }

  function afirmarPresenciaExplicitaPuntosTemplate(landmarks) {
    NOMBRES_PUNTOS_CLAVE_MANO.forEach(function (nombreEsperado, indiceEsperado) {
      afirmarPuntoRequeridoTemplate(landmarks[indiceEsperado], indiceEsperado, nombreEsperado);
    });
  }

  function afirmarPuntoRequeridoTemplate(punto, indiceEsperado, nombreEsperado) {
    if (!punto || typeof punto !== "object" || Array.isArray(punto)) {
      throw new Error(
        `Falta el punto requerido ${indiceEsperado} (${nombreEsperado}) en los landmarks del template.`
      );
    }

    afirmarIndicePuntoTemplate(punto, indiceEsperado, nombreEsperado);
    afirmarNombrePuntoTemplate(punto, indiceEsperado, nombreEsperado);
    afirmarCoordenadasPuntoTemplate(punto, indiceEsperado, nombreEsperado);
  }

  function afirmarIndicePuntoTemplate(punto, indiceEsperado, nombreEsperado) {
    if (punto.indice !== indiceEsperado) {
      throw new Error(
        `El punto ${indiceEsperado} (${nombreEsperado}) debe declarar indice ${indiceEsperado}.`
      );
    }
  }

  function afirmarNombrePuntoTemplate(punto, indiceEsperado, nombreEsperado) {
    if (punto.nombre !== nombreEsperado) {
      throw new Error(`El punto ${indiceEsperado} debe declarar nombre "${nombreEsperado}".`);
    }
  }

  function afirmarCoordenadasPuntoTemplate(punto, indiceEsperado, nombreEsperado) {
    COORDENADAS_REQUERIDAS_LANDMARK.forEach(function (coordenada) {
      if (!Number.isFinite(punto[coordenada])) {
        throw new Error(
          `El punto ${indiceEsperado} (${nombreEsperado}) debe declarar coordenada ${coordenada} finita.`
        );
      }
    });
  }

  function cumpleTotalPuntosClaveMano(landmarks) {
    return Array.isArray(landmarks) && landmarks.length === TOTAL_PUNTOS_CLAVE_MANO;
  }

  function cumpleUmbralConfianzaMano(handedness, umbrales = CONFIGURACION_CONFIANZA_DETECTOR_MANOS) {
    return handedness.score >= umbrales.clasificacionMinima;
  }

  function evaluarExclusionMargenesPerimetralesMano(
    landmarks,
    indiceMano,
    configuracion = CONFIGURACION_EXCLUSION_MARGENES_CAMARA
  ) {
    const puntosEnMargen = [];
    const puntosFueraEncuadre = [];
    const puntosInvalidos = [];

    landmarks.forEach(function (punto, indicePunto) {
      const evaluacionPunto = evaluarPuntoContraMargenesCamara(punto, indicePunto, configuracion);

      if (evaluacionPunto.invalido) {
        puntosInvalidos.push(evaluacionPunto);
        return;
      }

      if (evaluacionPunto.fueraEncuadre) {
        puntosFueraEncuadre.push(evaluacionPunto);
        return;
      }

      if (evaluacionPunto.enMargen) {
        puntosEnMargen.push(evaluacionPunto);
      }
    });

    const motivos = [];

    if (puntosInvalidos.length > 0) {
      motivos.push("coordenadas_no_finitas");
    }

    if (puntosFueraEncuadre.length > 0) {
      motivos.push("puntos_fuera_de_encuadre");
    }

    if (puntosEnMargen.length > 0) {
      motivos.push("puntos_en_margen_perimetral");
    }

    return {
      excluir: motivos.length > 0,
      indiceMano: indiceMano,
      motivos: motivos,
      margenPerimetralNormalizado: configuracion.margenPerimetralNormalizado,
      limitesNormalizados: {
        minimo: configuracion.limiteMinimoNormalizado,
        maximo: configuracion.limiteMaximoNormalizado,
      },
      totalPuntosComprometidos:
        puntosInvalidos.length + puntosFueraEncuadre.length + puntosEnMargen.length,
      puntosInvalidos: puntosInvalidos,
      puntosFueraEncuadre: puntosFueraEncuadre,
      puntosEnMargen: puntosEnMargen,
    };
  }

  function evaluarPuntoContraMargenesCamara(punto, indicePunto, configuracion) {
    const x = punto?.x;
    const y = punto?.y;
    const z = punto?.z;
    const nombre = NOMBRES_PUNTOS_CLAVE_MANO[indicePunto];

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return crearEvaluacionPerimetralPunto({
        indice: indicePunto,
        nombre: nombre,
        x: x,
        y: y,
        z: z,
        invalido: true,
        bordes: ["coordenadas_no_finitas"],
      });
    }

    const bordesFueraEncuadre = obtenerBordesFueraEncuadre(x, y, configuracion);

    if (bordesFueraEncuadre.length > 0) {
      return crearEvaluacionPerimetralPunto({
        indice: indicePunto,
        nombre: nombre,
        x: x,
        y: y,
        z: z,
        fueraEncuadre: true,
        bordes: bordesFueraEncuadre,
      });
    }

    const bordesMargen = obtenerBordesMargenPerimetral(x, y, configuracion);

    return crearEvaluacionPerimetralPunto({
      indice: indicePunto,
      nombre: nombre,
      x: x,
      y: y,
      z: z,
      enMargen: bordesMargen.length > 0,
      bordes: bordesMargen,
    });
  }

  function crearEvaluacionPerimetralPunto(datosPunto) {
    return {
      indice: datosPunto.indice,
      nombre: datosPunto.nombre,
      x: datosPunto.x,
      y: datosPunto.y,
      z: Number.isFinite(datosPunto.z) ? datosPunto.z : 0,
      invalido: Boolean(datosPunto.invalido),
      fueraEncuadre: Boolean(datosPunto.fueraEncuadre),
      enMargen: Boolean(datosPunto.enMargen),
      bordes: datosPunto.bordes,
    };
  }

  function obtenerBordesFueraEncuadre(x, y, configuracion) {
    const bordes = [];
    const limiteMinimo = configuracion.limiteMinimoNormalizado;
    const limiteMaximo = configuracion.limiteMaximoNormalizado;

    if (x < limiteMinimo) {
      bordes.push("fuera_izquierda");
    }

    if (x > limiteMaximo) {
      bordes.push("fuera_derecha");
    }

    if (y < limiteMinimo) {
      bordes.push("fuera_superior");
    }

    if (y > limiteMaximo) {
      bordes.push("fuera_inferior");
    }

    return bordes;
  }

  function obtenerBordesMargenPerimetral(x, y, configuracion) {
    const bordes = [];
    const margen = configuracion.margenPerimetralNormalizado;
    const limiteMinimo = configuracion.limiteMinimoNormalizado;
    const limiteMaximo = configuracion.limiteMaximoNormalizado;

    if (x <= limiteMinimo + margen) {
      bordes.push("margen_izquierdo");
    }

    if (x >= limiteMaximo - margen) {
      bordes.push("margen_derecho");
    }

    if (y <= limiteMinimo + margen) {
      bordes.push("margen_superior");
    }

    if (y >= limiteMaximo - margen) {
      bordes.push("margen_inferior");
    }

    return bordes;
  }

  function construirBanderasExclusionDatos(
    manosDetectadas,
    configuracion = CONFIGURACION_EXCLUSION_MARGENES_CAMARA
  ) {
    const manosExcluidas = manosDetectadas
      .map(function (manoDetectada) {
        return manoDetectada.exclusionDatos;
      })
      .filter(function (exclusionMano) {
        return exclusionMano?.excluir;
      });

    return {
      excluir: manosExcluidas.length > 0,
      motivo: manosExcluidas.length > 0 ? "margenes_perimetrales_comprometidos" : "sin_exclusion",
      totalManosEvaluadas: manosDetectadas.length,
      totalManosExcluidas: manosExcluidas.length,
      configuracion: {
        margenPerimetralNormalizado: configuracion.margenPerimetralNormalizado,
        limiteMinimoNormalizado: configuracion.limiteMinimoNormalizado,
        limiteMaximoNormalizado: configuracion.limiteMaximoNormalizado,
      },
      manos: manosExcluidas,
    };
  }

  function resolverEstadoDeteccionManos(landmarksPorMano, manosDescartadas) {
    if (landmarksPorMano.length > 0) {
      return "manos_detectadas";
    }

    if (
      manosDescartadas.some(function (manoDescartada) {
        return manoDescartada.motivo === "confianza_insuficiente";
      })
    ) {
      return "confianza_insuficiente_mediapipe";
    }

    return "sin_mano_en_encuadre";
  }

  function abstraerPuntosClaveMano(landmarks) {
    return NOMBRES_PUNTOS_CLAVE_MANO.map(function (nombre, indicePunto) {
      return abstraerPuntoClaveMano(landmarks[indicePunto], nombre, indicePunto);
    });
  }

  function abstraerPuntoClaveMano(punto, nombre, indicePunto) {
    return {
      indice: indicePunto,
      nombre: nombre,
      x: normalizarCoordenadaEspacial(punto?.x),
      y: normalizarCoordenadaEspacial(punto?.y),
      z: normalizarCoordenadaEspacial(punto?.z),
      visibilidad: normalizarCoordenadaEspacial(punto?.visibility),
    };
  }

  function normalizarCoordenadaEspacial(valor) {
    return Number.isFinite(valor) ? valor : 0;
  }

  function validarMatrizTridimensionalMano(matriz) {
    return (
      Array.isArray(matriz) &&
      matriz.length === TOTAL_PUNTOS_CLAVE_MANO &&
      matriz.every(function (coordenadas) {
        return (
          Array.isArray(coordenadas) &&
          coordenadas.length === 3 &&
          coordenadas.every(function (valor) {
            return Number.isFinite(valor);
          })
        );
      })
    );
  }

  function crearConfiguracionExclusionMargenesCamara(opciones = {}) {
    return Object.freeze({
      margenPerimetralNormalizado: Number.isFinite(opciones.margenPerimetralNormalizado)
        ? opciones.margenPerimetralNormalizado
        : CONFIGURACION_EXCLUSION_MARGENES_CAMARA.margenPerimetralNormalizado,
      limiteMinimoNormalizado: Number.isFinite(opciones.limiteMinimoNormalizado)
        ? opciones.limiteMinimoNormalizado
        : CONFIGURACION_EXCLUSION_MARGENES_CAMARA.limiteMinimoNormalizado,
      limiteMaximoNormalizado: Number.isFinite(opciones.limiteMaximoNormalizado)
        ? opciones.limiteMaximoNormalizado
        : CONFIGURACION_EXCLUSION_MARGENES_CAMARA.limiteMaximoNormalizado,
    });
  }

  function crearConfiguracionConfianzaDetectorManos(opciones = {}) {
    return Object.freeze({
      deteccionMinima: Number.isFinite(opciones.deteccionMinima) ? opciones.deteccionMinima : 0.75,
      seguimientoMinimo: Number.isFinite(opciones.seguimientoMinimo)
        ? opciones.seguimientoMinimo
        : 0.75,
      clasificacionMinima: Number.isFinite(opciones.clasificacionMinima)
        ? opciones.clasificacionMinima
        : 0.75,
    });
  }

  global.reglasHeuristicasAulaSenas = Object.freeze({
    TOTAL_PUNTOS_CLAVE_MANO: TOTAL_PUNTOS_CLAVE_MANO,
    obtenerNombresPuntosClaveMano: obtenerNombresPuntosClaveMano,
    obtenerCoordenadasRequeridasLandmark: obtenerCoordenadasRequeridasLandmark,
    obtenerConfiguracionFiltroVarianzaFija: obtenerConfiguracionFiltroVarianzaFija,
    obtenerConfiguracionExclusionMargenesCamara: obtenerConfiguracionExclusionMargenesCamara,
    obtenerUmbralesConfianzaDetectorManos: obtenerUmbralesConfianzaDetectorManos,
    validarLandmarksTemplate: validarLandmarksTemplate,
    evaluarFiltroVarianzaTemporalCapturaFija: evaluarFiltroVarianzaTemporalCapturaFija,
    cumpleTotalPuntosClaveMano: cumpleTotalPuntosClaveMano,
    cumpleUmbralConfianzaMano: cumpleUmbralConfianzaMano,
    evaluarExclusionMargenesPerimetralesMano: evaluarExclusionMargenesPerimetralesMano,
    construirBanderasExclusionDatos: construirBanderasExclusionDatos,
    resolverEstadoDeteccionManos: resolverEstadoDeteccionManos,
    abstraerPuntosClaveMano: abstraerPuntosClaveMano,
    validarMatrizTridimensionalMano: validarMatrizTridimensionalMano,
  });
})(typeof window !== "undefined" ? window : globalThis);
