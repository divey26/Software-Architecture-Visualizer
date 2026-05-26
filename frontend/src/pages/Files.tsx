import { Alert, Card } from 'antd';
import { FileTree } from '../components/FileTree';
import type { ProjectAnalysis } from '../types/analysis';

interface FilesProps {
  analysis?: ProjectAnalysis;
}

export function Files({ analysis }: FilesProps) {
  if (!analysis) {
    return <Alert type="info" showIcon message="Upload a ZIP file to browse scanned files." />;
  }

  return (
    <div className="py-8">
      <Card title="Project Files">
        <FileTree files={analysis.files} />
      </Card>
    </div>
  );
}
