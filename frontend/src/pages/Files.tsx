import { Alert, Card } from 'antd';
import { FileTree } from '../components/FileTree';
import type { ProjectAnalysis } from '../types/analysis';
import { AnimatedPage } from '../components/AnimatedPage';

interface FilesProps {
  analysis?: ProjectAnalysis;
}

export function Files({ analysis }: FilesProps) {
  if (!analysis) {
    return <Alert type="info" showIcon message="Upload a ZIP file to browse scanned files." />;
  }

  return (
    <AnimatedPage className="py-6">
      <Card title={<span className="text-slate-50">Project Files</span>} className="dark-ant-card">
        <FileTree files={analysis.files} />
      </Card>
    </AnimatedPage>
  );
}
