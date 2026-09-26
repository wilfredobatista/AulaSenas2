"""Ejecuta TRAIN-02: lectura, vectorización, split y reporte, sin entrenar."""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from dataclasses import dataclass
import json
import math
from pathlib import Path
import statistics
from typing import Iterable

from dataset_reader import DatasetReader
from split_dataset import SPLIT_RATIOS, build_class_mapping, stratified_split
from vectorizer import (
    DELTA_NORMALIZED,
    FACE_PRESENCE,
    FACE_XYZ,
    FEATURE_COUNT,
    InvalidTorsoReferenceError,
    LEFT_HAND,
    LEFT_HAND_PRESENCE,
    POSE_PRESENCE,
    POSE_VISIBILITY,
    POSE_XYZ,
    RIGHT_HAND,
    RIGHT_HAND_PRESENCE,
    TORSO_EPSILON,
    VectorizationError,
    vectorize_sample,
)


@dataclass(frozen=True)
class ProcessedSample:
    """Metadata mínima retenida tras validar y liberar los vectores."""

    sample_id: str
    class_id: str
    temporal_length: int
    warnings: list[str]


def _percentile(values: list[float], percentile: float) -> float:
    """Calcula percentil lineal inclusivo sin dependencias externas."""

    if not values:
        raise ValueError("No se pueden resumir valores vacíos")
    ordered = sorted(values)
    position = (len(ordered) - 1) * percentile
    lower, upper = math.floor(position), math.ceil(position)
    if lower == upper:
        return float(ordered[lower])
    fraction = position - lower
    return float(ordered[lower] * (1.0 - fraction) + ordered[upper] * fraction)


def _summary(values: Iterable[float], percentiles: tuple[int, ...]) -> dict[str, float]:
    """Resume una distribución con los estadísticos requeridos."""

    data = list(values)
    result = {
        "min": float(min(data)),
        "mean": float(statistics.fmean(data)),
        "median": float(statistics.median(data)),
    }
    for percentile in percentiles:
        result[f"p{percentile}"] = _percentile(data, percentile / 100.0)
    result["max"] = float(max(data))
    return result


def _validate_vector(vector: list[float], sample_id: str) -> None:
    """Comprueba forma, finitud, máscaras, delta y placeholders de ausencia."""

    if len(vector) != FEATURE_COUNT:
        raise AssertionError(f"F != {FEATURE_COUNT} en {sample_id}")
    if not all(math.isfinite(value) for value in vector):
        raise AssertionError(f"NaN/Infinity en {sample_id}")
    presences = (LEFT_HAND_PRESENCE, RIGHT_HAND_PRESENCE, POSE_PRESENCE, FACE_PRESENCE)
    if any(vector[index] not in (0.0, 1.0) for index in presences):
        raise AssertionError(f"Máscara no binaria en {sample_id}")
    if not 0.0 <= vector[DELTA_NORMALIZED] <= 1.0:
        raise AssertionError(f"deltaNorm fuera de rango en {sample_id}")
    for presence, block in (
        (LEFT_HAND_PRESENCE, LEFT_HAND),
        (RIGHT_HAND_PRESENCE, RIGHT_HAND),
        (POSE_PRESENCE, POSE_XYZ),
        (FACE_PRESENCE, FACE_XYZ),
    ):
        if vector[presence] == 0.0 and any(value != 0.0 for value in vector[block]):
            raise AssertionError(f"Coordenadas no nulas en ausencia: {sample_id}")
    if vector[POSE_PRESENCE] == 0.0 and any(
        value != 0.0 for value in vector[POSE_VISIBILITY]
    ):
        raise AssertionError(f"Visibilidad no nula con pose ausente en {sample_id}")


def _write_json(path: Path, payload: object) -> None:
    """Escribe un resultado legible, estable y terminado en nueva línea."""

    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2, sort_keys=True)
        handle.write("\n")


