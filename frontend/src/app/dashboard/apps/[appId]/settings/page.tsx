'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appsApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2, Save, ArrowLeft, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AppSettingsPage() {
  const params = useParams();
  const appId = params.appId as string;
  const router = useRouter();
  const qc = useQueryClient();
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');

  const { data: app, isLoading } = useQuery({
    queryKey: ['app', appId],
    queryFn: () => appsApi.get(appId).then(r => r.data),
  });

  useEffect(() => {
    if (app?.config) setJsonText(JSON.stringify(app.config, null, 2));
  }, [app]);

  const updateMutation = useMutation({
    mutationFn: (config: unknown) => appsApi.update(appId, config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app', appId] });
      toast.success('App updated');
      router.push(`/dashboard/apps/${appId}`);
    },
    onError: () => toast.error('Update failed'),
  });

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonError('');
      updateMutation.mutate(parsed);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={24} /></div>;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/dashboard/apps/${appId}`} className="btn-ghost p-2"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Config — {app?.name}</h1>
          <p className="text-gray-500 text-sm mt-0.5">Modify the JSON config and redeploy</p>
        </div>
      </div>

      <div className="card overflow-hidden mb-4">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">JSON Configuration</span>
          <span className="text-xs text-gray-400">All changes will re-provision the database schema</span>
        </div>
        <textarea value={jsonText} onChange={e => { setJsonText(e.target.value); setJsonError(''); }}
          className="json-editor w-full h-[500px] rounded-none border-0 outline-none resize-none" spellCheck={false} />
        {jsonError && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-600 text-xs font-mono flex items-center gap-2">
            <AlertCircle size={12} /> {jsonError}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link href={`/dashboard/apps/${appId}`} className="btn-secondary">Cancel</Link>
        <button onClick={handleSave} disabled={updateMutation.isPending || !!jsonError} className="btn-primary">
          {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save & Redeploy
        </button>
      </div>
    </div>
  );
}
