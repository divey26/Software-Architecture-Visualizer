import {
  ApiOutlined,
  ApartmentOutlined,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  WarningOutlined,
  CodeOutlined,
  BugOutlined,
} from '@ant-design/icons';
import { Statistic } from 'antd';
import type { Summary } from '../types/analysis';

interface SummaryCardsProps {
  summary: Summary;
}

const items = (summary: Summary) => [
  {
    label: 'Controllers',
    value: summary.controllers,
    icon: <DeploymentUnitOutlined />,
    color: '#818cf8',
    bg: 'rgba(99,102,241,0.1)',
    accent: 'rgba(99,102,241,0.5)',
  },
  {
    label: 'Services',
    value: summary.services,
    icon: <ApartmentOutlined />,
    color: '#34d399',
    bg: 'rgba(16,185,129,0.1)',
    accent: 'rgba(16,185,129,0.5)',
  },
  {
    label: 'Repositories',
    value: summary.repositories,
    icon: <DatabaseOutlined />,
    color: '#c084fc',
    bg: 'rgba(192,132,252,0.1)',
    accent: 'rgba(192,132,252,0.5)',
  },
  {
    label: 'APIs',
    value: summary.apis,
    icon: <ApiOutlined />,
    color: '#22d3ee',
    bg: 'rgba(34,211,238,0.1)',
    accent: 'rgba(34,211,238,0.5)',
  },
  {
    label: 'Models / DTOs',
    value: summary.models,
    icon: <CodeOutlined />,
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.1)',
    accent: 'rgba(251,146,60,0.5)',
  },
  {
    label: 'Graph Dependencies',
    value: summary.dependencies,
    icon: <DeploymentUnitOutlined />,
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.1)',
    accent: 'rgba(148,163,184,0.5)',
  },
  {
    label: 'Packages',
    value: summary.packageDependencies ?? 0,
    icon: <DatabaseOutlined />,
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.1)',
    accent: 'rgba(167,139,250,0.5)',
  },
  {
    label: 'Architecture Smells',
    value: summary.smells ?? 0,
    icon: <BugOutlined />,
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.1)',
    accent: 'rgba(251,191,36,0.5)',
  },
];

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
      {items(summary).map((item) => (
        <div
          key={item.label}
          style={{
            position: 'relative',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: '18px 20px',
            overflow: 'hidden',
            transition: 'border-color 200ms, box-shadow 200ms, transform 200ms',
            cursor: 'default',
          }}
          className="stat-hover-card"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = `${item.accent}`;
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px rgba(0,0,0,0.18)`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          }}
        >
          {/* Bottom accent bar */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, ${item.color}, ${item.accent})`,
          }} />
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: item.bg, color: item.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, marginBottom: 14,
          }}>
            {item.icon}
          </div>
          <Statistic title={item.label} value={item.value} />
        </div>
      ))}
    </div>
  );
}
