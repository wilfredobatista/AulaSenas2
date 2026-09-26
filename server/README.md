# Proxy contextual de Gemini

Este proceso expone el servicio contextual de Usuario en `http://127.0.0.1:8765`.
El servidor estático continúa ejecutándose desde la raíz del repositorio:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

En otra terminal, con `GEMINI_API_KEY` definida solo en el proceso del proxy:

```powershell
$env:GEMINI_API_KEY = "<clave-no-versionada>"
powershell -ExecutionPolicy Bypass -File .\server\geminiProxy.ps1
```

Endpoints:

- `GET /api/estado-ia`
- `POST /api/interpretar-texto` con `{ "textoCrudo": "..." }`
- `OPTIONS /api/*`

El proxy nunca sirve archivos estáticos ni devuelve la API key. En producción,
se recomienda publicar el proxy detrás del mismo origen mediante reverse proxy.
