import { Alert, Empty, Space, Tag, Typography } from 'antd';
import type { ArchitectureSmell, ProjectAnalysis, SmellSeverity } from '../types/analysis';
import { AnimatedPage } from '../components/AnimatedPage';
import { WarningOutlined, BugOutlined, InfoCircleOutlined } from '@ant-design/icons';

interface QualityReportProps {
  analysis?: ProjectAnalysis;
}

const severityConfig: Record<SmellSeverity, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  HIGH:   { color: '#f87171', bg: 'rgba(248,113,113,0.1)', label: 'HIGH',   icon: <WarningOutlined /> },
  MEDIUM: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  label: 'MEDIUM', icon: <BugOutlined /> },
  LOW:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  label: 'LOW',    icon: <InfoCircleOutlined /> },
};

export function QualityReport({ analysis }: QualityReportProps) {
  if (!analysis) {
    return (
      <AnimatedPage className="py-6">
        <Alert
          type="info"
          showIcon
          message="No project loaded"
          description="Upload a ZIP file to view architecture quality smells."
          style={{ borderRadius: 10 }}
        />
      </AnimatedPage>
    );
  }

  const smells = analysis.architectureSmells ?? [];

  const high   = smells.filter((s) => s.severity === 'HIGH').length;
  const medium = smells.filter((s) => s.severity === 'MEDIUM').length;
  const low    = smells.filter((s) => s.severity === 'LOW').length;

  return (
    <AnimatedPage className="space-y-5 py-6">
      {/* Header */}
      <div className="page-header">
        <div className="badge badge-accent" style={{ marginBottom: 12 }}>Architecture Smells</div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, marginBottom: 8 }}>
          Quality Report
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
          {smells.length} smell(s) detected across the codebase
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <SeverityPill count={high}   severity="HIGH"   />
          <SeverityPill count={medium} severity="MEDIUM" />
          <SeverityPill count={low}    severity="LOW"    />
        </div>
      </div>

      {/* Smell list */}
      {smells.length ? (
        smells.map((smell) => (
          <SmellCard key={`${smell.type}-${smell.affectedComponents.join('-')}`} smell={smell} />
        ))
      ) : (
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 14, padding: '48px 24px', textAlign: 'center',
        }}>
          <Empty description={
            <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
              No architecture smells detected. The current rules did not find major layering or dependency issues.
            </span>
          } />
        </div>
      )}
    </AnimatedPage>
  );
}

function SeverityPill({ count, severity }: { count: number; severity: SmellSeverity }) {
  const cfg = severityConfig[severity];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '5px 12px',
      background: cfg.bg, border: `1px solid ${cfg.color}40`,
      borderRadius: 100, fontSize: 12, color: cfg.color, fontWeight: 700,
      fontFamily: 'var(--font-mono)',
    }}>
      {cfg.icon} {severity}: {count}
    </div>
  );
}

function SmellCard({ smell }: { smell: ArchitectureSmell }) {
  const cfg = severityConfig[smell.severity];
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: `1px solid var(--color-border)`,
      borderLeft: `3px solid ${cfg.color}`,
      borderRadius: 12,
      overflow: 'hidden',
      transition: 'box-shadow 200ms',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px',
        borderBottom: '1px solid var(--color-border)',
        flexWrap: 'wrap',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: cfg.bg, color: cfg.color,
          padding: '3px 10px', borderRadius: 100,
          fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
        }}>
          {cfg.icon} {smell.severity}
        </div>
        <Typography.Text strong style={{ color: 'var(--color-text-primary)', fontSize: 14, fontFamily: 'var(--font-heading)' }}>
          {smell.title}
        </Typography.Text>
        <Tag style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
          {smell.type}
        </Tag>
      </div>
      <div style={{ padding: '16px 20px', color: 'var(--color-text-secondary)', fontSize: 13, lineHeight: 1.7 }}>
        <p style={{ marginBottom: 14 }}>{smell.description}</p>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
            Affected Components
          </div>
          <Space wrap>
            {smell.affectedComponents.map((comp) => (
              <Tag key={comp} style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{comp}</Tag>
            ))}
          </Space>
        </div>
        <div style={{
          background: 'var(--color-surface-2)', border: '1px solid var(--color-border-subtle)',
          borderRadius: 8, padding: '10px 14px', fontSize: 13,
        }}>
          <strong style={{ color: 'var(--color-text-primary)' }}>Recommendation: </strong>
          {smell.recommendation}
        </div>
      </div>
    </div>
  );
}
