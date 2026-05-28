export type ComponentType =
  | 'server'
  | 'route'
  | 'controller'
  | 'router'
  | 'service'
  | 'repository'
  | 'model'
  | 'dto'
  | 'component'
  | 'page'
  | 'api-client'
  | 'hook'
  | 'context'
  | 'store'
  | 'config'
  | 'middleware'
  | 'security'
  | 'unknown';

export interface Summary {
  controllers: number;
  services: number;
  repositories: number;
  models: number;
  apis: number;
  dependencies: number;
  packageDependencies?: number;
  smells?: number;
  highSeveritySmells?: number;
  mediumSeveritySmells?: number;
  lowSeveritySmells?: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: ComponentType;
  filePath: string;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface ApiEndpoint {
  method: string;
  path: string;
  handler: string;
  filePath: string;
  router?: string;
}

export interface ProjectFile {
  path: string;
  language: string;
  size: number;
  componentTypes: ComponentType[];
}

export type SmellSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ArchitectureSmell {
  type: string;
  severity: SmellSeverity;
  title: string;
  description: string;
  affectedComponents: string[];
  recommendation: string;
}

export interface DependencyInfo {
  name: string;
  version: string;
  source: string;
  ecosystem: 'python' | 'maven' | 'gradle' | 'npm';
  dependencyType?: string;
}

export interface PackageScript {
  name: string;
  command: string;
  source: string;
  ecosystem: 'npm';
}

export type AccessLevel =
  | 'PUBLIC'
  | 'AUTHENTICATED'
  | 'ADMIN'
  | 'EMPLOYEE'
  | 'ADMIN_OR_EMPLOYEE'
  | 'UNKNOWN'
  | 'UNPROTECTED_SENSITIVE';

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export interface AccessControlledEndpoint {
  method: string;
  path: string;
  handler: string;
  controller: string;
  middleware: string[];
  accessLevel: AccessLevel;
  risk: RiskLevel;
  reason: string;
  filePath?: string;
}

export interface AccessControlSummary {
  publicEndpoints: number;
  authenticatedEndpoints: number;
  adminEndpoints: number;
  employeeEndpoints: number;
  unknownEndpoints: number;
  unprotectedSensitiveEndpoints: number;
}

export interface AccessControlResult {
  authDetected: boolean;
  rolesDetected: string[];
  roleEnforcementDetected: boolean;
  summary: AccessControlSummary;
  endpoints: AccessControlledEndpoint[];
}

export interface ProjectAnalysis {
  projectName: string;
  stack?: string;
  languages?: string[];
  frameworks?: string[];
  summary: Summary;
  nodes: GraphNode[];
  edges: GraphEdge[];
  endpoints: ApiEndpoint[];
  files: ProjectFile[];
  architectureSmells?: ArchitectureSmell[];
  architectureReport?: string;
  dependencies?: DependencyInfo[];
  packageScripts?: PackageScript[];
  accessControl?: AccessControlResult;
}

export interface ProjectHistoryItem {
  id: string;
  projectName: string;
  analyzedAt: string;
  summary: Summary;
  endpointCount: number;
  smellCount: number;
  analysis: ProjectAnalysis;
}
