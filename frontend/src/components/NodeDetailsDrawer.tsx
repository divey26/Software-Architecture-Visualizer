import { Drawer, Tag } from 'antd';
import type { GraphNode } from '../types/analysis';

interface NodeDetailsDrawerProps {
  node?: GraphNode;
  open: boolean;
  onClose: () => void;
}

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', gap: 4,
    padding: '12px 0',
    borderBottom: '1px solid var(--color-border-subtle)',
  }}>
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: 'var(--color-text-muted)',
      fontFamily: 'var(--font-mono)',
    }}>
      {label}
    </div>
    <div style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
      {children}
    </div>
  </div>
);

export function NodeDetailsDrawer({ node, open, onClose }: NodeDetailsDrawerProps) {
  return (
    <Drawer
      title={
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16 }}>
          {node?.label ?? 'Component Details'}
        </span>
      }
      open={open}
      onClose={onClose}
      width={420}
    >
      {node ? (
        <div style={{ padding: '4px 0' }}>
          <DetailRow label="Type">
            <Tag style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{node.type}</Tag>
          </DetailRow>
          <DetailRow label="Component ID">
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#818cf8' }}>{node.id}</code>
          </DetailRow>
          <DetailRow label="File Path">
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-secondary)', wordBreak: 'break-all' }}>
              {node.filePath}
            </code>
          </DetailRow>
          {node.metadata && Object.keys(node.metadata).length ? (
            <DetailRow label="Metadata">
              <pre style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-text-secondary)',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: '10px 12px',
                overflow: 'auto',
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}>
                {JSON.stringify(node.metadata, null, 2)}
              </pre>
            </DetailRow>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  );
}
