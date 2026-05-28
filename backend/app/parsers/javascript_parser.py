from __future__ import annotations

import re
from pathlib import Path

from app.models.schemas import ApiEndpoint, Component, ComponentType
from app.utils.file_utils import safe_read_text


HTTP_METHODS = {"get", "post", "put", "delete", "patch", "options", "head"}


class JavaScriptParser:
    def discover_route_prefixes(self, root: Path, relative_paths: list[str]) -> dict[str, str]:
        prefixes: dict[str, str] = {}
        for relative_path in relative_paths:
            source = safe_read_text(root / relative_path)
            imports = self._import_bindings(source)
            for prefix, route_name in re.findall(
                r"\b(?:app|router)\.use\(\s*['\"]([^'\"]+)['\"]\s*,\s*([A-Za-z_$][\w$]*)",
                source,
            ):
                imported_path = imports.get(route_name)
                if imported_path:
                    prefixes[self._module_key(relative_path, imported_path)] = prefix
        return prefixes

    def parse(
        self,
        root: Path,
        relative_path: str,
        route_prefixes: dict[str, str] | None = None,
    ) -> tuple[list[Component], list[ApiEndpoint]]:
        source = safe_read_text(root / relative_path)
        imports = self._extract_imports(source)
        references = self._extract_references(source)
        components: list[Component] = []
        endpoints = self._endpoints(relative_path, source, route_prefixes or {})

        component_type = self._component_type(relative_path, source, endpoints)
        if component_type != "unknown":
            label = self._label(relative_path, source, component_type)
            components.append(
                Component(
                    id=self._component_id(relative_path, label),
                    label=label,
                    type=component_type,
                    filePath=relative_path,
                    imports=imports,
                    references=references,
                    metadata=self._metadata(component_type, source),
                )
            )

        model_component = self._mongoose_model(relative_path, source, imports)
        if model_component and not any(component.id == model_component.id for component in components):
            components.append(model_component)

        return components, endpoints

    def _component_type(self, relative_path: str, source: str, endpoints: list[ApiEndpoint]) -> ComponentType:
        path = relative_path.lower().replace("\\", "/")
        name = Path(relative_path).stem.lower()
        if (endpoints or "/routes/" in f"/{path}" or name.endswith(("routes", "route"))) and "app.listen" not in source:
            return "route"
        if self._is_express_server(source):
            return "server"
        if self._is_api_client(relative_path, source):
            return "api-client"
        if "controller" in path:
            return "controller"
        if "service" in path:
            return "service"
        if any(token in path for token in ("repository", "repositories", "dao", "data-access", "/db/")):
            return "repository"
        if self._is_mongoose_model(source):
            return "model"
        if any(token in path for token in ("/pages/", "/views/", "/screens/")):
            return "page"
        if "context" in path or "createcontext" in source.lower():
            return "context"
        if "store" in path or "createslice" in source.lower() or re.search(r"\bcreate\(\s*\(?\s*set\b", source):
            return "store"
        if name.startswith("use") and ("usestate" in source.lower() or "useeffect" in source.lower()):
            return "hook"
        if self._is_react_component(relative_path, source):
            return "component"
        if self._is_config(relative_path, source):
            return "config"
        return "unknown"

    def _endpoints(self, relative_path: str, source: str, route_prefixes: dict[str, str]) -> list[ApiEndpoint]:
        endpoints: list[ApiEndpoint] = []
        prefix = route_prefixes.get(self._path_key(relative_path), "")
        pattern = re.compile(
            r"\b(?P<router>router|app)\.(?P<method>get|post|put|delete|patch|options|head)\(\s*"
            r"['\"](?P<path>[^'\"]*)['\"]\s*,\s*(?P<handler>[A-Za-z_$][\w$]*)?",
            re.IGNORECASE,
        )
        for match in pattern.finditer(source):
            method = match.group("method").upper()
            path = self._join_paths(prefix if match.group("router") == "router" else "", match.group("path"))
            endpoints.append(
                ApiEndpoint(
                    method=method,
                    path=path,
                    handler=match.group("handler") or "inlineHandler",
                    filePath=relative_path,
                    router="Express",
                )
            )
        return endpoints

    def _mongoose_model(self, relative_path: str, source: str, imports: list[str]) -> Component | None:
        if not self._is_mongoose_model(source):
            return None
        model_match = re.search(r"(?:mongoose\.)?model\(\s*['\"]([^'\"]+)['\"]", source)
        schema_match = re.search(r"(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*new\s+(?:mongoose\.)?Schema", source)
        label = model_match.group(1) if model_match else self._label(relative_path, source, "model")
        return Component(
            id=self._component_id(relative_path, label),
            label=label,
            type="model",
            filePath=relative_path,
            imports=imports,
            references=self._extract_references(source),
            metadata={
                "schema": schema_match.group(1) if schema_match else "",
                "fields": self._schema_fields(source),
            },
        )

    def _metadata(self, component_type: ComponentType, source: str) -> dict[str, object]:
        if component_type in {"api-client", "page", "component"}:
            return {"hardcodedUrls": re.findall(r"['\"](/api/[^'\"]+)['\"]", source)}
        if component_type == "server":
            return {"usesExpress": True, "listens": "app.listen" in source}
        return {}

    def _extract_imports(self, source: str) -> list[str]:
        imports = re.findall(r"\bimport\s+(?:[\w${}\s,*]+from\s+)?['\"]([^'\"]+)['\"]", source)
        imports.extend(re.findall(r"\brequire\(\s*['\"]([^'\"]+)['\"]\s*\)", source))
        return sorted(set(imports))

    def _import_bindings(self, source: str) -> dict[str, str]:
        bindings: dict[str, str] = {}
        for name, module in re.findall(r"\bimport\s+([A-Za-z_$][\w$]*)\s+from\s+['\"]([^'\"]+)['\"]", source):
            bindings[name] = module
        for name, module in re.findall(r"\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*require\(\s*['\"]([^'\"]+)['\"]\s*\)", source):
            bindings[name] = module
        return bindings

    def _extract_references(self, source: str) -> list[str]:
        references = set(re.findall(r"\b([A-Z][A-Za-z0-9_]*(?:Controller|Service|Repository|Model|Routes?|Schema|Client|Page))\b", source))
        for exported in re.findall(r"\b(?:exports|module\.exports)\.([A-Za-z_$][\w$]*)", source):
            references.add(exported)
        return sorted(references)

    def _is_express_server(self, source: str) -> bool:
        return bool(
            re.search(r"\bexpress\(\s*\)", source)
            or "app.listen" in source
            or re.search(r"require\(\s*['\"]express['\"]\s*\)", source)
            or re.search(r"import\s+express\s+from\s+['\"]express['\"]", source)
        )

    def _is_mongoose_model(self, source: str) -> bool:
        return bool("mongoose.Schema" in source or re.search(r"\bnew\s+Schema\b", source) or re.search(r"\bmodel\(\s*['\"]", source))

    def _is_api_client(self, relative_path: str, source: str) -> bool:
        path = relative_path.lower().replace("\\", "/")
        return bool("axios" in source or "fetch(" in source or "apiclient" in path or "httpclient" in path or "/services/api" in path)

    def _is_react_component(self, relative_path: str, source: str) -> bool:
        extension = Path(relative_path).suffix.lower()
        if extension in {".jsx", ".tsx"}:
            return True
        return bool(
            "React.FC" in source
            or re.search(r"\bexport\s+default\s+function\s+[A-Z]", source)
            or re.search(r"\bfunction\s+[A-Z][A-Za-z0-9_]*\s*\([^)]*\)\s*{[\s\S]{0,800}return\s*\(", source)
            or re.search(r"\bconst\s+[A-Z][A-Za-z0-9_]*\s*=\s*\([^)]*\)\s*=>\s*\(?\s*<", source)
        )

    def _is_config(self, relative_path: str, source: str) -> bool:
        path = relative_path.lower().replace("\\", "/")
        return bool(
            "/config/" in path
            or "mongoose.connect" in source
            or "dotenv.config" in source
            or "express.json" in source
            or "helmet(" in source
            or "cors(" in source
        )

    def _schema_fields(self, source: str) -> list[str]:
        schema_match = re.search(r"new\s+(?:mongoose\.)?Schema\(\s*{(?P<body>[\s\S]*?)}\s*[,)]", source)
        if not schema_match:
            return []
        return sorted(set(re.findall(r"^\s*([A-Za-z_$][\w$]*)\s*:", schema_match.group("body"), re.MULTILINE)))

    def _label(self, relative_path: str, source: str, component_type: ComponentType) -> str:
        if component_type in {"controller", "service", "repository", "route", "api-client"}:
            return self._title_from_stem(Path(relative_path).stem)
        component_match = re.search(r"\b(?:function|class)\s+([A-Z][A-Za-z0-9_]*)", source)
        if component_match:
            return component_match.group(1)
        return self._title_from_stem(Path(relative_path).stem)

    def _title_from_stem(self, stem: str) -> str:
        parts = re.split(r"[._-]+", stem)
        return "".join(part[:1].upper() + part[1:] for part in parts if part)

    def _component_id(self, relative_path: str, label: str) -> str:
        token = re.sub(r"[^A-Za-z0-9]+", "-", relative_path).strip("-").lower()
        return f"{token}:{label}"

    def _path_key(self, relative_path: str) -> str:
        return str(Path(relative_path).with_suffix("")).replace("\\", "/").lower()

    def _module_key(self, from_path: str, imported_path: str) -> str:
        if not imported_path.startswith("."):
            return imported_path.lower()
        base = Path(from_path).parent
        return str((base / imported_path).with_suffix("")).replace("\\", "/").lower()

    def _join_paths(self, base: str, path: str) -> str:
        if not base:
            return path or "/"
        if not path or path == "/":
            return base if base.startswith("/") else f"/{base}"
        return f"/{base.strip('/')}/{path.strip('/')}"
