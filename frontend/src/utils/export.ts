import type { GraphNode, ProjectAnalysis } from '../types/analysis';

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

export async function exportElementAsPng(element: HTMLElement, filename: string): Promise<void> {
  const rect = element.getBoundingClientRect();
  const width = Math.max(Math.ceil(rect.width), element.scrollWidth, 1);
  const height = Math.max(Math.ceil(rect.height), element.scrollHeight, 1);
  const clone = element.cloneNode(true) as HTMLElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.background = '#ffffff';

  const markup = new XMLSerializer().serializeToString(clone);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">${markup}</foreignObject>
    </svg>
  `;

  const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  const canvas = document.createElement('canvas');
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas rendering is not available in this browser.');
  }
  context.scale(window.devicePixelRatio, window.devicePixelRatio);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function exportArchitectureAsPng(
  analysis: ProjectAnalysis,
  exportedAt: Date,
  filename: string,
): Promise<void> {
  const layoutedNodes = getExportLayoutedNodes(analysis.nodes, analysis.edges);
  const padding = 56;
  const headerHeight = 126;
  const maxX = Math.max(...layoutedNodes.map((node) => node.x + nodeWidth), 900);
  const maxY = Math.max(...layoutedNodes.map((node) => node.y + nodeHeight), 420);
  const width = Math.ceil(maxX + padding * 2);
  const height = Math.ceil(maxY + headerHeight + padding);
  const nodeById = new Map(layoutedNodes.map((node) => [node.id, node]));

  const edgeMarkup = analysis.edges
    .map((edge, index) => {
      const source = nodeById.get(edge.source);
      const target = nodeById.get(edge.target);
      if (!source || !target) {
        return '';
      }
      const startX = source.x + nodeWidth;
      const startY = source.y + headerHeight + nodeHeight / 2;
      const endX = target.x;
      const endY = target.y + headerHeight + nodeHeight / 2;
      const laneOffset = ((index % 7) - 3) * 8;

      if (endX > startX) {
        const midX = startX + Math.max(36, (endX - startX) / 2) + laneOffset;
        return `<path d="M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}" fill="none" stroke="#64748b" stroke-width="1.35" marker-end="url(#arrow)" opacity="0.36" />`;
      }

      const loopX = Math.max(startX, endX) + 44 + Math.abs(laneOffset);
      return `<path d="M ${startX} ${startY} L ${loopX} ${startY} L ${loopX} ${endY} L ${endX} ${endY}" fill="none" stroke="#94a3b8" stroke-width="1.2" marker-end="url(#arrow)" opacity="0.28" stroke-dasharray="6 5" />`;
    })
    .join('');

  const nodeMarkup = layoutedNodes
    .map((node) => {
      const color = nodeColors[node.type] ?? nodeColors.unknown;
      const labelLines = wrapText(node.label, 24).slice(0, 2);
      const type = node.type.toUpperCase();
      return `
        <g transform="translate(${node.x}, ${node.y + headerHeight})">
          <rect width="${nodeWidth}" height="${nodeHeight}" rx="8" fill="${color}" stroke="rgba(15,23,42,0.16)" />
          ${labelLines
            .map(
              (line, index) =>
                `<text x="16" y="${24 + index * 17}" fill="#ffffff" font-size="14" font-weight="700">${escapeHtml(line)}</text>`,
            )
            .join('')}
          <text x="16" y="58" fill="rgba(255,255,255,0.84)" font-size="11" letter-spacing="0.5">${escapeHtml(type)}</text>
        </g>
      `;
    })
    .join('');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#cbd5e1" />
        </pattern>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
        </marker>
      </defs>
      <rect width="100%" height="100%" fill="#ffffff" />
      <text x="${padding}" y="42" fill="#0f172a" font-size="28" font-weight="700" font-family="Arial, sans-serif">${escapeHtml(analysis.projectName)}</text>
      <text x="${padding}" y="72" fill="#475569" font-size="14" font-family="Arial, sans-serif">Exported ${escapeHtml(exportedAt.toLocaleString())}</text>
      <text x="${padding}" y="98" fill="#475569" font-size="14" font-family="Arial, sans-serif">${analysis.nodes.length} components, ${analysis.edges.length} graph dependencies, ${analysis.endpoints.length} endpoints, ${analysis.architectureSmells?.length ?? 0} architecture smells.</text>
      <text x="${width - padding}" y="98" text-anchor="end" fill="#64748b" font-size="12" font-family="Arial, sans-serif">Arrows show dependency direction</text>
      <rect x="${padding / 2}" y="${headerHeight - 10}" width="${width - padding}" height="${height - headerHeight - padding / 2}" rx="10" fill="url(#dots)" stroke="#e2e8f0" />
      <g font-family="Arial, sans-serif">${edgeMarkup}${nodeMarkup}</g>
    </svg>
  `;

  await downloadSvgAsPng(svg, width, height, filename);
}

