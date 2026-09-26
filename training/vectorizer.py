"""Normalización torso-céntrica y vectorización contractual ``[T, 319]``.

La única fuente geométrica es ``frame.observacion``. Las ausencias producen
ceros y máscara binaria; no se interpolan landmarks ni referencias.
"""

from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Any

from dataset_reader import DatasetSample


HAND_LANDMARK_COUNT = 21
POSE_LANDMARK_COUNT = 11
FACE_LANDMARK_COUNT = 48
FEATURE_COUNT = 319
LEFT_HAND = slice(0, 63)
RIGHT_HAND = slice(63, 126)
POSE_XYZ = slice(126, 159)
FACE_XYZ = slice(159, 303)
POSE_VISIBILITY = slice(303, 314)
LEFT_HAND_PRESENCE = 314
RIGHT_HAND_PRESENCE = 315
POSE_PRESENCE = 316
FACE_PRESENCE = 317
DELTA_NORMALIZED = 318

# El contrato guarda MediaPipe 11/12 en las posiciones de pose 3/4.
LEFT_SHOULDER = 3
RIGHT_SHOULDER = 4
TORSO_EPSILON = 1e-8
DELTA_SCALE_MS = 1000.0


class VectorizationError(ValueError):
    """Error que impide aceptar una muestra sin inventar datos."""


class InvalidTorsoReferenceError(VectorizationError):
    """Los hombros faltan o su distancia XY es degenerada."""


@dataclass(frozen=True)
class VectorizedSample:
    """Secuencia variable y deltas crudos usados para diagnóstico."""

    sample_id: str
    class_id: str
    glosa: str
    tipo: str
    features: list[list[float]]
    delta_ms: list[float]
    warnings: list[str]

    @property
    def temporal_length(self) -> int:
        """Devuelve T real, preservado sin padding ni remuestreo."""

        return len(self.features)


def _finite_number(value: Any, context: str) -> float:
    """Convierte un número JSON y rechaza booleanos, NaN e Infinity."""

    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise VectorizationError(f"Valor no numérico en {context}")
    result = float(value)
    if not math.isfinite(result):
        raise VectorizationError(f"NaN/Infinity en {context}")
    return result


def _landmarks(component: Any, expected: int, context: str) -> list[dict[str, Any]]:
    """Valida cantidad y forma general de landmarks contractuales."""

    if not isinstance(component, dict):
        raise VectorizationError(f"Componente inválido: {context}")
    landmarks = component.get("landmarks")
    if not isinstance(landmarks, list) or len(landmarks) != expected:
        raise VectorizationError(f"{context} requiere exactamente {expected} landmarks")
    if not all(isinstance(item, dict) for item in landmarks):
        raise VectorizationError(f"Landmarks inválidos en {context}")
    return landmarks


def _point(item: dict[str, Any], context: str) -> tuple[float, float, float]:
    """Extrae XYZ de un landmark presente con validación estricta."""

    point = item.get("punto")
    if not isinstance(point, dict):
        raise VectorizationError(f"Punto ausente en componente presente: {context}")
    return (
        _finite_number(point.get("x"), f"{context}.x"),
        _finite_number(point.get("y"), f"{context}.y"),
        _finite_number(point.get("z"), f"{context}.z"),
    )


def _torso_reference(pose: Any, context: str) -> tuple[tuple[float, float, float], float]:
    """Calcula centro XYZ y distancia XY de hombros.

    Una referencia inválida excluye la muestra completa. Así no se propagan
    valores no finitos ni se introduce una referencia temporal artificial.
    """

    landmarks = _landmarks(pose, POSE_LANDMARK_COUNT, f"{context}.pose")
    if pose.get("estado") != "detectado":
        raise InvalidTorsoReferenceError(f"Pose ausente en {context}")
    try:
        left = _point(landmarks[LEFT_SHOULDER], f"{context}.hombroIzq")
        right = _point(landmarks[RIGHT_SHOULDER], f"{context}.hombroDer")
    except VectorizationError as exc:
        raise InvalidTorsoReferenceError(str(exc)) from exc
    center = tuple((left[index] + right[index]) / 2.0 for index in range(3))
    scale = math.hypot(left[0] - right[0], left[1] - right[1])
    if not math.isfinite(scale) or scale <= TORSO_EPSILON:
        raise InvalidTorsoReferenceError(
            f"Escala torso <= epsilon ({TORSO_EPSILON}) en {context}"
        )
    return (center[0], center[1], center[2]), scale


