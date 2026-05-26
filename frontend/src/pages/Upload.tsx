import { Alert, Card } from 'antd';
import { UploadBox } from '../components/UploadBox';
import type { ProjectAnalysis } from '../types/analysis';

interface UploadPageProps {
  analysis?: ProjectAnalysis;
  loading: boolean;
  error?: string;
  onLoadingChange: (loading: boolean) => void;
  onAnalysis: (analysis: ProjectAnalysis) => void;
  onError: (message: string) => void;
}

export function UploadPage(props: UploadPageProps) {
  return (
    <div className="mx-auto max-w-4xl py-8">
      <Card title="Upload Project ZIP">
        <div className="space-y-4">
          {props.analysis ? (
            <Alert
              type="success"
              showIcon
              message={`Loaded ${props.analysis.projectName}`}
              description="Open the dashboard or architecture pages to inspect the analysis."
            />
          ) : null}
          <UploadBox {...props} />
        </div>
      </Card>
    </div>
  );
}
