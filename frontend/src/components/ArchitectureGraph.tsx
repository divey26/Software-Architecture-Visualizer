import { useMemo, useState } from 'react';
import { Background, Controls, MiniMap, ReactFlow, type Edge, type Node } from '@xyflow/react';
import { Empty, Input } from 'antd';
import type { GraphNode, ProjectAnalysis } from '../types/analysis';
import { NodeDetailsDrawer } from './NodeDetailsDrawer';

interface ArchitectureGraphProps {
  analysis: ProjectAnalysis;
}

const nodeColors: Record<string, string> = {
  controller: '#2563eb',
  router: '#2563eb',
  service: '#16a34a',
  repository: '#9333ea',
  model: '#ea580c',
  dto: '#f59e0b',
  config: '#475569',
  middleware: '#0891b2',
  security: '#dc2626',
  unknown: '#64748b',
};

export function ArchitectureGraph({ analysis }: ArchitectureGraphProps) {
  const [query, setQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | undefined>();

  const filteredNodeIds = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return new Set(
      analysis.nodes
        .filter((node) => !normalized || `${node.label} ${node.type} ${node.filePath}`.toLowerCase().includes(normalized))
        .map((node) => node.id),
    );
  }, [analysis.nodes, query]);

  const nodes = useMemo<Node[]>(
    () =>
      analysis.nodes
        .filter((node) => filteredNodeIds.has(node.id))
        .map((node, index) => ({
          id: node.id,
          data: { label: `${node.label}\n${node.type}` },
          position: { x: (index % 4) * 260, y: Math.floor(index / 4) * 150 },
          style: {
            background: nodeColors[node.type],
            border: '1px solid rgba(15, 23, 42, 0.12)',
            color: '#fff',
            width: 190,
            padding: 12,
            whiteSpace: 'pre-line',
            fontSize: 13,
          },
        })),
    [analysis.nodes, filteredNodeIds],
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

  return (
    <div className="space-y-4">
      <Input.Search
        allowClear
        placeholder="Search components by name, type, or file"
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="h-[620px] overflow-hidden rounded-lg border border-slate-200 bg-white">
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
          <Background color="#e2e8f0" gap={18} />
        </ReactFlow>
      </div>
      <NodeDetailsDrawer open={Boolean(selected)} node={selected} onClose={() => setSelectedNode(undefined)} />
    </div>
  );
}
