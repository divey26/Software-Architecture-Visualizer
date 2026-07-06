import axios from 'axios';
import type { ProjectAnalysis } from '../types/analysis';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 60000,
});

export async function uploadProjectZip(file: File): Promise<ProjectAnalysis> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<ProjectAnalysis>('/api/projects/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function analyzeGithubRepository(repoUrl: string): Promise<ProjectAnalysis> {
  const response = await api.post<ProjectAnalysis>('/api/projects/analyze-github', { repoUrl });
  return response.data;
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (typeof item === 'string') {
            return item;
          }
          if (item && typeof item === 'object' && 'msg' in item) {
            return String(item.msg);
          }
          return JSON.stringify(item);
        })
        .join(', ');
    }
    if (error.response?.statusText) {
      return `${error.response.status}: ${error.response.statusText}`;
    }
    return error.message;
  }
  return error instanceof Error ? error.message : 'Upload failed.';
}

export async function getHealth() {
  const response = await api.get('/api/health');
  return response.data;
}

export async function getSupportedFrameworks() {
  const response = await api.get('/api/supported-frameworks');
  return response.data;
}
