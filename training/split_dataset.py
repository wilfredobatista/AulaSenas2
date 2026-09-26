"""Mapping estable y split piloto estratificado por muestras independientes."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
import hashlib
import math
import random
from typing import Iterable, Protocol


SPLIT_NAMES = ("train", "validation", "test")
SPLIT_RATIOS = (0.70, 0.15, 0.15)


class SampleForSplit(Protocol):
    """Campos mínimos del split, sin acoplarlo al vectorizador."""

    sample_id: str
    class_id: str
    temporal_length: int
    warnings: list[str]


@dataclass(frozen=True)
class SplitEntry:
    """Asignación serializable de una muestra a un único subconjunto."""

    sample_id: str
    class_id: str
    split: str
    temporal_length: int
    warnings: list[str]


def build_class_mapping(class_ids: Iterable[str]) -> dict[str, int]:
    """Asigna índices según orden lexicográfico estable de ``classId``."""

    ordered = sorted(set(class_ids))
    if not ordered:
        raise ValueError("No hay classId para construir el mapping")
    return {class_id: index for index, class_id in enumerate(ordered)}


def _allocate_counts(total: int) -> dict[str, int]:
    """Aplica mayor residuo con desempate train/validation/test."""

    exact = [total * ratio for ratio in SPLIT_RATIOS]
    counts = [math.floor(value) for value in exact]
    remaining = total - sum(counts)
    order = sorted(range(3), key=lambda index: (-(exact[index] - counts[index]), index))
    for index in order[:remaining]:
        counts[index] += 1
    return dict(zip(SPLIT_NAMES, counts))


def _class_seed(seed: int, class_id: str) -> int:
    """Deriva semilla estable, independiente del hash aleatorio de Python."""

    digest = hashlib.sha256(f"{seed}:{class_id}".encode("utf-8")).digest()
    return int.from_bytes(digest[:8], "big")


def stratified_split(samples: Iterable[SampleForSplit], seed: int = 42) -> list[SplitEntry]:
    """Divide por clase de forma determinista y sin solapamientos."""

    by_class: dict[str, list[SampleForSplit]] = defaultdict(list)
    seen: set[str] = set()
    for sample in samples:
        if sample.sample_id in seen:
            raise ValueError(f"sampleId duplicado en split: {sample.sample_id}")
        seen.add(sample.sample_id)
        by_class[sample.class_id].append(sample)

    result: list[SplitEntry] = []
    for class_id in sorted(by_class):
        ordered = sorted(by_class[class_id], key=lambda item: item.sample_id)
        random.Random(_class_seed(seed, class_id)).shuffle(ordered)
        counts = _allocate_counts(len(ordered))
        cursor = 0
        for split_name in SPLIT_NAMES:
            selected = ordered[cursor : cursor + counts[split_name]]
            cursor += counts[split_name]
            result.extend(
                SplitEntry(
                    sample_id=item.sample_id,
                    class_id=item.class_id,
                    split=split_name,
                    temporal_length=item.temporal_length,
                    warnings=list(item.warnings),
                )
                for item in selected
            )
    return result
