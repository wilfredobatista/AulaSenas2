# AulaSeñas GRU-CTC TensorFlow.js

Modelo temporal de inferencia continua validado para AulaSeñas.

## Contrato de ejecución

- Formato: TensorFlow.js GraphModel
- Precisión: float32
- Entrada de frame: `[1, 1, 308]`
- Entrada de estado GRU: `[1, 128]`
- Salida de probabilidades: `[1, 1, 12]`
- Salida de nuevo estado: `[1, 128]`
- Índice CTC blank: `11`
- API recomendada: `model.execute()`

## Nodos reales

- Frames: `frames_308:0`
- Estado: `estado_gru:0`
- Probabilidades: `Identity_1:0`
- Nuevo estado: `Identity:0`

## Estado recurrente

El estado comienza con 128 ceros. Después de cada frame,
la aplicación debe conservar `nuevo_estado_gru` y utilizarlo
como `estado_gru` en el siguiente frame.

## Decodificación CTC

La aplicación conserva el índice crudo anterior:

1. Calcula el índice de mayor probabilidad.
2. No emite el índice blank.
3. No repite un índice consecutivo idéntico.
4. El blank actúa como separador y permite emitir nuevamente
   una misma clase después de una separación.

La política de reinicio del estado se controla desde AulaSeñas.
