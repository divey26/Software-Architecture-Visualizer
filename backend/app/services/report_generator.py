from __future__ import annotations

from collections import Counter

from app.models.schemas import AccessControlResult, ArchitectureSmell, ApiEndpoint, DependencyInfo, GraphEdge, GraphNode, Summary


class ReportGenerator:
    def generate(
        self,
        project_name: str,
        summary: Summary,
        nodes: list[GraphNode],
        edges: list[GraphEdge],
        endpoints: list[ApiEndpoint],
        smells: list[ArchitectureSmell],
        dependencies: list[DependencyInfo],
        access_control: AccessControlResult | None = None,
    ) -> str:
        frameworks = self._frameworks(nodes, endpoints, dependencies)
        lines = [
            f"Architecture Report: {project_name}",
            "",
            "Project overview",
            (
                f"This project contains {len(nodes)} detected architecture components across "
                f"{summary.controllers} controller/router components, {summary.services} services, "
                f"{summary.repositories} repositories, and {summary.models} models or DTOs."
            ),
            f"Detected framework/language: {frameworks}.",
            self._mern_overview(nodes, dependencies),
            "",
            "API endpoint summary",
            (
                f"The analyzer detected {len(endpoints)} API endpoint(s). "
                f"Primary HTTP methods: {self._method_summary(endpoints)}."
            ),
            "",
            "Dependency overview",
            (
                f"The architecture graph contains {len(edges)} component dependency edge(s). "
                f"Dependency manifests contributed {len(dependencies)} package dependency record(s)."
            ),
            "",
            "Architecture quality",
            self._smell_summary(smells),
            "",
            "Access Control Summary",
            self._access_control_summary(access_control),
            "",
            "Recommendations",
            self._recommendations(summary, smells, dependencies, access_control),
        ]
        return "\n".join(lines)

    def _frameworks(
        self,
        nodes: list[GraphNode],
        endpoints: list[ApiEndpoint],
        dependencies: list[DependencyInfo],
    ) -> str:
        ecosystems = {dependency.ecosystem for dependency in dependencies}
        dependency_names = {dependency.name.lower() for dependency in dependencies}
        file_paths = " ".join(node.filePath.lower() for node in nodes)
        frameworks: list[str] = []
        if "express" in dependency_names or any(node.type in {"server", "route"} for node in nodes):
            frameworks.append("Express.js")
        if "react" in dependency_names or any(node.type in {"page", "component"} for node in nodes):
            frameworks.append("React")
        if "mongoose" in dependency_names:
            frameworks.append("MongoDB/Mongoose")
        if endpoints and ("python" in ecosystems or ".py" in file_paths):
            frameworks.append("Python/FastAPI")
        if "maven" in ecosystems or "gradle" in ecosystems or ".java" in file_paths:
            frameworks.append("Java/Spring Boot")
        if not frameworks and "python" in ecosystems:
            frameworks.append("Python")
        return ", ".join(frameworks) if frameworks else "Unknown or convention-based backend"

    def _mern_overview(self, nodes: list[GraphNode], dependencies: list[DependencyInfo]) -> str:
        names = {dependency.name.lower() for dependency in dependencies}
        has_mern = (
            ("express" in names or any(node.type in {"server", "route"} for node in nodes))
            and ("react" in names or any(node.type in {"page", "component"} for node in nodes))
            and ("mongoose" in names or any(node.type == "model" and node.filePath.endswith((".js", ".ts")) for node in nodes))
        )
        if not has_mern:
            return ""
        return (
            "This project appears to follow a MERN architecture. React pages and components communicate with "
            "API client modules, which call Express routes. Express routes delegate request handling to controllers "
            "and services, while Mongoose models represent MongoDB collections."
        )

    def _method_summary(self, endpoints: list[ApiEndpoint]) -> str:
        if not endpoints:
            return "none detected"
        counts = Counter(endpoint.method for endpoint in endpoints)
        return ", ".join(f"{method} ({count})" for method, count in sorted(counts.items()))

    def _smell_summary(self, smells: list[ArchitectureSmell]) -> str:
        if not smells:
            return "No architecture smells were detected by the current rule set."
        counts = Counter(smell.severity for smell in smells)
        examples = "; ".join(f"{smell.title}: {', '.join(smell.affectedComponents)}" for smell in smells[:3])
        return (
            f"The analyzer detected {len(smells)} smell(s): {counts.get('HIGH', 0)} high, "
            f"{counts.get('MEDIUM', 0)} medium, and {counts.get('LOW', 0)} low severity. "
            f"Notable findings include {examples}."
        )

    def _recommendations(
        self,
        summary: Summary,
        smells: list[ArchitectureSmell],
        dependencies: list[DependencyInfo],
        access_control: AccessControlResult | None,
    ) -> str:
        recommendations = []
        recommendations.extend(smell.recommendation for smell in smells)
        if access_control and access_control.summary.unprotectedSensitiveEndpoints:
            recommendations.append("Add centralized JWT verification and role-based middleware to sensitive routes.")
        if access_control and access_control.rolesDetected and not access_control.roleEnforcementDetected:
            recommendations.append("Apply route-level role checks anywhere admin or employee permissions are required.")
        if summary.controllers and summary.repositories and not summary.services:
            recommendations.append("Introduce service classes between request handlers and data access components.")
        if dependencies:
            recommendations.append("Review parsed dependency versions regularly and keep runtime dependencies current.")
        if not recommendations:
            recommendations.append("Continue keeping request handling, business logic, and persistence responsibilities separate.")
        return "\n".join(f"- {item}" for item in dict.fromkeys(recommendations))

    def _access_control_summary(self, access_control: AccessControlResult | None) -> str:
        if not access_control:
            return "Access control analysis was not available for this report."
        roles = ", ".join(access_control.rolesDetected) if access_control.rolesDetected else "none detected"
        unprotected = [
            f"{endpoint.method} {endpoint.path}"
            for endpoint in access_control.endpoints
            if endpoint.accessLevel == "UNPROTECTED_SENSITIVE"
        ]
        status = [
            f"Authentication detected: {'yes' if access_control.authDetected else 'no'}.",
            f"Roles detected: {roles}.",
            f"Route-level role enforcement detected: {'yes' if access_control.roleEnforcementDetected else 'no'}.",
        ]
        if unprotected:
            status.append(
                "Potentially unprotected sensitive endpoints include "
                + ", ".join(unprotected[:8])
                + ("." if len(unprotected) <= 8 else f", and {len(unprotected) - 8} more.")
            )
        else:
            status.append("No unprotected sensitive endpoints were detected by the current static rules.")
        if access_control.rolesDetected and not access_control.roleEnforcementDetected:
            status.append(
                "The project defines role-related data, but the analyzer did not detect route-level authorization middleware."
            )
        return " ".join(status)
