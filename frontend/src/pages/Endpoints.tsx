import { Alert, Card } from 'antd';
import { EndpointTable } from '../components/EndpointTable';
import type { ProjectAnalysis } from '../types/analysis';
import { AnimatedPage } from '../components/AnimatedPage';

interface EndpointsProps {
  analysis?: ProjectAnalysis;
}

export function Endpoints({ analysis }: EndpointsProps) {
  if (!analysis) {
    return <Alert type="info" showIcon message="Upload a ZIP file to inspect endpoints." />;
  }

  return (
    <AnimatedPage className="py-6">
      <Card title={<span className="text-slate-50">API Endpoints</span>} className="dark-ant-card">
        <EndpointTable endpoints={analysis.endpoints} />
      </Card>
    </AnimatedPage>
  );
}
