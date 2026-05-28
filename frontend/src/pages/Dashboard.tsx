import { Alert, Statistic, Tag } from 'antd';
import { SummaryCards } from '../components/SummaryCards';
import type { ProjectAnalysis } from '../types/analysis';
import { AnimatedPage } from '../components/AnimatedPage';
import { GlassCard } from '../components/GlassCard';
import {
  LockOutlined,
  UnlockOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

interface DashboardProps {
  analysis?: ProjectAnalysis;
}

export function Dashboard({ analysis }: DashboardProps) {
  if (!analysis) {
    return (
      <AnimatedPage className="py-6">
        <Alert
          type="info"
          showIcon
          message="No project loaded"
          description="Upload a ZIP file or load a sample project from the sidebar to see the dashboard."
          style={{ borderRadius: 10 }}
        />
      </AnimatedPage>
    );
  }

  const accessSummary = analysis.accessControl?.summary;
  const authSmells =
    analysis.architectureSmells?.filter((smell) =>
      ['ROLE_DEFINED_NOT_ENFORCED', 'MISSING_AUTHORIZATION_MIDDLEWARE', 'HARDCODED_ADMIN_LOGIC'].includes(smell.type),
    ).length ?? 0;
  const protectedApis =
    (accessSummary?.authenticatedEndpoints ?? 0) +
    (accessSummary?.adminEndpoints ?? 0) +
    (accessSummary?.employeeEndpoints ?? 0);

  const accessCards = [
    { label: 'Public APIs', value: accessSummary?.publicEndpoints ?? 0, icon: <UnlockOutlined />, color: '#34d399', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Protected APIs', value: protectedApis, icon: <LockOutlined />, color: '#818cf8', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Admin APIs', value: accessSummary?.adminEndpoints ?? 0, icon: <SafetyCertificateOutlined />, color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
    { label: 'Employee APIs', value: accessSummary?.employeeEndpoints ?? 0, icon: <TeamOutlined />, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    { label: 'Unprotected Sensitive', value: accessSummary?.unprotectedSensitiveEndpoints ?? 0, icon: <WarningOutlined />, color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
    { label: 'Auth Smells', value: authSmells, icon: <CheckCircleOutlined />, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  ];

  return (
    <AnimatedPage className="space-y-6 py-6">
      {/* Header */}
      <div className="page-header">
        <div className="badge badge-accent" style={{ marginBottom: 12 }}>Analysis Dashboard</div>
        <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: 8 }}>
          {analysis.projectName}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
          {analysis.files.length} scanned files · {analysis.nodes.length} detected components
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {analysis.stack ? (
            <Tag color="geekblue" style={{ fontFamily: 'var(--font-mono)' }}>
              Stack: {analysis.stack}
            </Tag>
          ) : null}
          {analysis.languages?.map((lang) => (
            <Tag key={lang} style={{ fontFamily: 'var(--font-mono)' }}>{lang}</Tag>
          ))}
          {analysis.frameworks?.map((fw) => (
            <Tag key={fw} color="purple" style={{ fontFamily: 'var(--font-mono)' }}>{fw}</Tag>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards summary={analysis.summary} />

      {/* Access Control Cards */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
          Access Control Overview
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {accessCards.map((item) => (
            <GlassCard key={item.label} className="p-5">
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: item.bg, color: item.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 17, marginBottom: 12,
              }}>
                {item.icon}
              </div>
              <Statistic title={item.label} value={item.value} />
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Analysis note */}
      <div style={{
        background: 'rgba(99,102,241,0.05)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 10,
        padding: '16px 20px',
        fontSize: 13,
        color: 'var(--color-text-secondary)',
        lineHeight: 1.7,
      }}>
        <strong style={{ color: 'var(--color-text-primary)' }}>Note: </strong>
        This tool uses static AST and annotation detection. It is designed for quick architecture
        discovery and does not execute uploaded code. Results reflect static analysis accuracy only.
      </div>
    </AnimatedPage>
  );
}