export async function printElementAsPdf(element: HTMLElement, title: string): Promise<void> {
  const rect = element.getBoundingClientRect();
  const width = Math.max(Math.ceil(rect.width), element.scrollWidth, 1);
  const height = Math.max(Math.ceil(rect.height), element.scrollHeight, 1);
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = `${width}px`;
  clone.style.minHeight = `${height}px`;
  const popup = window.open('', '_blank', 'noopener,noreferrer');
  if (!popup) {
    throw new Error('The browser blocked the PDF export window.');
  }
  popup.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body { margin: 24px; font-family: Arial, sans-serif; color: #0f172a; }
          .react-flow__controls, .react-flow__minimap { display: none !important; }
          @page { size: landscape; margin: 12mm; }
        </style>
      </head>
      <body>${clone.outerHTML}</body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  window.setTimeout(() => popup.print(), 250);
}

async function downloadSvgAsPng(svg: string, width: number, height: number, filename: string): Promise<void> {
  const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  const canvas = document.createElement('canvas');
  const scale = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas rendering is not available in this browser.');
  }
  context.scale(scale, scale);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function getExportLayoutedNodes(graphNodes: GraphNode[], graphEdges: ProjectAnalysis['edges']) {
  const dependencyCounts = new Map<string, number>();
  graphEdges.forEach((edge) => {
    dependencyCounts.set(edge.source, (dependencyCounts.get(edge.source) ?? 0) + 1);
    dependencyCounts.set(edge.target, (dependencyCounts.get(edge.target) ?? 0) + 1);
  });

  const columns = new Map<number, GraphNode[]>();
  graphNodes.forEach((node) => {
    const column = columnForNode(node);
    columns.set(column, [...(columns.get(column) ?? []), node]);
  });

  const layouted: Array<GraphNode & { x: number; y: number }> = [];
  [...columns.entries()]
    .sort(([left], [right]) => left - right)
    .forEach(([column, nodes]) => {
      const sortedNodes = [...nodes].sort((left, right) => {
        const featureCompare = featureName(left.label).localeCompare(featureName(right.label));
        if (featureCompare !== 0) {
          return featureCompare;
        }
        const dependencyCompare = (dependencyCounts.get(right.id) ?? 0) - (dependencyCounts.get(left.id) ?? 0);
        if (dependencyCompare !== 0) {
          return dependencyCompare;
        }
        return left.label.localeCompare(right.label);
      });

      sortedNodes.forEach((node, row) => {
        layouted.push({
          ...node,
          x: 56 + column * (nodeWidth + horizontalGap),
          y: row * (nodeHeight + verticalGap),
        });
      });
    });

  return layouted;
}

function columnForNode(node: GraphNode): number {
  if (node.type === 'page' || node.type === 'component') {
    return 0;
  }
  if (node.type === 'api-client' || node.type === 'server') {
    return 1;
  }
  if (node.type === 'controller' || node.type === 'router' || node.type === 'route') {
    return 2;
  }
  if (node.type === 'service') {
    return 3;
  }
  if (node.type === 'repository') {
    return 4;
  }
  if (node.type === 'model' || node.type === 'dto') {
    return 5;
  }
  return 6;
}

function featureName(label: string): string {
  return label
    .replace(/Controller$|Router$|Routes$|Route$|ServiceImpl$|Service$|Repository$|DTO$|Dto$|Model$|Entity$|Config$|Page$|Component$|Client$/i, '')
    .toLowerCase();
}

function wrapText(value: string, maxLength: number): string[] {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) {
    lines.push(current);
  }
  return lines.length ? lines : [value];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not render export image.'));
    image.src = src;
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return entities[character];
  });
}
