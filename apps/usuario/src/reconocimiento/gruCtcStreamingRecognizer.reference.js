(function (global) {
  const EVENTO_PREDICCION_DINAMICA = "aulasenas:prediccion-dinamica";
  const EVENTO_ESTADO = "aulasenas:estado-reconocimiento-holistic";
  const FEATURES_VISUALES = 307;
  const FEATURES_MODELO = 308;
  const UNIDADES_GRU = 128;
  const BLANK = 11;
  const DELTA_ESCALA_MS = 100;
  const UMBRAL_AUSENCIA_ESTABLE_MS = 550;
  const MAX_FRAMES_PENDIENTES = 2;
  const MAX_ESPERA_FRAME_MS = 250;

  const estado = {
    activo: false,
    inferenciaEnCurso: false,
    generacion: 0,
    totalResultadosObsoletos: 0,
    colaFrames: [],
    totalFramesEncolados: 0,
    totalFramesColaVencidos: 0,
    totalFramesColaCancelados: 0,
    esperaColaMaximaMs: 0,
    removerListener: null,
    estadoTensor: null,
    timestampAnterior: null,
    indiceCrudoAnterior: null,
    ultimaPalabraAceptada: null,
    totalFrames: 0,
    totalFramesRecibidos: 0,
    totalFramesProcesados: 0,
    totalFramesOmitidosInferenciaEnCurso: 0,
    totalFramesOmitidosSinManos: 0,
    totalFramesSinManos: 0,
    totalFramesConManos: 0,
    totalBlank: 0,
    totalNoBlank: 0,
    totalBlankConManos: 0,
    totalBlankSinManos: 0,
    totalNoBlankConManos: 0,
    totalNoBlankSinManos: 0,
    totalRepetidasCtc: 0,
    totalEmitidas: 0,
    totalReinicios: 0,
    totalAusenciasEstables: 0,
    ausenciaInicioMs: null,
    ausenciaActualMs: 0,
    fronteraAusenciaAplicada: false,
    ultimoMotivoReinicio: null,
    inferenciasMedidas: 0,
    inferenciaTotalMs: 0,
    ultimaInferenciaMs: null,
    inferenciaMediaMs: null,
    inferenciaMaximaMs: 0,
    conteoNoBlankPorEtiqueta: {},
    conteoEmitidasPorEtiqueta: {},
    ultimoNoBlank: null,
    ultimaPresenciaManos: false,
    ultimoDeltaMs: null,
    ultimoIndice: null,
    ultimaEtiqueta: null,
    ultimaConfianza: null,
    ultimoTop3: [],
    error: null,
  };

  function numero(valor) {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
  }

  function puntosAArray(puntos, total) {
    const lista = Array.isArray(puntos) ? puntos : [];
    const salida = [];
    for (let i = 0; i < total; i += 1) {
      const punto = lista[i];
      salida.push(numero(punto?.x ?? punto?.[0]), numero(punto?.y ?? punto?.[1]), numero(punto?.z ?? punto?.[2]));
    }
    return salida;
  }

  function errorSerializable(error) {
    if (!error) return null;
    return {
      nombre: error.name || "Error",
      mensaje: error.message || String(error),
      stack: typeof error.stack === "string" ? error.stack : null,
    };
  }

  function ahoraMonotonoMs() {
    return typeof global.performance?.now === "function" ? global.performance.now() : Date.now();
  }

  function incrementarConteo(diccionario, etiqueta) {
    const clave = String(etiqueta || "desconocida");
    diccionario[clave] = (diccionario[clave] || 0) + 1;
  }

  function copiarConteos(diccionario) {
    return Object.keys(diccionario).sort().reduce((salida, clave) => {
      salida[clave] = diccionario[clave];
      return salida;
    }, {});
  }

  function registrarDuracionInferencia(inicioMs) {
    const duracionMs = Math.max(0, ahoraMonotonoMs() - inicioMs);
    estado.inferenciasMedidas += 1;
    estado.inferenciaTotalMs += duracionMs;
    estado.ultimaInferenciaMs = Number(duracionMs.toFixed(3));
    estado.inferenciaMediaMs = Number((estado.inferenciaTotalMs / estado.inferenciasMedidas).toFixed(3));
    estado.inferenciaMaximaMs = Number(Math.max(estado.inferenciaMaximaMs, duracionMs).toFixed(3));
  }

  function manoCanonicaPorLateralidad(frame, lateralidad) {
    const clave = lateralidad === "Left" ? "izquierda" : "derecha";
    const slot = frame?.representacionCanonicaManos?.[clave];
    return slot?.lateralidadFisica === lateralidad ? slot : null;
  }

  function manoPorLateralidad(frame, lateralidad) {
    const manos = Array.isArray(frame?.manosDetectadas) ? frame.manosDetectadas : [];
    return manos.find((mano) => mano?.lateralidadFisica === lateralidad) || null;
  }

  function vectorMano(frame, lateralidad) {
    const manoCanonica = manoCanonicaPorLateralidad(frame, lateralidad);
    if (
      manoCanonica?.presente === true &&
      Array.isArray(manoCanonica.landmarks) &&
      manoCanonica.landmarks.length === 21
    ) {
      return normalizarVectorMano(manoCanonica.landmarks);
    }

    const mano = manoPorLateralidad(frame, lateralidad);
    if (!mano || !Array.isArray(mano.puntosClave) || mano.puntosClave.length !== 21) {
      return { presente: false, vector: Array(63).fill(0) };
    }
    return normalizarVectorMano(mano.puntosClave);
  }

  function normalizarVectorMano(puntosClave) {
    const normalizar = global.normalizarLandmarksMano;
    if (typeof normalizar !== "function") {
      return { presente: true, vector: puntosAArray(puntosClave, 21) };
    }
    const resultado = normalizar(puntosClave);
    if (resultado?.valido === true && Array.isArray(resultado.vector) && resultado.vector.length === 63) {
      return { presente: true, vector: resultado.vector.map(numero) };
    }
    return { presente: false, vector: Array(63).fill(0) };
  }

  function hayManos(frame) {
    if (frame?.hayManos === true) return true;
    if (Array.isArray(frame?.manosDetectadas) && frame.manosDetectadas.length > 0) return true;
    if (
      frame?.presenciaManos?.izquierda === true ||
      frame?.presenciaManos?.derecha === true
    ) {
      return true;
    }
    if (frame?.representacionCanonicaManos?.izquierda?.presente === true) return true;
    if (frame?.representacionCanonicaManos?.derecha?.presente === true) return true;
    return Array.isArray(frame?.manos) && frame.manos.some((mano) => mano?.presente === true);
  }

  function construirVisual307(frame) {
    if (Array.isArray(frame?.features) && frame.features.length === FEATURES_VISUALES) return frame.features.map(numero);
    if (Array.isArray(frame?.vector) && frame.vector.length === FEATURES_VISUALES) return frame.vector.map(numero);
    const izquierda = vectorMano(frame, "Left");
    const derecha = vectorMano(frame, "Right");
    const pose = puntosAArray(frame?.pose, 11);
    const cara = puntosAArray(frame?.cara, 48);
    const posePresente = Array.isArray(frame?.pose) && frame.pose.some(Boolean);
    const caraPresente = Array.isArray(frame?.cara) && frame.cara.some(Boolean);
    const salida = izquierda.vector.concat(derecha.vector, pose, cara, [
      izquierda.presente ? 1 : 0,
      derecha.presente ? 1 : 0,
      posePresente ? 1 : 0,
      caraPresente ? 1 : 0,
    ]);
    if (salida.length !== FEATURES_VISUALES) {
      throw new Error(`Frame Holistic invalido: ${salida.length} features visuales; esperado ${FEATURES_VISUALES}.`);
    }
    return salida;
  }

  function construirEntrada308(frame) {
    if (Array.isArray(frame?.features) && frame.features.length === FEATURES_MODELO) return frame.features.map(numero);
    if (Array.isArray(frame?.vector) && frame.vector.length === FEATURES_MODELO) return frame.vector.map(numero);
    const visual = construirVisual307(frame);
    const timestamp = Number.isFinite(frame?.timestamp) ? frame.timestamp : Date.now();
    const deltaMs = Number.isFinite(estado.timestampAnterior) ? Math.max(timestamp - estado.timestampAnterior, 0) : 0;
    estado.timestampAnterior = timestamp;
    estado.ultimoDeltaMs = deltaMs;
    return visual.concat(deltaMs / DELTA_ESCALA_MS);
  }

  function timestampFrameMs(frame) {
    return Number.isFinite(frame?.timestamp) ? frame.timestamp : Date.now();
  }

  function aplicarFronteraAusenciaEstable() {
    estado.generacion += 1;
    cancelarCola();
    estado.estadoTensor?.dispose();
    estado.estadoTensor = null;
    estado.timestampAnterior = null;
    estado.indiceCrudoAnterior = null;
    estado.totalReinicios += 1;
    estado.totalAusenciasEstables += 1;
    estado.fronteraAusenciaAplicada = true;
    estado.ultimoMotivoReinicio = "ausencia_estable_manos";
    notificarEstado({ estado: "ausencia_estable_manos" });
  }

  function registrarAusenciaManos(frame) {
    const timestamp = timestampFrameMs(frame);
    if (!Number.isFinite(estado.ausenciaInicioMs)) {
      estado.ausenciaInicioMs = timestamp;
    }
    estado.ausenciaActualMs = Math.max(timestamp - estado.ausenciaInicioMs, 0);
    if (
      estado.ausenciaActualMs >= UMBRAL_AUSENCIA_ESTABLE_MS &&
      estado.fronteraAusenciaAplicada !== true
    ) {
      aplicarFronteraAusenciaEstable();
    }
  }

  function limpiarSeguimientoAusencia() {
    estado.ausenciaInicioMs = null;
    estado.ausenciaActualMs = 0;
    estado.fronteraAusenciaAplicada = false;
  }

  function cancelarCola() {
    const pendientes = estado.colaFrames.splice(0);
    estado.totalFramesColaCancelados += pendientes.length;
    pendientes.forEach((pendiente) => pendiente.resolver(null));
  }

  function procesarSiguienteEnCola() {
    while (estado.activo && estado.colaFrames.length > 0) {
      const pendiente = estado.colaFrames.shift();
      const esperaMs = Math.max(0, ahoraMonotonoMs() - pendiente.recibidaMs);
      if (esperaMs > MAX_ESPERA_FRAME_MS) {
        estado.totalFramesColaVencidos += 1;
        pendiente.resolver(null);
        continue;
      }
      estado.esperaColaMaximaMs = Math.max(estado.esperaColaMaximaMs, esperaMs);
      ejecutarFotograma(pendiente.frame, true, pendiente.numeroFrame).then(pendiente.resolver);
      return;
    }
  }

  function classIdDesdeEtiqueta(etiqueta) {
    return `unidad_${String(etiqueta).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ñ/g, "n").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`;
  }

  function notificarEstado(detalle = {}) {
    if (typeof global.dispatchEvent === "function" && typeof global.CustomEvent === "function") {
      global.dispatchEvent(new CustomEvent(EVENTO_ESTADO, { detail: {
        estado: detalle.estado || "streaming",
        ultimaPalabraAceptada: estado.ultimaPalabraAceptada,
        prediccion: detalle.prediccion || null,
      } }));
    }
  }

  function emitirPrediccion(clase, confianza, indice) {
    const prediccion = {
      disponible: true,
      aceptada: true,
      classId: classIdDesdeEtiqueta(clase.label),
      label: clase.label,
      unit: "PALABRA",
      confianza,
      indice,
      group: "gru_ctc_streaming",
      timestampPrediccion: `gru-ctc-${Date.now()}-${estado.totalEmitidas + 1}`,
    };
    estado.ultimaPalabraAceptada = clase.label;
    estado.totalEmitidas += 1;
    incrementarConteo(estado.conteoEmitidasPorEtiqueta, clase.label);
    global.aulaSenasPrediccionDinamica = prediccion;
    global.dispatchEvent?.(new CustomEvent(EVENTO_PREDICCION_DINAMICA, { detail: prediccion }));
    notificarEstado({ estado: "emitida", prediccion });
  }

  async function procesarFotograma(frame) {
    estado.totalFramesRecibidos += 1;
    if (!estado.activo) return null;
    const presenciaManos = hayManos(frame);
    estado.ultimaPresenciaManos = presenciaManos;
    if (!presenciaManos) {
      estado.totalFramesSinManos += 1;
      estado.totalFramesOmitidosSinManos += 1;
      registrarAusenciaManos(frame);
      return null;
    }
    // A delayed next callback can be the first observation after the boundary.
    if (Number.isFinite(estado.ausenciaInicioMs)) registrarAusenciaManos(frame);
    limpiarSeguimientoAusencia();
    const loader = global.aulaSenasGruCtcModelLoader;
    if (!loader?.modelo || loader.obtenerEstado?.().disponible !== true) return null;
    if (estado.inferenciaEnCurso) {
      if (estado.colaFrames.length >= MAX_FRAMES_PENDIENTES) {
        estado.totalFramesOmitidosInferenciaEnCurso += 1;
        return null;
      }
      // Snapshot numbers only: never retain camera images or mutable landmark objects.
      const features = Array.isArray(frame?.features) && frame.features.length === FEATURES_MODELO
        ? frame.features.slice()
        : Array.isArray(frame?.vector) && frame.vector.length === FEATURES_MODELO
          ? frame.vector.slice() : construirVisual307(frame);
      const copia = { timestamp: timestampFrameMs(frame), features };
      estado.totalFramesEncolados += 1;
      return new Promise((resolver) => estado.colaFrames.push({
        frame: copia, recibidaMs: ahoraMonotonoMs(), numeroFrame: estado.totalFramesRecibidos, resolver,
      }));
    }
    return ejecutarFotograma(frame, presenciaManos, estado.totalFramesRecibidos);
  }

  async function ejecutarFotograma(frame, presenciaManos, numeroFrame) {
    const loader = global.aulaSenasGruCtcModelLoader;
    if (!loader?.modelo || loader.obtenerEstado?.().disponible !== true) return null;
    estado.totalFrames += 1;
    estado.totalFramesProcesados += 1;
    estado.totalFramesConManos += 1;
    estado.inferenciaEnCurso = true;
    const generacionInferencia = estado.generacion;
    let tensorFrame = null;
    let tensorAnterior = null;
    let probabilidades = null;
    let nuevoEstado = null;
    const inicioInferenciaMs = ahoraMonotonoMs();
    try {
      const entrada = construirEntrada308(frame);
      if (entrada.length !== FEATURES_MODELO || !entrada.every(Number.isFinite)) {
        throw new Error("La entrada GRU-CTC debe contener 308 valores finitos.");
      }
      const tf = global.tf;
      tensorFrame = tf.tensor3d(entrada, [1, 1, FEATURES_MODELO], "float32");
      tensorAnterior = estado.estadoTensor || tf.zeros([1, UNIDADES_GRU], "float32");
      // The pending inference owns this tensor until finally; reset must not dispose it.
      estado.estadoTensor = null;
      const salidas = loader.modelo.execute({
        "frames_308:0": tensorFrame,
        "estado_gru:0": tensorAnterior,
      }, ["Identity_1:0", "Identity:0"]);
      probabilidades = Array.isArray(salidas) ? salidas[0] : salidas["Identity_1:0"];
      nuevoEstado = Array.isArray(salidas) ? salidas[1] : salidas["Identity:0"];
      const datos = Array.from(await probabilidades.data());
      if (generacionInferencia !== estado.generacion || !estado.activo) {
        estado.totalResultadosObsoletos += 1;
        return null;
      }
      const indice = datos.reduce((mejor, valor, actual) => valor > datos[mejor] ? actual : mejor, 0);
      const confianza = datos[indice];
      const top3 = datos
        .map((valor, actual) => ({ indice: actual, confianza: valor }))
        .sort((a, b) => b.confianza - a.confianza)
        .slice(0, 3)
        .map((item) => ({
          indice: item.indice,
          etiqueta: item.indice === BLANK ? "blank" : loader.resolverClase(item.indice)?.label || null,
          confianza: item.confianza,
        }));
      estado.ultimoIndice = indice;
      estado.ultimaConfianza = confianza;
      estado.ultimoTop3 = top3;
      estado.estadoTensor = nuevoEstado;
      nuevoEstado = null;
      tensorAnterior.dispose();
      tensorAnterior = null;
      const previo = estado.indiceCrudoAnterior;
      estado.indiceCrudoAnterior = indice;
      if (indice === BLANK) {
        estado.totalBlank += 1;
        if (presenciaManos) {
          estado.totalBlankConManos += 1;
        } else {
          estado.totalBlankSinManos += 1;
        }
        estado.ultimaEtiqueta = "blank";
        notificarEstado({ estado: "blank" });
      } else if (indice !== previo) {
        estado.totalNoBlank += 1;
        const clase = loader.resolverClase(indice);
        estado.ultimaEtiqueta = clase?.label || null;
        if (presenciaManos) {
          estado.totalNoBlankConManos += 1;
        } else {
          estado.totalNoBlankSinManos += 1;
        }
        incrementarConteo(estado.conteoNoBlankPorEtiqueta, estado.ultimaEtiqueta || `indice_${indice}`);
        estado.ultimoNoBlank = {
          indice,
          etiqueta: estado.ultimaEtiqueta,
          confianza,
          top3,
          presenciaManos,
          timestamp: Number.isFinite(frame?.timestamp) ? frame.timestamp : null,
          numeroFrame,
        };
        if (clase) emitirPrediccion(clase, confianza, indice);
      } else {
        estado.totalNoBlank += 1;
        estado.totalRepetidasCtc += 1;
        estado.ultimaEtiqueta = loader.resolverClase(indice)?.label || null;
        if (presenciaManos) {
          estado.totalNoBlankConManos += 1;
        } else {
          estado.totalNoBlankSinManos += 1;
        }
        incrementarConteo(estado.conteoNoBlankPorEtiqueta, estado.ultimaEtiqueta || `indice_${indice}`);
        estado.ultimoNoBlank = {
          indice,
          etiqueta: estado.ultimaEtiqueta,
          confianza,
          top3,
          presenciaManos,
          timestamp: Number.isFinite(frame?.timestamp) ? frame.timestamp : null,
          numeroFrame,
        };
        notificarEstado({ estado: "repetida_ctc" });
      }
      return { indice, confianza };
    } catch (error) {
      if (generacionInferencia !== estado.generacion) return null;
      estado.error = errorSerializable(error);
      console.error("[GRU-CTC] error en inferencia streaming", estado.error);
      reiniciar("error_inferencia");
      return null;
    } finally {
      registrarDuracionInferencia(inicioInferenciaMs);
      tensorFrame?.dispose();
      tensorAnterior?.dispose();
      probabilidades?.dispose();
      nuevoEstado?.dispose();
      estado.inferenciaEnCurso = false;
      procesarSiguienteEnCola();
    }
  }

  function iniciar() {
    if (estado.activo) return obtenerEstado();
    const registrar = global.registrarListenerFotogramasManos;
    if (typeof registrar !== "function") throw new Error("No existe registrarListenerFotogramasManos para GRU-CTC.");
    estado.removerListener = registrar((frame) => { procesarFotograma(frame); });
    estado.activo = true;
    notificarEstado({ estado: "activo" });
    return obtenerEstado();
  }

  function detener(motivo = "detenido") {
    if (typeof estado.removerListener === "function") estado.removerListener();
    estado.removerListener = null;
    estado.activo = false;
    reiniciar(motivo);
    return obtenerEstado();
  }

  function reiniciar(motivo = "reinicio") {
    estado.generacion += 1;
    cancelarCola();
    estado.estadoTensor?.dispose();
    estado.estadoTensor = null;
    estado.timestampAnterior = null;
    estado.indiceCrudoAnterior = null;
    estado.ausenciaInicioMs = null;
    estado.ausenciaActualMs = 0;
    estado.fronteraAusenciaAplicada = false;
    estado.totalReinicios += 1;
    estado.ultimoMotivoReinicio = motivo;
    notificarEstado({ estado: motivo });
  }

  function obtenerEstado() {
    return {
      activo: estado.activo,
      inferenciaEnCurso: estado.inferenciaEnCurso,
      totalResultadosObsoletos: estado.totalResultadosObsoletos,
      framesPendientes: estado.colaFrames.length,
      totalFramesEncolados: estado.totalFramesEncolados,
      totalFramesColaVencidos: estado.totalFramesColaVencidos,
      totalFramesColaCancelados: estado.totalFramesColaCancelados,
      esperaColaMaximaMs: estado.esperaColaMaximaMs,
      totalFrames: estado.totalFrames,
      totalFramesRecibidos: estado.totalFramesRecibidos,
      totalFramesProcesados: estado.totalFramesProcesados,
      totalFramesOmitidosInferenciaEnCurso: estado.totalFramesOmitidosInferenciaEnCurso,
      totalFramesOmitidosSinManos: estado.totalFramesOmitidosSinManos,
      totalFramesConManos: estado.totalFramesConManos,
      totalFramesSinManos: estado.totalFramesSinManos,
      totalBlank: estado.totalBlank,
      totalNoBlank: estado.totalNoBlank,
      totalBlankConManos: estado.totalBlankConManos,
      totalBlankSinManos: estado.totalBlankSinManos,
      totalNoBlankConManos: estado.totalNoBlankConManos,
      totalNoBlankSinManos: estado.totalNoBlankSinManos,
      totalRepetidasCtc: estado.totalRepetidasCtc,
      totalEmitidas: estado.totalEmitidas,
      totalReinicios: estado.totalReinicios,
      totalAusenciasEstables: estado.totalAusenciasEstables,
      ausenciaActualMs: estado.ausenciaActualMs,
      fronteraAusenciaAplicada: estado.fronteraAusenciaAplicada,
      ultimoMotivoReinicio: estado.ultimoMotivoReinicio,
      ultimaInferenciaMs: estado.ultimaInferenciaMs,
      inferenciaMediaMs: estado.inferenciaMediaMs,
      inferenciaMaximaMs: estado.inferenciaMaximaMs,
      conteoNoBlankPorEtiqueta: copiarConteos(estado.conteoNoBlankPorEtiqueta),
      conteoEmitidasPorEtiqueta: copiarConteos(estado.conteoEmitidasPorEtiqueta),
      ultimoNoBlank: estado.ultimoNoBlank ? {
        ...estado.ultimoNoBlank,
        top3: estado.ultimoNoBlank.top3.map((item) => ({ ...item })),
      } : null,
      ultimaPalabraAceptada: estado.ultimaPalabraAceptada,
      ultimaPresenciaManos: estado.ultimaPresenciaManos,
      ultimoDeltaMs: estado.ultimoDeltaMs,
      ultimoIndice: estado.ultimoIndice,
      ultimaEtiqueta: estado.ultimaEtiqueta,
      ultimaConfianza: estado.ultimaConfianza,
      ultimoTop3: estado.ultimoTop3.map((item) => ({ ...item })),
      listenerActivo: typeof estado.removerListener === "function",
      error: estado.error,
    };
  }

  global.aulaSenasGruCtcStreamingRecognizer = Object.freeze({
    iniciar,
    detener,
    reiniciar,
    procesarFotograma,
    obtenerEstado,
  });
})(typeof window !== "undefined" ? window : globalThis);
