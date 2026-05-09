import { query } from '../db/pool';
import { AppConfig, EntityConfig } from '../types/config.types';

interface QueryOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  searchFields?: string[];
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
  userId?: string;
  includeSoftDeleted?: boolean;
}

function getTableName(appId: string, entityName: string, entity?: EntityConfig): string {
  const safeId = appId.replace(/-/g, '_');
  const tableName = entity?.tableName || entityName + 's';
  return `app_${safeId}_${tableName}`;
}

function sanitizeColumnName(col: string): string {
  return col.replace(/[^a-zA-Z0-9_]/g, '');
}

export async function listRecords(
  appId: string,
  entityName: string,
  options: QueryOptions = {},
  entity?: EntityConfig
): Promise<{ rows: Record<string, unknown>[]; total: number; page: number; pageSize: number }> {
  const table = getTableName(appId, entityName, entity);
  const {
    page = 1,
    pageSize = 20,
    search = '',
    searchFields = [],
    sortBy = 'created_at',
    sortDir = 'desc',
    filters = {},
    userId,
    includeSoftDeleted = false,
  } = options;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  // Soft delete filter
  if (entity?.softDelete && !includeSoftDeleted) {
    conditions.push(`deleted_at IS NULL`);
  }

  // User scope
  if (entity?.userScoped && userId) {
    conditions.push(`created_by = $${idx++}`);
    params.push(userId);
  }

  // Search
  if (search && searchFields.length > 0) {
    const searchClauses = searchFields.map(f => {
      const col = sanitizeColumnName(f);
      params.push(`%${search}%`);
      return `${col}::TEXT ILIKE $${idx++}`;
    });
    conditions.push(`(${searchClauses.join(' OR ')})`);
  } else if (search) {
    // Full text search on all text-like columns
    params.push(`%${search}%`);
    conditions.push(`(id::TEXT ILIKE $${idx++})`);
  }

  // Filters
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;
    const col = sanitizeColumnName(key);
    if (typeof value === 'object' && !Array.isArray(value)) {
      const rangeFilter = value as Record<string, unknown>;
      if (rangeFilter.gte !== undefined) {
        conditions.push(`${col} >= $${idx++}`);
        params.push(rangeFilter.gte);
      }
      if (rangeFilter.lte !== undefined) {
        conditions.push(`${col} <= $${idx++}`);
        params.push(rangeFilter.lte);
      }
    } else if (Array.isArray(value)) {
      conditions.push(`${col} = ANY($${idx++}::text[])`);
      params.push(value);
    } else {
      conditions.push(`${col} = $${idx++}`);
      params.push(value);
    }
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const safeSortBy = sanitizeColumnName(sortBy);
  const safeSortDir = sortDir === 'asc' ? 'ASC' : 'DESC';
  const offset = (page - 1) * pageSize;

  const countResult = await query(`SELECT COUNT(*) FROM ${table} ${where}`, params);
  const total = parseInt(countResult.rows[0].count);

  const dataResult = await query(
    `SELECT * FROM ${table} ${where} ORDER BY ${safeSortBy} ${safeSortDir} LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, pageSize, offset]
  );

  return { rows: dataResult.rows, total, page, pageSize };
}

export async function getRecord(
  appId: string,
  entityName: string,
  id: string,
  entity?: EntityConfig
): Promise<Record<string, unknown> | null> {
  const table = getTableName(appId, entityName, entity);
  const result = await query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

export async function createRecord(
  appId: string,
  entityName: string,
  data: Record<string, unknown>,
  userId?: string,
  entity?: EntityConfig
): Promise<Record<string, unknown>> {
  const table = getTableName(appId, entityName, entity);

  // Filter out reserved/system fields from data
  const reserved = new Set(['id', 'app_id', 'created_at', 'updated_at', 'deleted_at']);
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([k]) => !reserved.has(k))
  );

  const fields = Object.keys(filteredData);
  const values = Object.values(filteredData);

  // Add system fields
  fields.push('app_id');
  values.push(appId);

  if (userId) {
    fields.push('created_by');
    values.push(userId);
  }

  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
  const result = await query(
    `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    values
  );

  return result.rows[0];
}

export async function updateRecord(
  appId: string,
  entityName: string,
  id: string,
  data: Record<string, unknown>,
  userId?: string,
  entity?: EntityConfig
): Promise<Record<string, unknown> | null> {
  const table = getTableName(appId, entityName, entity);

  const reserved = new Set(['id', 'app_id', 'created_at', 'updated_at', 'deleted_at', 'created_by']);
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([k]) => !reserved.has(k))
  );

  if (Object.keys(filteredData).length === 0) {
    return getRecord(appId, entityName, id, entity);
  }

  const fields = Object.keys(filteredData);
  const values = Object.values(filteredData);

  if (userId) {
    fields.push('updated_by');
    values.push(userId);
  }

  const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  values.push(id);

  const result = await query(
    `UPDATE ${table} SET ${setClauses}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
    values
  );

  return result.rows[0] || null;
}

export async function deleteRecord(
  appId: string,
  entityName: string,
  id: string,
  entity?: EntityConfig,
  soft = false
): Promise<boolean> {
  const table = getTableName(appId, entityName, entity);

  if (soft || entity?.softDelete) {
    const result = await query(
      `UPDATE ${table} SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return (result.rowCount || 0) > 0;
  }

  const result = await query(`DELETE FROM ${table} WHERE id = $1`, [id]);
  return (result.rowCount || 0) > 0;
}

export async function bulkCreate(
  appId: string,
  entityName: string,
  records: Record<string, unknown>[],
  userId?: string,
  entity?: EntityConfig
): Promise<{ created: number; failed: number; errors: string[] }> {
  let created = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < records.length; i++) {
    try {
      await createRecord(appId, entityName, records[i], userId, entity);
      created++;
    } catch (err) {
      failed++;
      errors.push(`Row ${i + 1}: ${(err as Error).message}`);
    }
  }

  return { created, failed, errors };
}

export async function aggregateStats(
  appId: string,
  entityName: string,
  entity?: EntityConfig
): Promise<Record<string, unknown>> {
  const table = getTableName(appId, entityName, entity);
  try {
    const result = await query(`SELECT COUNT(*) as total FROM ${table} WHERE deleted_at IS NULL`);
    const today = await query(
      `SELECT COUNT(*) as today FROM ${table} WHERE created_at >= NOW() - INTERVAL '1 day' AND deleted_at IS NULL`
    );
    const thisWeek = await query(
      `SELECT COUNT(*) as this_week FROM ${table} WHERE created_at >= NOW() - INTERVAL '7 days' AND deleted_at IS NULL`
    );

    return {
      total: parseInt(result.rows[0].total),
      today: parseInt(today.rows[0].today),
      thisWeek: parseInt(thisWeek.rows[0].this_week),
    };
  } catch {
    return { total: 0, today: 0, thisWeek: 0 };
  }
}

export function getEntityFromConfig(config: AppConfig, entityName: string): EntityConfig | undefined {
  return config.entities.find(e =>
    e.name === entityName ||
    e.tableName === entityName ||
    e.name + 's' === entityName
  );
}
