import { Alert, Card, Statistic, Table, Tag } from 'antd';
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
    return <Alert type="info" showIcon message="Upload a ZIP file to view access control analysis." />;
  }

  const accessControl = analysis.accessControl;
  if (!accessControl) {
    return <Alert type="warning" showIcon message="Access control analysis is not available for this project." />;
  }

  const summaryItems = [
    { label: 'Auth detected', value: accessControl.authDetected ? 'Yes' : 'No', icon: <LockOutlined />, color: 'text-sky-300' },
    {
      label: 'Roles detected',
      value: accessControl.rolesDetected.length ? accessControl.rolesDetected.join(', ') : 'None',
      icon: <TeamOutlined />,
      color: 'text-violet-300',
    },
    { label: 'Public endpoints', value: accessControl.summary.publicEndpoints, icon: <UnlockOutlined />, color: 'text-emerald-300' },
    {
      label: 'Authenticated endpoints',
      value: accessControl.summary.authenticatedEndpoints,
      icon: <CheckCircleOutlined />,
      color: 'text-blue-300',
    },
    { label: 'Admin endpoints', value: accessControl.summary.adminEndpoints, icon: <SafetyCertificateOutlined />, color: 'text-rose-300' },
    { label: 'Employee endpoints', value: accessControl.summary.employeeEndpoints, icon: <TeamOutlined />, color: 'text-cyan-300' },
    { label: 'Unknown endpoints', value: accessControl.summary.unknownEndpoints, icon: <WarningOutlined />, color: 'text-slate-300' },
    {
      label: 'Unprotected sensitive',
      value: accessControl.summary.unprotectedSensitiveEndpoints,
      icon: <WarningOutlined />,
      color: 'text-red-300',
    },
  ];

  return (
    <AnimatedPage className="space-y-6 py-6">
      <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-6">
        <p className="text-sm uppercase tracking-[0.22em] text-sky-300">Access Control</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">{analysis.projectName}</h1>
        <p className="mt-2 text-slate-400">
          Static authentication, role, route middleware, and sensitive endpoint analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((item) => (
          <GlassCard key={item.label} className="p-5">
            <div className={`mb-3 text-2xl ${item.color}`}>{item.icon}</div>
            <Statistic title={item.label} value={item.value} />
          </GlassCard>
        ))}
      </div>

      {accessControl.rolesDetected.length > 0 && !accessControl.roleEnforcementDetected ? (
        <Alert
          type="warning"
          showIcon
          message="Roles are defined in the codebase, but route-level authorization middleware was not detected."
        />
      ) : null}

      <Card title={<span className="text-slate-50">Access Control Matrix</span>} className="dark-ant-card">
        <Table<AccessControlledEndpoint>
          rowKey={(record) => `${record.method}-${record.path}-${record.handler}`}
          dataSource={accessControl.endpoints}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1100 }}
          columns={[
            { title: 'Method', dataIndex: 'method', width: 96, render: (method) => <Tag color="blue">{method}</Tag> },
            { title: 'Endpoint', dataIndex: 'path', width: 220 },
            { title: 'Handler', dataIndex: 'handler', width: 180 },
            { title: 'Controller', dataIndex: 'controller', width: 180 },
            {
              title: 'Middleware',
              dataIndex: 'middleware',
              width: 240,
              render: (middleware: string[]) =>
                middleware.length ? middleware.map((item) => <Tag key={item}>{item}</Tag>) : <span className="text-slate-500">None</span>,
            },
            {
              title: 'Access Level',
              dataIndex: 'accessLevel',
              width: 190,
              render: (level: AccessLevel) => <Tag color={accessColors[level]}>{level}</Tag>,
            },
            {
              title: 'Risk',
              dataIndex: 'risk',
              width: 110,
              render: (risk: RiskLevel) => <Tag color={riskColors[risk]}>{risk}</Tag>,
            },
            { title: 'Reason', dataIndex: 'reason', width: 360 },
          ]}
        />
      </Card>
    </AnimatedPage>
  );
}
