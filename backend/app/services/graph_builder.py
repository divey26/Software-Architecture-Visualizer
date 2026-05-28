from __future__ import annotations

from app.models.schemas import Component, GraphEdge, GraphNode


class GraphBuilder:
    def edge(self, edge_id: str, source: str, target: str, label: str = "uses") -> GraphEdge:
        return GraphEdge(id=edge_id, source=source, target=target, label=label)

    def build_nodes(self, components: list[Component]) -> list[GraphNode]:
        return [
            GraphNode(
                id=component.id,
                label=component.label,
                type=component.type,
                filePath=component.filePath,
                metadata=component.metadata,
            )
            for component in self._dedupe_by_id(components)
        ]

    def build_edges(self, components: list[Component]) -> list[GraphEdge]:
        by_id = {component.id: component for component in components}
        by_label = {component.label: component.id for component in components}
        by_file_token = {
            self._file_token(component.filePath): component.id
            for component in components
            if self._file_token(component.filePath)
        }
        by_feature_type: dict[tuple[str, str], list[str]] = {}
        by_type: dict[str, list[str]] = {}
        for component in components:
            by_feature_type.setdefault((self._feature_token(component.label), component.type), []).append(component.id)
            by_type.setdefault(component.type, []).append(component.id)
        edges: list[GraphEdge] = []
        seen: set[tuple[str, str]] = set()

        for component in components:
            candidates: set[str] = set()
            for reference in component.references:
                candidates.add(reference)
                if reference in by_label:
                    candidates.add(by_label[reference])
            for import_name in component.imports:
                token = self._import_token(import_name)
                if token in by_file_token:
                    candidates.add(by_file_token[token])
            for target_type in self._mern_target_types(component.type):
                candidates.update(by_feature_type.get((self._feature_token(component.label), target_type), []))
            if component.type == "server":
                candidates.update(by_type.get("route", []))
            if component.type in {"page", "component"} and not any(by_id[target].type == "api-client" for target in candidates if target in by_id):
                candidates.update(by_type.get("api-client", []))
            if component.type == "api-client":
                candidates.update(by_type.get("route", []))
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

    def _import_token(self, import_name: str) -> str:
        normalized = import_name.replace("\\", "/").rstrip("/")
        stem = normalized.rsplit("/", 1)[-1]
        return stem.rsplit(".", 1)[0].lower()

    def _feature_token(self, label: str) -> str:
        normalized = label.lower()
        for suffix in (
            "controller",
            "routes",
            "route",
            "service",
            "repository",
            "repo",
            "model",
            "schema",
            "page",
            "component",
            "api",
            "client",
        ):
            if normalized.endswith(suffix):
                normalized = normalized[: -len(suffix)]
        return "".join(character for character in normalized if character.isalnum())

    def _mern_target_types(self, source_type: str) -> tuple[str, ...]:
        return {
            "server": ("route",),
            "page": ("api-client",),
            "component": ("api-client",),
            "api-client": ("route",),
            "route": ("controller",),
            "controller": ("service",),
            "service": ("repository", "model"),
            "repository": ("model",),
        }.get(source_type, ())
