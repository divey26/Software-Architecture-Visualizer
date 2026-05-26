import { useState } from 'react';
import { Layout, Menu, Button } from 'antd';
import { Link, Navigate, Route, BrowserRouter as Router, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ApartmentOutlined, ApiOutlined, DashboardOutlined, FileTextOutlined, HomeOutlined, UploadOutlined } from '@ant-design/icons';
import { Home } from './pages/Home';
import { UploadPage } from './pages/Upload';
import { Dashboard } from './pages/Dashboard';
import { Architecture } from './pages/Architecture';
import { Endpoints } from './pages/Endpoints';
import { Files } from './pages/Files';
import type { ProjectAnalysis } from './types/analysis';
import { sampleAnalysis } from './sampleData';

const { Header, Content } = Layout;

function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<ProjectAnalysis | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleAnalysis = (result: ProjectAnalysis) => {
    setAnalysis(result);
    setError(undefined);
    navigate('/dashboard');
  };

  return (
    <Layout className="min-h-screen">
      <Header className="flex h-auto flex-col gap-3 bg-white px-4 py-3 shadow-sm lg:h-16 lg:flex-row lg:items-center lg:px-6">
        <Link to="/" className="text-lg font-semibold text-slate-950">
          Architecture Visualizer
        </Link>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          className="min-w-0 flex-1 border-0"
          items={[
            { key: '/', icon: <HomeOutlined />, label: <Link to="/">Home</Link> },
            { key: '/upload', icon: <UploadOutlined />, label: <Link to="/upload">Upload</Link> },
            { key: '/dashboard', icon: <DashboardOutlined />, label: <Link to="/dashboard">Dashboard</Link> },
            { key: '/architecture', icon: <ApartmentOutlined />, label: <Link to="/architecture">Architecture</Link> },
            { key: '/endpoints', icon: <ApiOutlined />, label: <Link to="/endpoints">Endpoints</Link> },
            { key: '/files', icon: <FileTextOutlined />, label: <Link to="/files">Files</Link> },
          ]}
        />
        <Button onClick={() => setAnalysis(sampleAnalysis)}>Load Sample</Button>
      </Header>
      <Content className="px-4 lg:px-8">
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
            <Route path="/files" element={<Files analysis={analysis} />} />
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
