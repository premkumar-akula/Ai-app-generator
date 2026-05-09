'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appsApi } from '@/lib/api';
import Link from 'next/link';
import { Plus, ExternalLink, Trash2, Settings, Loader2, Layout, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface App { id: string; name: string; description: string; slug: string; updated_at: string; config: { entities?: unknown[]; pages?: unknown[] }; }

export default function DashboardPage() {
  const qc = useQueryClient();
  const { data: apps, isLoading } = useQuery({ queryKey: ['apps'], queryFn: () => appsApi.list().then(r => r.data as App[]) });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => appsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['apps'] }); toast.success('App deleted'); },
    onError: () => toast.error('Failed to delete app'),
  });

  const handleDelete = (app: App) => {
    if (confirm(`Delete "${app.name}"? This cannot be undone.`)) deleteMutation.mutate(app.id);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Apps</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage your generated applications</p>
        </div>
        <Link href="/dashboard/new" className="btn-primary">
          <Plus size={18} /> New App
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : !apps?.length ? (
        <div className="text-center py-20 card">
          <Layout size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No apps yet</h3>
          <p className="text-gray-400 text-sm mb-6">Create your first app by uploading a JSON config</p>
          <Link href="/dashboard/new" className="btn-primary mx-auto">
            <Plus size={16} /> Create your first app
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map(app => (
            <div key={app.id} className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Layout size={20} className="text-indigo-600" />
                </div>
                <div className="flex gap-1">
                  <Link href={`/dashboard/apps/${app.id}/settings`} className="btn-ghost p-1.5 rounded-lg">
                    <Settings size={16} />
                  </Link>
                  <button onClick={() => handleDelete(app)} className="btn-ghost p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{app.name}</h3>
              {app.description && <p className="text-sm text-gray-500 mb-4 line-clamp-2">{app.description}</p>}
              <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                <span>{app.config?.entities?.length || 0} entities</span>
                <span>{app.config?.pages?.length || 0} pages</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={12} /> {formatDistanceToNow(new Date(app.updated_at), { addSuffix: true })}
                </span>
                <Link href={`/dashboard/apps/${app.id}`} className="btn-secondary text-xs px-3 py-1.5">
                  Open <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
