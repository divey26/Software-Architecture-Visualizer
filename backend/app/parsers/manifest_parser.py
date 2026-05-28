from __future__ import annotations

import re
import json
import xml.etree.ElementTree as ET
from pathlib import Path

from app.models.schemas import DependencyInfo, PackageScript
from app.utils.file_utils import should_ignore

try:
    import tomllib
except ModuleNotFoundError:  # pragma: no cover - Python < 3.11 fallback
    tomllib = None  # type: ignore[assignment]


class ManifestParser:
    MANIFEST_NAMES = {"requirements.txt", "pyproject.toml", "pom.xml", "build.gradle", "package.json"}

    def parse(self, root: Path) -> list[DependencyInfo]:
        dependencies: list[DependencyInfo] = []
        for path in root.rglob("*"):
            if path.is_dir() or should_ignore(path.relative_to(root)):
                continue
            if path.name not in self.MANIFEST_NAMES:
                continue
            relative = path.relative_to(root).as_posix()
            if path.name == "requirements.txt":
                dependencies.extend(self._requirements(path, relative))
            elif path.name == "pyproject.toml":
                dependencies.extend(self._pyproject(path, relative))
            elif path.name == "pom.xml":
                dependencies.extend(self._pom(path, relative))
            elif path.name == "build.gradle":
                dependencies.extend(self._gradle(path, relative))
            elif path.name == "package.json":
                dependencies.extend(self._package_json(path, relative))
        return self._dedupe(dependencies)

    def parse_scripts(self, root: Path) -> list[PackageScript]:
        scripts: list[PackageScript] = []
        for path in root.rglob("package.json"):
            if should_ignore(path.relative_to(root)):
                continue
            relative = path.relative_to(root).as_posix()
            try:
                data = json.loads(path.read_text(encoding="utf-8", errors="ignore"))
            except json.JSONDecodeError:
                continue
            values = data.get("scripts", {})
            if not isinstance(values, dict):
                continue
            scripts.extend(
                PackageScript(name=str(name), command=str(command), source=relative)
                for name, command in values.items()
            )
        return scripts

    def _requirements(self, path: Path, source: str) -> list[DependencyInfo]:
        dependencies: list[DependencyInfo] = []
        for raw_line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = raw_line.split("#", 1)[0].strip()
            if not line or line.startswith(("-r", "--", "git+", "http://", "https://")):
                continue
            match = re.match(r"([A-Za-z0-9_.-]+)\s*(?:==|~=|>=|<=|>|<)?\s*([^;,\s]+)?", line)
            if match:
                dependencies.append(
                    DependencyInfo(
                        name=match.group(1),
                        version=match.group(2) or "",
                        source=source,
                        ecosystem="python",
                    )
                )
        return dependencies

    def _pyproject(self, path: Path, source: str) -> list[DependencyInfo]:
        if tomllib is None:
            return self._pyproject_regex(path, source)
        try:
            data = tomllib.loads(path.read_text(encoding="utf-8", errors="ignore"))
        except Exception:
            return self._pyproject_regex(path, source)

        raw_dependencies: list[str] = []
        project = data.get("project", {})
        if isinstance(project, dict):
            raw_dependencies.extend(project.get("dependencies", []) or [])
            optional = project.get("optional-dependencies", {}) or {}
            if isinstance(optional, dict):
                for values in optional.values():
                    raw_dependencies.extend(values or [])

        poetry_deps = data.get("tool", {}).get("poetry", {}).get("dependencies", {})
        if isinstance(poetry_deps, dict):
            for name, version in poetry_deps.items():
                if name.lower() == "python":
                    continue
                raw_dependencies.append(f"{name}{version if isinstance(version, str) else ''}")

        return [self._python_dependency(item, source) for item in raw_dependencies if isinstance(item, str)]

    def _pyproject_regex(self, path: Path, source: str) -> list[DependencyInfo]:
        dependencies: list[DependencyInfo] = []
        for match in re.finditer(r"['\"]([A-Za-z0-9_.-]+)\s*(?:==|~=|>=|<=|>|<)?\s*([^'\"]*)['\"]", path.read_text(encoding="utf-8", errors="ignore")):
            dependencies.append(DependencyInfo(name=match.group(1), version=match.group(2).strip(), source=source, ecosystem="python"))
        return dependencies

    def _pom(self, path: Path, source: str) -> list[DependencyInfo]:
        try:
            root = ET.fromstring(path.read_text(encoding="utf-8", errors="ignore"))
        except ET.ParseError:
            return []
        dependencies: list[DependencyInfo] = []
        namespace = self._namespace(root.tag)
        for dependency in root.findall(f".//{namespace}dependency"):
            artifact = dependency.findtext(f"{namespace}artifactId") or ""
            version = dependency.findtext(f"{namespace}version") or ""
            if artifact:
                dependencies.append(
                    DependencyInfo(name=artifact.strip(), version=version.strip(), source=source, ecosystem="maven")
                )
        return dependencies

    def _gradle(self, path: Path, source: str) -> list[DependencyInfo]:
        dependencies: list[DependencyInfo] = []
        text = path.read_text(encoding="utf-8", errors="ignore")
        patterns = [
            r"\b(?:implementation|api|compileOnly|runtimeOnly|testImplementation)\s+['\"]([^:'\"]+):([^:'\"]+):([^'\"]+)['\"]",
            r"\b(?:implementation|api|compileOnly|runtimeOnly|testImplementation)\s*\(\s*['\"]([^:'\"]+):([^:'\"]+):([^'\"]+)['\"]\s*\)",
        ]
        for pattern in patterns:
            for _, artifact, version in re.findall(pattern, text):
                dependencies.append(
                    DependencyInfo(name=artifact.strip(), version=version.strip(), source=source, ecosystem="gradle")
                )
        return dependencies

    def _package_json(self, path: Path, source: str) -> list[DependencyInfo]:
        try:
            data = json.loads(path.read_text(encoding="utf-8", errors="ignore"))
        except json.JSONDecodeError:
            return []

        dependencies: list[DependencyInfo] = []
        for dependency_type, key in (("production", "dependencies"), ("development", "devDependencies")):
            values = data.get(key, {})
            if not isinstance(values, dict):
                continue
            for name, version in values.items():
                dependencies.append(
                    DependencyInfo(
                        name=str(name),
                        version=str(version),
                        source=source,
                        ecosystem="npm",
                        dependencyType=dependency_type,
                    )
                )
        return dependencies

    def _python_dependency(self, requirement: str, source: str) -> DependencyInfo:
        match = re.match(r"\s*([A-Za-z0-9_.-]+)\s*(?:==|~=|>=|<=|>|<)?\s*(.*)", requirement)
        if not match:
            return DependencyInfo(name=requirement.strip(), source=source, ecosystem="python")
        return DependencyInfo(
            name=match.group(1),
            version=match.group(2).strip(),
            source=source,
            ecosystem="python",
        )

    def _namespace(self, tag: str) -> str:
        if tag.startswith("{"):
            return tag.split("}", 1)[0] + "}"
        return ""

    def _dedupe(self, dependencies: list[DependencyInfo]) -> list[DependencyInfo]:
        seen: set[tuple[str, str, str]] = set()
        unique: list[DependencyInfo] = []
        for dependency in dependencies:
            key = (dependency.name.lower(), dependency.source, dependency.ecosystem, dependency.dependencyType)
            if key in seen:
                continue
            seen.add(key)
            unique.append(dependency)
        return sorted(unique, key=lambda item: (item.ecosystem, item.source, item.name.lower()))
