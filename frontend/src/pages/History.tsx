import { Alert, Button, Empty, Popconfirm, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ProjectAnalysis, ProjectHistoryItem } from '../types/analysis';
import { clearHistory, deleteHistoryItem, loadHistory } from '../utils/history';
import { AnimatedPage } from '../components/AnimatedPage';
import { HistoryOutlined, ReloadOutlined, DeleteOutlined, FolderOpenOutlined } from '@ant-design/icons';

interface HistoryProps {
  items: ProjectHistoryItem[];
  onItemsChange: (items: ProjectHistoryItem[]) => void;
  onOpenAnalysis: (analysis: ProjectAnalysis) => void;
}

export function History({ items, onItemsChange, onOpenAnalysis }: HistoryProps) {
  const columns: ColumnsType<ProjectHistoryItem> = [
    {
      title: 'Project',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (name: string) => (
        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>
          {name}
        </span>
      ),
    },
    {
      title: 'Analyzed',
      dataIndex: 'analyzedAt',
      key: 'analyzedAt',
      render: (value: string) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {new Date(value).toLocaleString()}
        </span>
      ),
      sorter: (a, b) => new Date(a.analyzedAt).getTime() - new Date(b.analyzedAt).getTime(),
    },
    {
      title: 'Endpoints',
      dataIndex: 'endpointCount',
      key: 'endpointCount',
      render: (val: number) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#818cf8' }}>{val}</span>
      ),
    },
    {
      title: 'Smells',
      dataIndex: 'smellCount',
      key: 'smellCount',
      render: (value: number) => (
        <Tag color={value ? 'orange' : 'green'} style={{ fontFamily: 'var(--font-mono)' }}>
          {value}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, item) => (
        <Space size={4}>
          <Button
            type="link"
            icon={<FolderOpenOutlined />}
            onClick={() => onOpenAnalysis(item.analysis)}
            style={{ color: '#818cf8', padding: '4px 8px', fontSize: 12, fontWeight: 600 }}
          >
            Open
          </Button>
          <Popconfirm
            title="Delete this history item?"
            onConfirm={() => {
              onItemsChange(deleteHistoryItem(item.id));
              message.success('History item deleted.');
            }}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              style={{ padding: '4px 8px', fontSize: 12, fontWeight: 600 }}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
              background: 'rgba(99,102,241,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#818cf8', fontSize: 17,
            }}>
              <HistoryOutlined />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Project History
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                {items.length} previous {items.length === 1 ? 'analysis' : 'analyses'}
              </div>
            </div>
          </div>
          <Space>
            <Button
              className="btn-ghost"
              icon={<ReloadOutlined />}
              onClick={() => onItemsChange(loadHistory())}
              style={{ fontSize: 13 }}
            >
              Refresh
            </Button>
            <Popconfirm
              title="Clear all history?"
              onConfirm={() => {
                clearHistory();
                onItemsChange([]);
                message.success('History cleared.');
              }}
            >
              <Button
                danger
                disabled={!items.length}
                icon={<DeleteOutlined />}
                style={{ fontSize: 13 }}
              >
                Clear All
              </Button>
            </Popconfirm>
          </Space>
        </div>

        {/* Body */}
        <div style={{ padding: '0 8px 16px' }}>
          {items.length ? (
            <Table rowKey="id" columns={columns} dataSource={items} style={{ marginTop: 4 }} />
          ) : (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <Empty description={
                <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                  No previous analyses yet. Upload a project to get started.
                </span>
              } />
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}
