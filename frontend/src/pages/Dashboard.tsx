import { Alert, Card, Statistic, Tag } from 'antd';
import { SummaryCards } from '../components/SummaryCards';
import type { ProjectAnalysis } from '../types/analysis';
import { AnimatedPage } from '../components/AnimatedPage';
import { GlassCard } from '../components/GlassCard';

interface DashboardProps {
  analysis?: ProjectAnalysis;
}

export function Dashboard({ analysis }: DashboardProps) {
  if (!analysis) {
    return <Alert type="info" showIcon message="Upload a ZIP file to see the dashboard." />;
  }

  const accessSummary = analysis.accessControl?.summary;
  const authSmells = analysis.architectureSmells?.filter((smell) =>
    ['ROLE_DEFINED_NOT_ENFORCED', 'MISSING_AUTHORIZATION_MIDDLEWARE', 'HARDCODED_ADMIN_LOGIC'].includes(smell.type),
  ).length ?? 0;
  const protectedApis = (accessSummary?.authenticatedEndpoints ?? 0)
    + (accessSummary?.adminEndpoints ?? 0)
    + (accessSummary?.employeeEndpoints ?? 0);
  const accessCards = [
    { label: 'Public APIs', value: accessSummary?.publicEndpoints ?? 0 },
    { label: 'Protected APIs', value: protectedApis },
    { label: 'Admin APIs', value: accessSummary?.adminEndpoints ?? 0 },
    { label: 'Employee APIs', value: accessSummary?.employeeEndpoints ?? 0 },
    { label: 'Unprotected Sensitive APIs', value: accessSummary?.unprotectedSensitiveEndpoints ?? 0 },
    { label: 'Auth Smells', value: authSmells },
  ];

  return (
    <AnimatedPage className="space-y-6 py-6">
      <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-6">
        <p className="text-sm uppercase tracking-[0.22em] text-sky-300">Analysis Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">{analysis.projectName}</h1>
        <p className="mt-2 text-slate-400">
          {analysis.files.length} scanned files, {analysis.nodes.length} detected components.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {analysis.stack ? <Tag color="cyan">Detected Stack: {analysis.stack}</Tag> : null}
          {analysis.languages?.map((language) => (
            <Tag key={language}>{language}</Tag>
          ))}
          {analysis.frameworks?.map((framework) => (
            <Tag key={framework} color="purple">
              {framework}
            </Tag>
          ))}
        </div>
      </div>
      <SummaryCards summary={analysis.summary} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {accessCards.map((item) => (
          <GlassCard key={item.label} className="p-5">
            <Statistic title={item.label} value={item.value} />
          </GlassCard>
        ))}
      </div>
      <Card title="Analysis Notes" className="dark-ant-card">
        <p className="text-slate-400">
          This MVP uses static AST and annotation detection. It is designed for quick architecture discovery and does not
          execute uploaded code.
        </p>
      </Card>
    </AnimatedPage>
  );
}
