import { useRef } from 'react';
import { Alert, Button, message } from 'antd';
import type { ProjectAnalysis } from '../types/analysis';
import { printElementAsPdf } from '../utils/export';
import { AnimatedPage } from '../components/AnimatedPage';
import { FilePdfOutlined, FileTextOutlined } from '@ant-design/icons';

interface ReportProps {
  analysis?: ProjectAnalysis;
}

export function Report({ analysis }: ReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  if (!analysis) {
    return (
      <AnimatedPage className="py-6">
        <Alert
          type="info"
          showIcon
          message="No project loaded"
          description="Upload a ZIP file to view the generated architecture report."
          style={{ borderRadius: 10 }}
        />
      </AnimatedPage>
    );
  }

  const report = analysis.architectureReport || 'No architecture report was generated for this analysis.';

  const handleExport = async () => {
    try {
      if (!reportRef.current) throw new Error('Report is not ready to export.');
      await printElementAsPdf(reportRef.current, `${analysis.projectName} Architecture Report`);
      message.success('Report PDF opened in a print window.');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Report export failed.');
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
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid var(--color-border)',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'rgba(16,185,129,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#34d399', fontSize: 17,
            }}>
              <FileTextOutlined />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Architecture Report
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                {analysis.projectName}
              </div>
            </div>
          </div>
          <Button
            className="btn-ghost"
            icon={<FilePdfOutlined />}
            onClick={handleExport}
            style={{ fontSize: 13, fontWeight: 600 }}
          >
            Export as PDF
          </Button>
        </div>

        {/* Report content */}
        <div ref={reportRef} style={{ padding: '24px 28px', maxWidth: 860 }}>
          <h1 style={{
            fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800,
            marginBottom: 20, color: 'var(--color-text-primary)',
          }}>
            {analysis.projectName}
          </h1>

          {analysis.accessControl && (
            <div style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderLeft: '3px solid #818cf8',
              borderRadius: 10,
              padding: '18px 22px',
              marginBottom: 20,
              lineHeight: 1.75,
              color: 'var(--color-text-secondary)',
              fontSize: 14,
            }}>
              <h2 style={{
                fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700,
                color: 'var(--color-text-primary)', marginBottom: 12,
              }}>
                Access Control Summary
              </h2>
              <p style={{ margin: '0 0 10px' }}>
                Authentication detected:{' '}
                <strong style={{ color: analysis.accessControl.authDetected ? '#34d399' : '#f87171' }}>
                  {analysis.accessControl.authDetected ? 'Yes' : 'No'}
                </strong>
                {'. '}Roles detected:{' '}
                <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#a5b4fc' }}>
                  {analysis.accessControl.rolesDetected.length
                    ? analysis.accessControl.rolesDetected.join(', ')
                    : 'none'}
                </code>
                {'. '}Route-level role enforcement:{' '}
                <strong style={{ color: analysis.accessControl.roleEnforcementDetected ? '#34d399' : '#fbbf24' }}>
                  {analysis.accessControl.roleEnforcementDetected ? 'Yes' : 'No'}
                </strong>.
              </p>
              <p style={{ margin: 0 }}>
                Unprotected sensitive endpoints:{' '}
                <strong style={{ color: '#f87171' }}>
                  {analysis.accessControl.summary.unprotectedSensitiveEndpoints}
                </strong>.
                {' '}Add centralized JWT verification and role-based middleware for sensitive routes that are
                currently unknown or unprotected.
              </p>
            </div>
          )}

          <div style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            padding: '18px 22px',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
          }}>
            {report}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
