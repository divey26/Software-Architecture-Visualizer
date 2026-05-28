from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


ComponentType = Literal[
    "server",
    "route",
    "controller",
    "router",
    "service",
    "repository",
    "model",
    "dto",
    "component",
    "page",
    "api-client",
    "hook",
    "context",
    "store",
    "config",
    "middleware",
    "security",
    "unknown",
]


class Summary(BaseModel):
    controllers: int = 0
    services: int = 0
    repositories: int = 0
    models: int = 0
    apis: int = 0
    dependencies: int = 0
    packageDependencies: int = 0
    smells: int = 0
    highSeveritySmells: int = 0
    mediumSeveritySmells: int = 0
    lowSeveritySmells: int = 0


class GraphNode(BaseModel):
    id: str
    label: str
    type: ComponentType = "unknown"
    filePath: str
    metadata: dict[str, object] = Field(default_factory=dict)


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str = "uses"


class ApiEndpoint(BaseModel):
    method: str
    path: str
    handler: str
    filePath: str
    router: str = ""


class ProjectFile(BaseModel):
    path: str
    language: str
    size: int
    componentTypes: list[ComponentType] = Field(default_factory=list)


class Component(BaseModel):
    id: str
    label: str
    type: ComponentType
    filePath: str
    imports: list[str] = Field(default_factory=list)
    references: list[str] = Field(default_factory=list)
    metadata: dict[str, object] = Field(default_factory=dict)


class ArchitectureSmell(BaseModel):
    type: str
    severity: Literal["HIGH", "MEDIUM", "LOW"]
    title: str
    description: str
    affectedComponents: list[str] = Field(default_factory=list)
    recommendation: str


class DependencyInfo(BaseModel):
    name: str
    version: str = ""
    source: str
    ecosystem: Literal["python", "maven", "gradle", "npm"]
    dependencyType: str = ""


class PackageScript(BaseModel):
    name: str
    command: str
    source: str
    ecosystem: Literal["npm"] = "npm"


AccessLevel = Literal[
    "PUBLIC",
    "AUTHENTICATED",
    "ADMIN",
    "EMPLOYEE",
    "ADMIN_OR_EMPLOYEE",
    "UNKNOWN",
    "UNPROTECTED_SENSITIVE",
]

RiskLevel = Literal["HIGH", "MEDIUM", "LOW", "NONE"]


class AccessControlledEndpoint(BaseModel):
    method: str
    path: str
    handler: str = ""
    controller: str = ""
    middleware: list[str] = Field(default_factory=list)
    accessLevel: AccessLevel = "UNKNOWN"
    risk: RiskLevel = "NONE"
    reason: str = ""
    filePath: str = ""


class AccessControlSummary(BaseModel):
    publicEndpoints: int = 0
    authenticatedEndpoints: int = 0
    adminEndpoints: int = 0
    employeeEndpoints: int = 0
    unknownEndpoints: int = 0
    unprotectedSensitiveEndpoints: int = 0


class AccessControlResult(BaseModel):
    authDetected: bool = False
    rolesDetected: list[str] = Field(default_factory=list)
    roleEnforcementDetected: bool = False
    summary: AccessControlSummary = Field(default_factory=AccessControlSummary)
    endpoints: list[AccessControlledEndpoint] = Field(default_factory=list)


class ProjectAnalysis(BaseModel):
    projectName: str
    stack: str = ""
    languages: list[str] = Field(default_factory=list)
    frameworks: list[str] = Field(default_factory=list)
    summary: Summary
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    endpoints: list[ApiEndpoint]
    files: list[ProjectFile]
    architectureSmells: list[ArchitectureSmell] = Field(default_factory=list)
    architectureReport: str = ""
    dependencies: list[DependencyInfo] = Field(default_factory=list)
    packageScripts: list[PackageScript] = Field(default_factory=list)
    accessControl: AccessControlResult = Field(default_factory=AccessControlResult)


class GithubAnalysisRequest(BaseModel):
    repoUrl: str


class HealthResponse(BaseModel):
    status: str
    service: str


class SupportedFrameworksResponse(BaseModel):
    frameworks: list[str]
    fileTypes: list[str]
    ignoredFolders: list[str]
