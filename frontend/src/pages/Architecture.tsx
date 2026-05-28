import { useRef, useState } from 'react';
import { Alert, Button, Space, message } from 'antd';
import { ArchitectureGraph } from '../components/ArchitectureGraph';
import type { ProjectAnalysis } from '../types/analysis';
import { exportArchitectureAsPng, printElementAsPdf } from '../utils/export';
import { AnimatedPage } from '../components/AnimatedPage';
import { DownloadOutlined, FilePdfOutlined, ApartmentOutlined } from '@ant-design/icons';

interface ArchitectureProps {
  analysis?: ProjectAnalysis;
}

export function Architecture({ analysis }: ArchitectureProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [exportedAt, setExportedAt] = useState(new Date());

  if (!analysis) {
    return (
      <AnimatedPage className="py-6">
        <Alert
          type="info"
          showIcon
          message="No project loaded"
          description="Upload a ZIP file to view the interactive architecture graph."
          style={{ borderRadius: 10 }}
        />
      </AnimatedPage>
    );
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
      await exportArchitectureAsPng(
        analysis,
        now,
        `${analysis.projectName}-architecture-${now.toISOString().slice(0, 10)}.png`,
      );
      message.success('Architecture diagram exported as PNG.');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'PNG export failed.');
    }
  };

  const handlePdfExport = async () => {
    refreshTimestamp();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    try {
      if (!exportRef.current) throw new Error('Architecture diagram is not ready to export.');
      await printElementAsPdf(exportRef.current, `${analysis.projectName} Architecture`);
      message.success('PDF export opened in a print window.');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'PDF export failed.');
    }
  };

  return (
    <AnimatedPage className="py-6">
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        {/* Card Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid var(--color-border)',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'rgba(99,102,241,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#818cf8', fontSize: 17,
            }}>
              <ApartmentOutlined />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Architecture Workspace
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                {analysis.nodes.length} components · {analysis.edges.length} edges
              </div>
            </div>
          </div>
          <Space wrap>
            <Button className="btn-ghost" icon={<DownloadOutlined />} onClick={handlePngExport} style={{ fontSize: 13 }}>
              Export PNG
            </Button>
            <Button className="btn-primary" icon={<FilePdfOutlined />} onClick={handlePdfExport} style={{ fontSize: 13 }}>
              Export PDF
            </Button>
          </Space>
        </div>

        {/* Content */}
        <div ref={exportRef} style={{ padding: '16px 24px 24px' }}>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
              {analysis.projectName}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', margin: 0 }}>
              Exported {exportedAt.toLocaleString()} · {analysis.endpoints.length} endpoints · {analysis.architectureSmells?.length ?? 0} smells
            </p>
          </div>
          <ArchitectureGraph analysis={analysis} />
        </div>
      </div>
    </AnimatedPage>
  );
}
