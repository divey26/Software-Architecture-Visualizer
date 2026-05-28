import { useEffect, useMemo, useRef, useState } from 'react';
import { Background, Controls, MiniMap, Position, ReactFlow, type Edge, type Node } from '@xyflow/react';
import { Button, Empty, Input, Select, Tag } from 'antd';
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
import type { ComponentType, GraphNode, ProjectAnalysis } from '../types/analysis';
import { NodeDetailsDrawer } from './NodeDetailsDrawer';

interface ArchitectureGraphProps {
  analysis: ProjectAnalysis;
}

const nodeColors: Record<string, string> = {
  server: '#0ea5e9',
  route: '#38bdf8',
  controller: '#2563eb',
  router: '#2563eb',
  service: '#16a34a',
  repository: '#9333ea',
  model: '#ea580c',
  dto: '#f59e0b',
  component: '#8b5cf6',
  page: '#a855f7',
  'api-client': '#06b6d4',
  hook: '#14b8a6',
  context: '#6366f1',
  store: '#7c3aed',
  config: '#475569',
  middleware: '#0891b2',
  security: '#dc2626',
  unknown: '#64748b',
};

const nodeWidth = 210;
const nodeHeight = 72;
const horizontalGap = 120;
const verticalGap = 70;

function getLayoutedNodes(graphNodes: GraphNode[], graphEdges: ProjectAnalysis['edges']): Node[] {
  const ids = new Set(graphNodes.map((node) => node.id));
  const incomingCounts = new Map(graphNodes.map((node) => [node.id, 0]));
  const outgoing = new Map(graphNodes.map((node) => [node.id, [] as string[]]));

  graphEdges.forEach((edge) => {
    if (!ids.has(edge.source) || !ids.has(edge.target)) {
      return;
    }
    incomingCounts.set(edge.target, (incomingCounts.get(edge.target) ?? 0) + 1);
    outgoing.get(edge.source)?.push(edge.target);
  });

  const layerById = new Map<string, number>();
  const queue = graphNodes.filter((node) => (incomingCounts.get(node.id) ?? 0) === 0).map((node) => node.id);

  queue.forEach((id) => layerById.set(id, 0));

  for (let index = 0; index < queue.length; index += 1) {
    const id = queue[index];
    const nextLayer = (layerById.get(id) ?? 0) + 1;
    outgoing.get(id)?.forEach((target) => {
      incomingCounts.set(target, (incomingCounts.get(target) ?? 0) - 1);
      layerById.set(target, Math.max(layerById.get(target) ?? 0, nextLayer));
      if ((incomingCounts.get(target) ?? 0) <= 0) {
        queue.push(target);
      }
    });
  }

  graphNodes.forEach((node) => {
    if (!layerById.has(node.id)) {
      layerById.set(node.id, 0);
    }
  });

  const layers = new Map<number, GraphNode[]>();
  graphNodes.forEach((node) => {
    const layer = layerById.get(node.id) ?? 0;
    layers.set(layer, [...(layers.get(layer) ?? []), node]);
  });

  return graphNodes.map((node) => {
    const layer = layerById.get(node.id) ?? 0;
    const layerNodes = layers.get(layer) ?? [];
    const row = layerNodes.findIndex((item) => item.id === node.id);
    const accessLevels = Array.isArray(node.metadata?.accessLevels) ? node.metadata.accessLevels.join(', ') : '';
    const hasUnprotectedSensitive = Boolean(node.metadata?.hasUnprotectedSensitive);
    return {
      id: node.id,
      data: { label: `${hasUnprotectedSensitive ? '! ' : ''}${node.label}\n${node.type}${accessLevels ? `\n${accessLevels}` : ''}` },
      position: { x: layer * (nodeWidth + horizontalGap), y: row * (nodeHeight + verticalGap) },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        background: nodeColors[node.type],
        border: hasUnprotectedSensitive ? '3px solid #ef4444' : '1px solid rgba(15, 23, 42, 0.12)',
        color: '#fff',
        width: nodeWidth,
        minHeight: accessLevels ? 92 : nodeHeight,
        padding: 12,
        whiteSpace: 'pre-line',
        fontSize: 13,
      },
    };
  });
}

