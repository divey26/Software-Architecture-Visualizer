from __future__ import annotations

from pathlib import Path


IGNORED_DIRS = {
    ".git",
    "__pycache__",
    "node_modules",
    "venv",
    ".venv",
    "env",
    "target",
    "build",
    "dist",
}

SUPPORTED_EXTENSIONS = {".py", ".java", ".json", ".yml", ".yaml", ".properties"}


def should_ignore(path: Path) -> bool:
    return any(part in IGNORED_DIRS for part in path.parts)


def language_for(path: Path) -> str:
    extension = path.suffix.lower()
    if extension == ".py":
        return "python"
    if extension == ".java":
        return "java"
    if extension in {".yml", ".yaml"}:
        return "yaml"
    if extension == ".json":
        return "json"
    if extension == ".properties":
        return "properties"
    return "unknown"


def safe_read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")
