from __future__ import annotations

from pathlib import Path

from app.models.schemas import ProjectFile
from app.utils.file_utils import SUPPORTED_EXTENSIONS, language_for, should_ignore


class ScannerService:
    def scan(self, root: Path) -> list[ProjectFile]:
        files: list[ProjectFile] = []
        for path in root.rglob("*"):
            if path.is_dir() or should_ignore(path.relative_to(root)):
                continue
            if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
                continue
            relative = path.relative_to(root).as_posix()
            files.append(
                ProjectFile(
                    path=relative,
                    language=language_for(path),
                    size=path.stat().st_size,
                    componentTypes=[],
                )
            )
        return sorted(files, key=lambda item: item.path)
