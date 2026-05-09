'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';
import { X, Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification { id: string; title: string; body?: string; type: string; read: boolean; created_at: string; }

export function NotificationPanel({ appId, onClose }: { appId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['notifications', appId],
    queryFn: () => notificationsApi.list(appId).then(r => r.data as { notifications: Notification[]; unread: number }),
    refetchInterval: 30000,
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(appId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', appId] }),
  });

  const typeColors: Record<string, string> = { info: 'bg-blue-500', success: 'bg-green-500', error: 'bg-red-500', warning: 'bg-yellow-500' };

  return (
    <aside className="w-72 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-gray-600" />
          <span className="font-semibold text-sm text-gray-800">Notifications</span>
          {(data?.unread || 0) > 0 && (
            <span className="badge badge-blue">{data?.unread}</span>
          )}
        </div>
        <div className="flex gap-1">
          {(data?.unread || 0) > 0 && (
            <button onClick={() => markAllMutation.mutate()} className="p-1 text-gray-400 hover:text-gray-600" title="Mark all read">
              <CheckCheck size={16} />
            </button>
          )}
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!data?.notifications?.length ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
            <Bell size={32} className="mb-3 opacity-30" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          data.notifications.map(notif => (
            <div key={notif.id} className={`px-4 py-3 border-b border-gray-50 ${!notif.read ? 'bg-blue-50/50' : ''}`}>
              <div className="flex items-start gap-2">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${typeColors[notif.type] || 'bg-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notif.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>{notif.title}</p>
                  {notif.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>}
                  <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
