import { Button } from 'antd';
import { Link } from 'react-router-dom';
import { AnimatedPage } from '../components/AnimatedPage';
import {
  ApartmentOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  ExportOutlined,
  ArrowRightOutlined,
  CodeOutlined,
} from '@ant-design/icons';

const features = [
  {
    icon: <ThunderboltOutlined />,
    color: '#818cf8',
    bg: 'rgba(99,102,241,0.12)',
    title: 'Framework Aware',
    description:
      'Detects FastAPI, Spring Boot, and MERN stack structure from static source signals without executing code.',
  },
  {
    icon: <SafetyOutlined />,
    color: '#34d399',
    bg: 'rgba(16,185,129,0.1)',
    title: 'Quality Signals',
    description:
      'Surface layering smells, circular dependencies, and missing service boundaries automatically.',
  },
  {
    icon: <ExportOutlined />,
    color: '#c084fc',
    bg: 'rgba(192,132,252,0.1)',
    title: 'Exportable Diagrams',
    description:
      'Download architecture diagrams and generated AI reports for documentation reviews.',
  },
];

const steps = [
  { num: '01', label: 'Upload ZIP or paste a GitHub URL' },
  { num: '02', label: 'Static analysis runs in seconds' },
  { num: '03', label: 'Explore components, APIs, dependencies' },
];

export function Home() {
  return (
    <AnimatedPage className="py-6 space-y-8">
      {/* Hero */}
      <section style={{
        position: 'relative',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 20,
        padding: '52px 48px',
        overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 340, height: 340, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: '30%',
          width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(192,132,252,0.12), transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Top line accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.7), transparent)',
        }} />

        <div style={{ position: 'relative', maxWidth: 680 }}>
          <div className="badge badge-accent" style={{ marginBottom: 20 }}>
            Static project intelligence
          </div>

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 800,
            lineHeight: 1.1,
            color: 'var(--color-text-primary)',
            marginBottom: 20,
          }}>
            Visualize backend{' '}
            <span className="text-gradient">architecture</span>
            {' '}before it becomes technical debt.
          </h1>

          <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--color-text-secondary)', marginBottom: 32, maxWidth: 560 }}>
            Upload a backend project ZIP and generate architecture components, API endpoints, dependency
            edges, and browsable project files — without running the uploaded code.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/upload">
              <Button
                type="primary"
                size="large"
                className="btn-primary"
                icon={<ApartmentOutlined />}
                style={{ height: 44, paddingInline: 24, fontSize: 14 }}
              >
                Analyze Project
              </Button>
            </Link>
            <Link to="/architecture">
              <Button
                size="large"
                className="btn-ghost"
                icon={<ArrowRightOutlined />}
                style={{ height: 44, paddingInline: 22, fontSize: 14 }}
              >
                View Demo Graph
              </Button>
            </Link>
          </div>

          {/* Steps */}
          <div style={{ marginTop: 40, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {steps.map((step) => (
              <div key={step.num} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#818cf8',
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  borderRadius: 6,
                  padding: '2px 8px',
                }}>
                  {step.num}
                </span>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {features.map((feat) => (
          <div key={feat.title} className="glass-card" style={{ padding: 24 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: feat.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, color: feat.color,
              marginBottom: 16,
            }}>
              {feat.icon}
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, marginBottom: 8, color: 'var(--color-text-primary)' }}>
              {feat.title}
            </h3>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--color-text-secondary)', margin: 0 }}>
              {feat.description}
            </p>
          </div>
        ))}
      </div>

      {/* CTA banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
        border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: 14,
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)', marginBottom: 4 }}>
            Ready to explore your architecture?
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Upload any Python or Java backend project ZIP and get instant insights.
          </div>
        </div>
        <Link to="/upload">
          <Button className="btn-primary" icon={<CodeOutlined />} style={{ fontWeight: 600 }}>
            Get Started Free
          </Button>
        </Link>
      </div>
    </AnimatedPage>
  );
}
