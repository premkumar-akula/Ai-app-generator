import { Router, Request, Response } from 'express';
import { query } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord, aggregateStats, getEntityFromConfig, bulkCreate } from '../services/data.service';
import { AppConfig } from '../types/config.types';
import multer from 'multer';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

const router = Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

async function getAppConfig(appId: string, userId: string): Promise<AppConfig | null> {
  const result = await query(
    `SELECT config FROM apps WHERE id = $1 AND (owner_id = $2 OR id IN (SELECT app_id FROM app_members WHERE user_id = $2))`,
    [appId, userId]
  );
  return result.rows[0]?.config || null;
}

// GET /api/apps/:appId/data/:entity
router.get('/:entity', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { appId, entity } = req.params as { appId: string; entity: string };
    const appConfig = await getAppConfig(appId, req.user!.id);
    if (!appConfig) { res.status(404).json({ error: 'App not found' }); return; }

    const entityDef = getEntityFromConfig(appConfig, entity);
    const {
      page = '1', pageSize = '20', search = '', sortBy = 'created_at', sortDir = 'desc', ...filters
    } = req.query as Record<string, string>;

    const searchFields = entityDef?.fields
      .filter(f => ['string', 'text'].includes(f.type))
      .map(f => f.name) || [];

    const result = await listRecords(appId, entity, {
      page: parseInt(page),
      pageSize: Math.min(parseInt(pageSize), 100),
      search,
      searchFields,
      sortBy,
      sortDir: sortDir as 'asc' | 'desc',
      filters,
      userId: entityDef?.userScoped ? req.user!.id : undefined,
    }, entityDef);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list records' });
  }
});

// GET /api/apps/:appId/data/:entity/stats
router.get('/:entity/stats', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { appId, entity } = req.params as { appId: string; entity: string };
    const appConfig = await getAppConfig(appId, req.user!.id);
    if (!appConfig) { res.status(404).json({ error: 'App not found' }); return; }
    const entityDef = getEntityFromConfig(appConfig, entity);
    const stats = await aggregateStats(appId, entity, entityDef);
    res.json(stats);
  } catch { res.status(500).json({ error: 'Failed to get stats' }); }
});

// GET /api/apps/:appId/data/:entity/export
router.get('/:entity/export', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { appId, entity } = req.params as { appId: string; entity: string };
    const appConfig = await getAppConfig(appId, req.user!.id);
    if (!appConfig) { res.status(404).json({ error: 'App not found' }); return; }
    const entityDef = getEntityFromConfig(appConfig, entity);

    const result = await listRecords(appId, entity, { pageSize: 10000 }, entityDef);
    if (result.rows.length === 0) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${entity}_export.csv"`);
      res.send('');
      return;
    }

    const headers = Object.keys(result.rows[0]);
    const csvLines = [
      headers.join(','),
      ...result.rows.map(row =>
        headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(',')
      )
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${entity}_export.csv"`);
    res.send(csvLines.join('\n'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Export failed' });
  }
});

// POST /api/apps/:appId/data/:entity/import
router.post('/:entity/import', authenticate, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { appId, entity } = req.params as { appId: string; entity: string };
    if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }

    const appConfig = await getAppConfig(appId, req.user!.id);
    if (!appConfig) { res.status(404).json({ error: 'App not found' }); return; }

    const mapping: Record<string, string> = req.body.mapping ? JSON.parse(req.body.mapping) : {};
    const entityDef = getEntityFromConfig(appConfig, entity);
    const records: Record<string, unknown>[] = [];

    await new Promise<void>((resolve, reject) => {
      Readable.from(req.file!.buffer)
        .pipe(csvParser())
        .on('data', (row: Record<string, unknown>) => {
          const mapped: Record<string, unknown> = {};
          for (const [csvCol, dbCol] of Object.entries(mapping)) {
            if (row[csvCol] !== undefined) mapped[dbCol] = row[csvCol];
          }
          if (Object.keys(mapping).length === 0) Object.assign(mapped, row);
          records.push(mapped);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    const result = await bulkCreate(appId, entity, records, req.user!.id, entityDef);

    try {
      await query(
        `INSERT INTO import_jobs (app_id, entity, status, total_rows, imported_rows, failed_rows, errors, mapping, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [appId, entity, 'completed', records.length, result.created, result.failed,
         JSON.stringify(result.errors), JSON.stringify(mapping), req.user!.id]
      );
    } catch {
      // import_jobs table may not exist, ignore
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Import failed' });
  }
});

// GET /api/apps/:appId/data/:entity/:id
router.get('/:entity/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { appId, entity, id } = req.params as { appId: string; entity: string; id: string };
    const appConfig = await getAppConfig(appId, req.user!.id);
    if (!appConfig) { res.status(404).json({ error: 'App not found' }); return; }
    const entityDef = getEntityFromConfig(appConfig, entity);
    const record = await getRecord(appId, entity, id, entityDef);
    if (!record) { res.status(404).json({ error: 'Record not found' }); return; }
    res.json(record);
  } catch { res.status(500).json({ error: 'Failed to get record' }); }
});

// POST /api/apps/:appId/data/:entity
router.post('/:entity', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { appId, entity } = req.params as { appId: string; entity: string };
    const appConfig = await getAppConfig(appId, req.user!.id);
    if (!appConfig) { res.status(404).json({ error: 'App not found' }); return; }
    const entityDef = getEntityFromConfig(appConfig, entity);
    const record = await createRecord(appId, entity, req.body, req.user!.id, entityDef);
    res.status(201).json(record);
  } catch (err: unknown) {
    const msg = (err as Error).message || 'Failed to create record';
    res.status(400).json({ error: msg });
  }
});

// PUT /api/apps/:appId/data/:entity/:id
router.put('/:entity/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { appId, entity, id } = req.params as { appId: string; entity: string; id: string };
    const appConfig = await getAppConfig(appId, req.user!.id);
    if (!appConfig) { res.status(404).json({ error: 'App not found' }); return; }
    const entityDef = getEntityFromConfig(appConfig, entity);
    const record = await updateRecord(appId, entity, id, req.body, req.user!.id, entityDef);
    if (!record) { res.status(404).json({ error: 'Record not found' }); return; }
    res.json(record);
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// DELETE /api/apps/:appId/data/:entity/:id
router.delete('/:entity/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { appId, entity, id } = req.params as { appId: string; entity: string; id: string };
    const appConfig = await getAppConfig(appId, req.user!.id);
    if (!appConfig) { res.status(404).json({ error: 'App not found' }); return; }
    const entityDef = getEntityFromConfig(appConfig, entity);
    const deleted = await deleteRecord(appId, entity, id, entityDef);
    if (!deleted) { res.status(404).json({ error: 'Record not found' }); return; }
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ error: 'Delete failed' }); }
});

export default router;