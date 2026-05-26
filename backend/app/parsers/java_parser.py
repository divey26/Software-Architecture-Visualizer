from __future__ import annotations

import re
from pathlib import Path

from app.models.schemas import ApiEndpoint, Component, ComponentType
from app.utils.file_utils import safe_read_text


ANNOTATION_TYPES: dict[str, ComponentType] = {
    "RestController": "controller",
    "Controller": "controller",
    "Service": "service",
    "Repository": "repository",
    "Entity": "model",
    "Configuration": "config",
}

METHOD_MAPPINGS = {
    "GetMapping": "GET",
    "PostMapping": "POST",
    "PutMapping": "PUT",
    "DeleteMapping": "DELETE",
    "PatchMapping": "PATCH",
    "RequestMapping": "REQUEST",
}


class JavaParser:
    def parse(self, root: Path, relative_path: str) -> tuple[list[Component], list[ApiEndpoint]]:
        source = safe_read_text(root / relative_path)
        imports = re.findall(r"^\s*import\s+([\w.]+);", source, re.MULTILINE)
        components = self._components(relative_path, source, imports)
        endpoints = self._endpoints(relative_path, source)
        return components, endpoints

    def _components(self, relative_path: str, source: str, imports: list[str]) -> list[Component]:
        components: list[Component] = []
        class_match = re.search(r"\b(class|interface|record)\s+([A-Za-z0-9_]+)", source)
        if not class_match:
            return components
        class_name = class_match.group(2)
        annotations = set(re.findall(r"@([A-Za-z]+)", source[: class_match.start()]))
        component_type = self._type_from_annotations(annotations) or self._type_from_path(relative_path)
        if component_type == "unknown":
            return components
        references = sorted(
            set(re.findall(r"\b([A-Z][A-Za-z0-9_]*(?:Service|Repository|Controller|Entity|Dto|DTO))\b", source))
            - {class_name}
        )
        components.append(
            Component(
                id=class_name,
                label=class_name,
                type=component_type,
                filePath=relative_path,
                imports=imports,
                references=references,
            )
        )
        return components

    def _endpoints(self, relative_path: str, source: str) -> list[ApiEndpoint]:
        endpoints: list[ApiEndpoint] = []
        base_path = self._request_path(source)
        method_pattern = re.compile(
            r"@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)"
            r"(?:\(([^)]*)\))?[\s\S]{0,500}?\b(?:public|private|protected)?\s+[\w<>, ?]+\s+(\w+)\s*\(",
            re.MULTILINE,
        )
        for match in method_pattern.finditer(source):
            annotation, args, handler = match.groups()
            method = self._method_for(annotation, args or "")
            path = self._path_from_args(args or "")
            endpoints.append(
                ApiEndpoint(
                    method=method,
                    path=self._join_paths(base_path, path),
                    handler=handler,
                    filePath=relative_path,
                )
            )
        return endpoints

    def _type_from_annotations(self, annotations: set[str]) -> ComponentType | None:
        for annotation, component_type in ANNOTATION_TYPES.items():
            if annotation in annotations:
                return component_type
        if "Component" in annotations:
            return "service"
        return None

    def _type_from_path(self, relative_path: str) -> ComponentType:
        path = relative_path.lower()
        if "controller" in path:
            return "controller"
        if "service" in path:
            return "service"
        if "repository" in path:
            return "repository"
        if "entity" in path or "model" in path:
            return "model"
        if "dto" in path:
            return "dto"
        if "config" in path:
            return "config"
        if "security" in path:
            return "security"
        return "unknown"

    def _request_path(self, source: str) -> str:
        class_section = source[: source.find("{")] if "{" in source else source
        request_mapping = re.search(r"@RequestMapping\(([^)]*)\)", class_section)
        return self._path_from_args(request_mapping.group(1)) if request_mapping else ""

    def _path_from_args(self, args: str) -> str:
        match = re.search(r"(?:value\s*=\s*|path\s*=\s*)?[\"']([^\"']+)[\"']", args)
        return match.group(1) if match else "/"

    def _method_for(self, annotation: str, args: str) -> str:
        if annotation != "RequestMapping":
            return METHOD_MAPPINGS[annotation]
        method_match = re.search(r"RequestMethod\.([A-Z]+)", args)
        return method_match.group(1) if method_match else "REQUEST"

    def _join_paths(self, base: str, path: str) -> str:
        if not base:
            return path or "/"
        if path in {"", "/"}:
            return base
        return f"/{base.strip('/')}/{path.strip('/')}"
