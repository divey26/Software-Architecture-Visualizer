import { Alert, Card } from 'antd';
import { ArchitectureGraph } from '../components/ArchitectureGraph';
import type { ProjectAnalysis } from '../types/analysis';

interface ArchitectureProps {
  analysis?: ProjectAnalysis;
}

export function Architecture({ analysis }: ArchitectureProps) {
  if (!analysis) {
    return <Alert type="info" showIcon message="Upload a ZIP file to view the architecture graph." />;
  }

  return (
    <div className="py-8">
      <Card title="Architecture Diagram">
        <ArchitectureGraph analysis={analysis} />
      </Card>
    </div>
  );
}