def _normalized_xyz(
    component: Any,
    expected: int,
    present: bool,
    center: tuple[float, float, float],
    scale: float,
    context: str,
) -> list[float]:
    """Devuelve XYZ normalizado o ceros si el componente está ausente."""

    landmarks = _landmarks(component, expected, context)
    if not present:
        return [0.0] * (expected * 3)
    values: list[float] = []
    for index, landmark in enumerate(landmarks):
        point = _point(landmark, f"{context}[{index}]")
        values.extend((point[axis] - center[axis]) / scale for axis in range(3))
    return values


def vectorize_frame(
    frame: dict[str, Any], previous_timestamp_ms: float | None, context: str
) -> tuple[list[float], float, float]:
    """Convierte un frame; retorna features, deltaMs crudo y timestamp actual."""

    observation = frame.get("observacion")
    if not isinstance(observation, dict):
        raise VectorizationError(f"observacion inválida en {context}")
    hands = observation.get("manos")
    if not isinstance(hands, dict):
        raise VectorizationError(f"manos inválidas en {context}")
    left, right = hands.get("izquierda"), hands.get("derecha")
    pose, face = observation.get("pose"), observation.get("rostro")
    if not all(isinstance(item, dict) for item in (left, right, pose, face)):
        raise VectorizationError(f"Componentes incompletos en {context}")

    center, scale = _torso_reference(pose, context)
    left_present = left.get("presente") is True
    right_present = right.get("presente") is True
    pose_present = pose.get("estado") == "detectado"
    face_present = face.get("estado") == "detectado"

    timestamp = _finite_number(frame.get("timestampMs"), f"{context}.timestampMs")
    delta = 0.0 if previous_timestamp_ms is None else timestamp - previous_timestamp_ms
    if delta < 0.0:
        raise VectorizationError(f"deltaMs negativo en {context}: {delta}")
    delta_normalized = min(max(delta / DELTA_SCALE_MS, 0.0), 1.0)

    features = [0.0] * FEATURE_COUNT
    features[LEFT_HAND] = _normalized_xyz(
        left, HAND_LANDMARK_COUNT, left_present, center, scale, f"{context}.manoIzquierda"
    )
    features[RIGHT_HAND] = _normalized_xyz(
        right, HAND_LANDMARK_COUNT, right_present, center, scale, f"{context}.manoDerecha"
    )
    features[POSE_XYZ] = _normalized_xyz(
        pose, POSE_LANDMARK_COUNT, pose_present, center, scale, f"{context}.pose"
    )
    features[FACE_XYZ] = _normalized_xyz(
        face, FACE_LANDMARK_COUNT, face_present, center, scale, f"{context}.rostro"
    )
    pose_landmarks = _landmarks(pose, POSE_LANDMARK_COUNT, f"{context}.pose")
    if pose_present:
        features[POSE_VISIBILITY] = [
            _finite_number(item.get("punto", {}).get("visibilidad"), f"{context}.vis[{i}]")
            for i, item in enumerate(pose_landmarks)
        ]
    features[LEFT_HAND_PRESENCE] = float(left_present)
    features[RIGHT_HAND_PRESENCE] = float(right_present)
    features[POSE_PRESENCE] = float(pose_present)
    features[FACE_PRESENCE] = float(face_present)
    features[DELTA_NORMALIZED] = delta_normalized
    if len(features) != FEATURE_COUNT or not all(math.isfinite(value) for value in features):
        raise VectorizationError(f"Vector no finito o F != {FEATURE_COUNT} en {context}")
    return features, delta, timestamp


def vectorize_sample(sample: DatasetSample) -> VectorizedSample:
    """Vectoriza una muestra preservando T; rechaza muestras vacías/parciales."""

    if not sample.frames:
        raise VectorizationError(f"Muestra vacía: {sample.sample_id}")
    vectors: list[list[float]] = []
    deltas: list[float] = []
    previous_timestamp: float | None = None
    for position, frame in enumerate(sample.frames):
        context = f"muestra {sample.sample_id}, frame {position}"
        vector, delta, previous_timestamp = vectorize_frame(frame, previous_timestamp, context)
        vectors.append(vector)
        deltas.append(delta)
    return VectorizedSample(
        sample_id=sample.sample_id,
        class_id=sample.class_id,
        glosa=sample.glosa,
        tipo=sample.tipo,
        features=vectors,
        delta_ms=deltas,
        warnings=[],
    )
