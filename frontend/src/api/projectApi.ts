import axios from 'axios';
import type { ProjectAnalysis } from '../types/analysis';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
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

export async function getHealth() {
  const response = await api.get('/api/health');
  return response.data;
}

export async function getSupportedFrameworks() {
  const response = await api.get('/api/supported-frameworks');
  return response.data;
}
