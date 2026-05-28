from __future__ import annotations

from collections import defaultdict

from app.models.schemas import ArchitectureSmell, GraphEdge, GraphNode


class SmellDetector:
    def detect(self, nodes: list[GraphNode], edges: list[GraphEdge]) -> list[ArchitectureSmell]:
        node_by_id = {node.id: node for node in nodes}
        outgoing: dict[str, list[str]] = defaultdict(list)
        for edge in edges:
            if edge.source in node_by_id and edge.target in node_by_id:
                outgoing[edge.source].append(edge.target)

        smells: list[ArchitectureSmell] = []
        smells.extend(self._direct_repository_access(node_by_id, outgoing))
        smells.extend(self._mern_model_access(node_by_id, outgoing))
        smells.extend(self._circular_dependencies(node_by_id, outgoing))
        smells.extend(self._too_many_dependencies(node_by_id, outgoing))
        smells.extend(self._missing_service_layer(nodes))
        smells.extend(self._scattered_frontend_api_calls(nodes))
        return self._dedupe(smells)

    def _direct_repository_access(
        self,
        node_by_id: dict[str, GraphNode],
        outgoing: dict[str, list[str]],
    ) -> list[ArchitectureSmell]:
        smells: list[ArchitectureSmell] = []
        for source_id, target_ids in outgoing.items():
            source = node_by_id[source_id]
            if source.type not in {"controller", "router"}:
                continue
            for target_id in target_ids:
                target = node_by_id[target_id]
                if target.type != "repository":
                    continue
                smells.append(
                    ArchitectureSmell(
                        type="DIRECT_REPOSITORY_ACCESS",
                        severity="HIGH",
                        title="Controller directly accesses repository",
                        description=f"{source.label} depends on {target.label} without using a service layer.",
                        affectedComponents=[source.label, target.label],
                        recommendation=(
                            "Move database access logic into a service class and keep the controller responsible "
                            "only for request handling."
                        ),
                    )
                )
        return smells

    def _mern_model_access(
        self,
        node_by_id: dict[str, GraphNode],
        outgoing: dict[str, list[str]],
    ) -> list[ArchitectureSmell]:
        smells: list[ArchitectureSmell] = []
        for source_id, target_ids in outgoing.items():
            source = node_by_id[source_id]
            if source.type not in {"route", "controller"}:
                continue
            for target_id in target_ids:
                target = node_by_id[target_id]
                if target.type != "model":
                    continue
                severity = "HIGH" if source.type == "route" else "MEDIUM"
                smells.append(
                    ArchitectureSmell(
                        type="DIRECT_MODEL_ACCESS",
                        severity=severity,
                        title="Request layer directly accesses Mongoose model",
                        description=f"{source.label} depends on {target.label} without going through a service layer.",
                        affectedComponents=[source.label, target.label],
                        recommendation="Move database access behind a service or repository module.",
                    )
                )
        return smells

    def _circular_dependencies(
        self,
        node_by_id: dict[str, GraphNode],
        outgoing: dict[str, list[str]],
    ) -> list[ArchitectureSmell]:
        smells: list[ArchitectureSmell] = []
        seen_cycles: set[tuple[str, ...]] = set()

        def visit(current: str, path: list[str]) -> None:
            for target in outgoing.get(current, []):
                if target not in node_by_id:
                    continue
                if target in path:
                    cycle = path[path.index(target) :]
                    key = tuple(sorted(cycle))
                    if key in seen_cycles or len(cycle) < 2:
                        continue
                    seen_cycles.add(key)
                    labels = [node_by_id[item].label for item in cycle]
                    smells.append(
                        ArchitectureSmell(
                            type="CIRCULAR_DEPENDENCY",
                            severity="HIGH",
                            title="Circular dependency detected",
                            description=f"A circular dependency exists between {', '.join(labels)}.",
                            affectedComponents=labels,
                            recommendation="Refactor shared logic into a separate service or utility module.",
                        )
                    )
                    continue
                if len(path) < 12:
                    visit(target, [*path, target])

        for node_id in node_by_id:
            visit(node_id, [node_id])
        return smells

    def _too_many_dependencies(
        self,
        node_by_id: dict[str, GraphNode],
        outgoing: dict[str, list[str]],
    ) -> list[ArchitectureSmell]:
        smells: list[ArchitectureSmell] = []
        for source_id, target_ids in outgoing.items():
            unique_targets = sorted(set(target_ids))
            if len(unique_targets) <= 5:
                continue
            source = node_by_id[source_id]
            smells.append(
                ArchitectureSmell(
                    type="TOO_MANY_DEPENDENCIES",
                    severity="MEDIUM",
                    title="Component has too many dependencies",
                    description=(
                        f"{source.label} depends on {len(unique_targets)} components, which may indicate "
                        "too many responsibilities."
                    ),
                    affectedComponents=[source.label],
                    recommendation="Split responsibilities into smaller services or helper classes.",
                )
            )
        return smells

    def _missing_service_layer(self, nodes: list[GraphNode]) -> list[ArchitectureSmell]:
        controllers = [node for node in nodes if node.type in {"controller", "router", "route"}]
        repositories = [node for node in nodes if node.type in {"repository", "model"}]
        services = [node for node in nodes if node.type == "service"]
        service_features = {self._feature_name(node.label) for node in services}
        smells: list[ArchitectureSmell] = []

        for controller in controllers:
            feature = self._feature_name(controller.label)
            if not feature or feature in service_features:
                continue
            repository = next((node for node in repositories if self._feature_name(node.label) == feature), None)
            if not repository:
                continue
            expected = f"{feature}Service"
            smells.append(
                ArchitectureSmell(
                    type="MISSING_SERVICE_LAYER",
                    severity="MEDIUM",
                    title="Missing service layer",
                    description=(
                        f"{controller.label} and {repository.label} were detected, but {expected} was not found."
                    ),
                    affectedComponents=[controller.label, repository.label],
                    recommendation=(
                        "Add a service layer to separate business logic from request handling and data access."
                    ),
                )
            )
        return smells

    def _scattered_frontend_api_calls(self, nodes: list[GraphNode]) -> list[ArchitectureSmell]:
        callers = [
            node
            for node in nodes
            if node.type in {"page", "component"}
            and isinstance(node.metadata.get("hardcodedUrls"), list)
            and len(node.metadata.get("hardcodedUrls", [])) >= 3
        ]
        if len(callers) < 2:
            return []
        return [
            ArchitectureSmell(
                type="SCATTERED_FRONTEND_API_CALLS",
                severity="LOW",
                title="Frontend API calls are scattered",
                description="Multiple React components or pages contain several hardcoded API URLs.",
                affectedComponents=[node.label for node in callers],
                recommendation="Centralize HTTP calls in an API client module and let pages/components depend on it.",
            )
        ]

    def _feature_name(self, label: str) -> str:
        for suffix in ("Controller", "Router", "Routes", "Route", "Service", "Repository", "Repo", "Model"):
            if label.endswith(suffix):
                return label[: -len(suffix)]
        return label

    def _dedupe(self, smells: list[ArchitectureSmell]) -> list[ArchitectureSmell]:
        seen: set[tuple[str, tuple[str, ...]]] = set()
        unique: list[ArchitectureSmell] = []
        for smell in smells:
            key = (smell.type, tuple(smell.affectedComponents))
            if key in seen:
                continue
            seen.add(key)
            unique.append(smell)
        return unique
