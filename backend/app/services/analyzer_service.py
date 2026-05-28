from __future__ import annotations

from pathlib import Path

from app.models.schemas import Component, ProjectAnalysis, ProjectFile, Summary
from app.parsers.manifest_parser import ManifestParser
from app.parsers.java_parser import JavaParser
from app.parsers.javascript_parser import JavaScriptParser
from app.parsers.python_parser import PythonParser
from app.services.access_control_analyzer import AccessControlAnalyzer
from app.services.graph_builder import GraphBuilder
from app.services.report_generator import ReportGenerator
from app.services.scanner_service import ScannerService
from app.services.smell_detector import SmellDetector


class AnalyzerService:
    def __init__(self) -> None:
        self.scanner = ScannerService()
        self.python_parser = PythonParser()
        self.java_parser = JavaParser()
        self.javascript_parser = JavaScriptParser()
        self.graph_builder = GraphBuilder()
        self.access_control_analyzer = AccessControlAnalyzer()
        self.manifest_parser = ManifestParser()
        self.smell_detector = SmellDetector()
        self.report_generator = ReportGenerator()

    def analyze(self, root: Path, project_name: str) -> ProjectAnalysis:
        files = self.scanner.scan(root)
        components: list[Component] = []
        endpoints = []
        python_include_prefixes = self.python_parser.discover_include_prefixes(
            root,
            [file.path for file in files if file.language == "python"],
        )
        javascript_route_prefixes = self.javascript_parser.discover_route_prefixes(
            root,
            [file.path for file in files if file.language in {"javascript", "typescript"}],
        )

        for file in files:
            parsed_components: list[Component] = []
            parsed_endpoints = []
            if file.language == "python":
                parsed_components, parsed_endpoints = self.python_parser.parse(root, file.path)
                parsed_endpoints = [
                    endpoint.model_copy(
                        update={
                            "path": self._join_paths(
                                python_include_prefixes.get(self._module_name(file.path), ""),
                                endpoint.path,
                            )
                        }
                    )
                    for endpoint in parsed_endpoints
                ]
            elif file.language == "java":
                parsed_components, parsed_endpoints = self.java_parser.parse(root, file.path)
            elif file.language in {"javascript", "typescript"}:
                parsed_components, parsed_endpoints = self.javascript_parser.parse(
                    root,
                    file.path,
                    javascript_route_prefixes,
                )
            elif file.language in {"json", "yaml", "properties"} and self._is_architecture_config_file(file.path):
                parsed_components = [self._config_component(file)]

            components.extend(parsed_components)
            endpoints.extend(parsed_endpoints)
            file.componentTypes = sorted({component.type for component in parsed_components})

        access_control, access_smells, access_components = self.access_control_analyzer.analyze(
            root,
            files,
            endpoints,
            javascript_route_prefixes,
        )
        self._apply_access_metadata(components, access_control.endpoints)
        components.extend(access_components)

        nodes = self.graph_builder.build_nodes(components)
        edges = self.graph_builder.build_edges(components)
        edges.extend(self._access_edges(nodes))
        architecture_smells = self.smell_detector.detect(nodes, edges)
        architecture_smells.extend(access_smells)
        dependencies = self.manifest_parser.parse(root)
        package_scripts = self.manifest_parser.parse_scripts(root)
        stack, frameworks = self._detect_stack(files, dependencies, nodes)
        languages = sorted({file.language for file in files if file.language not in {"json", "yaml", "properties", "env"}})
        summary = Summary(
            controllers=sum(1 for node in nodes if node.type in {"controller", "router", "route"}),
            services=sum(1 for node in nodes if node.type == "service"),
            repositories=sum(1 for node in nodes if node.type == "repository"),
            models=sum(1 for node in nodes if node.type in {"model", "dto"}),
            apis=len(endpoints),
            dependencies=len(edges),
            packageDependencies=len(dependencies),
            smells=len(architecture_smells),
            highSeveritySmells=sum(1 for smell in architecture_smells if smell.severity == "HIGH"),
            mediumSeveritySmells=sum(1 for smell in architecture_smells if smell.severity == "MEDIUM"),
            lowSeveritySmells=sum(1 for smell in architecture_smells if smell.severity == "LOW"),
        )
        return ProjectAnalysis(
            projectName=project_name,
            stack=stack,
            languages=languages,
            frameworks=frameworks,
            summary=summary,
            nodes=nodes,
            edges=edges,
            endpoints=endpoints,
            files=files,
            architectureSmells=architecture_smells,
            architectureReport=self.report_generator.generate(
                project_name,
                summary,
                nodes,
                edges,
                endpoints,
                architecture_smells,
                dependencies,
                access_control,
            ),
            dependencies=dependencies,
            packageScripts=package_scripts,
            accessControl=access_control,
        )

    def _config_component(self, file: ProjectFile) -> Component:
        label = "".join(part.capitalize() for part in Path(file.path).stem.replace("-", "_").split("_"))
        return Component(
            id=self._component_id(file.path, f"{label}Config"),
            label=f"{label} Config",
            type="config",
            filePath=file.path,
        )

    def _is_architecture_config_file(self, file_path: str) -> bool:
        path = Path(file_path)
        stem = path.stem.lower()
        name = path.name.lower()
        parts = {part.lower() for part in path.parts}

        if self._looks_like_generated_hash(stem):
            return False
        if name in {"package-lock.json", "yarn.lock", "pnpm-lock.yaml", "package.json", "tsconfig.json"}:
            return False
        if {"fixtures", "fixture", "data", "mock", "mocks", "samples", "sample"} & parts:
            return False

        config_tokens = {
            "application",
            "bootstrap",
            "config",
            "settings",
            "security",
            "properties",
            "environment",
            "env",
            "docker",
            "compose",
        }
        return any(token in stem for token in config_tokens)

    def _looks_like_generated_hash(self, value: str) -> bool:
        compact = value.replace("-", "").replace("_", "")
        if len(compact) < 24:
            return False
        hex_chars = sum(1 for character in compact if character in "0123456789abcdef")
        return hex_chars / len(compact) > 0.85

    def _detect_stack(self, files: list[ProjectFile], dependencies, nodes) -> tuple[str, list[str]]:
        dependency_names = {dependency.name.lower() for dependency in dependencies}
        languages = {file.language for file in files}
        frameworks: list[str] = []
        if "fastapi" in dependency_names or any(file.language == "python" for file in files):
            frameworks.append("FastAPI")
        if {"spring-boot-starter-web", "spring-boot-starter-data-jpa"} & dependency_names or any(file.language == "java" for file in files):
            frameworks.append("Spring Boot")
        has_express = "express" in dependency_names or any(node.type in {"server", "route"} for node in nodes)
        has_react = "react" in dependency_names or any(node.type in {"component", "page"} for node in nodes)
        has_mongo = "mongoose" in dependency_names or any(node.type == "model" and node.filePath.endswith((".js", ".ts")) for node in nodes)
        if has_express:
            frameworks.append("Express.js")
        if has_react:
            frameworks.append("React")
        if has_mongo:
            frameworks.append("MongoDB/Mongoose")
        if has_express and has_react and has_mongo:
            stack = "MERN"
        elif "FastAPI" in frameworks:
            stack = "FastAPI"
        elif "Spring Boot" in frameworks:
            stack = "Spring Boot"
        elif {"javascript", "typescript"} & languages:
            stack = "Node.js / React"
        else:
            stack = ""
        return stack, list(dict.fromkeys(frameworks))

    def _module_name(self, file_path: str) -> str:
        path = Path(file_path)
        without_suffix = path.with_suffix("")
        parts = list(without_suffix.parts)
        if parts[-1:] == ["__init__"]:
            parts = parts[:-1]
        return ".".join(parts)

    def _component_id(self, file_path: str, label: str) -> str:
        token = "".join(character if character.isalnum() else "-" for character in file_path).strip("-").lower()
        return f"{token}:{label}"

    def _join_paths(self, base: str, path: str) -> str:
        if not base:
            return path or "/"
        if not path or path == "/":
            return base if base.startswith("/") else f"/{base}"
        if path.startswith(base.rstrip("/") + "/") or path == base:
            return path
        return f"/{base.strip('/')}/{path.strip('/')}"

    def _apply_access_metadata(self, components: list[Component], endpoints) -> None:
        by_file: dict[str, list[dict[str, object]]] = {}
        for endpoint in endpoints:
            by_file.setdefault(endpoint.filePath, []).append(
                {
                    "method": endpoint.method,
                    "path": endpoint.path,
                    "accessLevel": endpoint.accessLevel,
                    "risk": endpoint.risk,
                    "middleware": endpoint.middleware,
                }
            )
        for component in components:
            if component.type not in {"route", "router", "controller"}:
                continue
            route_access = by_file.get(component.filePath)
            if not route_access:
                continue
            component.metadata = {
                **component.metadata,
                "accessLevels": sorted({item["accessLevel"] for item in route_access}),
                "accessEndpoints": route_access,
                "hasUnprotectedSensitive": any(item["accessLevel"] == "UNPROTECTED_SENSITIVE" for item in route_access),
            }

    def _access_edges(self, nodes) -> list:
        auth_node = next((node for node in nodes if node.id == "access-control:authentication"), None)
        middleware_node = next((node for node in nodes if node.id == "access-control:middleware"), None)
        if not auth_node and not middleware_node:
            return []
        edges = []
        route_nodes = [
            node
            for node in nodes
            if node.type in {"route", "router", "controller"}
            and isinstance(node.metadata.get("accessLevels"), list)
        ]
        for route_node in route_nodes:
            source = middleware_node.id if middleware_node else auth_node.id
            edges.append(
                self.graph_builder.edge(
                    f"access-edge-{len(edges) + 1}",
                    source,
                    route_node.id,
                    "protects",
                )
            )
        return edges
