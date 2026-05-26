from __future__ import annotations

from pathlib import Path

from app.models.schemas import Component, ProjectAnalysis, ProjectFile, Summary
from app.parsers.java_parser import JavaParser
from app.parsers.python_parser import PythonParser
from app.services.graph_builder import GraphBuilder
from app.services.scanner_service import ScannerService


class AnalyzerService:
    def __init__(self) -> None:
        self.scanner = ScannerService()
        self.python_parser = PythonParser()
        self.java_parser = JavaParser()
        self.graph_builder = GraphBuilder()

    def analyze(self, root: Path, project_name: str) -> ProjectAnalysis:
        files = self.scanner.scan(root)
        components: list[Component] = []
        endpoints = []

        for file in files:
            parsed_components: list[Component] = []
            parsed_endpoints = []
            if file.language == "python":
                parsed_components, parsed_endpoints = self.python_parser.parse(root, file.path)
            elif file.language == "java":
                parsed_components, parsed_endpoints = self.java_parser.parse(root, file.path)
            elif file.language in {"json", "yaml", "properties"}:
                parsed_components = [self._config_component(file)]

            components.extend(parsed_components)
            endpoints.extend(parsed_endpoints)
            file.componentTypes = sorted({component.type for component in parsed_components})

        nodes = self.graph_builder.build_nodes(components)
        edges = self.graph_builder.build_edges(components)
        return ProjectAnalysis(
            projectName=project_name,
            summary=Summary(
                controllers=sum(1 for node in nodes if node.type in {"controller", "router"}),
                services=sum(1 for node in nodes if node.type == "service"),
                repositories=sum(1 for node in nodes if node.type == "repository"),
                models=sum(1 for node in nodes if node.type in {"model", "dto"}),
                apis=len(endpoints),
                dependencies=len(edges),
            ),
            nodes=nodes,
            edges=edges,
            endpoints=endpoints,
            files=files,
        )

    def _config_component(self, file: ProjectFile) -> Component:
        label = "".join(part.capitalize() for part in Path(file.path).stem.replace("-", "_").split("_"))
        return Component(id=f"{label}Config", label=f"{label} Config", type="config", filePath=file.path)
