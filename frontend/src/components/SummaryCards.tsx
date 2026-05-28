import { ApiOutlined, ApartmentOutlined, DatabaseOutlined, DeploymentUnitOutlined, WarningOutlined } from '@ant-design/icons';
import { Statistic } from 'antd';
import { GlassCard } from './GlassCard';
import type { Summary } from '../types/analysis';

interface SummaryCardsProps {
  summary: Summary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const items = [
    { label: 'Controllers', value: summary.controllers, icon: <DeploymentUnitOutlined />, color: 'text-sky-300' },
    { label: 'Services', value: summary.services, icon: <ApartmentOutlined />, color: 'text-emerald-300' },
    { label: 'Repositories', value: summary.repositories, icon: <DatabaseOutlined />, color: 'text-violet-300' },
    { label: 'APIs', value: summary.apis, icon: <ApiOutlined />, color: 'text-cyan-300' },
    { label: 'Models / DTOs', value: summary.models, icon: <ApartmentOutlined />, color: 'text-orange-300' },
    { label: 'Graph Dependencies', value: summary.dependencies, icon: <DeploymentUnitOutlined />, color: 'text-slate-300' },
    { label: 'Package Dependencies', value: summary.packageDependencies ?? 0, icon: <DatabaseOutlined />, color: 'text-purple-300' },
    { label: 'Architecture Smells', value: summary.smells ?? 0, icon: <WarningOutlined />, color: 'text-amber-300' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <GlassCard key={item.label} className="p-5">
          <div className={`mb-3 text-2xl ${item.color}`}>{item.icon}</div>
          <Statistic title={item.label} value={item.value} />
        </GlassCard>
      ))}
    </div>
  );
}
