export type ComponentType =
  | 'controller'
  | 'router'
  | 'service'
  | 'repository'
  | 'model'
  | 'dto'
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
}

export interface GraphNode {
  id: string;
  label: string;
  type: ComponentType;
  filePath: string;
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
}

export interface ProjectFile {
  path: string;
  language: string;
  size: number;
  componentTypes: ComponentType[];
}

export interface ProjectAnalysis {
  projectName: string;
  summary: Summary;
  nodes: GraphNode[];
  edges: GraphEdge[];
  endpoints: ApiEndpoint[];
  files: ProjectFile[];
}
