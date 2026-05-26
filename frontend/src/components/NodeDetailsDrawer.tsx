import { Descriptions, Drawer, Tag } from 'antd';
import type { GraphNode } from '../types/analysis';

interface NodeDetailsDrawerProps {
  node?: GraphNode;
  open: boolean;
  onClose: () => void;
}

export function NodeDetailsDrawer({ node, open, onClose }: NodeDetailsDrawerProps) {
  return (
    <Drawer title={node?.label ?? 'Component'} open={open} onClose={onClose} width={420}>
      {node ? (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Type">
            <Tag>{node.type}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="ID">{node.id}</Descriptions.Item>
          <Descriptions.Item label="File">{node.filePath}</Descriptions.Item>
        </Descriptions>
      ) : null}
    </Drawer>
  );
}
