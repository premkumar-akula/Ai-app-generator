'use client';
import { useQuery } from '@tanstack/react-query';
import { dataApi } from '@/lib/api';
import { ComponentConfig } from '@/types/config';
import { Loader2, TrendingUp, Users, Calendar, DollarSign, BarChart2, Star, LucideIcon } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ICONS: Record<string, any> = {
  Users, TrendingUp, Calendar, DollarSign, BarChart2, Star,
};

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  green: 'bg-green-50 border-green-200 text-green-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
};

export function DynamicStats({ appId, component, t }: { appId: string; component: ComponentConfig; t: (k: string) => string }) {
  const entity = component.entity || '';
  const { data, isLoading } = useQuery({
    queryKey: ['stats', appId, entity],
    queryFn: () => dataApi.stats(appId, entity).then(r => r.data as Record<string, number>),
    enabled: !!entity,
    refetchInterval: 30000,
  });

  if (!component.stats?.length) return null;

  return (
    <div className={`grid gap-4 ${component.stats.length === 1 ? 'grid-cols-1' : component.stats.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
      {component.stats.map((stat, i) => {
        const Icon = stat.icon ? (ICONS[stat.icon] || TrendingUp) : TrendingUp;
        const colorClass = COLOR_MAP[stat.color || 'blue'] || COLOR_MAP.blue;
        const value = data?.[stat.key];

        return (
          <div key={i} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                {isLoading ? (
                  <div className="skeleton h-8 w-16 mt-2 rounded" />
                ) : (
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stat.format === 'currency' ? `$${Number(value || 0).toLocaleString()}` :
                     stat.format === 'percent' ? `${value || 0}%` :
                     (value || 0).toLocaleString()}
                  </p>
                )}
              </div>
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${colorClass}`}>
                <Icon size={22} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DynamicChart({ appId, component }: { appId: string; component: ComponentConfig }) {
  const entity = component.entity || '';
  const chartConfig = component.chart;

  const { data, isLoading } = useQuery({
    queryKey: ['data', appId, entity, 'chart'],
    queryFn: () => dataApi.list(appId, entity, { pageSize: 100 }).then(r => r.data.rows),
    enabled: !!entity,
  });

  if (!chartConfig) return null;

  if (isLoading) return (
    <div className="card p-6">
      <div className="flex items-center justify-center h-48">
        <Loader2 className="animate-spin text-indigo-500" size={24} />
      </div>
    </div>
  );

  const chartData = data || [];
  const type = chartConfig.type || 'bar';

  return (
    <div className="card p-6">
      {component.title && <h3 className="font-semibold text-gray-800 mb-4">{component.title}</h3>}
      <ResponsiveContainer width="100%" height={280}>
        {type === 'bar' ? (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={chartConfig.xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey={chartConfig.yKey || 'value'} fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : type === 'line' ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={chartConfig.xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey={chartConfig.yKey || 'value'} stroke="#6366f1" strokeWidth={2} dot={false} />
          </LineChart>
        ) : type === 'pie' || type === 'donut' ? (
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={type === 'donut' ? 60 : 0}
              outerRadius={100} dataKey={chartConfig.yKey || 'value'} nameKey={chartConfig.xKey}>
              {chartData.map((_: unknown, index: number) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        ) : (
          <BarChart data={chartData}>
            <Bar dataKey={chartConfig.yKey || 'value'} fill="#6366f1" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}