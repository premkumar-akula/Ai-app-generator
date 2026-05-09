'use client';
import { ComponentConfig, PageConfig } from '@/types/config';
import { DynamicTable } from './DynamicTable';
import { DynamicForm } from './DynamicForm';
import { DynamicStats } from './DynamicStats';
import { DynamicChart } from './DynamicChart';
import { AlertCircle } from 'lucide-react';

interface AppRuntimeProps {
  appId: string;
  page: PageConfig;
  config: {
    pages?: PageConfig[];
    theme?: { primaryColor?: string };
    i18n?: { translations?: Record<string, Record<string, string>> };
  };
  locale?: string;
}

function translate(key: string, translations: Record<string, Record<string, string>>, locale: string): string {
  return translations?.[locale]?.[key] || translations?.['en']?.[key] || key;
}

function ComponentRenderer({ component, appId, translations, locale }: {
  component: ComponentConfig;
  appId: string;
  translations?: Record<string, Record<string, string>>;
  locale?: string;
}) {
  const t = (key: string) => translate(key, translations || {}, locale || 'en');

  try {
    switch (component.type) {
      case 'table':
        return <DynamicTable appId={appId} component={component} t={t} />;
      case 'form':
        return <DynamicForm appId={appId} component={component} t={t} />;
      case 'stats':
        return <DynamicStats appId={appId} component={component} t={t} />;
      case 'chart':
        return <DynamicChart appId={appId} component={component} />;
      case 'dashboard':
        return (
          <div className="space-y-6">
            {component.fields?.map((_, i) => (
              <div key={i} className="card p-6">
                <p className="text-gray-400 text-sm">Dashboard widget {i + 1}</p>
              </div>
            ))}
          </div>
        );
      case 'card':
        return (
          <div className="card p-6">
            {component.title && <h3 className="font-semibold text-gray-800 mb-4">{component.title}</h3>}
            <DynamicTable appId={appId} component={{ ...component, type: 'table' }} t={t} />
          </div>
        );
      default:
        return (
          <div className="card p-6 border-dashed border-yellow-300 bg-yellow-50">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertCircle size={16} />
              <p className="text-sm">Unknown component type: <code className="font-mono bg-yellow-100 px-1 rounded">{component.type}</code></p>
            </div>
            <p className="text-xs text-yellow-600 mt-1">This component type is not yet supported, but it won't break the app.</p>
          </div>
        );
    }
  } catch (err) {
    return (
      <div className="card p-6 border-dashed border-red-300 bg-red-50">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          <p className="text-sm font-medium">Component Error</p>
        </div>
        <p className="text-xs text-red-600 mt-1">{(err as Error).message}</p>
      </div>
    );
  }
}

export function AppRuntime({ appId, page, config, locale = 'en' }: AppRuntimeProps) {
  const translations = config.i18n?.translations;
  const components = page.components || [];

  if (!components.length) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle size={40} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-gray-500 font-medium">No components</h3>
          <p className="text-gray-400 text-sm mt-1">Add components to this page in your config</p>
        </div>
      </div>
    );
  }

  const layoutClass = page.layout === 'split' ? 'grid grid-cols-2 gap-6' :
    page.layout === 'tabs' ? '' : 'space-y-6';

  return (
    <div className="p-6">
      {page.title && (
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">{page.title}</h1>
          {page.description && <p className="text-gray-500 text-sm mt-1">{page.description as string}</p>}
        </div>
      )}
      <div className={layoutClass}>
        {components.map((component, i) => (
          <ComponentRenderer
            key={component.id || i}
            component={component}
            appId={appId}
            translations={translations}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
}
