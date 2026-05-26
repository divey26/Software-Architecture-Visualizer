from __future__ import annotations

import ast
import re
from pathlib import Path

from app.models.schemas import ApiEndpoint, Component, ComponentType
from app.utils.file_utils import safe_read_text


FASTAPI_METHODS = {"get", "post", "put", "delete", "patch", "options", "head"}


class PythonParser:
    def parse(self, root: Path, relative_path: str) -> tuple[list[Component], list[ApiEndpoint]]:
        path = root / relative_path
        source = safe_read_text(path)
        components: list[Component] = []
        endpoints: list[ApiEndpoint] = []
        imports: list[str] = []

        try:
            tree = ast.parse(source)
        except SyntaxError:
            return self._fallback_parse(relative_path, source)

        imports = self._extract_imports(tree)
        router_file = "APIRouter" in source or re.search(r"@\w+\.(get|post|put|delete|patch)\(", source)
        file_component_type = self._type_from_path(relative_path, router_file)

        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                component_type = self._class_type(node, relative_path, source)
                if component_type != "unknown":
                    components.append(
                        Component(
                            id=node.name,
                            label=node.name,
                            type=component_type,
                            filePath=relative_path,
                            imports=imports,
                            references=self._class_references(node),
                        )
                    )

            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                for decorator in node.decorator_list:
                    endpoint = self._endpoint_from_decorator(decorator, node.name, relative_path)
                    if endpoint:
                        endpoints.append(endpoint)

        if file_component_type in {"router", "service", "repository", "config", "middleware", "security"}:
            label = self._label_from_file(relative_path)
            components.append(
                Component(
                    id=label,
                    label=label,
                    type=file_component_type,
                    filePath=relative_path,
                    imports=imports,
                    references=self._references_from_source(source),
                )
            )

        return self._dedupe_components(components), endpoints

    def _fallback_parse(self, relative_path: str, source: str) -> tuple[list[Component], list[ApiEndpoint]]:
        endpoints: list[ApiEndpoint] = []
        for match in re.finditer(r"@(?:app|router)\.(get|post|put|delete|patch)\(['\"]([^'\"]+)['\"]", source):
            endpoints.append(
                ApiEndpoint(
                    method=match.group(1).upper(),
                    path=match.group(2),
                    handler="unknown",
                    filePath=relative_path,
                )
            )
        return [], endpoints

    def _extract_imports(self, tree: ast.AST) -> list[str]:
        imports: list[str] = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imports.extend(alias.name for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imports.append(node.module)
        return imports

    def _endpoint_from_decorator(
        self, decorator: ast.expr, handler: str, relative_path: str
    ) -> ApiEndpoint | None:
        if not isinstance(decorator, ast.Call) or not isinstance(decorator.func, ast.Attribute):
            return None
        method = decorator.func.attr.lower()
        if method not in FASTAPI_METHODS:
            return None
        if not decorator.args or not isinstance(decorator.args[0], ast.Constant):
            path = "/"
        else:
            path = str(decorator.args[0].value)
        return ApiEndpoint(method=method.upper(), path=path, handler=handler, filePath=relative_path)

    def _class_type(self, node: ast.ClassDef, relative_path: str, source: str) -> ComponentType:
        base_names = {self._name_for_expr(base) for base in node.bases}
        name = node.name.lower()
        path = relative_path.lower()
        if {"basemodel", "base"} & {base.lower() for base in base_names}:
            return "dto" if any(token in name for token in ("schema", "dto", "request", "response")) else "model"
        if "service" in name or "service" in path:
            return "service"
        if "repository" in name or "repo" in name or "repository" in path:
            return "repository"
        if "middleware" in name or "middleware" in path:
            return "middleware"
        if "config" in name or "settings" in name or "config" in path:
            return "config"
        if "security" in name or "auth" in path:
            return "security"
        if "APIRouter" in source and ("route" in path or "router" in path or "controller" in path):
            return "router"
        return "unknown"

    def _type_from_path(self, relative_path: str, router_file: bool) -> ComponentType:
        path = relative_path.lower()
        name = Path(relative_path).stem.lower()
        if router_file or any(token in path for token in ("routes", "routers", "controllers")):
            return "router"
        if "service" in name or "services/" in path:
            return "service"
        if "repository" in name or "repo" in name or "repositories/" in path:
            return "repository"
        if any(token in path for token in ("schema", "dto")):
            return "dto"
        if any(token in path for token in ("model", "entity")):
            return "model"
        if "middleware" in path:
            return "middleware"
        if any(token in path for token in ("config", "settings")):
            return "config"
        if any(token in path for token in ("security", "auth")):
            return "security"
        return "unknown"

    def _label_from_file(self, relative_path: str) -> str:
        return "".join(part.capitalize() for part in Path(relative_path).stem.replace("-", "_").split("_"))

    def _name_for_expr(self, expr: ast.expr) -> str:
        if isinstance(expr, ast.Name):
            return expr.id
        if isinstance(expr, ast.Attribute):
            return expr.attr
        return ""

    def _class_references(self, node: ast.ClassDef) -> list[str]:
        references: set[str] = set()
        for child in ast.walk(node):
            if isinstance(child, ast.Name) and child.id[:1].isupper():
                references.add(child.id)
        references.discard(node.name)
        return sorted(references)

    def _references_from_source(self, source: str) -> list[str]:
        return sorted(set(re.findall(r"\b[A-Z][A-Za-z0-9_]*(?:Service|Repository|Model|Schema|Controller)\b", source)))

    def _dedupe_components(self, components: list[Component]) -> list[Component]:
        seen: set[tuple[str, str]] = set()
        unique: list[Component] = []
        for component in components:
            key = (component.id, component.filePath)
            if key not in seen:
                seen.add(key)
                unique.append(component)
        return unique
