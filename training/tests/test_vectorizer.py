"""Pruebas del layout F=319 y de la política geométrica/temporal."""

import math
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dataset_reader import DatasetSample
from vectorizer import (
    FACE_PRESENCE, FEATURE_COUNT, InvalidTorsoReferenceError,
    LEFT_HAND, LEFT_HAND_PRESENCE, POSE_PRESENCE, POSE_VISIBILITY,
    RIGHT_HAND_PRESENCE, VectorizationError, vectorize_sample,
)


def _landmark(x: float, y: float, z: float, visibility: float | None = None) -> dict:
    """Construye un landmark contractual sintético para una prueba aislada."""

    point = {"x": x, "y": y, "z": z}
    if visibility is not None:
        point["visibilidad"] = visibility
    return {"punto": point}


def _absent_landmarks(count: int) -> list[dict]:
    """Representa una ausencia sin inventar geometría."""

    return [{"punto": None} for _ in range(count)]


def _frame(timestamp: float, degenerate_torso: bool = False) -> dict:
    """Crea un frame con hombros separados por dos unidades en XY."""

    pose = [_landmark(1.0, 0.0, 0.0, 0.5) for _ in range(11)]
    pose[3] = _landmark(0.0, 0.0, 0.0, 0.8)
    pose[4] = _landmark(0.0 if degenerate_torso else 2.0, 0.0, 0.0, 0.9)
    hand = [_landmark(1.0, 2.0, 3.0) for _ in range(21)]
    face = [_landmark(1.0, 1.0, 0.0) for _ in range(48)]
    return {
        "frameIndex": 0,
        "timestampMs": timestamp,
        "observacion": {
            "manos": {
                "izquierda": {"presente": False, "landmarks": _absent_landmarks(21)},
                "derecha": {"presente": True, "landmarks": hand},
            },
            "pose": {"estado": "detectado", "landmarks": pose},
            "rostro": {"estado": "detectado", "landmarks": face},
        },
    }


def _sample(frames: list[dict]) -> DatasetSample:
    """Envuelve frames sintéticos como muestra independiente."""

    return DatasetSample("sample", "u001", "bien", "normal", frames, "now", {})


class VectorizerTests(unittest.TestCase):
    """Cubre forma, normalización, ausencias, visibilidad y tiempo."""

    def test_layout_normalization_absence_and_delta(self) -> None:
        """Valida centro, escala, máscaras, deltas y longitud variable."""

        result = vectorize_sample(_sample([_frame(100.0), _frame(133.0)]))
        self.assertEqual(result.temporal_length, 2)
        self.assertTrue(all(len(vector) == FEATURE_COUNT for vector in result.features))
        first, second = result.features
        self.assertEqual(first[LEFT_HAND], [0.0] * 63)
        self.assertEqual(first[LEFT_HAND_PRESENCE], 0.0)
        self.assertEqual(first[RIGHT_HAND_PRESENCE], 1.0)
        self.assertEqual(first[POSE_PRESENCE], 1.0)
        self.assertEqual(first[FACE_PRESENCE], 1.0)
        self.assertAlmostEqual(first[63], 0.0)  # (x=1 - centroX=1) / escala=2
        self.assertAlmostEqual(first[64], 1.0)
        self.assertAlmostEqual(first[65], 1.5)
        self.assertAlmostEqual(first[126 + 3 * 3], -0.5)
        self.assertAlmostEqual(first[126 + 4 * 3], 0.5)
        self.assertEqual(first[POSE_VISIBILITY][3:5], [0.8, 0.9])
        self.assertEqual(result.delta_ms, [0.0, 33.0])
        self.assertEqual(first[318], 0.0)
        self.assertAlmostEqual(second[318], 0.033)
        self.assertTrue(all(math.isfinite(value) for vector in result.features for value in vector))

    def test_invalid_torso_excludes_sample(self) -> None:
        """Una escala degenerada genera diagnóstico, nunca NaN/Infinity."""

        with self.assertRaises(InvalidTorsoReferenceError):
            vectorize_sample(_sample([_frame(0.0, degenerate_torso=True)]))

    def test_empty_and_negative_time_are_invalid(self) -> None:
        """Rechaza muestra vacía y deltas contractuales negativos."""

        with self.assertRaises(VectorizationError):
            vectorize_sample(_sample([]))
        with self.assertRaises(VectorizationError):
            vectorize_sample(_sample([_frame(20.0), _frame(10.0)]))


if __name__ == "__main__":
    unittest.main()
