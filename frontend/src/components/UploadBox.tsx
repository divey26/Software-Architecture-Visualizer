import { InboxOutlined } from '@ant-design/icons';
import { Button, Upload, type UploadProps } from 'antd';
import type { ProjectAnalysis } from '../types/analysis';
import { getApiErrorMessage, uploadProjectZip } from '../api/projectApi';

interface UploadBoxProps {
  loading: boolean;
  error?: string;
  onLoadingChange: (loading: boolean) => void;
  onAnalysis: (analysis: ProjectAnalysis) => void;
  onError: (message: string) => void;
}

export function UploadBox({ loading, onLoadingChange, onAnalysis, onError }: UploadBoxProps) {
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
        onError(getApiErrorMessage(err));
      } finally {
        onLoadingChange(false);
      }
      return false;
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Upload.Dragger {...props} disabled={loading}>
        <div style={{ padding: '24px 16px' }}>
          <p className="ant-upload-drag-icon" style={{ marginBottom: 14 }}>
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Drop your backend project ZIP here</p>
          <p className="ant-upload-hint" style={{ marginBottom: 18 }}>
            Drag and drop a .zip file, or click to browse from your machine.
          </p>
          <Button
            type="primary"
            loading={loading}
            className="btn-primary"
            style={{ height: 38, paddingInline: 22, fontWeight: 600, fontSize: 13 }}
          >
            {loading ? 'Analyzing…' : 'Select ZIP File'}
          </Button>
        </div>
      </Upload.Dragger>
    </div>
  );
}
