import { Button, Card } from 'antd';
import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 py-8">
      <section className="rounded-lg bg-white p-8 shadow-sm">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Static project analysis</p>
          <h1 className="text-4xl font-semibold text-slate-950">Software Architecture Visualizer</h1>
          <p className="text-lg text-slate-600">
            Upload a backend project ZIP and generate architecture components, API endpoints, dependency edges, and
            browsable project files without running the uploaded code.
          </p>
          <Link to="/upload">
            <Button type="primary" size="large">
              Upload Project
            </Button>
          </Link>
        </div>
      </section>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {['FastAPI routers', 'Spring controllers', 'Interactive graph'].map((title) => (
          <Card key={title} title={title}>
            <p className="text-slate-600">
              Detect framework structure, endpoints, and simple relationships from source files and annotations.
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
