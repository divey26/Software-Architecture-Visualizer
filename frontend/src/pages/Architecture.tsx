import { useRef, useState } from 'react';
import { Alert, Button, Card, Space, message } from 'antd';
import { ArchitectureGraph } from '../components/ArchitectureGraph';
import type { ProjectAnalysis } from '../types/analysis';
import { exportArchitectureAsPng, printElementAsPdf } from '../utils/export';
import { AnimatedPage } from '../components/AnimatedPage';

interface ArchitectureProps {
  analysis?: ProjectAnalysis;
}

export function Architecture({ analysis }: ArchitectureProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [exportedAt, setExportedAt] = useState(new Date());

  if (!analysis) {
    return <Alert type="info" showIcon message="Upload a ZIP file to view the architecture graph." />;
  }

  const refreshTimestamp = () => {
    const now = new Date();
    setExportedAt(now);
    return now;
  };

  const handlePngExport = async () => {
    const now = refreshTimestamp();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    try {
      await exportArchitectureAsPng(analysis, now, `${analysis.projectName}-architecture-${now.toISOString().slice(0, 10)}.png`);
      message.success('Architecture diagram exported as PNG.');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'PNG export failed.');
    }
  };

  const handlePdfExport = async () => {
    refreshTimestamp();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    try {
      if (!exportRef.current) {
        throw new Error('Architecture diagram is not ready to export.');
      }
      await printElementAsPdf(exportRef.current, `${analysis.projectName} Architecture`);
      message.success('PDF export opened in a print window.');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'PDF export failed.');
    }
  };

  return (
    <AnimatedPage className="py-6">
      <Card
        title={<span className="text-slate-50">Architecture Workspace</span>}
        className="dark-ant-card"
        extra={
          <Space wrap>
            <Button onClick={handlePngExport} className="border-slate-600 bg-slate-900 text-slate-100">
              Export as PNG
            </Button>
            <Button type="primary" onClick={handlePdfExport} className="bg-sky-400 font-semibold text-slate-950">
              Export as PDF
            </Button>
          </Space>
        }
      >
        <div ref={exportRef} className="space-y-4 bg-transparent">
          <div>
            <h2 className="text-xl font-semibold text-slate-50">{analysis.projectName}</h2>
            <p className="text-sm text-slate-500">Exported {exportedAt.toLocaleString()}</p>
            <p className="text-sm text-slate-400">
              {analysis.nodes.length} components, {analysis.edges.length} graph dependencies, {analysis.endpoints.length} endpoints,
              {` ${analysis.architectureSmells?.length ?? 0}`} architecture smells.
            </p>
          </div>
          <ArchitectureGraph analysis={analysis} />
        </div>
      </Card>
    </AnimatedPage>
  );
}
