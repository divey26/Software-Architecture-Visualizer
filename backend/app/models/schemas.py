from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


ComponentType = Literal[
    "controller",
    "router",
    "service",
    "repository",
    "model",
    "dto",
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


class GraphNode(BaseModel):
    id: str
    label: str
    type: ComponentType = "unknown"
    filePath: str


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


class ProjectAnalysis(BaseModel):
    projectName: str
    summary: Summary
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    endpoints: list[ApiEndpoint]
    files: list[ProjectFile]


class HealthResponse(BaseModel):
    status: str
    service: str


class SupportedFrameworksResponse(BaseModel):
    frameworks: list[str]
    fileTypes: list[str]
    ignoredFolders: list[str]
