import type { ProjectAnalysis, ProjectHistoryItem } from '../types/analysis';

const HISTORY_KEY = 'architecture-visualizer-history';

export function loadHistory(): ProjectHistoryItem[] {
  try {
    const value = window.localStorage.getItem(HISTORY_KEY);
    return value ? (JSON.parse(value) as ProjectHistoryItem[]) : [];
  } catch {
    return [];
  }
}

export function saveAnalysisToHistory(analysis: ProjectAnalysis): ProjectHistoryItem[] {
  const item: ProjectHistoryItem = {
    id: `${Date.now()}-${analysis.projectName}`,
    projectName: analysis.projectName,
    analyzedAt: new Date().toISOString(),
    summary: analysis.summary,
    endpointCount: analysis.endpoints.length,
    smellCount: analysis.architectureSmells?.length ?? analysis.summary.smells ?? 0,
    analysis,
  };
  const next = [item, ...loadHistory().filter((existing) => existing.projectName !== analysis.projectName)].slice(0, 20);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function deleteHistoryItem(id: string): ProjectHistoryItem[] {
  const next = loadHistory().filter((item) => item.id !== id);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function clearHistory(): void {
  window.localStorage.removeItem(HISTORY_KEY);
}
