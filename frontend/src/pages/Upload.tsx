import { Alert, Button, Card, Form, Input, Tabs } from 'antd';
import { UploadBox } from '../components/UploadBox';
import type { ProjectAnalysis } from '../types/analysis';
import { analyzeGithubRepository, getApiErrorMessage } from '../api/projectApi';
import { AnimatedPage } from '../components/AnimatedPage';

interface UploadPageProps {
  analysis?: ProjectAnalysis;
  loading: boolean;
  error?: string;
  onLoadingChange: (loading: boolean) => void;
  onAnalysis: (analysis: ProjectAnalysis) => void;
  onError: (message: string) => void;
}

export function UploadPage(props: UploadPageProps) {
  const handleGithubAnalyze = async ({ repoUrl }: { repoUrl: string }) => {
    props.onLoadingChange(true);
    try {
      const analysis = await analyzeGithubRepository(repoUrl);
      props.onAnalysis(analysis);
    } catch (error) {
      props.onError(getApiErrorMessage(error));
    } finally {
      props.onLoadingChange(false);
    }
  };

  return (
    <AnimatedPage className="mx-auto max-w-5xl py-6">
      <Card
        title={<span className="text-slate-50">Analyze Project</span>}
        className="dark-ant-card overflow-hidden"
      >
        <div className="space-y-4">
          {props.analysis ? (
            <Alert
              type="success"
              showIcon
              message={`Loaded ${props.analysis.projectName}`}
              description="Open the dashboard or architecture pages to inspect the analysis."
            />
          ) : null}
          {props.error ? <Alert type="error" showIcon message={props.error} /> : null}
          <Tabs
            items={[
              {
                key: 'zip',
                label: 'Upload ZIP',
                children: <UploadBox {...props} />,
              },
              {
                key: 'github',
                label: 'Analyze GitHub URL',
                children: (
                  <Form layout="vertical" onFinish={handleGithubAnalyze} className="max-w-2xl">
                    <Form.Item
                      name="repoUrl"
                      label="Public GitHub repository URL"
                      rules={[
                        { required: true, message: 'Enter a GitHub repository URL.' },
                        { type: 'url', message: 'Enter a valid URL.' },
                      ]}
                    >
                      <Input placeholder="https://github.com/username/repository" disabled={props.loading} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={props.loading}>
                      Analyze Repository
                    </Button>
                  </Form>
                ),
              },
            ]}
          />
        </div>
      </Card>
    </AnimatedPage>
  );
}
