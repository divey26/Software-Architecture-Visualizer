import { Alert, Card, Empty, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DependencyInfo, ProjectAnalysis } from '../types/analysis';
import { AnimatedPage } from '../components/AnimatedPage';

interface DependenciesProps {
  analysis?: ProjectAnalysis;
}

const columns: ColumnsType<DependencyInfo> = [
  { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
  { title: 'Version', dataIndex: 'version', key: 'version', render: (value: string) => value || 'Unspecified' },
  {
    title: 'Ecosystem',
    dataIndex: 'ecosystem',
    key: 'ecosystem',
    filters: [
      { text: 'Python', value: 'python' },
      { text: 'Maven', value: 'maven' },
      { text: 'Gradle', value: 'gradle' },
      { text: 'NPM', value: 'npm' },
    ],
    onFilter: (value, record) => record.ecosystem === value,
    render: (value: DependencyInfo['ecosystem']) => (
      <Tag color={value === 'python' ? 'cyan' : value === 'maven' ? 'purple' : value === 'npm' ? 'green' : 'blue'}>
        {value.toUpperCase()}
      </Tag>
    ),
  },
  { title: 'Type', dataIndex: 'dependencyType', key: 'dependencyType', render: (value: string) => value || 'runtime' },
  { title: 'Source File', dataIndex: 'source', key: 'source' },
];

export function Dependencies({ analysis }: DependenciesProps) {
  if (!analysis) {
    return <Alert type="info" showIcon message="Upload a ZIP file to inspect dependency manifests." />;
  }

  const dependencies = analysis.dependencies ?? [];

  return (
    <AnimatedPage className="py-6">
      <Card title={<span className="text-slate-50">Dependencies</span>} className="dark-ant-card">
        {dependencies.length ? (
          <Table rowKey={(record) => `${record.ecosystem}-${record.source}-${record.dependencyType ?? ''}-${record.name}`} columns={columns} dataSource={dependencies} />
        ) : (
          <Empty description="No supported dependency manifest was found." />
        )}
      </Card>
    </AnimatedPage>
  );
}
