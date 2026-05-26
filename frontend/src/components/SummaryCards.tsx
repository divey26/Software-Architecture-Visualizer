import { ApiOutlined, ApartmentOutlined, DatabaseOutlined, DeploymentUnitOutlined } from '@ant-design/icons';
import { Card, Statistic } from 'antd';
import type { Summary } from '../types/analysis';

interface SummaryCardsProps {
  summary: Summary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const items = [
    { label: 'Controllers', value: summary.controllers, icon: <DeploymentUnitOutlined /> },
    { label: 'Services', value: summary.services, icon: <ApartmentOutlined /> },
    { label: 'Repositories', value: summary.repositories, icon: <DatabaseOutlined /> },
    { label: 'APIs', value: summary.apis, icon: <ApiOutlined /> },
    { label: 'Models / DTOs', value: summary.models, icon: <ApartmentOutlined /> },
    { label: 'Dependencies', value: summary.dependencies, icon: <DeploymentUnitOutlined /> },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label}>
          <Statistic title={item.label} value={item.value} prefix={item.icon} />
        </Card>
      ))}
    </div>
  );
}
