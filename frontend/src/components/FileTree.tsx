import { Table, Tag } from 'antd';
import type { ProjectFile } from '../types/analysis';

interface FileTreeProps {
  files: ProjectFile[];
}

export function FileTree({ files }: FileTreeProps) {
  return (
    <Table
      rowKey="path"
      dataSource={files}
      pagination={{ pageSize: 10 }}
      columns={[
        { title: 'Path', dataIndex: 'path' },
        { title: 'Language', dataIndex: 'language', width: 140 },
        {
          title: 'Components',
          dataIndex: 'componentTypes',
          render: (types: string[]) => types.map((type) => <Tag key={type}>{type}</Tag>),
        },
        {
          title: 'Size',
          dataIndex: 'size',
          width: 120,
          render: (size: number) => `${(size / 1024).toFixed(1)} KB`,
        },
      ]}
    />
  );
}
