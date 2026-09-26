param([int]$Port = 8765)

$ErrorActionPreference = 'Stop'
$modelId = 'gemini-3.1-flash-lite'
$geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent"
$allowedOrigin = 'http://127.0.0.1:8000'
$maxInputCharacters = 1000
$maxBodyBytes = 16384
$apiKey = $env:GEMINI_API_KEY

function Write-JsonResponse($Response, [int]$StatusCode, $Payload) {
  $json = $Payload | ConvertTo-Json -Depth 10 -Compress
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $Response.StatusCode = $StatusCode
  $Response.ContentType = 'application/json; charset=utf-8'
  $Response.ContentLength64 = $bytes.Length
  $Response.Headers['Cache-Control'] = 'no-store'
  $Response.Headers['X-Content-Type-Options'] = 'nosniff'
  $Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $Response.Close()
}

function Add-CorsHeaders($Response, [string]$Origin) {
  if ($Origin -eq $allowedOrigin) {
    $Response.Headers['Access-Control-Allow-Origin'] = $allowedOrigin
    $Response.Headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    $Response.Headers['Access-Control-Allow-Headers'] = 'Content-Type'
    $Response.Headers['Vary'] = 'Origin'
  }
}

function Get-RequestText($Request) {
  if ($Request.ContentLength64 -lt 0 -or $Request.ContentLength64 -gt $maxBodyBytes) { throw [InvalidOperationException]::new('body_too_large') }
  $reader = [IO.StreamReader]::new($Request.InputStream, [Text.Encoding]::UTF8)
  try { return $reader.ReadToEnd() } finally { $reader.Dispose() }
}

function Get-GeminiText($Response) {
  $parts = @($Response.candidates[0].content.parts)
  $texts = @($parts | Where-Object { $_.text -is [string] -and -not [string]::IsNullOrWhiteSpace($_.text) -and $_.thought -ne $true } | ForEach-Object { $_.text })
  return (($texts -join '').Trim())
}

function Invoke-Gemini([string]$Text) {
  $prompt = "Corrige y organiza el siguiente texto generado automáticamente. Separa las palabras, corrige errores ortográficos y recupera las tildes cuando corresponda. Conserva estrictamente el significado original. No agregues información. No completes frases. No expliques los cambios. Devuelve únicamente el texto final corregido, sin Markdown ni etiquetas.`n`nTexto:`n$Text"
  $requestBody = @{
    contents = @(@{ role = 'user'; parts = @(@{ text = $prompt }) })
    generationConfig = @{
      temperature = 0.1
      maxOutputTokens = 64
      responseMimeType = 'text/plain'
      thinkingConfig = @{ thinkingBudget = 0 }
    }
    store = $false
  } | ConvertTo-Json -Depth 10 -Compress
  return Invoke-RestMethod -Method Post -Uri $geminiEndpoint -Headers @{ 'x-goog-api-key' = $apiKey } -ContentType 'application/json; charset=utf-8' -Body $requestBody -TimeoutSec 60
}

function Get-UpstreamStatus($ErrorRecord) {
  try { return [int]$ErrorRecord.Exception.Response.StatusCode } catch { return 0 }
}

function Handle-Request($Context) {
  $request = $Context.Request
  $response = $Context.Response
  Add-CorsHeaders $response $request.Headers['Origin']
  $path = $request.Url.AbsolutePath

  if ($request.HttpMethod -eq 'OPTIONS' -and $path.StartsWith('/api/')) {
    if ($request.Headers['Origin'] -and $request.Headers['Origin'] -ne $allowedOrigin) { Write-JsonResponse $response 403 @{ codigo = 'origen_no_permitido' }; return }
    $response.StatusCode = 204
    $response.Close()
    return
  }
  if ($path -eq '/api/estado-ia' -and $request.HttpMethod -eq 'GET') {
    Write-JsonResponse $response 200 @{ disponible = -not [string]::IsNullOrWhiteSpace($apiKey); modelo = $modelId; configuracionPresente = -not [string]::IsNullOrWhiteSpace($apiKey) }
    return
  }
  if ($path -ne '/api/interpretar-texto' -or $request.HttpMethod -ne 'POST') {
    Write-JsonResponse $response 404 @{ codigo = 'ruta_no_encontrada' }
    return
  }

  try {
    $bodyText = Get-RequestText $request
  } catch {
    $status = if ($_.Exception.Message -eq 'body_too_large') { 413 } else { 400 }
    Write-JsonResponse $response $status @{ codigo = if ($status -eq 413) { 'cuerpo_demasiado_largo' } else { 'cuerpo_invalido' } }
    return
  }
  try { $payload = $bodyText | ConvertFrom-Json -ErrorAction Stop } catch { Write-JsonResponse $response 400 @{ codigo = 'json_invalido'; mensaje = 'El cuerpo JSON no es válido.' }; return }
  $text = if ($payload.textoCrudo -is [string]) { $payload.textoCrudo.Trim() } else { '' }
  if ([string]::IsNullOrWhiteSpace($text)) { Write-JsonResponse $response 400 @{ codigo = 'texto_vacio'; mensaje = 'textoCrudo es obligatorio.' }; return }
  if ($text.Length -gt $maxInputCharacters) { Write-JsonResponse $response 413 @{ codigo = 'texto_demasiado_largo'; mensaje = 'textoCrudo supera el límite permitido.' }; return }
  if ([string]::IsNullOrWhiteSpace($apiKey)) { Write-JsonResponse $response 503 @{ codigo = 'api_no_configurada'; mensaje = 'GEMINI_API_KEY no está configurada.' }; return }

  $timer = [Diagnostics.Stopwatch]::StartNew()
  try {
    $geminiResponse = Invoke-Gemini $text
    $interpreted = Get-GeminiText $geminiResponse
    if ([string]::IsNullOrWhiteSpace($interpreted)) { Write-JsonResponse $response 502 @{ codigo = 'respuesta_vacia'; mensaje = 'Gemini devolvió una respuesta vacía.' }; return }
    $timer.Stop()
    Write-JsonResponse $response 200 @{ textoInterpretadoIA = $interpreted; modelo = $modelId; tiempoRespuestaMs = [int]$timer.ElapsedMilliseconds }
  } catch {
    $upstreamStatus = Get-UpstreamStatus $_
    $status = if ($upstreamStatus -eq 429) { 429 } else { 502 }
    $code = if ($status -eq 429) { 'limite_solicitudes' } else { 'error_gemini' }
    Write-JsonResponse $response $status @{ codigo = $code; mensaje = 'No fue posible obtener una respuesta de Gemini.' }
  }
}

$listener = [Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()
Write-Output "Proxy Gemini disponible en http://127.0.0.1:$Port/"
Write-Output "Gemini configurado: $(-not [string]::IsNullOrWhiteSpace($apiKey))"
try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    try { Handle-Request $context } catch { try { Write-JsonResponse $context.Response 500 @{ codigo = 'error_interno' } } catch {} }
  }
} finally { $listener.Stop(); $listener.Close() }
