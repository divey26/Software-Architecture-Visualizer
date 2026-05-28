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
    <div className="space-y-4">
      <Upload.Dragger {...props} disabled={loading} className="bg-white">
        <p className="ant-upload-drag-icon">
          <InboxOutlined className="text-sky-300" />
        </p>
        <p className="ant-upload-text text-slate-100">Drop a backend project ZIP here</p>
        <p className="ant-upload-hint">Supports Python FastAPI and Java Spring Boot projects.</p>
        <Button type="primary" loading={loading} className="bg-sky-400 font-semibold text-slate-950">
          Select ZIP
        </Button>
      </Upload.Dragger>
    </div>
  );
}
