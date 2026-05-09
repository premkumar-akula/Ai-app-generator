'use client';
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataApi } from '@/lib/api';
import { ComponentConfig, ColumnConfig, FieldConfig } from '@/types/config';
import { Search, Plus, Download, Upload, Trash2, Edit2, Loader2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { DynamicForm } from './DynamicForm';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface DynamicTableProps {
  appId: string;
  component: ComponentConfig;
  t: (key: string) => string;
}

function CellRenderer({ value, column }: { value: unknown; column: ColumnConfig }) {
  if (value === null || value === undefined) return <span className="text-gray-400 text-xs">—</span>;

  switch (column.render) {
    case 'badge': {
      const colors: Record<string, string> = {
        active: 'green', inactive: 'gray', pending: 'yellow', error: 'red',
        lead: 'blue', customer: 'green', churned: 'red', qualified: 'purple',
        won: 'green', lost: 'red', prospect: 'blue', proposal: 'yellow', negotiation: 'orange',
      };
      const color = colors[String(value).toLowerCase()] || 'gray';
      return <span className={`badge badge-${color}`}>{String(value)}</span>;
    }
    case 'date':
      try { return <span className="text-gray-600 text-xs">{format(new Date(String(value)), 'MMM d, yyyy')}</span>; }
      catch { return <span>{String(value)}</span>; }
    case 'currency':
      return <span className="font-medium">${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>;
    case 'boolean':
      return <span className={`badge ${value ? 'badge-green' : 'badge-gray'}`}>{value ? 'Yes' : 'No'}</span>;
    case 'rating':
      return <span>{'★'.repeat(Number(value))}{'☆'.repeat(5 - Number(value))}</span>;
    default:
      if (typeof value === 'boolean') return <span className={`badge ${value ? 'badge-green' : 'badge-gray'}`}>{value ? 'Yes' : 'No'}</span>;
      if (typeof value === 'object') return <code className="text-xs bg-gray-100 rounded px-1">{JSON.stringify(value).slice(0, 60)}</code>;
      const str = String(value);
      if (str.length > 80) return <span title={str}>{str.slice(0, 80)}…</span>;
      return <span>{str}</span>;
  }
}

export function DynamicTable({ appId, component, t }: DynamicTableProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<Record<string, unknown> | null>(null);
  const [showImport, setShowImport] = useState(false);
  const qc = useQueryClient();

  const entity = component.entity || '';
  const pageSize = typeof component.pagination === 'object' ? component.pagination?.pageSize || 20 : 20;

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['data', appId, entity, page, search, sortBy, sortDir],
    queryFn: () => dataApi.list(appId, entity, { page, pageSize, search, sortBy, sortDir }).then(r => r.data),
    enabled: !!entity,
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dataApi.delete(appId, entity, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['data', appId, entity] }); toast.success('Record deleted'); },
    onError: () => toast.error('Delete failed'),
  });

  const handleSort = (key: string) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('asc'); }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this record?')) deleteMutation.mutate(id);
  };

  const handleExport = async () => {
    try {
      const res = await dataApi.exportCsv(appId, entity);
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${entity}_export.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Export complete');
    } catch { toast.error('Export failed'); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await dataApi.importCsv(appId, entity, file);
      toast.success(`Imported ${res.data.created} records`);
      qc.invalidateQueries({ queryKey: ['data', appId, entity] });
    } catch { toast.error('Import failed'); }
    e.target.value = '';
  };

  // Resolve columns: from config or auto-detect from data
  const resolvedColumns: ColumnConfig[] = (component.columns && component.columns.length > 0)
    ? component.columns.filter(c => !c.hidden)
    : data?.rows?.[0]
      ? Object.keys(data.rows[0])
          .filter(k => !['id', 'app_id', 'created_by', 'updated_by', 'deleted_at'].includes(k))
          .slice(0, 8)
          .map(k => ({ key: k, label: k.replace(/_/g, ' '), sortable: true }))
      : [];

  const hasCreate = component.actions?.some(a => a.name === 'create' || a.method === 'POST');
  const hasEdit = component.actions?.some(a => a.name === 'edit' || a.method === 'PUT' || a.method === 'PATCH');
  const hasDelete = component.actions?.some(a => a.name === 'delete' || a.method === 'DELETE');
  const hasFormFields = (component.fields || []).length > 0;

  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  if (!entity) return (
    <div className="card p-6 border-dashed border-yellow-200 bg-yellow-50">
      <p className="text-yellow-700 text-sm flex items-center gap-2"><AlertCircle size={16} /> Table component has no entity defined</p>
    </div>
  );

  return (
    <div className="card overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap bg-white">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {component.title && <h2 className="font-semibold text-gray-800 text-sm shrink-0">{component.title}</h2>}
          {component.searchable !== false && (
            <div className="relative max-w-xs flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" placeholder="Search..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="form-input pl-8 py-1.5 text-xs"
              />
            </div>
          )}
          {isFetching && <Loader2 size={14} className="animate-spin text-gray-400" />}
        </div>
        <div className="flex items-center gap-2">
          {component.exportable && (
            <button onClick={handleExport} className="btn-secondary text-xs py-1.5 px-3">
              <Download size={14} /> Export
            </button>
          )}
          {component.importable && (
            <label className="btn-secondary text-xs py-1.5 px-3 cursor-pointer">
              <Upload size={14} /> Import
              <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
            </label>
          )}
          {hasCreate && hasFormFields && (
            <button onClick={() => { setEditRecord(null); setShowForm(true); }} className="btn-primary text-xs py-1.5 px-3">
              <Plus size={14} /> {component.actions?.find(a => a.name === 'create')?.label || 'Add'}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-indigo-500" size={24} />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12 text-red-500 gap-2">
          <AlertCircle size={16} /> Failed to load data
        </div>
      ) : !data?.rows?.length ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">{component.emptyState?.title || 'No records yet'}</p>
          {component.emptyState?.description && <p className="text-gray-300 text-xs mt-1">{component.emptyState.description}</p>}
          {hasCreate && hasFormFields && (
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4 text-sm">
              <Plus size={14} /> {component.emptyState?.action || 'Add first record'}
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                {resolvedColumns.map(col => (
                  <th key={col.key} style={col.width ? { width: col.width } : {}}
                    className={col.sortable !== false ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}
                    onClick={() => col.sortable !== false && handleSort(col.key)}>
                    <span className="flex items-center gap-1">
                      {col.label || col.key.replace(/_/g, ' ')}
                      {sortBy === col.key && <span className="text-indigo-500">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </span>
                  </th>
                ))}
                {(hasEdit || hasDelete) && <th className="w-20">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row: Record<string, unknown>) => (
                <tr key={row.id as string}>
                  {resolvedColumns.map(col => (
                    <td key={col.key}><CellRenderer value={row[col.key]} column={col} /></td>
                  ))}
                  {(hasEdit || hasDelete) && (
                    <td>
                      <div className="flex items-center gap-1">
                        {hasEdit && hasFormFields && (
                          <button onClick={() => { setEditRecord(row); setShowForm(true); }}
                            className="p-1 text-gray-400 hover:text-indigo-600 rounded">
                            <Edit2 size={14} />
                          </button>
                        )}
                        {hasDelete && (
                          <button onClick={() => handleDelete(row.id as string)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {component.pagination !== false && data && data.total > pageSize && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-white">
          <span className="text-xs text-gray-500">
            Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, data.total)} of {data.total}
          </span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="btn-secondary p-1.5 disabled:opacity-40">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-gray-700">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="btn-secondary p-1.5 disabled:opacity-40">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && hasFormFields && (
        <FormModal
          appId={appId}
          component={component}
          editRecord={editRecord}
          onClose={() => { setShowForm(false); setEditRecord(null); }}
          onSuccess={() => { setShowForm(false); setEditRecord(null); qc.invalidateQueries({ queryKey: ['data', appId, entity] }); }}
        />
      )}
    </div>
  );
}

function FormModal({ appId, component, editRecord, onClose, onSuccess }: {
  appId: string;
  component: ComponentConfig;
  editRecord: Record<string, unknown> | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!editRecord;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">{isEdit ? 'Edit' : 'Add'} {component.title || component.entity}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-6">
          <DynamicForm
            appId={appId}
            component={component}
            editRecord={editRecord || undefined}
            onSuccess={onSuccess}
            onCancel={onClose}
            t={k => k}
          />
        </div>
      </div>
    </div>
  );
}
