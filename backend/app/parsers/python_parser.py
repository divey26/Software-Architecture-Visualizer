from __future__ import annotations

import ast
import re
from pathlib import Path

from app.models.schemas import ApiEndpoint, Component, ComponentType
from app.utils.file_utils import safe_read_text


FASTAPI_METHODS = {"get", "post", "put", "delete", "patch", "options", "head"}


class PythonParser:
    def discover_include_prefixes(self, root: Path, relative_paths: list[str]) -> dict[str, str]:
        prefixes: dict[str, str] = {}
        for relative_path in relative_paths:
            try:
                tree = ast.parse(safe_read_text(root / relative_path))
            except SyntaxError:
                continue
            import_aliases = self._import_aliases(tree)
            for node in ast.walk(tree):
                if not isinstance(node, ast.Call) or not isinstance(node.func, ast.Attribute):
                    continue
                if node.func.attr != "include_router" or not node.args:
                    continue
                router_name = self._name_for_expr(node.args[0])
                module_name = import_aliases.get(router_name)
                prefix = self._keyword_string(node, "prefix")
                if module_name and prefix:
                    prefixes[module_name] = self._join_paths(prefixes.get(module_name, ""), prefix)
        return prefixes

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
        router_prefixes = self._router_prefixes(tree)
        include_router_prefixes = self._include_router_prefixes(tree)
        router_file = "APIRouter" in source or re.search(r"@\w+\.(get|post|put|delete|patch)\(", source)
        file_component_type = self._type_from_path(relative_path, router_file)

        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                component_type = self._class_type(node, relative_path, source)
                if component_type != "unknown":
                    components.append(
                        Component(
                            id=self._component_id(relative_path, node.name),
                            label=node.name,
                            type=component_type,
                            filePath=relative_path,
                            imports=imports,
                            references=self._class_references(node),
                        )
                    )

            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                for decorator in node.decorator_list:
                    endpoint = self._endpoint_from_decorator(
                        decorator,
                        node.name,
                        relative_path,
                        router_prefixes,
                        include_router_prefixes,
                    )
                    if endpoint:
                        endpoints.append(endpoint)

        if file_component_type in {"router", "service", "repository", "config", "middleware", "security"}:
            label = self._label_from_file(relative_path)
            components.append(
                Component(
                    id=self._component_id(relative_path, label),
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
        router_prefix_match = re.search(r"APIRouter\([^)]*prefix\s*=\s*['\"]([^'\"]+)['\"]", source)
        router_prefix = router_prefix_match.group(1) if router_prefix_match else ""
        for match in re.finditer(r"@(?P<router>app|router)\.(?P<method>get|post|put|delete|patch)\(['\"](?P<path>[^'\"]+)['\"]", source):
            endpoints.append(
                ApiEndpoint(
                    method=match.group("method").upper(),
                    path=self._join_paths(router_prefix if match.group("router") != "app" else "", match.group("path")),
                    handler="unknown",
                    filePath=relative_path,
                    router=match.group("router"),
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

    def _import_aliases(self, tree: ast.AST) -> dict[str, str]:
        aliases: dict[str, str] = {}
        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom) and node.module:
                for alias in node.names:
                    local_name = alias.asname or alias.name
                    aliases[local_name] = node.module if alias.name == "router" else f"{node.module}.{alias.name}"
            elif isinstance(node, ast.Import):
                for alias in node.names:
                    local_name = alias.asname or alias.name.split(".")[0]
                    aliases[local_name] = alias.name
        return aliases

    def _endpoint_from_decorator(
        self,
        decorator: ast.expr,
        handler: str,
        relative_path: str,
        router_prefixes: dict[str, str],
        include_router_prefixes: dict[str, str],
    ) -> ApiEndpoint | None:
        if not isinstance(decorator, ast.Call) or not isinstance(decorator.func, ast.Attribute):
            return None
        method = decorator.func.attr.lower()
        if method not in FASTAPI_METHODS:
            return None
        router_name = self._name_for_expr(decorator.func.value)
        if not decorator.args or not isinstance(decorator.args[0], ast.Constant):
            path = "/"
        else:
            path = str(decorator.args[0].value)
        route_prefix = router_prefixes.get(router_name, "")
        include_prefix = include_router_prefixes.get(router_name, "")
        full_path = self._join_paths(include_prefix, self._join_paths(route_prefix, path))
        return ApiEndpoint(
            method=method.upper(),
            path=full_path,
            handler=handler,
            filePath=relative_path,
            router=router_name,
        )

    def _router_prefixes(self, tree: ast.AST) -> dict[str, str]:
        prefixes: dict[str, str] = {}
        for node in ast.walk(tree):
            target_name = self._assignment_target_name(node)
            if not target_name:
                continue
            value = node.value if isinstance(node, (ast.Assign, ast.AnnAssign)) else None
            if not isinstance(value, ast.Call) or self._name_for_expr(value.func) != "APIRouter":
                continue
            prefix = self._keyword_string(value, "prefix")
            if prefix:
                prefixes[target_name] = prefix
        return prefixes

    def _include_router_prefixes(self, tree: ast.AST) -> dict[str, str]:
        prefixes: dict[str, str] = {}
        for node in ast.walk(tree):
            if not isinstance(node, ast.Call) or not isinstance(node.func, ast.Attribute):
                continue
            if node.func.attr != "include_router" or not node.args:
                continue
            router_name = self._name_for_expr(node.args[0])
            if not router_name:
                continue
            prefix = self._keyword_string(node, "prefix")
            if prefix:
                prefixes[router_name] = self._join_paths(prefixes.get(router_name, ""), prefix)
        return prefixes

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

    def _component_id(self, relative_path: str, label: str) -> str:
        token = re.sub(r"[^A-Za-z0-9]+", "-", relative_path).strip("-").lower()
        return f"{token}:{label}"

    def _name_for_expr(self, expr: ast.expr) -> str:
        if isinstance(expr, ast.Name):
            return expr.id
        if isinstance(expr, ast.Attribute):
            return expr.attr
        return ""

    def _assignment_target_name(self, node: ast.AST) -> str:
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    return target.id
        if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            return node.target.id
        return ""

    def _keyword_string(self, node: ast.Call, keyword_name: str) -> str:
        for keyword in node.keywords:
            if keyword.arg == keyword_name:
                return self._literal_string(keyword.value)
        return ""

    def _literal_string(self, expr: ast.expr) -> str:
        if isinstance(expr, ast.Constant) and isinstance(expr.value, str):
            return expr.value
        return ""

    def _join_paths(self, base: str, path: str) -> str:
        if not base:
            return path or "/"
        if not path or path == "/":
            return base if base.startswith("/") else f"/{base}"
        return f"/{base.strip('/')}/{path.strip('/')}"

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