def run(dataset: Path, seed: int, output: Path) -> dict[str, object]:
    """Ejecuta el pipeline y genera los tres artefactos de TRAIN-02.

    Los vectores se validan muestra por muestra y se liberan; los reportes no
    duplican la geometría del dataset fuente.
    """

    reader = DatasetReader(dataset)
    hashes_before = reader.source_hashes()
    accepted: list[ProcessedSample] = []
    excluded: list[dict[str, str]] = []
    temporal_lengths: list[float] = []
    temporal_by_class: dict[str, list[float]] = defaultdict(list)
    deltas: list[float] = []
    total_frames = 0
    torso_invalid_frames = 0

    for sample in reader.iter_samples():
        try:
            vectorized = vectorize_sample(sample)
            for vector in vectorized.features:
                _validate_vector(vector, sample.sample_id)
            if vectorized.temporal_length < 1 or any(delta < 0 for delta in vectorized.delta_ms):
                raise AssertionError(f"Secuencia/deltas inválidos en {sample.sample_id}")
        except InvalidTorsoReferenceError as exc:
            torso_invalid_frames += 1
            excluded.append(
                {"sampleId": sample.sample_id, "classId": sample.class_id, "reason": str(exc)}
            )
            continue
        except (VectorizationError, AssertionError) as exc:
            excluded.append(
                {"sampleId": sample.sample_id, "classId": sample.class_id, "reason": str(exc)}
            )
            continue

        accepted.append(
            ProcessedSample(
                sample.sample_id, sample.class_id, vectorized.temporal_length, vectorized.warnings
            )
        )
        temporal_lengths.append(float(vectorized.temporal_length))
        temporal_by_class[sample.class_id].append(float(vectorized.temporal_length))
        deltas.extend(vectorized.delta_ms)
        total_frames += vectorized.temporal_length

    if not accepted:
        raise RuntimeError("TRAIN-02 no produjo muestras aceptadas")

    mapping = build_class_mapping(item.class_id for item in accepted)
    split_entries = stratified_split(accepted, seed)
    if split_entries != stratified_split(accepted, seed):
        raise AssertionError("El split no es reproducible")
    if len({entry.sample_id for entry in split_entries}) != len(split_entries):
        raise AssertionError("Un sampleId aparece en más de un split")

    split_counts = Counter(entry.split for entry in split_entries)
    split_by_class: dict[str, Counter[str]] = defaultdict(Counter)
    for entry in split_entries:
        split_by_class[entry.class_id][entry.split] += 1

    hashes_after = reader.source_hashes()
    if hashes_before != hashes_after:
        raise AssertionError("El dataset fuente cambió durante TRAIN-02")

    mapping_payload = {
        "rule": "classId lexicográfico ascendente",
        "classIdToClassIndex": mapping,
        "classIndexToClassId": {str(index): key for key, index in mapping.items()},
    }
    split_payload = {
        "seed": seed,
        "targetRatios": dict(zip(("train", "validation", "test"), SPLIT_RATIOS)),
        "rounding": "mayor residuo; desempate train, validation, test",
        "samples": [
            {
                "sampleId": entry.sample_id,
                "classId": entry.class_id,
                "split": entry.split,
                "T": entry.temporal_length,
                "warnings": entry.warnings,
            }
            for entry in split_entries
        ],
    }
    report: dict[str, object] = {
        "train02": {
            "trainedModel": False,
            "featureSource": "frame.observacion",
            "variableLength": True,
            "paddingTruncationResampling": False,
        },
        "dataset": {
            "path": dataset.as_posix(),
            "classCount": len(mapping),
            "acceptedSampleCount": len(accepted),
            "excludedSampleCount": len(excluded),
            "totalFrames": total_frames,
            "sourceUnchanged": True,
            "sourceSha256": hashes_after,
        },
        "features": {
            "F": FEATURE_COUNT,
            "layout": {
                "0:63": "leftHandXYZ", "63:126": "rightHandXYZ",
                "126:159": "poseXYZ", "159:303": "faceXYZ",
                "303:314": "poseVisibility", "314": "leftHandPresence",
                "315": "rightHandPresence", "316": "posePresence",
                "317": "facePresence", "318": "deltaNorm",
            },
            "normalization": {
                "origin": "midpoint(pose[3], pose[4]) in XYZ",
                "scale": "XY distance between pose[3] and pose[4]",
                "formula": "(point - shoulderMidpoint) / shoulderDistanceXY",
                "epsilon": TORSO_EPSILON,
                "invalidTorsoPolicy": "exclude complete sample",
            },
        },
        "temporalLength": {
            "global": _summary(temporal_lengths, (75, 90, 95)),
            "byClass": {
                key: _summary(values, (75, 90, 95))
                for key, values in sorted(temporal_by_class.items())
            },
        },
        "deltaMs": _summary(deltas, (95,)),
        "diagnostics": {
            "nanCount": 0,
            "infinityCount": 0,
            "framesWithoutValidTorso": torso_invalid_frames,
            "excludedSamples": excluded,
        },
        "split": {
            "seed": seed,
            "counts": dict(sorted(split_counts.items())),
            "countsByClass": {
                key: dict(sorted(counts.items())) for key, counts in sorted(split_by_class.items())
            },
            "reproducible": True,
            "uniqueSampleIds": True,
        },
        "validations": {
            "allShapesTBy319": True, "allTAtLeastOne": True,
            "finiteValues": True, "binaryMasks": True,
            "nonNegativeDeltas": True, "deltaNormInRange": True,
            "absentCoordinatesAreZero": True, "validTorsoForAcceptedFrames": True,
            "deterministicClassMapping": True, "disjointSplits": True,
            "reproducibleSplit": True, "sourceDatasetUnchanged": True,
        },
    }
    _write_json(output / "class_mapping.json", mapping_payload)
    _write_json(output / "split_manifest.json", split_payload)
    _write_json(output / "train02_report.json", report)
    return report


def main() -> None:
    """Parsea rutas relativas al repositorio y ejecuta TRAIN-02."""

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", type=Path, required=True)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output", type=Path, default=Path("training/resultados/train02"))
    args = parser.parse_args()
    report = run(args.dataset, args.seed, args.output)
    print(json.dumps({
        "report": (args.output / "train02_report.json").as_posix(),
        "samples": report["dataset"]["acceptedSampleCount"],
        "frames": report["dataset"]["totalFrames"],
        "sourceUnchanged": report["dataset"]["sourceUnchanged"],
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
