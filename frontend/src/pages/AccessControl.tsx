import { Alert, Statistic, Table, Tag } from 'antd';
import {
  CheckCircleOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UnlockOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { AnimatedPage } from '../components/AnimatedPage';
import { GlassCard } from '../components/GlassCard';
import type { AccessControlledEndpoint, AccessLevel, ProjectAnalysis, RiskLevel } from '../types/analysis';

interface AccessControlProps {
  analysis?: ProjectAnalysis;
}

const accessColors: Record<AccessLevel, string> = {
  PUBLIC: 'green',
  AUTHENTICATED: 'blue',
  ADMIN: 'magenta',
  EMPLOYEE: 'cyan',
  ADMIN_OR_EMPLOYEE: 'purple',
  UNKNOWN: 'default',
  UNPROTECTED_SENSITIVE: 'red',
};

const riskColors: Record<RiskLevel, string> = {
  HIGH: 'red',
  MEDIUM: 'orange',
  LOW: 'green',
  NONE: 'default',
};

export function AccessControl({ analysis }: AccessControlProps) {
  if (!analysis) {
    return (
      <AnimatedPage className="py-6">
        <Alert
          type="info"
          showIcon
          message="No project loaded"
          description="Upload a ZIP file to view access control analysis."
          style={{ borderRadius: 10 }}
        />
      </AnimatedPage>
    );
  }

  const accessControl = analysis.accessControl;
  if (!accessControl) {
    return (
      <AnimatedPage className="py-6">
        <Alert
          type="warning"
          showIcon
          message="Access control analysis is not available for this project."
          style={{ borderRadius: 10 }}
        />
      </AnimatedPage>
    );
  }

  const summaryItems = [
    { label: 'Auth Detected', value: accessControl.authDetected ? 'Yes' : 'No', icon: <LockOutlined />, color: '#818cf8', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Roles Detected', value: accessControl.rolesDetected.length ? accessControl.rolesDetected.join(', ') : 'None', icon: <TeamOutlined />, color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
    { label: 'Public Endpoints', value: accessControl.summary.publicEndpoints, icon: <UnlockOutlined />, color: '#34d399', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Authenticated', value: accessControl.summary.authenticatedEndpoints, icon: <CheckCircleOutlined />, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    { label: 'Admin Endpoints', value: accessControl.summary.adminEndpoints, icon: <SafetyCertificateOutlined />, color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
    { label: 'Employee Endpoints', value: accessControl.summary.employeeEndpoints, icon: <TeamOutlined />, color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    { label: 'Unknown Endpoints', value: accessControl.summary.unknownEndpoints, icon: <WarningOutlined />, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
    { label: 'Unprotected Sensitive', value: accessControl.summary.unprotectedSensitiveEndpoints, icon: <WarningOutlined />, color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  ];

  return (
    <AnimatedPage className="space-y-6 py-6">
      {/* Header */}
      <div className="page-header">
        <div className="badge badge-accent" style={{ marginBottom: 12 }}>Access Control</div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, marginBottom: 8 }}>
          {analysis.projectName}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
          Static authentication, role, route middleware, and sensitive endpoint analysis.
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
        {summaryItems.map((item) => (
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

      {/* Warning if roles defined but not enforced */}
      {accessControl.rolesDetected.length > 0 && !accessControl.roleEnforcementDetected ? (
        <Alert
          type="warning"
          showIcon
          message="Roles defined but enforcement not detected"
          description="Roles are defined in the codebase, but route-level authorization middleware was not detected. Consider adding centralized role checks."
          style={{ borderRadius: 10 }}
        />
      ) : null}

      {/* Table */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 14,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--color-border)',
          fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700,
          color: 'var(--color-text-primary)',
        }}>
          Access Control Matrix
        </div>
        <div style={{ padding: '0 4px 8px' }}>
          <Table<AccessControlledEndpoint>
            rowKey={(record) => `${record.method}-${record.path}-${record.handler}`}
            dataSource={accessControl.endpoints}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1100 }}
            columns={[
              {
                title: 'Method',
                dataIndex: 'method',
                width: 90,
                render: (method) => <Tag color="geekblue" style={{ fontFamily: 'var(--font-mono)' }}>{method}</Tag>,
              },
              { title: 'Endpoint', dataIndex: 'path', width: 220, render: (v) => <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#a5b4fc' }}>{v}</code> },
              { title: 'Handler', dataIndex: 'handler', width: 180, render: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v}</span> },
              { title: 'Controller', dataIndex: 'controller', width: 180, render: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v}</span> },
              {
                title: 'Middleware',
                dataIndex: 'middleware',
                width: 220,
                render: (middleware: string[]) =>
                  middleware.length
                    ? middleware.map((item) => <Tag key={item} style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{item}</Tag>)
                    : <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: 12 }}>None</span>,
              },
              {
                title: 'Access Level',
                dataIndex: 'accessLevel',
                width: 190,
                render: (level: AccessLevel) => <Tag color={accessColors[level]} style={{ fontFamily: 'var(--font-mono)' }}>{level}</Tag>,
              },
              {
                title: 'Risk',
                dataIndex: 'risk',
                width: 100,
                render: (risk: RiskLevel) => <Tag color={riskColors[risk]} style={{ fontFamily: 'var(--font-mono)' }}>{risk}</Tag>,
              },
              { title: 'Reason', dataIndex: 'reason', width: 340, render: (v) => <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{v}</span> },
            ]}
          />
        </div>
      </div>
    </AnimatedPage>
  );
}
