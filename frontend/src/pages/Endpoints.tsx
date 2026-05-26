import { Alert, Card } from 'antd';
import { EndpointTable } from '../components/EndpointTable';
import type { ProjectAnalysis } from '../types/analysis';

interface EndpointsProps {
  analysis?: ProjectAnalysis;
}

export function Endpoints({ analysis }: EndpointsProps) {
  if (!analysis) {
    return <Alert type="info" showIcon message="Upload a ZIP file to inspect endpoints." />;
  }

  return (
    <div className="py-8">
      <Card title="API Endpoints">
        <EndpointTable endpoints={analysis.endpoints} />
      </Card>
    </div>
  );
}
