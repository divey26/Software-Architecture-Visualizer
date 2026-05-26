import { Input, Table, Tag } from 'antd';
import { useMemo, useState } from 'react';
import type { ApiEndpoint } from '../types/analysis';

interface EndpointTableProps {
  endpoints: ApiEndpoint[];
}

const methodColors: Record<string, string> = {
  GET: 'green',
  POST: 'blue',
  PUT: 'gold',
  PATCH: 'purple',
  DELETE: 'red',
};

export function EndpointTable({ endpoints }: EndpointTableProps) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return endpoints;
    }
    return endpoints.filter((endpoint) =>
      `${endpoint.method} ${endpoint.path} ${endpoint.handler} ${endpoint.filePath}`.toLowerCase().includes(normalized),
    );
  }, [endpoints, query]);

  return (
    <div className="space-y-4">
      <Input.Search allowClear placeholder="Search endpoints" onChange={(event) => setQuery(event.target.value)} />
      <Table
        rowKey={(record) => `${record.method}-${record.path}-${record.handler}`}
        dataSource={filtered}
        pagination={{ pageSize: 8 }}
        columns={[
          {
            title: 'Method',
            dataIndex: 'method',
            render: (method: string) => <Tag color={methodColors[method] ?? 'default'}>{method}</Tag>,
          },
          { title: 'Path', dataIndex: 'path' },
          { title: 'Handler', dataIndex: 'handler' },
          { title: 'File', dataIndex: 'filePath' },
        ]}
      />
    </div>
  );
}
