'use client';
import { useQuery } from '@tanstack/react-query';
import { appsApi } from '@/lib/api';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertCircle, Layout, ChevronRight, Bell } from 'lucide-react';
import { AppRuntime } from '@/components/runtime/AppRuntime';
import { NotificationPanel } from '@/components/runtime/NotificationPanel';

interface App {
  id: string;
  name: string;
  config: {
    pages?: Array<{ id: string; title: string; icon?: string; hidden?: boolean; path: string }>;
    theme?: { primaryColor?: string; mode?: string; appName?: string };
    i18n?: { defaultLocale?: string; supportedLocales?: string[] };
  };
}

export default function AppPage() {
  const params = useParams();
  const appId = params.appId as string;
  const [activePage, setActivePage] = useState<string | null>(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [locale, setLocale] = useState('en');

  const { data: app, isLoading, error } = useQuery({
    queryKey: ['app', appId],
    queryFn: () => appsApi.get(appId).then(r => r.data as App),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-full py-20">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  if (error || !app) return (
    <div className="flex items-center justify-center h-full py-20">
      <div className="text-center">
        <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">Failed to load app</h2>
        <p className="text-gray-500 text-sm mt-1">Check that the app exists and you have access.</p>
      </div>
    </div>
  );

  const visiblePages = (app.config.pages || []).filter(p => !p.hidden);
  const currentPageId = activePage || visiblePages[0]?.id;
  const currentPage = visiblePages.find(p => p.id === currentPageId) || visiblePages[0];
  const primaryColor = app.config.theme?.primaryColor || '#6366f1';
  const supportedLocales = app.config.i18n?.supportedLocales || ['en'];

  return (
    <div className="flex h-screen flex-col" style={{ '--app-primary': primaryColor } as React.CSSProperties}>
      {/* App Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: primaryColor }}>
            <Layout size={14} className="text-white" />
          </div>
          <span className="font-semibold text-gray-900 text-sm">{app.config.theme?.appName || app.name}</span>
        </div>
        <div className="flex items-center gap-3">
          {supportedLocales.length > 1 && (
            <select value={locale} onChange={e => setLocale(e.target.value)}
              className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600">
              {supportedLocales.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
          )}
          <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <Bell size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* App Sidebar */}
        {visiblePages.length > 1 && (
          <aside className="w-52 bg-white border-r border-gray-200 py-4 px-3 space-y-1 overflow-y-auto shrink-0">
            {visiblePages.map(page => (
              <button key={page.id} onClick={() => setActivePage(page.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPageId === page.id
                    ? 'text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
                style={currentPageId === page.id ? { background: primaryColor } : {}}>
                <span>{page.title}</span>
                <ChevronRight size={14} className="opacity-50" />
              </button>
            ))}
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {currentPage ? (
            <AppRuntime appId={appId} page={currentPage} config={app.config} locale={locale} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">No pages configured</p>
            </div>
          )}
        </main>

        {/* Notification Panel */}
        {showNotifs && (
          <NotificationPanel appId={appId} onClose={() => setShowNotifs(false)} />
        )}
      </div>
    </div>
  );
}
