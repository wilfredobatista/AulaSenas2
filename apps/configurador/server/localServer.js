/**
 * Servidor local exclusivo del Configurador. Sirve su interfaz, expone los
 * contratos en solo lectura y delega toda escritura de data/ al DatasetService.
 * No comparte puertos, rutas ni código con el proxy de Gemini del proyecto.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatasetRequestError, DatasetService, assertSafeClassId, safeChild } from './DatasetService.js';

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const defaultAppRoot = resolve(moduleDirectory, '..');
const defaultProjectRoot = resolve(defaultAppRoot, '..', '..');
const MIME_TYPES = { '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const MAX_JSON_BYTES = 128 * 1024 * 1024;

/**
 * Crea el servidor sin iniciarlo, para que pruebas puedan usar un puerto efímero.
 * En producción las rutas se derivan de este archivo, no de una ruta absoluta.
 */
export function createConfiguratorServer({ projectRoot = defaultProjectRoot, appRoot = defaultAppRoot, dataRoot, contractsRoot, datasetService } = {}) {
  const resolvedProjectRoot = resolve(projectRoot);
  const resolvedAppRoot = resolve(appRoot);
  const resolvedContractsRoot = resolve(contractsRoot ?? safeChild(resolvedProjectRoot, 'contracts'));
  const service = datasetService ?? new DatasetService({ projectRoot: resolvedProjectRoot, dataRoot, contractsRoot: resolvedContractsRoot });

  return createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
      if (requestUrl.pathname.startsWith('/api/dataset')) await serveDatasetApi(request, response, requestUrl, service);
      else await serveStatic(request, response, requestUrl.pathname, { appRoot: resolvedAppRoot, contractsRoot: resolvedContractsRoot });
    } catch (error) {
      sendError(response, error);
    }
  });
}

/** Inicializa las rutas explícitas del API; no existe acceso genérico a archivos. */
async function serveDatasetApi(request, response, requestUrl, service) {
  const path = requestUrl.pathname;
  if (request.method === 'POST' && path === '/api/dataset/initialize') return sendJson(response, 200, await service.initialize());
  if (request.method === 'GET' && path === '/api/dataset') return sendJson(response, 200, await service.load());
  if (request.method === 'POST' && path === '/api/dataset/classes') {
    const body = await readJsonBody(request); return sendJson(response, 201, await service.createClass(body.classDefinition));
  }

  const classMatch = /^\/api\/dataset\/classes\/([^/]+)$/.exec(path);
  if (request.method === 'PUT' && classMatch) {
    const classId = decodeClassId(classMatch[1]); const body = await readJsonBody(request);
    return sendJson(response, 200, await service.updateClass(classId, body.classDefinition));
  }
  const samplesMatch = /^\/api\/dataset\/classes\/([^/]+)\/samples$/.exec(path);
  if (request.method === 'POST' && samplesMatch) {
    const classId = decodeClassId(samplesMatch[1]); const body = await readJsonBody(request);
    return sendJson(response, 201, await service.appendSample(classId, body.classDefinition, body.sample));
  }
  const latestMatch = /^\/api\/dataset\/classes\/([^/]+)\/samples\/latest$/.exec(path);
  if (request.method === 'DELETE' && latestMatch) return sendJson(response, 200, await service.deleteLatestSample(decodeClassId(latestMatch[1])));
  throw new DatasetRequestError('Ruta de dataset no disponible.', 404, 'DATASET_ROUTE_NOT_FOUND');
}

/** Sirve únicamente los assets del Configurador y los JSON de contracts/. */
async function serveStatic(request, response, pathname, { appRoot, contractsRoot }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') throw new DatasetRequestError('Método no permitido.', 405, 'METHOD_NOT_ALLOWED');
  let target;
  if (pathname === '/') target = safeChild(appRoot, 'index.html');
  else if (pathname.startsWith('/src/')) target = resolveStaticPath(appRoot, pathname.slice(1));
  else if (pathname.startsWith('/contracts/')) target = resolveStaticPath(contractsRoot, pathname.slice('/contracts/'.length));
  else throw new DatasetRequestError('Recurso no disponible.', 404, 'STATIC_NOT_FOUND');
  const extension = extname(target);
  if (!MIME_TYPES[extension]) throw new DatasetRequestError('Tipo de recurso no disponible.', 404, 'STATIC_TYPE_NOT_ALLOWED');
  const content = await readFile(target);
  response.writeHead(200, { 'content-type': MIME_TYPES[extension], 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  if (request.method !== 'HEAD') response.end(content); else response.end();
}

/** Rechaza segmentos URL ambiguos antes de aplicar la comprobación de confinamiento. */
function resolveStaticPath(root, encodedPath) {
  const segments = encodedPath.split('/').map((segment) => decodeURIComponent(segment));
  if (!segments.length || segments.some((segment) => !segment || segment === '.' || segment === '..' || /[\\\0]/.test(segment))) throw new DatasetRequestError('Ruta no permitida.', 400, 'STATIC_PATH_INVALID');
  return safeChild(root, ...segments);
}

/** Lee un cuerpo JSON acotado para proteger el proceso local de datos truncados. */
async function readJsonBody(request) {
  const chunks = []; let received = 0;
  for await (const chunk of request) {
    received += chunk.length;
    if (received > MAX_JSON_BYTES) throw new DatasetRequestError('La solicitud excede el tamaño máximo del servicio local.', 413, 'REQUEST_TOO_LARGE');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new DatasetRequestError('El cuerpo debe ser JSON válido.', 400, 'JSON_INVALID'); }
}
function decodeClassId(encodedClassId) {
  let classId;
  try { classId = decodeURIComponent(encodedClassId); } catch { throw new DatasetRequestError('classId codificado de forma inválida.', 400, 'CLASS_ID_INVALID'); }
  assertSafeClassId(classId);
  return classId;
}
function sendJson(response, status, value) { response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }); response.end(JSON.stringify(value)); }
function sendError(response, error) {
  const status = error instanceof DatasetRequestError ? error.status : 500;
  const message = error instanceof DatasetRequestError ? error.message : 'Servicio de dataset no disponible.';
  sendJson(response, status, { error: { code: error?.code ?? 'DATASET_SERVICE_FAILED', message } });
}

/** Arranca únicamente en loopback para que el dataset nunca quede expuesto en red. */
export function startConfiguratorServer({ port = 8000, host = '127.0.0.1', ...options } = {}) {
  const server = createConfiguratorServer(options);
  return new Promise((resolveStart, rejectStart) => {
    server.once('error', rejectStart);
    server.listen(port, host, () => { server.off('error', rejectStart); resolveStart(server); });
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startConfiguratorServer().then(() => console.log('Configurador disponible en http://127.0.0.1:8000/')).catch((error) => { console.error(`No se pudo iniciar Configurador: ${error.message}`); process.exitCode = 1; });
}
