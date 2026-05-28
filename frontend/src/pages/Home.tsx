import { Button, Tag } from 'antd';
import { Link } from 'react-router-dom';
import { AnimatedPage } from '../components/AnimatedPage';
import { GlassCard } from '../components/GlassCard';

export function Home() {
  return (
    <AnimatedPage className="space-y-8 py-6">
      <section className="relative overflow-hidden rounded-lg border border-slate-700 bg-slate-950/60 p-8 shadow-2xl shadow-sky-950/30 lg:p-12">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute bottom-0 right-32 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative max-w-4xl space-y-5">
          <Tag color="cyan" className="border-sky-400/40 bg-sky-400/10 px-3 py-1 text-sky-200">
            Static project intelligence
          </Tag>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-slate-50 lg:text-6xl">
            Visualize backend architecture before it becomes technical debt.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-400">
            Upload a backend project ZIP and generate architecture components, API endpoints, dependency edges, and
            browsable project files without running the uploaded code.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/upload">
              <Button type="primary" size="large" className="bg-sky-400 font-semibold text-slate-950">
                Analyze Project
              </Button>
            </Link>
            <Link to="/architecture">
              <Button size="large" className="border-slate-600 bg-slate-900/70 text-slate-100">
                View Graph
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          ['Framework aware', 'Detect FastAPI, Spring Boot, and MERN stack structure from static source signals.'],
          ['Quality signals', 'Surface layering smells, circular dependencies, and missing service boundaries.'],
          ['Exportable diagrams', 'Download architecture diagrams and generated reports for reviews.'],
        ].map(([title, description]) => (
          <GlassCard key={title} className="p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-violet-300">{title}</p>
            <p className="mt-3 leading-7 text-slate-400">{description}</p>
          </GlassCard>
        ))}
      </div>
    </AnimatedPage>
  );
}
