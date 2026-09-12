/* Loader autoritativo de GraphModel: valida contrato, mapa de clases, nodos y estado GRU. */
(function (global) {
  // Ruta única del modelo vigente; los artefactos permanecen fuera de Usuario.
  const BASE_PATH_PREDETERMINADO = "/models/exportados/gru_ctc_v3";
  const EVENTO_ESTADO = "aulasenas:modelo-gru-ctc-estado";
  const estado = {
    disponible: false,
    cargando: false,
    error: null,
    modelo: null,
    contrato: null,
    mapaClases: null,
    manifest: null,
    basePath: BASE_PATH_PREDETERMINADO,
    promesaCarga: null,
  };

  function copiar(valor) {
    return valor && typeof valor === "object" ? JSON.parse(JSON.stringify(valor)) : valor;
  }

  function resolverUrl(ruta) {
    try {
      return new URL(ruta, global.location?.href).href;
    } catch (_error) {
      return ruta;
    }
  }

  async function cargarJson(basePath, nombre) {
    const respuesta = await fetch(`${basePath}/${nombre}`);
    if (!respuesta.ok) {
      throw new Error(`No se pudo cargar ${nombre} (${respuesta.status}).`);
    }
    return respuesta.json();
  }

  function validarContrato(contrato) {
    if (contrato?.model?.format !== "graph-model") throw new Error("El modelo GRU-CTC debe ser GraphModel.");
    if (contrato?.model?.recommended_load_api !== "tf.loadGraphModel") throw new Error("El contrato requiere tf.loadGraphModel.");
    if (contrato?.features_per_frame !== 308) throw new Error("El contrato debe declarar 308 features por frame.");
    if (contrato?.state_management?.units !== 128) throw new Error("El estado GRU debe tener 128 unidades.");
    if (contrato?.ctc?.blank_index !== 11) throw new Error("El indice blank CTC debe ser 11.");
    if (contrato?.ctc?.number_of_outputs !== 12) throw new Error("El modelo debe producir 12 salidas.");
    if (contrato?.delta_temporal?.scale_ms !== 100 || contrato?.delta_temporal?.clamp !== false) {
      throw new Error("El delta temporal debe usar escala 100 sin clamp.");
    }
    return contrato;
  }

  function validarMapaClases(mapa) {
    if (mapa?.number_of_sign_classes !== 11 || mapa?.number_of_outputs !== 12) {
      throw new Error("El mapa de clases GRU-CTC debe declarar 11 clases y 12 salidas.");
    }
    if (mapa?.blank?.index !== 11 || mapa.blank.internal_ctc_only !== true) {
      throw new Error("El blank CTC debe permanecer como simbolo interno en indice 11.");
    }
    if (!Array.isArray(mapa.classes) || mapa.classes.length !== 11) {
      throw new Error("El mapa de clases debe contener 11 clases reconocibles.");
    }
    mapa.classes.forEach((clase, indice) => {
      if (clase.index !== indice || typeof clase.label !== "string" || !clase.label.trim()) {
        throw new Error("El mapa de clases GRU-CTC contiene indices o etiquetas invalidas.");
      }
    });
    return mapa;
  }

  function validarNodos(contrato) {
    const entradas = contrato.inputs || {};
    const salidas = contrato.outputs || {};
    if (entradas.frames_308?.tensor_name !== "frames_308:0") throw new Error("Nodo de entrada frames_308 inesperado.");
    if (entradas.estado_gru?.tensor_name !== "estado_gru:0") throw new Error("Nodo de entrada estado_gru inesperado.");
    if (salidas.probabilidades_streaming?.tensor_name !== "Identity_1:0") throw new Error("Nodo de salida probabilidades inesperado.");
    if (salidas.nuevo_estado_gru?.tensor_name !== "Identity:0") throw new Error("Nodo de salida estado inesperado.");
  }

  async function cargarRecursos(basePath) {
    if (!global.tf || typeof global.tf.loadGraphModel !== "function") {
      throw new Error("TensorFlow.js GraphModel no esta disponible.");
    }
    const contrato = validarContrato(await cargarJson(basePath, "input_contract_gru_ctc_one_step_tfjs.json"));
    const mapaClases = validarMapaClases(await cargarJson(basePath, "class_map_gru_ctc.json"));
    const manifest = await cargarJson(basePath, "release_manifest.json");
    validarNodos(contrato);
    const modeloUrl = resolverUrl(`${basePath}/model.json`);
    console.info("[GRU-CTC] cargando GraphModel", modeloUrl);
    const modelo = await global.tf.loadGraphModel(modeloUrl);
    // Compile/upload kernels before the recognizer accepts camera frames.
    const frameInicial = global.tf.zeros([1, 1, 308], "float32");
    const estadoInicial = global.tf.zeros([1, 128], "float32");
    let salidas = [];
    try {
      salidas = modelo.execute({
        "frames_308:0": frameInicial,
        "estado_gru:0": estadoInicial,
      }, ["Identity_1:0", "Identity:0"]);
      await salidas[0].data();
    } catch (error) {
      modelo.dispose();
      throw error;
    } finally {
      frameInicial.dispose();
      estadoInicial.dispose();
      salidas.forEach((tensor) => tensor.dispose());
    }
    console.info("[GRU-CTC] modelo cargado");
    return { modelo, contrato, mapaClases, manifest };
  }

  function notificar() {
    if (typeof global.dispatchEvent === "function" && typeof global.CustomEvent === "function") {
      global.dispatchEvent(new CustomEvent(EVENTO_ESTADO, { detail: obtenerEstado() }));
    }
  }

  function configurar(opciones = {}) {
    if (typeof opciones.basePath === "string" && opciones.basePath.trim()) {
      estado.basePath = opciones.basePath.replace(/\/$/, "");
    }
    return obtenerEstado();
  }

  function cargar(opciones = {}) {
    configurar(opciones);
    if (estado.promesaCarga) return estado.promesaCarga;
    estado.cargando = true;
    estado.error = null;
    notificar();
    estado.promesaCarga = cargarRecursos(estado.basePath)
      .then((recursos) => {
        Object.assign(estado, recursos, { disponible: true, error: null });
        return estado;
      })
      .catch((error) => {
        estado.disponible = false;
        estado.error = error;
        console.error("[GRU-CTC] error de carga", error);
        return estado;
      })
      .finally(() => {
        estado.cargando = false;
        notificar();
      });
    return estado.promesaCarga;
  }

  function resolverClase(indice) {
    return estado.mapaClases?.classes?.find((clase) => clase.index === indice) || null;
  }

  function obtenerEstado() {
    return {
      disponible: estado.disponible,
      cargando: estado.cargando,
      error: estado.error,
      basePath: estado.basePath,
      contrato: copiar(estado.contrato),
      mapaClases: copiar(estado.mapaClases),
      manifest: copiar(estado.manifest),
    };
  }

  global.aulaSenasGruCtcModelLoader = Object.freeze({
    configurar,
    cargar,
    resolverClase,
    obtenerEstado,
    eventoEstado: EVENTO_ESTADO,
    get modelo() { return estado.modelo; },
    get contrato() { return estado.contrato; },
    get mapaClases() { return estado.mapaClases; },
  });
})(typeof window !== "undefined" ? window : globalThis);
