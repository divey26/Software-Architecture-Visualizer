from __future__ import annotations

from app.models.schemas import Component, GraphEdge, GraphNode


class GraphBuilder:
    def build_nodes(self, components: list[Component]) -> list[GraphNode]:
        return [
            GraphNode(id=component.id, label=component.label, type=component.type, filePath=component.filePath)
            for component in self._dedupe_by_id(components)
        ]

    def build_edges(self, components: list[Component]) -> list[GraphEdge]:
        by_id = {component.id: component for component in components}
        by_file_token = {
            self._file_token(component.filePath): component.id
            for component in components
            if self._file_token(component.filePath)
        }
        edges: list[GraphEdge] = []
        seen: set[tuple[str, str]] = set()

        for component in components:
            candidates: set[str] = set(component.references)
            for import_name in component.imports:
                token = import_name.split(".")[-1].lower()
                if token in by_file_token:
                    candidates.add(by_file_token[token])
            for target in candidates:
                if target in by_id and target != component.id and (component.id, target) not in seen:
                    seen.add((component.id, target))
                    edges.append(
                        GraphEdge(
                            id=f"edge-{len(edges) + 1}",
                            source=component.id,
                            target=target,
                            label="uses",
                        )
                    )
        return edges

    def _dedupe_by_id(self, components: list[Component]) -> list[Component]:
        seen: set[str] = set()
        unique: list[Component] = []
        for component in components:
            if component.id not in seen:
                seen.add(component.id)
                unique.append(component)
        return unique

    def _file_token(self, file_path: str) -> str:
        return file_path.rsplit("/", 1)[-1].rsplit(".", 1)[0].lower()
