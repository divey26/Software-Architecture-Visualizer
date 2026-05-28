import { useRef } from 'react';
import { Alert, Button, Card, message } from 'antd';
import type { ProjectAnalysis } from '../types/analysis';
import { printElementAsPdf } from '../utils/export';
import { AnimatedPage } from '../components/AnimatedPage';

interface ReportProps {
  analysis?: ProjectAnalysis;
}

export function Report({ analysis }: ReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  if (!analysis) {
    return <Alert type="info" showIcon message="Upload a ZIP file to view the generated report." />;
  }

  const report = analysis.architectureReport || 'No architecture report was generated for this analysis.';

  const handleExport = async () => {
    try {
      if (!reportRef.current) {
        throw new Error('Report is not ready to export.');
      }
      await printElementAsPdf(reportRef.current, `${analysis.projectName} Architecture Report`);
      message.success('Report PDF opened in a print window.');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Report export failed.');
    }
  };

  return (
    <AnimatedPage className="py-6">
      <Card
        title={<span className="text-slate-50">Architecture Explanation Report</span>}
        className="dark-ant-card"
        extra={<Button onClick={handleExport} className="border-slate-600 bg-slate-900 text-slate-100">Export Report as PDF</Button>}
      >
        <div ref={reportRef} className="space-y-4 rounded-lg bg-slate-950/50 p-5">
          <h1 className="text-2xl font-semibold text-slate-50">{analysis.projectName}</h1>
          {analysis.accessControl ? (
            <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-5 leading-7 text-slate-300">
              <h2 className="mb-3 text-xl font-semibold text-slate-50">Access Control Summary</h2>
              <p>
                Authentication detected: {analysis.accessControl.authDetected ? 'yes' : 'no'}. Roles detected:{' '}
                {analysis.accessControl.rolesDetected.length ? analysis.accessControl.rolesDetected.join(', ') : 'none'}.
                Route-level role enforcement detected: {analysis.accessControl.roleEnforcementDetected ? 'yes' : 'no'}.
              </p>
              <p className="mt-3">
                Unprotected sensitive endpoints:{' '}
                {analysis.accessControl.summary.unprotectedSensitiveEndpoints}. Add centralized JWT verification and
                role-based middleware for sensitive routes that are currently unknown or unprotected.
              </p>
            </div>
          ) : null}
          <div className="whitespace-pre-wrap rounded-lg border border-slate-700 bg-slate-900/80 p-5 leading-7 text-slate-300">
            {report}
          </div>
        </div>
      </Card>
    </AnimatedPage>
  );
}
