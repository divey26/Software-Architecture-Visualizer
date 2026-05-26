import { InboxOutlined } from '@ant-design/icons';
import { Alert, Button, Upload, type UploadProps } from 'antd';
import type { ProjectAnalysis } from '../types/analysis';
import { uploadProjectZip } from '../api/projectApi';

interface UploadBoxProps {
  loading: boolean;
  error?: string;
  onLoadingChange: (loading: boolean) => void;
  onAnalysis: (analysis: ProjectAnalysis) => void;
  onError: (message: string) => void;
}

export function UploadBox({ loading, error, onLoadingChange, onAnalysis, onError }: UploadBoxProps) {
  const props: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.zip',
    showUploadList: true,
    beforeUpload: async (file) => {
      if (!file.name.toLowerCase().endsWith('.zip')) {
        onError('Please upload a .zip file.');
        return Upload.LIST_IGNORE;
      }
      onLoadingChange(true);
      try {
        const analysis = await uploadProjectZip(file);
        onAnalysis(analysis);
      } catch (err) {
        const message =
          typeof err === 'object' && err && 'message' in err
            ? String((err as Error).message)
            : 'Upload failed.';
        onError(message);
      } finally {
        onLoadingChange(false);
      }
      return false;
    },
  };

  return (
    <div className="space-y-4">
      {error ? <Alert type="error" showIcon message={error} /> : null}
      <Upload.Dragger {...props} disabled={loading} className="bg-white">
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Drop a backend project ZIP here</p>
        <p className="ant-upload-hint">Supports Python FastAPI and Java Spring Boot projects for the MVP.</p>
        <Button type="primary" loading={loading}>
          Select ZIP
        </Button>
      </Upload.Dragger>
    </div>
  );
}
