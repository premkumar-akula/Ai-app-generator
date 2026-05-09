export type FieldType =
  | 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'multiselect'
  | 'checkbox' | 'radio' | 'date' | 'datetime' | 'file' | 'image' | 'boolean'
  | 'url' | 'phone' | 'color' | 'rating' | 'currency' | 'json';

export type ComponentType =
  | 'form' | 'table' | 'dashboard' | 'card' | 'chart' | 'kanban' | 'calendar'
  | 'detail' | 'list' | 'stats' | 'modal';

export interface FieldConfig {
  name: string;
  label?: string;
  type?: FieldType;
  required?: boolean;
  placeholder?: string;
  defaultValue?: unknown;
  options?: Array<{ label: string; value: string | number } | string>;
  validation?: { min?: number; max?: number; minLength?: number; maxLength?: number; pattern?: string };
  hidden?: boolean;
  readOnly?: boolean;
  helpText?: string;
  dependsOn?: { field: string; value: unknown };
}

export interface ColumnConfig {
  key: string;
  label?: string;
  type?: FieldType;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: 'badge' | 'avatar' | 'link' | 'date' | 'currency' | 'boolean' | 'rating';
  hidden?: boolean;
}

export interface ActionConfig {
  name: string;
  label?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  confirm?: string;
}

export interface ComponentConfig {
  id: string;
  type: ComponentType;
  title?: string;
  description?: string;
  entity?: string;
  fields?: FieldConfig[];
  columns?: ColumnConfig[];
  actions?: ActionConfig[];
  layout?: string;
  pagination?: boolean | { pageSize?: number };
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  exportable?: boolean;
  importable?: boolean;
  chart?: { type: string; xKey?: string; yKey?: string };
  stats?: Array<{ label: string; key: string; icon?: string; color?: string; format?: string }>;
  permissions?: Record<string, unknown>;
  emptyState?: { title?: string; description?: string; action?: string };
}

export interface PageConfig {
  id: string;
  title: string;
  path: string;
  icon?: string;
  description?: string;
  components: ComponentConfig[];
  layout?: 'single' | 'split' | 'tabs' | 'sidebar';
  auth?: boolean;
  hidden?: boolean;
}

export interface AppConfig {
  id: string;
  name: string;
  description?: string;
  version?: string;
  auth?: {
    methods?: string[];
    roles?: string[];
  };
  theme?: {
    primaryColor?: string;
    accentColor?: string;
    mode?: string;
    appName?: string;
  };
  i18n?: {
    defaultLocale?: string;
    supportedLocales?: string[];
    translations?: Record<string, Record<string, string>>;
  };
  notifications?: { enabled?: boolean };
  entities: Array<{
    name: string;
    tableName?: string;
    fields: Array<{ name: string; type: string; nullable?: boolean }>;
    timestamps?: boolean;
    userScoped?: boolean;
  }>;
  pages: PageConfig[];
}
