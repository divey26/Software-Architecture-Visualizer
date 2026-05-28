import { useEffect, useMemo, useState } from 'react';
import { Layout, Menu, Button, Drawer, Segmented, Tooltip } from 'antd';
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
  MoonOutlined,
  SunOutlined,
  CodeOutlined,
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

const navGroups = [
  {
    label: 'Overview',
    items: [
      { key: '/', icon: <HomeOutlined />, label: 'Home' },
      { key: '/upload', icon: <UploadOutlined />, label: 'Upload' },
      { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { key: '/architecture', icon: <ApartmentOutlined />, label: 'Architecture' },
      { key: '/endpoints', icon: <ApiOutlined />, label: 'Endpoints' },
      { key: '/access-control', icon: <LockOutlined />, label: 'Access Control' },
      { key: '/files', icon: <FileTextOutlined />, label: 'Files' },
      { key: '/dependencies', icon: <DatabaseOutlined />, label: 'Dependencies' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { key: '/quality', icon: <WarningOutlined />, label: 'Quality' },
      { key: '/report', icon: <CodeOutlined />, label: 'Report' },
      { key: '/history', icon: <HistoryOutlined />, label: 'History' },
    ],
  },
];

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
    () =>
      navGroups.flatMap((group) =>
        group.items.map((item) => ({
          key: item.key,
          icon: item.icon,
          label: <Link to={item.key}>{item.label}</Link>,
        })),
      ),
    [],
  );

  const sidebar = (
    <div className="sidebar-root">
      {/* Logo */}
      <Link to="/" className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <ApartmentOutlined style={{ color: '#fff', fontSize: 16 }} />
        </div>
        <div className="sidebar-logo-text">
          <div className="brand">ArchViz</div>
          <div className="title">Architecture Visualizer</div>
        </div>
      </Link>

      {/* Navigation grouped */}
      <nav style={{ flex: 1 }}>
        {navGroups.map((group) => (
          <div key={group.label} style={{ marginBottom: 8 }}>
            <div className="sidebar-section-label">{group.label}</div>
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={group.items.map((item) => ({
                key: item.key,
                icon: item.icon,
                label: <Link to={item.key} onClick={() => setMobileNavOpen(false)}>{item.label}</Link>,
              }))}
              className="sidebar-menu"
            />
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Theme toggle */}
        <div style={{ marginBottom: 14 }}>
          <Segmented
            block
            size="small"
            value={themeMode}
            onChange={(value) => setThemeMode(value as ThemeMode)}
            options={[
              { label: <span><SunOutlined /> Light</span>, value: 'light' },
              { label: <span><MoonOutlined /> Dark</span>, value: 'dark' },
            ]}
          />
        </div>

        {/* Current project */}
        <div className="sidebar-project-card">
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
            Active Project
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {analysis?.projectName ?? 'No project loaded'}
          </div>
          <Button
            block
            size="small"
            className="btn-ghost"
            onClick={() => handleAnalysis(sampleAnalysis)}
            style={{ fontSize: 12, fontWeight: 600 }}
          >
            Load Sample Project
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Layout className="min-h-screen" style={{ background: 'transparent' }}>
      <Sider
        width={256}
        style={{ background: 'transparent', position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}
        className="hidden lg:block"
      >
        {sidebar}
      </Sider>

      <Drawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        placement="left"
        width={260}
        bodyStyle={{ padding: 0, background: 'var(--color-surface)' }}
        headerStyle={{ display: 'none' }}
      >
        {sidebar}
      </Drawer>

      <Content className="theme-surface min-w-0 px-4 pb-10 pt-5 lg:px-8">
        {/* Mobile top bar */}
        <div className="mb-5 flex items-center justify-between lg:hidden">
          <Button
            icon={<MenuOutlined />}
            onClick={() => setMobileNavOpen(true)}
            className="btn-ghost"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="sidebar-logo-icon" style={{ width: 28, height: 28 }}>
              <ApartmentOutlined style={{ color: '#fff', fontSize: 13 }} />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)' }}>
              ArchViz
            </span>
          </div>
          <Tooltip title={themeMode === 'dark' ? 'Light mode' : 'Dark mode'}>
            <Button
              className="btn-ghost"
              icon={themeMode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
            />
          </Tooltip>
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
