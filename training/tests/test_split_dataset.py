"""Pruebas del mapping y split determinista estratificado."""

from dataclasses import dataclass
from collections import Counter, defaultdict
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from split_dataset import build_class_mapping, stratified_split


@dataclass
class Sample:
    """Objeto mínimo compatible con el protocolo del split."""

    sample_id: str
    class_id: str
    temporal_length: int = 10
    warnings: list[str] = None

    def __post_init__(self) -> None:
        """Evita compartir la lista mutable por defecto entre pruebas."""

        if self.warnings is None:
            self.warnings = []


class SplitTests(unittest.TestCase):
    """Comprueba mapping léxico, redondeo y reproducibilidad."""

    def test_mapping_is_lexical(self) -> None:
        """El orden no depende del manifest ni del sistema de archivos."""

        self.assertEqual(
            build_class_mapping(["u002", "ruido_background", "u001"]),
            {"ruido_background": 0, "u001": 1, "u002": 2},
        )

    def test_stratified_reproducible_allocation(self) -> None:
        """15 produce 11/2/2 y 14 produce 10/2/2 sin solapamientos."""

        samples = [Sample(f"u001-{i}", "u001") for i in range(15)]
        samples += [Sample(f"bg-{i}", "ruido_background") for i in range(14)]
        first = stratified_split(samples, 42)
        self.assertEqual(first, stratified_split(reversed(samples), 42))
        counts = defaultdict(Counter)
        for entry in first:
            counts[entry.class_id][entry.split] += 1
        self.assertEqual(counts["u001"], {"train": 11, "validation": 2, "test": 2})
        self.assertEqual(counts["ruido_background"], {"train": 10, "validation": 2, "test": 2})
        self.assertEqual(len({entry.sample_id for entry in first}), len(first))


if __name__ == "__main__":
    unittest.main()
