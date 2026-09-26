"""Pruebas del lector sobre un dataset mínimo con la estructura real."""

import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dataset_reader import DatasetReader, DatasetFormatError


class DatasetReaderTests(unittest.TestCase):
    """Verifica exposición de metadata e identidad por classId."""

    def test_reads_independent_sample(self) -> None:
        """Carga manifest/clase y expone los campos mínimos solicitados."""

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "clases").mkdir()
            manifest = {"clases": [{"classId": "u001", "archivo": "clases/u001.json"}]}
            class_file = {
                "clase": {"classId": "u001", "glosa": "bien", "tipo": "normal"},
                "muestras": [{
                    "id": "sample-1", "classId": "u001", "capturedAt": "2026-01-01T00:00:00Z",
                    "frames": [{"frameIndex": 0, "timestampMs": 0, "observacion": {}}],
                    "fuente": {"tipo": "video"}, "tiempo": {}, "stage": "validated",
                }],
            }
            (root / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
            (root / "clases" / "u001.json").write_text(json.dumps(class_file), encoding="utf-8")
            sample = list(DatasetReader(root).iter_samples())[0]
            self.assertEqual(sample.sample_id, "sample-1")
            self.assertEqual(sample.class_id, "u001")
            self.assertEqual(sample.glosa, "bien")
            self.assertEqual(sample.tipo, "normal")
            self.assertEqual(len(sample.frames), 1)

    def test_rejects_duplicate_sample_ids(self) -> None:
        """Impide identidades ambiguas antes del split."""

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "clases").mkdir()
            manifest = {"clases": [{"classId": "u001", "archivo": "clases/u001.json"}]}
            sample = {
                "id": "same", "classId": "u001", "capturedAt": "now",
                "frames": [{"frameIndex": 0, "timestampMs": 0, "observacion": {}}],
            }
            payload = {
                "clase": {"classId": "u001", "glosa": "x", "tipo": "normal"},
                "muestras": [sample, sample],
            }
            (root / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
            (root / "clases" / "u001.json").write_text(json.dumps(payload), encoding="utf-8")
            with self.assertRaises(DatasetFormatError):
                list(DatasetReader(root).iter_samples())


if __name__ == "__main__":
    unittest.main()