export function ArchitectureGraph({ analysis }: ArchitectureGraphProps) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ComponentType | 'all'>('all');
  const [selectedNode, setSelectedNode] = useState<GraphNode | undefined>();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const graphShellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === graphShellRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const filteredNodeIds = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return new Set(
      analysis.nodes
        .filter((node) => {
          const matchesType = typeFilter === 'all' || node.type === typeFilter;
          const matchesQuery = !normalized || `${node.label} ${node.type} ${node.filePath}`.toLowerCase().includes(normalized);
          return matchesType && matchesQuery;
        })
        .map((node) => node.id),
    );
  }, [analysis.nodes, query, typeFilter]);

  const nodes = useMemo<Node[]>(
    () => getLayoutedNodes(analysis.nodes.filter((node) => filteredNodeIds.has(node.id)), analysis.edges),
    [analysis.edges, analysis.nodes, filteredNodeIds],
  );

  const edges = useMemo<Edge[]>(
    () =>
      analysis.edges
        .filter((edge) => filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target))
        .map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          animated: true,
          style: { stroke: '#64748b' },
        })),
    [analysis.edges, filteredNodeIds],
  );

  const selected = selectedNode ? analysis.nodes.find((node) => node.id === selectedNode.id) : undefined;

  if (analysis.nodes.length === 0) {
    return <Empty description="No architecture components were detected." />;
  }

  const toggleFullscreen = async () => {
    const graphShell = graphShellRef.current;
    if (!graphShell) {
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    if (isFullscreen) {
      setIsFullscreen(false);
      return;
    }

    if (graphShell.requestFullscreen) {
      await graphShell.requestFullscreen();
    } else {
      setIsFullscreen(true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-950/80 p-3 shadow-lg shadow-slate-950/30 backdrop-blur-xl md:flex-row md:items-center">
        <Input.Search
          allowClear
          placeholder="Search components by name, type, or file"
          onChange={(event) => setQuery(event.target.value)}
          className="md:max-w-md"
        />
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          className="min-w-48"
          options={[
            { label: 'All components', value: 'all' },
            { label: 'Servers', value: 'server' },
            { label: 'Routes', value: 'route' },
            { label: 'Controllers', value: 'controller' },
            { label: 'Routers', value: 'router' },
            { label: 'Services', value: 'service' },
            { label: 'Repositories', value: 'repository' },
            { label: 'Models', value: 'model' },
            { label: 'DTOs', value: 'dto' },
            { label: 'React Pages', value: 'page' },
            { label: 'React Components', value: 'component' },
            { label: 'API Clients', value: 'api-client' },
            { label: 'Config', value: 'config' },
          ]}
        />
        <Tag color="cyan" className="ml-auto w-fit">
          {nodes.length} visible
        </Tag>
        <Button
          icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          onClick={toggleFullscreen}
          className="border-slate-600 bg-slate-900 text-slate-100"
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </Button>
      </div>
      {nodes.length === 0 ? <Empty description="No components match your search." /> : null}
      <div
        ref={graphShellRef}
        className={`graph-fade-in overflow-hidden border border-slate-700 bg-slate-950 ${
          isFullscreen
            ? 'fixed inset-0 z-50 h-screen w-screen rounded-none p-4'
            : 'h-[calc(100vh-260px)] min-h-[620px] rounded-lg'
        }`}
      >
        {isFullscreen ? (
          <div className="mb-3 flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950/90 p-3">
            <div>
              <p className="m-0 text-sm uppercase tracking-wide text-sky-300">Fullscreen Architecture View</p>
              <h2 className="m-0 text-lg font-semibold text-slate-50">{analysis.projectName}</h2>
            </div>
            <Button icon={<FullscreenExitOutlined />} onClick={toggleFullscreen}>
              Exit Fullscreen
            </Button>
          </div>
        ) : null}
        <div className={isFullscreen ? 'h-[calc(100vh-96px)] overflow-hidden rounded-lg border border-slate-800' : 'h-full'}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          onNodeClick={(_, node) => {
            setSelectedNode(analysis.nodes.find((item) => item.id === node.id));
          }}
        >
          <MiniMap nodeColor={(node) => String(node.style?.background ?? '#64748b')} />
          <Controls />
          <Background color="#334155" gap={18} />
        </ReactFlow>
        </div>
      </div>
      <NodeDetailsDrawer open={Boolean(selected)} node={selected} onClose={() => setSelectedNode(undefined)} />
    </div>
  );
}
