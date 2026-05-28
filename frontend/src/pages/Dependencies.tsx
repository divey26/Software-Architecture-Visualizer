import { Alert, Empty, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DependencyInfo, ProjectAnalysis } from '../types/analysis';
import { AnimatedPage } from '../components/AnimatedPage';
import { DatabaseOutlined } from '@ant-design/icons';

interface DependenciesProps {
  analysis?: ProjectAnalysis;
}

const ecosystemColors: Record<string, { color: string; label: string }> = {
  python: { color: '#60a5fa', label: 'Python' },
  maven:  { color: '#c084fc', label: 'Maven' },
  gradle: { color: '#34d399', label: 'Gradle' },
  npm:    { color: '#fbbf24', label: 'NPM' },
};

const columns: ColumnsType<DependencyInfo> = [
  {
    title: 'Package',
    dataIndex: 'name',
    key: 'name',
    sorter: (a, b) => a.name.localeCompare(b.name),
    render: (name: string) => (
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>
        {name}
      </span>
    ),
  },
  {
    title: 'Version',
    dataIndex: 'version',
    key: 'version',
    width: 140,
    render: (value: string) => (
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#818cf8' }}>
        {value || '—'}
      </span>
    ),
  },
  {
    title: 'Ecosystem',
    dataIndex: 'ecosystem',
    key: 'ecosystem',
    width: 120,
    filters: [
      { text: 'Python', value: 'python' },
      { text: 'Maven', value: 'maven' },
      { text: 'Gradle', value: 'gradle' },
      { text: 'NPM', value: 'npm' },
    ],
    onFilter: (value, record) => record.ecosystem === value,
    render: (value: DependencyInfo['ecosystem']) => {
      const cfg = ecosystemColors[value] ?? { color: '#94a3b8', label: value.toUpperCase() };
      return (
        <Tag style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: cfg.color, background: `${cfg.color}18`, borderColor: `${cfg.color}40` }}>
          {cfg.label}
        </Tag>
      );
    },
  },
  {
    title: 'Type',
    dataIndex: 'dependencyType',
    key: 'dependencyType',
    width: 120,
    render: (value: string) => (
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-secondary)' }}>
        {value || 'runtime'}
      </span>
    ),
  },
  {
    title: 'Source File',
    dataIndex: 'source',
    key: 'source',
    render: (value: string) => (
      <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}>
        {value}
      </code>
    ),
  },
];

export function Dependencies({ analysis }: DependenciesProps) {
  if (!analysis) {
    return (
      <AnimatedPage className="py-6">
        <Alert
          type="info"
          showIcon
          message="No project loaded"
          description="Upload a ZIP file to inspect dependency manifests."
          style={{ borderRadius: 10 }}
        />
      </AnimatedPage>
    );
  }

  const dependencies = analysis.dependencies ?? [];

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
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '18px 24px',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'rgba(192,132,252,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#c084fc', fontSize: 17,
          }}>
            <DatabaseOutlined />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Dependencies
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              {dependencies.length} packages found
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '0 4px 12px' }}>
          {dependencies.length ? (
            <Table
              rowKey={(record) => `${record.ecosystem}-${record.source}-${record.dependencyType ?? ''}-${record.name}`}
              columns={columns}
              dataSource={dependencies}
            />
          ) : (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <Empty description={
                <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                  No supported dependency manifest was found.
                </span>
              } />
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}
