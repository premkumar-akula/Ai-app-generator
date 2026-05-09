// Core type definitions for JSON config system

export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'datetime'
  | 'file'
  | 'image'
  | 'boolean'
  | 'url'
  | 'phone'
  | 'color'
  | 'rating'
  | 'currency'
  | 'json';

export type ComponentType =
  | 'form'
  | 'table'
  | 'dashboard'
  | 'card'
  | 'chart'
  | 'kanban'
  | 'calendar'
  | 'detail'
  | 'list'
  | 'stats'
  | 'modal';

export type ChartType = 'bar' | 'line' | 'pie' | 'donut' | 'area' | 'scatter';

export interface FieldConfig {
  name: string;
  label?: string;
  type?: FieldType;
  required?: boolean;
  placeholder?: string;
  defaultValue?: unknown;
  options?: Array<{ label: string; value: string | number } | string>;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    message?: string;
  };
  hidden?: boolean;
  readOnly?: boolean;
  helpText?: string;
  multiple?: boolean;
  accept?: string; // for file fields
  dependsOn?: {
    field: string;
    value: unknown;
  };
}

export interface ActionConfig {
  name: string;
  label?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint?: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  confirm?: string;
  successMessage?: string;
  errorMessage?: string;
  redirectTo?: string;
  payload?: Record<string, unknown>;
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
  sticky?: boolean;
}

export interface ComponentConfig {
  id: string;
  type: ComponentType;
  title?: string;
  description?: string;
  entity?: string;        // database table/collection
  fields?: FieldConfig[];
  columns?: ColumnConfig[];
  actions?: ActionConfig[];
  layout?: 'grid' | 'list' | 'masonry' | 'flex';
  gridCols?: number;
  pagination?: boolean | { pageSize?: number };
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  exportable?: boolean;
  importable?: boolean;
  chart?: {
    type: ChartType;
    xKey?: string;
    yKey?: string;
    colorKey?: string;
    groupBy?: string;
  };
  stats?: Array<{
    label: string;
    key: string;
    icon?: string;
    color?: string;
    format?: 'number' | 'currency' | 'percent';
  }>;
  permissions?: {
    create?: boolean | string[];
    read?: boolean | string[];
    update?: boolean | string[];
    delete?: boolean | string[];
  };
  dataSource?: string;    // override entity for custom queries
  filters?: Record<string, unknown>;
  emptyState?: {
    title?: string;
    description?: string;
    action?: string;
  };
}

export interface PageConfig {
  id: string;
  title: string;
  path: string;
  icon?: string;
  components: ComponentConfig[];
  layout?: 'single' | 'split' | 'tabs' | 'sidebar';
  auth?: boolean;
  roles?: string[];
  hidden?: boolean; // hide from nav
}

export interface EntityField {
  name: string;
  type: 'string' | 'text' | 'integer' | 'float' | 'boolean' | 'date' | 'timestamp' | 'json' | 'uuid';
  nullable?: boolean;
  unique?: boolean;
  default?: unknown;
  references?: {
    table: string;
    column: string;
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  };
  index?: boolean;
}

export interface EntityConfig {
  name: string;
  tableName?: string;
  fields: EntityField[];
  timestamps?: boolean;   // auto createdAt/updatedAt
  softDelete?: boolean;   // deletedAt instead of hard delete
  userScoped?: boolean;   // auto filter by userId
}

export interface AuthConfig {
  methods?: Array<'email' | 'github' | 'google'>;
  roles?: string[];
  jwtExpiry?: string;
  passwordPolicy?: {
    minLength?: number;
    requireUppercase?: boolean;
    requireNumbers?: boolean;
    requireSymbols?: boolean;
  };
  emailVerification?: boolean;
  customFields?: FieldConfig[];
}

export interface ThemeConfig {
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  mode?: 'light' | 'dark' | 'system';
  logo?: string;
  appName?: string;
}

export interface I18nConfig {
  defaultLocale?: string;
  supportedLocales?: string[];
  translations?: Record<string, Record<string, string>>;
}

export interface NotificationConfig {
  enabled?: boolean;
  events?: Array<{
    trigger: string;
    template?: string;
    channels?: Array<'email' | 'in-app'>;
    roles?: string[];
  }>;
}

export interface AppConfig {
  id?: string;
  name: string;
  description?: string;
  version?: string;
  auth?: AuthConfig;
  theme?: ThemeConfig;
  i18n?: I18nConfig;
  notifications?: NotificationConfig;
  entities: EntityConfig[];
  pages: PageConfig[];
  apiPrefix?: string;
}

// Sanitized / validated config after processing
export interface ProcessedConfig extends AppConfig {
  id: string;
  _errors?: string[];
  _warnings?: string[];
}
