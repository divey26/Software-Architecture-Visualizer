import { Button, Card, Empty, Popconfirm, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ProjectAnalysis, ProjectHistoryItem } from '../types/analysis';
import { clearHistory, deleteHistoryItem, loadHistory } from '../utils/history';
import { AnimatedPage } from '../components/AnimatedPage';

interface HistoryProps {
  items: ProjectHistoryItem[];
  onItemsChange: (items: ProjectHistoryItem[]) => void;
  onOpenAnalysis: (analysis: ProjectAnalysis) => void;
}

export function History({ items, onItemsChange, onOpenAnalysis }: HistoryProps) {
  const columns: ColumnsType<ProjectHistoryItem> = [
    { title: 'Project', dataIndex: 'projectName', key: 'projectName' },
    {
      title: 'Analyzed',
      dataIndex: 'analyzedAt',
      key: 'analyzedAt',
      render: (value: string) => new Date(value).toLocaleString(),
      sorter: (a, b) => new Date(a.analyzedAt).getTime() - new Date(b.analyzedAt).getTime(),
    },
    { title: 'Endpoints', dataIndex: 'endpointCount', key: 'endpointCount' },
    {
      title: 'Smells',
      dataIndex: 'smellCount',
      key: 'smellCount',
      render: (value: number) => <Tag color={value ? 'orange' : 'green'}>{value}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, item) => (
        <Space>
          <Button type="link" onClick={() => onOpenAnalysis(item.analysis)}>
            Open
          </Button>
          <Popconfirm
            title="Delete this history item?"
            onConfirm={() => {
              onItemsChange(deleteHistoryItem(item.id));
              message.success('History item deleted.');
            }}
          >
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AnimatedPage className="py-6">
      <Card
        title={<span className="text-slate-50">Project History</span>}
        className="dark-ant-card"
        extra={
          <Space>
            <Button onClick={() => onItemsChange(loadHistory())}>Refresh</Button>
            <Popconfirm
              title="Clear all history?"
              onConfirm={() => {
                clearHistory();
                onItemsChange([]);
                message.success('History cleared.');
              }}
            >
              <Button danger disabled={!items.length}>
                Clear All
              </Button>
            </Popconfirm>
          </Space>
        }
      >
        {items.length ? <Table rowKey="id" columns={columns} dataSource={items} /> : <Empty description="No previous analyses yet." />}
      </Card>
    </AnimatedPage>
  );
}
