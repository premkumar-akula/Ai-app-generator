'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { dataApi } from '@/lib/api';
import { ComponentConfig, FieldConfig } from '@/types/config';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface DynamicFormProps {
  appId: string;
  component: ComponentConfig;
  editRecord?: Record<string, unknown>;
  onSuccess?: (record: Record<string, unknown>) => void;
  onCancel?: () => void;
  t: (key: string) => string;
}

function FieldRenderer({ field, value, onChange }: {
  field: FieldConfig;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  if (field.hidden) return null;

  const baseClass = 'form-input';
  const val = value !== undefined ? value : field.defaultValue ?? '';

  switch (field.type) {
    case 'textarea':
      return <textarea className={baseClass} value={String(val || '')} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} rows={3} readOnly={field.readOnly} />;

    case 'select': {
      const opts = (field.options || []).map(o => typeof o === 'object' ? o : { label: String(o), value: o });
      return (
        <select className={baseClass} value={String(val || '')} onChange={e => onChange(e.target.value)} disabled={field.readOnly}>
          <option value="">— Select —</option>
          {opts.map(o => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
        </select>
      );
    }

    case 'multiselect': {
      const opts = (field.options || []).map(o => typeof o === 'object' ? o : { label: String(o), value: o });
      const selected = Array.isArray(val) ? val.map(String) : [];
      return (
        <div className="flex flex-wrap gap-2">
          {opts.map(o => (
            <label key={String(o.value)} className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={selected.includes(String(o.value))}
                onChange={e => {
                  const v = String(o.value);
                  if (e.target.checked) onChange([...selected, v]);
                  else onChange(selected.filter(s => s !== v));
                }} />
              <span className="text-sm">{o.label}</span>
            </label>
          ))}
        </div>
      );
    }

    case 'radio': {
      const opts = (field.options || []).map(o => typeof o === 'object' ? o : { label: String(o), value: o });
      return (
        <div className="flex gap-4 flex-wrap">
          {opts.map(o => (
            <label key={String(o.value)} className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name={field.name} value={String(o.value)} checked={String(val) === String(o.value)} onChange={() => onChange(o.value)} />
              <span className="text-sm">{o.label}</span>
            </label>
          ))}
        </div>
      );
    }

    case 'checkbox':
    case 'boolean':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={!!val} onChange={e => onChange(e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-sm text-gray-700">{field.label}</span>
        </label>
      );

    case 'number':
    case 'currency':
    case 'rating':
      return (
        <input type="number" className={baseClass} value={String(val || '')} onChange={e => onChange(e.target.valueAsNumber)}
          placeholder={field.placeholder} min={field.validation?.min} max={field.validation?.max} readOnly={field.readOnly} />
      );

    case 'date':
      return <input type="date" className={baseClass} value={String(val || '')} onChange={e => onChange(e.target.value)} readOnly={field.readOnly} />;

    case 'datetime':
      return <input type="datetime-local" className={baseClass} value={String(val || '')} onChange={e => onChange(e.target.value)} readOnly={field.readOnly} />;

    case 'color':
      return (
        <div className="flex items-center gap-2">
          <input type="color" value={String(val || '#000000')} onChange={e => onChange(e.target.value)} className="w-10 h-10 rounded border border-gray-300 cursor-pointer" />
          <span className="text-sm text-gray-500">{String(val || '')}</span>
        </div>
      );

    case 'email':
      return <input type="email" className={baseClass} value={String(val || '')} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || 'email@example.com'} readOnly={field.readOnly} />;

    case 'url':
      return <input type="url" className={baseClass} value={String(val || '')} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || 'https://'} readOnly={field.readOnly} />;

    case 'phone':
      return <input type="tel" className={baseClass} value={String(val || '')} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || '+1 (555) 000-0000'} readOnly={field.readOnly} />;

    case 'json':
      return (
        <textarea className="json-editor w-full h-28 text-xs" value={typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val || '{}')}
          onChange={e => { try { onChange(JSON.parse(e.target.value)); } catch { onChange(e.target.value); } }} />
      );

    case 'password':
      return <input type="password" className={baseClass} value={String(val || '')} onChange={e => onChange(e.target.value)} placeholder="••••••••" readOnly={field.readOnly} />;

    default:
      return (
        <input type="text" className={baseClass} value={String(val || '')} onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder} maxLength={field.validation?.maxLength} readOnly={field.readOnly} />
      );
  }
}

export function DynamicForm({ appId, component, editRecord, onSuccess, onCancel, t }: DynamicFormProps) {
  const entity = component.entity || '';
  const fields = (component.fields || []).filter(f => !f.hidden && f.type !== 'password' || !editRecord);

  const initialValues: Record<string, unknown> = {};
  fields.forEach(f => {
    initialValues[f.name] = editRecord?.[f.name] ?? f.defaultValue ?? (f.type === 'boolean' || f.type === 'checkbox' ? false : '');
  });

  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!editRecord;

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEdit
        ? dataApi.update(appId, entity, editRecord!.id as string, data)
        : dataApi.create(appId, entity, data),
    onSuccess: (res) => {
      toast.success(isEdit ? 'Updated successfully' : 'Created successfully');
      onSuccess?.(res.data);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Operation failed';
      toast.error(msg);
    },
  });

  const validate = () => {
    const errs: Record<string, string> = {};
    fields.forEach(f => {
      const v = values[f.name];
      if (f.required && (v === '' || v === null || v === undefined)) {
        errs[f.name] = `${f.label || f.name} is required`;
      }
      if (f.type === 'email' && v && !/\S+@\S+\.\S+/.test(String(v))) {
        errs[f.name] = 'Invalid email address';
      }
      if (f.validation?.min !== undefined && Number(v) < f.validation.min) {
        errs[f.name] = `Minimum value is ${f.validation.min}`;
      }
      if (f.validation?.max !== undefined && Number(v) > f.validation.max) {
        errs[f.name] = `Maximum value is ${f.validation.max}`;
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Clean up empty strings
    const clean: Record<string, unknown> = {};
    Object.entries(values).forEach(([k, v]) => {
      if (v !== '' || fields.find(f => f.name === k)?.required) clean[k] = v === '' ? null : v;
    });
    mutation.mutate(clean);
  };

  if (!fields.length) {
    return <p className="text-gray-400 text-sm">No form fields configured for this entity.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(field => {
        // Check dependency
        if (field.dependsOn) {
          const depVal = values[field.dependsOn.field];
          if (depVal !== field.dependsOn.value) return null;
        }

        const isCheckbox = field.type === 'checkbox' || field.type === 'boolean';

        return (
          <div key={field.name}>
            {!isCheckbox && (
              <label className="form-label">
                {field.label || field.name.replace(/_/g, ' ')}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            <FieldRenderer
              field={field}
              value={values[field.name]}
              onChange={val => setValues(prev => ({ ...prev, [field.name]: val }))}
            />
            {field.helpText && <p className="text-xs text-gray-400 mt-1">{field.helpText}</p>}
            {errors[field.name] && <p className="form-error">{errors[field.name]}</p>}
          </div>
        );
      })}

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>}
        <button type="submit" disabled={mutation.isPending} className="btn-primary">
          {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
          {isEdit ? 'Save Changes' : 'Create'}
        </button>
      </div>
    </form>
  );
}
