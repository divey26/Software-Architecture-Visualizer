import { Alert, Card } from 'antd';
import { SummaryCards } from '../components/SummaryCards';
import type { ProjectAnalysis } from '../types/analysis';

interface DashboardProps {
  analysis?: ProjectAnalysis;
}

export function Dashboard({ analysis }: DashboardProps) {
  if (!analysis) {
    return <Alert type="info" showIcon message="Upload a ZIP file to see the dashboard." />;
  }

  return (
    <div className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">{analysis.projectName}</h1>
        <p className="text-slate-600">
          {analysis.files.length} scanned files, {analysis.nodes.length} detected components.
        </p>
      </div>
      <SummaryCards summary={analysis.summary} />
      <Card title="Analysis Notes">
        <p className="text-slate-600">
          This MVP uses static AST and annotation detection. It is designed for quick architecture discovery and does not
          execute uploaded code.
        </p>
      </Card>
    </div>
  );
}
