import { AppConfig, ProcessedConfig, EntityConfig, PageConfig, ComponentConfig, FieldConfig } from '../types/config.types';
import { v4 as uuidv4 } from 'uuid';

const VALID_FIELD_TYPES = new Set([
  'text', 'email', 'password', 'number', 'textarea', 'select', 'multiselect',
  'checkbox', 'radio', 'date', 'datetime', 'file', 'image', 'boolean',
  'url', 'phone', 'color', 'rating', 'currency', 'json'
]);

const VALID_COMPONENT_TYPES = new Set([
  'form', 'table', 'dashboard', 'card', 'chart', 'kanban', 'calendar',
  'detail', 'list', 'stats', 'modal'
]);

function sanitizeString(val: unknown, fallback: string): string {
  if (typeof val === 'string' && val.trim()) return val.trim();
  return fallback;
}

function sanitizeBoolean(val: unknown, fallback = false): boolean {
  if (typeof val === 'boolean') return val;
  if (val === 'true' || val === 1) return true;
  if (val === 'false' || val === 0) return false;
  return fallback;
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function sanitizeField(field: unknown, index: number): FieldConfig | null {
  if (!field || typeof field !== 'object') return null;
  const f = field as Record<string, unknown>;

  const name = sanitizeString(f.name || f.key || f.id, `field_${index}`);
  const rawType = (f.type as string)?.toLowerCase();
  const type = VALID_FIELD_TYPES.has(rawType) ? rawType as FieldConfig['type'] : 'text';

  const result: FieldConfig = {
    name: toSnakeCase(name),
    label: sanitizeString(f.label || f.title || f.display_name, name.replace(/_/g, ' ')),
    type,
    required: sanitizeBoolean(f.required),
    placeholder: typeof f.placeholder === 'string' ? f.placeholder : undefined,
    defaultValue: f.defaultValue ?? f.default_value,
    hidden: sanitizeBoolean(f.hidden),
    readOnly: sanitizeBoolean(f.readOnly || f.read_only),
    helpText: typeof f.helpText === 'string' ? f.helpText : undefined,
  };

  // Options normalization
  if (Array.isArray(f.options)) {
    result.options = f.options.map((opt: unknown) => {
      if (typeof opt === 'string' || typeof opt === 'number') {
        return { label: String(opt), value: opt };
      }
      if (opt && typeof opt === 'object') {
        const o = opt as Record<string, unknown>;
        return {
          label: sanitizeString(o.label || o.name || o.text || o.value, String(o.value || opt)),
          value: o.value ?? o.id ?? o.key ?? String(opt),
        };
      }
      return { label: String(opt), value: opt as string };
    });
  }

  // Validation
  if (f.validation && typeof f.validation === 'object') {
    result.validation = f.validation as FieldConfig['validation'];
  } else {
    // Extract validation from flat properties
    const val: FieldConfig['validation'] = {};
    if (typeof f.min === 'number') val.min = f.min;
    if (typeof f.max === 'number') val.max = f.max;
    if (typeof f.minLength === 'number') val.minLength = f.minLength;
    if (typeof f.maxLength === 'number') val.maxLength = f.maxLength;
    if (typeof f.pattern === 'string') val.pattern = f.pattern;
    if (Object.keys(val).length > 0) result.validation = val;
  }

  return result;
}

function sanitizeComponent(comp: unknown, index: number): ComponentConfig {
  if (!comp || typeof comp !== 'object') {
    return { id: `component_${index}`, type: 'form', title: `Component ${index}`, fields: [] };
  }
  const c = comp as Record<string, unknown>;

  const rawType = (c.type as string)?.toLowerCase();
  const type = VALID_COMPONENT_TYPES.has(rawType) ? rawType as ComponentConfig['type'] : 'table';

  const fields = Array.isArray(c.fields)
    ? c.fields.map((f: unknown, i: number) => sanitizeField(f, i)).filter(Boolean) as FieldConfig[]
    : [];

  const columns = Array.isArray(c.columns)
    ? c.columns.map((col: unknown, i: number) => {
        if (!col || typeof col !== 'object') return null;
        const co = col as Record<string, unknown>;
        return {
          key: sanitizeString(co.key || co.name || co.field, `col_${i}`),
          label: sanitizeString(co.label || co.title, sanitizeString(co.key || co.name, `Column ${i}`)),
          type: co.type as FieldConfig['type'],
          sortable: sanitizeBoolean(co.sortable, true),
          filterable: sanitizeBoolean(co.filterable),
          hidden: sanitizeBoolean(co.hidden),
          render: co.render as string | undefined,
        };
      }).filter(Boolean)
    : undefined;

  const actions = Array.isArray(c.actions)
    ? c.actions.map((a: unknown) => {
        if (!a || typeof a !== 'object') return null;
        const act = a as Record<string, unknown>;
        return {
          name: sanitizeString(act.name || act.id, 'action'),
          label: sanitizeString(act.label || act.text || act.title, sanitizeString(act.name, 'Action')),
          method: act.method as string || 'POST',
          endpoint: act.endpoint as string | undefined,
          icon: act.icon as string | undefined,
          variant: (act.variant || act.type || 'primary') as string,
          confirm: act.confirm as string | undefined,
        };
      }).filter(Boolean)
    : [];

  return {
    id: sanitizeString(c.id || c.key, `component_${index}`),
    type,
    title: c.title as string | undefined || c.name as string | undefined,
    description: c.description as string | undefined,
    entity: sanitizeString(c.entity || c.model || c.table || c.resource, ''),
    fields: fields.length > 0 ? fields : undefined,
    columns: columns && columns.length > 0 ? columns as ComponentConfig['columns'] : undefined,
    actions: actions as ComponentConfig['actions'],
    pagination: c.pagination !== false ? (typeof c.pagination === 'object' ? c.pagination as ComponentConfig['pagination'] : true) : false,
    searchable: sanitizeBoolean(c.searchable, true),
    filterable: sanitizeBoolean(c.filterable),
    sortable: sanitizeBoolean(c.sortable, true),
    exportable: sanitizeBoolean(c.exportable),
    importable: sanitizeBoolean(c.importable),
    chart: c.chart as ComponentConfig['chart'],
    stats: Array.isArray(c.stats) ? c.stats as ComponentConfig['stats'] : undefined,
    permissions: c.permissions as ComponentConfig['permissions'],
    emptyState: c.emptyState as ComponentConfig['emptyState'],
  };
}

function sanitizePage(page: unknown, index: number): PageConfig {
  if (!page || typeof page !== 'object') {
    return {
      id: `page_${index}`,
      title: `Page ${index + 1}`,
      path: `/page-${index + 1}`,
      components: [],
      auth: true,
    };
  }
  const p = page as Record<string, unknown>;

  const components = Array.isArray(p.components)
    ? p.components.map((c: unknown, i: number) => sanitizeComponent(c, i))
    : [];

  const title = sanitizeString(p.title || p.name || p.label, `Page ${index + 1}`);
  const path = sanitizeString(
    p.path || p.route || p.url,
    '/' + title.toLowerCase().replace(/\s+/g, '-')
  );

  return {
    id: sanitizeString(p.id || p.key, `page_${index}`),
    title,
    path: path.startsWith('/') ? path : `/${path}`,
    icon: p.icon as string | undefined,
    components,
    layout: (p.layout as PageConfig['layout']) || 'single',
    auth: sanitizeBoolean(p.auth ?? p.protected ?? p.requireAuth, true),
    roles: Array.isArray(p.roles) ? p.roles as string[] : undefined,
    hidden: sanitizeBoolean(p.hidden),
  };
}

function sanitizeEntity(entity: unknown, index: number): EntityConfig {
  if (!entity || typeof entity !== 'object') {
    return { name: `entity_${index}`, fields: [], timestamps: true };
  }
  const e = entity as Record<string, unknown>;
  const name = sanitizeString(e.name || e.model || e.table, `entity_${index}`);

  const VALID_DB_TYPES = new Set(['string', 'text', 'integer', 'float', 'boolean', 'date', 'timestamp', 'json', 'uuid']);

  const fields = Array.isArray(e.fields)
    ? e.fields.map((f: unknown, i: number) => {
        if (!f || typeof f !== 'object') return null;
        const fld = f as Record<string, unknown>;
        const fName = sanitizeString(fld.name || fld.key, `field_${i}`);

        // Map common type aliases
        let rawType = (fld.type as string)?.toLowerCase() || 'string';
        const typeMap: Record<string, string> = {
          'varchar': 'string', 'char': 'string', 'str': 'string',
          'int': 'integer', 'bigint': 'integer', 'smallint': 'integer',
          'decimal': 'float', 'numeric': 'float', 'double': 'float', 'real': 'float',
          'bool': 'boolean',
          'datetime': 'timestamp', 'timestamptz': 'timestamp',
          'jsonb': 'json', 'object': 'json', 'array': 'json',
        };
        if (typeMap[rawType]) rawType = typeMap[rawType];
        if (!VALID_DB_TYPES.has(rawType)) rawType = 'string';

        return {
          name: toSnakeCase(fName),
          type: rawType as EntityConfig['fields'][0]['type'],
          nullable: sanitizeBoolean(fld.nullable ?? fld.optional ?? !fld.required, true),
          unique: sanitizeBoolean(fld.unique),
          default: fld.default ?? fld.defaultValue,
          references: fld.references as EntityConfig['fields'][0]['references'],
          index: sanitizeBoolean(fld.index),
        };
      }).filter(Boolean) as EntityConfig['fields']
    : [];

  return {
    name: toSnakeCase(name),
    tableName: e.tableName as string | undefined || toSnakeCase(name) + 's',
    fields,
    timestamps: sanitizeBoolean(e.timestamps ?? e.addTimestamps, true),
    softDelete: sanitizeBoolean(e.softDelete ?? e.soft_delete),
    userScoped: sanitizeBoolean(e.userScoped ?? e.user_scoped ?? e.ownedByUser),
  };
}

export function validateAndSanitizeConfig(raw: unknown): ProcessedConfig {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw || typeof raw !== 'object') {
    errors.push('Config must be a JSON object');
    return {
      id: uuidv4(),
      name: 'Unnamed App',
      entities: [],
      pages: [],
      _errors: errors,
      _warnings: warnings,
    };
  }

  const cfg = raw as Record<string, unknown>;

  // App name
  const name = sanitizeString(cfg.name || cfg.appName || cfg.title, '');
  if (!name) {
    warnings.push('App name is missing — using "Unnamed App"');
  }

  // Entities
  let entities: EntityConfig[] = [];
  if (Array.isArray(cfg.entities)) {
    entities = cfg.entities.map((e, i) => sanitizeEntity(e, i));
  } else if (Array.isArray(cfg.models)) {
    entities = cfg.models.map((e: unknown, i: number) => sanitizeEntity(e, i));
    warnings.push('Using "models" key as entities');
  } else if (Array.isArray(cfg.tables)) {
    entities = cfg.tables.map((e: unknown, i: number) => sanitizeEntity(e, i));
    warnings.push('Using "tables" key as entities');
  } else {
    warnings.push('No entities defined — app will have no data models');
  }

  // Pages
  let pages: PageConfig[] = [];
  if (Array.isArray(cfg.pages)) {
    pages = cfg.pages.map((p, i) => sanitizePage(p, i));
  } else if (Array.isArray(cfg.routes)) {
    pages = cfg.routes.map((p: unknown, i: number) => sanitizePage(p, i));
    warnings.push('Using "routes" key as pages');
  } else if (Array.isArray(cfg.screens)) {
    pages = cfg.screens.map((p: unknown, i: number) => sanitizePage(p, i));
    warnings.push('Using "screens" key as pages');
  } else {
    warnings.push('No pages defined — auto-generating pages from entities');
    // Auto-generate CRUD pages from entities
    pages = entities.map((entity, i) => ({
      id: `page_${entity.name}`,
      title: entity.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      path: `/${entity.name.replace(/_/g, '-')}`,
      components: [
        {
          id: `${entity.name}_table`,
          type: 'table' as const,
          title: entity.name.replace(/_/g, ' '),
          entity: entity.name,
          columns: entity.fields.map(f => ({ key: f.name, label: f.name.replace(/_/g, ' '), sortable: true })),
          actions: [
            { name: 'create', label: 'Add New', method: 'POST' as const, variant: 'primary' as const },
            { name: 'edit', label: 'Edit', method: 'PUT' as const, variant: 'secondary' as const },
            { name: 'delete', label: 'Delete', method: 'DELETE' as const, variant: 'danger' as const, confirm: 'Are you sure?' },
          ],
          searchable: true,
          pagination: true,
          exportable: true,
        }
      ],
      auth: true,
    }));
  }

  // Auth config
  const authRaw = cfg.auth as Record<string, unknown> | undefined;
  const auth = authRaw ? {
    methods: Array.isArray(authRaw.methods) ? authRaw.methods as string[] : ['email'],
    roles: Array.isArray(authRaw.roles) ? authRaw.roles as string[] : ['admin', 'user'],
    jwtExpiry: sanitizeString(authRaw.jwtExpiry as string, '7d'),
    emailVerification: sanitizeBoolean(authRaw.emailVerification),
  } : { methods: ['email'], roles: ['admin', 'user'] };

  // Theme
  const themeRaw = cfg.theme as Record<string, unknown> | undefined;
  const theme = themeRaw ? {
    primaryColor: sanitizeString(themeRaw.primaryColor as string, '#6366f1'),
    accentColor: sanitizeString(themeRaw.accentColor as string, '#8b5cf6'),
    mode: (themeRaw.mode as string) || 'light',
    appName: sanitizeString(themeRaw.appName as string, name || 'App'),
  } : { primaryColor: '#6366f1', accentColor: '#8b5cf6', mode: 'light' };

  // i18n
  const i18nRaw = cfg.i18n as Record<string, unknown> | undefined;
  const i18n = i18nRaw ? {
    defaultLocale: sanitizeString(i18nRaw.defaultLocale as string || i18nRaw.default as string, 'en'),
    supportedLocales: Array.isArray(i18nRaw.supportedLocales) ? i18nRaw.supportedLocales as string[] : ['en'],
    translations: (i18nRaw.translations as Record<string, Record<string, string>>) || {},
  } : undefined;

  // Notifications
  const notifRaw = cfg.notifications as Record<string, unknown> | undefined;
  const notifications = notifRaw ? {
    enabled: sanitizeBoolean(notifRaw.enabled, true),
    events: Array.isArray(notifRaw.events) ? notifRaw.events as [] : [],
  } : undefined;

  return {
    id: sanitizeString(cfg.id as string, uuidv4()),
    name: name || 'Unnamed App',
    description: cfg.description as string | undefined,
    version: sanitizeString(cfg.version as string, '1.0.0'),
    auth,
    theme,
    i18n,
    notifications,
    entities,
    pages,
    apiPrefix: sanitizeString(cfg.apiPrefix as string, '/api'),
    _errors: errors,
    _warnings: warnings,
  };
}
