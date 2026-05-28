import { useEffect, useMemo, useState } from 'react';
import { Layout, Menu, Button, Drawer, Segmented } from 'antd';
import { Link, Navigate, Route, BrowserRouter as Router, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  ApartmentOutlined,
  ApiOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  HistoryOutlined,
  HomeOutlined,
  LockOutlined,
  UploadOutlined,
  WarningOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { Home } from './pages/Home';
import { UploadPage } from './pages/Upload';
import { Dashboard } from './pages/Dashboard';
import { Architecture } from './pages/Architecture';
import { Endpoints } from './pages/Endpoints';
import { Files } from './pages/Files';
import { Dependencies } from './pages/Dependencies';
import { QualityReport } from './pages/QualityReport';
import { Report } from './pages/Report';
import { History } from './pages/History';
import { AccessControl } from './pages/AccessControl';
import type { ProjectAnalysis, ProjectHistoryItem } from './types/analysis';
import { sampleAnalysis } from './sampleData';
import { loadHistory, saveAnalysisToHistory } from './utils/history';

const { Sider, Content } = Layout;
type ThemeMode = 'light' | 'dark';

function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<ProjectAnalysis | undefined>();
  const [historyItems, setHistoryItems] = useState<ProjectHistoryItem[]>(() => loadHistory());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = window.localStorage.getItem('architecture-visualizer-theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.remove('theme-dark', 'theme-light');
    document.documentElement.classList.add(`theme-${themeMode}`);
    window.localStorage.setItem('architecture-visualizer-theme', themeMode);
  }, [themeMode]);

  const handleAnalysis = (result: ProjectAnalysis) => {
    setAnalysis(result);
    setHistoryItems(saveAnalysisToHistory(result));
    setError(undefined);
    navigate('/dashboard');
  };

  const openHistoryAnalysis = (result: ProjectAnalysis) => {
    setAnalysis(result);
    setError(undefined);
    navigate('/dashboard');
  };

  const navItems = useMemo(
    () => [
      { key: '/', icon: <HomeOutlined />, label: <Link to="/">Home</Link> },
      { key: '/upload', icon: <UploadOutlined />, label: <Link to="/upload">Upload</Link> },
      { key: '/dashboard', icon: <DashboardOutlined />, label: <Link to="/dashboard">Dashboard</Link> },
      { key: '/architecture', icon: <ApartmentOutlined />, label: <Link to="/architecture">Architecture</Link> },
      { key: '/endpoints', icon: <ApiOutlined />, label: <Link to="/endpoints">Endpoints</Link> },
      { key: '/access-control', icon: <LockOutlined />, label: <Link to="/access-control">Access Control</Link> },
      { key: '/files', icon: <FileTextOutlined />, label: <Link to="/files">Files</Link> },
      { key: '/dependencies', icon: <DatabaseOutlined />, label: <Link to="/dependencies">Dependencies</Link> },
      { key: '/quality', icon: <WarningOutlined />, label: <Link to="/quality">Quality</Link> },
      { key: '/report', icon: <FileTextOutlined />, label: <Link to="/report">Report</Link> },
      { key: '/history', icon: <HistoryOutlined />, label: <Link to="/history">History</Link> },
    ],
    [],
  );

  const sidebar = (
    <div className="flex h-full flex-col border-r border-slate-700/70 bg-slate-950/70 p-4 backdrop-blur-xl">
      <Link to="/" className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-400/15 text-sky-300 shadow-[0_0_32px_rgba(56,189,248,0.24)]">
          <ApartmentOutlined />
        </div>
        <div>
          <p className="m-0 text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">SAV</p>
          <h1 className="m-0 text-base font-semibold text-slate-50">Architecture Visualizer</h1>
        </div>
      </Link>
      <Menu
        mode="inline"
        theme="dark"
        selectedKeys={[location.pathname]}
        items={navItems}
        className="border-0"
        onClick={() => setMobileNavOpen(false)}
      />
      <div className="mt-auto rounded-lg border border-slate-700 bg-slate-900/70 p-3">
        <div className="mb-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Theme</p>
          <Segmented
            block
            size="small"
            value={themeMode}
            onChange={(value) => setThemeMode(value as ThemeMode)}
            options={[
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
            ]}
          />
        </div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Current Project</p>
        <p className="truncate text-sm font-semibold text-slate-100">{analysis?.projectName ?? 'No analysis loaded'}</p>
        <Button block className="mt-3 border-sky-400/50 bg-sky-400/10 text-sky-200" onClick={() => handleAnalysis(sampleAnalysis)}>
          Load Sample
        </Button>
      </div>
    </div>
  );

  return (
    <Layout className="min-h-screen bg-transparent">
      <Sider width={284} className="sticky top-0 hidden h-screen overflow-auto bg-transparent lg:block">
        {sidebar}
      </Sider>
      <Drawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        placement="left"
        width={300}
        bodyStyle={{ padding: 0, background: '#0f172a' }}
        headerStyle={{ display: 'none' }}
      >
        {sidebar}
      </Drawer>
      <Content className="theme-surface min-w-0 px-4 pb-8 pt-4 lg:px-8">
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <Button icon={<MenuOutlined />} onClick={() => setMobileNavOpen(true)} />
          <span className="font-semibold text-slate-100">Architecture Visualizer</span>
        </div>
        <div className="mx-auto max-w-7xl">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/upload"
              element={
                <UploadPage
                  analysis={analysis}
                  loading={loading}
                  error={error}
                  onLoadingChange={setLoading}
                  onAnalysis={handleAnalysis}
                  onError={setError}
                />
              }
            />
            <Route path="/dashboard" element={<Dashboard analysis={analysis} />} />
            <Route path="/architecture" element={<Architecture analysis={analysis} />} />
            <Route path="/endpoints" element={<Endpoints analysis={analysis} />} />
            <Route path="/access-control" element={<AccessControl analysis={analysis} />} />
            <Route path="/files" element={<Files analysis={analysis} />} />
            <Route path="/dependencies" element={<Dependencies analysis={analysis} />} />
            <Route path="/quality" element={<QualityReport analysis={analysis} />} />
            <Route path="/report" element={<Report analysis={analysis} />} />
            <Route
              path="/history"
              element={
                <History
                  items={historyItems}
                  onItemsChange={setHistoryItems}
                  onOpenAnalysis={openHistoryAnalysis}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Content>
    </Layout>
  );
}

export default function App() {
  return (
    <Router>
      <Shell />
    </Router>
  );
}
