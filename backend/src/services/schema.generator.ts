import { query } from '../db/pool';
import { EntityConfig } from '../types/config.types';

const TYPE_MAP: Record<string, string> = {
  string: 'VARCHAR(500)',
  text: 'TEXT',
  integer: 'INTEGER',
  float: 'DOUBLE PRECISION',
  boolean: 'BOOLEAN',
  date: 'DATE',
  timestamp: 'TIMESTAMPTZ',
  json: 'JSONB',
  uuid: 'UUID',
};

export function entityToSql(entity: EntityConfig, appId: string): string {
  const tableName = `app_${appId.replace(/-/g, '_')}_${entity.tableName || entity.name + 's'}`;
  const columns: string[] = [
    'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    `app_id UUID NOT NULL`,
    `created_by UUID`,
  ];

  for (const field of entity.fields) {
    // Skip reserved names
    if (['id', 'app_id', 'created_by', 'created_at', 'updated_at', 'deleted_at'].includes(field.name)) continue;

    const sqlType = TYPE_MAP[field.type] || 'TEXT';
    const nullable = field.nullable !== false ? '' : ' NOT NULL';
    const unique = field.unique ? ' UNIQUE' : '';
    let defaultClause = '';

    if (field.default !== undefined && field.default !== null) {
      const defVal = field.default;
      if (typeof defVal === 'string') defaultClause = ` DEFAULT '${defVal.replace(/'/g, "''")}'`;
      else if (typeof defVal === 'boolean') defaultClause = ` DEFAULT ${defVal}`;
      else if (typeof defVal === 'number') defaultClause = ` DEFAULT ${defVal}`;
      else if (typeof defVal === 'object') defaultClause = ` DEFAULT '${JSON.stringify(defVal)}'::jsonb`;
    } else if (field.type === 'boolean') {
      defaultClause = ' DEFAULT false';
    } else if (field.type === 'json') {
      defaultClause = " DEFAULT '{}'::jsonb";
    }

    columns.push(`${field.name} ${sqlType}${nullable}${unique}${defaultClause}`);
  }

  if (entity.timestamps !== false) {
    columns.push('created_at TIMESTAMPTZ DEFAULT NOW()');
    columns.push('updated_at TIMESTAMPTZ DEFAULT NOW()');
  }

  if (entity.softDelete) {
    columns.push('deleted_at TIMESTAMPTZ');
  }

  return `CREATE TABLE IF NOT EXISTS ${tableName} (\n  ${columns.join(',\n  ')}\n)`;
}

export async function ensureAppTables(appId: string, entities: EntityConfig[]): Promise<void> {
  const safeId = appId.replace(/-/g, '_');

  for (const entity of entities) {
    const tableName = `app_${safeId}_${entity.tableName || entity.name + 's'}`;
    const sql = entityToSql(entity, appId);

    try {
      await query(sql);

      // Add indexes
      for (const field of entity.fields) {
        if (field.index || field.references) {
          const indexName = `idx_${tableName}_${field.name}`;
          await query(`CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName}(${field.name})`);
        }
      }

      if (entity.userScoped) {
        await query(`CREATE INDEX IF NOT EXISTS idx_${tableName}_created_by ON ${tableName}(created_by)`);
      }

      // Update trigger
      await query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_trigger WHERE tgname = 'update_${tableName}_updated_at'
          ) THEN
            CREATE TRIGGER update_${tableName}_updated_at
            BEFORE UPDATE ON ${tableName}
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
          END IF;
        END $$
      `);
    } catch (err) {
      console.error(`Failed to create table ${tableName}:`, err);
      // Don't throw - continue with other entities
    }
  }
}

// Get all tables for an app
export async function getAppTables(appId: string): Promise<string[]> {
  const prefix = `app_${appId.replace(/-/g, '_')}_`;
  const result = await query(
    `SELECT table_name FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_name LIKE $1`,
    [`${prefix}%`]
  );
  return result.rows.map(r => r.table_name);
}

// Drop all tables for an app (used on app delete)
export async function dropAppTables(appId: string): Promise<void> {
  const tables = await getAppTables(appId);
  for (const table of tables) {
    await query(`DROP TABLE IF EXISTS ${table} CASCADE`);
  }
}

// Get table columns for schema introspection
export async function getTableSchema(tableName: string): Promise<Array<{
  column_name: string;
  data_type: string;
  is_nullable: string;
}>> {
  const result = await query(
    `SELECT column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [tableName]
  );
  return result.rows;
}
