import { Alert, Button, Form, Input, Tabs } from 'antd';
import { UploadBox } from '../components/UploadBox';
import type { ProjectAnalysis } from '../types/analysis';
import { analyzeGithubRepository, getApiErrorMessage } from '../api/projectApi';
import { AnimatedPage } from '../components/AnimatedPage';
import { GithubOutlined, CloudUploadOutlined, CheckCircleOutlined } from '@ant-design/icons';

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
    <AnimatedPage className="py-6">
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div className="badge badge-accent" style={{ marginBottom: 12 }}>
            Static Analysis
          </div>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(22px, 4vw, 30px)',
            fontWeight: 800,
            marginBottom: 8,
          }}>
            Analyze Your Project
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
            Upload a ZIP archive or paste a public GitHub URL to begin static architecture analysis.
          </p>
        </div>

        {/* Status alerts */}
        {props.analysis && (
          <Alert
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            message={`Loaded: ${props.analysis.projectName}`}
            description="Open the Dashboard or Architecture pages to explore the analysis results."
            style={{ marginBottom: 20, borderRadius: 10 }}
          />
        )}
        {props.error && (
          <Alert
            type="error"
            showIcon
            message="Analysis Failed"
            description={props.error}
            style={{ marginBottom: 20, borderRadius: 10 }}
          />
        )}

        {/* Card */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 16,
          overflow: 'hidden',
        }}>
          <Tabs
            defaultActiveKey="zip"
            style={{ padding: '0 24px' }}
            items={[
              {
                key: 'zip',
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <CloudUploadOutlined /> Upload ZIP
                  </span>
                ),
                children: (
                  <div style={{ paddingBottom: 24 }}>
                    <UploadBox {...props} />
                  </div>
                ),
              },
              {
                key: 'github',
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <GithubOutlined /> GitHub URL
                  </span>
                ),
                children: (
                  <div style={{ paddingBottom: 24 }}>
                    <Form layout="vertical" onFinish={handleGithubAnalyze} style={{ maxWidth: 520 }}>
                      <Form.Item
                        name="repoUrl"
                        label="Public GitHub Repository URL"
                        rules={[
                          { required: true, message: 'Enter a GitHub repository URL.' },
                          { type: 'url', message: 'Enter a valid URL.' },
                        ]}
                      >
                        <Input
                          size="large"
                          prefix={<GithubOutlined style={{ color: 'var(--color-text-muted)' }} />}
                          placeholder="https://github.com/username/repository"
                          disabled={props.loading}
                        />
                      </Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={props.loading}
                        size="large"
                        className="btn-primary"
                        style={{ width: '100%', height: 42 }}
                      >
                        Analyze Repository
                      </Button>
                    </Form>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Supported frameworks note */}
        <div style={{
          marginTop: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 8,
          fontSize: 12,
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
        }}>
          <span>Supported:</span>
          <span style={{ color: '#818cf8', fontWeight: 600 }}>Python FastAPI</span>
          <span>·</span>
          <span style={{ color: '#34d399', fontWeight: 600 }}>Java Spring Boot</span>
          <span>·</span>
          <span style={{ color: '#60a5fa', fontWeight: 600 }}>Node.js / MERN</span>
        </div>
      </div>
    </AnimatedPage>
  );
}
