import { Alert, Card, Empty, Space, Tag, Typography } from 'antd';
import type { ArchitectureSmell, ProjectAnalysis, SmellSeverity } from '../types/analysis';
import { AnimatedPage } from '../components/AnimatedPage';

interface QualityReportProps {
  analysis?: ProjectAnalysis;
}

const severityColor: Record<SmellSeverity, string> = {
  HIGH: 'red',
  MEDIUM: 'orange',
  LOW: 'blue',
};

export function QualityReport({ analysis }: QualityReportProps) {
  if (!analysis) {
    return <Alert type="info" showIcon message="Upload a ZIP file to view architecture smells." />;
  }

  const smells = analysis.architectureSmells ?? [];

  return (
    <AnimatedPage className="space-y-4 py-6">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-violet-300">Architecture Smells</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">Quality Report</h1>
        <p className="mt-2 text-slate-400">
          {smells.length} smell(s) detected. High: {analysis.summary.highSeveritySmells ?? 0}, Medium:{' '}
          {analysis.summary.mediumSeveritySmells ?? 0}, Low: {analysis.summary.lowSeveritySmells ?? 0}
        </p>
      </div>
      {smells.length ? smells.map((smell) => <SmellCard key={`${smell.type}-${smell.affectedComponents.join('-')}`} smell={smell} />) : (
        <Card className="dark-ant-card">
          <Empty description="No architecture smells detected. The current rules did not find major layering or dependency issues." />
        </Card>
      )}
    </AnimatedPage>
  );
}

function SmellCard({ smell }: { smell: ArchitectureSmell }) {
  return (
    <Card
      className="dark-ant-card"
      title={
        <Space wrap>
          <Tag color={severityColor[smell.severity]}>{smell.severity}</Tag>
          <Typography.Text strong className="text-slate-50">{smell.title}</Typography.Text>
        </Space>
      }
      extra={<Tag>{smell.type}</Tag>}
    >
      <div className="space-y-3 text-slate-400">
        <p>{smell.description}</p>
        <div>
          <Typography.Text strong>Affected components</Typography.Text>
          <div className="mt-2 flex flex-wrap gap-2">
            {smell.affectedComponents.map((component) => (
              <Tag key={component}>{component}</Tag>
            ))}
          </div>
        </div>
        <p>
          <Typography.Text strong>Recommendation: </Typography.Text>
          {smell.recommendation}
        </p>
      </div>
    </Card>
  );
}
