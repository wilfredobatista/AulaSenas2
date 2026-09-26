"""Lectura validada y de solo lectura del dataset usado por TRAIN-02.

Traduce la estructura persistida (``clase`` + ``muestras``) a muestras
independientes. Carga un archivo de clase a la vez para limitar memoria y
nunca escribe en el directorio del dataset.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import json
from pathlib import Path
from typing import Any, Iterator


class DatasetFormatError(ValueError):
    """Indica que el dataset no cumple la estructura mínima requerida."""


@dataclass(frozen=True)
class DatasetSample:
    """Muestra independiente; ``class_id`` es la identidad de entrenamiento."""

    sample_id: str
    class_id: str
    glosa: str
    tipo: str
    frames: list[dict[str, Any]]
    captured_at: str
    metadata: dict[str, Any]


def _read_json(path: Path) -> Any:
    """Lee JSON y convierte errores de I/O/sintaxis en diagnóstico localizable."""

    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, json.JSONDecodeError) as exc:
        raise DatasetFormatError(f"No se pudo leer JSON válido: {path}: {exc}") from exc


class DatasetReader:
    """Carga el manifest y enumera muestras sin alterar archivos fuente."""

    def __init__(self, dataset_path: str | Path) -> None:
        """Inicializa con el directorio que contiene manifest y clases."""

        self.dataset_path = Path(dataset_path).resolve()
        self.manifest_path = self.dataset_path / "manifest.json"
        self.manifest = _read_json(self.manifest_path)
        if not isinstance(self.manifest, dict):
            raise DatasetFormatError("manifest.json debe contener un objeto JSON")
        classes = self.manifest.get("clases")
        if not isinstance(classes, list) or not classes:
            raise DatasetFormatError("manifest.json debe declarar una lista no vacía 'clases'")

    def source_files(self) -> list[Path]:
        """Devuelve fuentes declaradas, con rutas confinadas al dataset."""

        files = [self.manifest_path]
        for entry in self.manifest["clases"]:
            if not isinstance(entry, dict) or not isinstance(entry.get("archivo"), str):
                raise DatasetFormatError("Cada clase del manifest requiere 'archivo'")
            path = (self.dataset_path / entry["archivo"]).resolve()
            try:
                path.relative_to(self.dataset_path)
            except ValueError as exc:
                raise DatasetFormatError(f"Ruta de clase fuera del dataset: {path}") from exc
            if not path.is_file():
                raise DatasetFormatError(f"Archivo de clase inexistente: {path}")
            files.append(path)
        return files

    def source_hashes(self) -> dict[str, str]:
        """Calcula SHA-256 para demostrar que TRAIN-02 no modifica el dataset."""

        hashes: dict[str, str] = {}
        for path in self.source_files():
            digest = hashlib.sha256()
            with path.open("rb") as handle:
                for block in iter(lambda: handle.read(1024 * 1024), b""):
                    digest.update(block)
            hashes[path.relative_to(self.dataset_path).as_posix()] = digest.hexdigest()
        return hashes

    def iter_samples(self) -> Iterator[DatasetSample]:
        """Entrega muestras y valida identidad y estructura básica.

        Solo el vectorizador interpreta el contenido geométrico de los frames.
        """

        seen_ids: set[str] = set()
        class_files = self.source_files()[1:]
        for manifest_entry, class_path in zip(self.manifest["clases"], class_files):
            expected_class_id = manifest_entry.get("classId")
            if not isinstance(expected_class_id, str) or not expected_class_id:
                raise DatasetFormatError("Cada clase del manifest requiere 'classId'")
            document = _read_json(class_path)
            if not isinstance(document, dict):
                raise DatasetFormatError(f"{class_path} debe contener un objeto JSON")
            class_metadata = document.get("clase")
            samples = document.get("muestras")
            if not isinstance(class_metadata, dict) or not isinstance(samples, list):
                raise DatasetFormatError(f"{class_path} requiere 'clase' y 'muestras'")
            if class_metadata.get("classId") != expected_class_id:
                raise DatasetFormatError(f"classId no coincide en {class_path.name}")
            glosa, tipo = class_metadata.get("glosa", ""), class_metadata.get("tipo", "")
            if not isinstance(glosa, str) or not isinstance(tipo, str):
                raise DatasetFormatError(f"glosa/tipo inválidos en {class_path}")

            for sample in samples:
                if not isinstance(sample, dict):
                    raise DatasetFormatError(f"Muestra no objetiva en {class_path}")
                sample_id = sample.get("id")
                frames = sample.get("frames")
                captured_at = sample.get("capturedAt")
                if not isinstance(sample_id, str) or not sample_id:
                    raise DatasetFormatError(f"Muestra sin id en {class_path}")
                if sample_id in seen_ids:
                    raise DatasetFormatError(f"sampleId duplicado: {sample_id}")
                if sample.get("classId") != expected_class_id:
                    raise DatasetFormatError(f"classId inválido en muestra {sample_id}")
                if not isinstance(frames, list):
                    raise DatasetFormatError(f"frames inválido en muestra {sample_id}")
                if not isinstance(captured_at, str):
                    raise DatasetFormatError(f"capturedAt inválido en muestra {sample_id}")
                for frame in frames:
                    required = ("frameIndex", "timestampMs", "observacion")
                    if not isinstance(frame, dict) or not all(key in frame for key in required):
                        raise DatasetFormatError(f"Frame inválido en muestra {sample_id}")
                seen_ids.add(sample_id)
                yield DatasetSample(
                    sample_id=sample_id,
                    class_id=expected_class_id,
                    glosa=glosa,
                    tipo=tipo,
                    frames=frames,
                    captured_at=captured_at,
                    metadata={
                        "fuente": sample.get("fuente"),
                        "tiempo": sample.get("tiempo"),
                        "stage": sample.get("stage"),
                    },
                )
