import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { validateAndSanitizeConfig } from '../services/config.validator';
import { ensureAppTables, dropAppTables } from '../services/schema.generator';

const router = Router();

function toSlug(name: string, id: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + id.slice(0, 8);
}

// GET /api/apps
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT a.*, u.email as owner_email, u.name as owner_name
       FROM apps a JOIN users u ON a.owner_id = u.id
       WHERE a.owner_id = $1 OR a.id IN (
         SELECT app_id FROM app_members WHERE user_id = $1
       )
       ORDER BY a.updated_at DESC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list apps' });
  }
});

// POST /api/apps
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const rawConfig = req.body.config || req.body;
    const config = validateAndSanitizeConfig(rawConfig);
    const id = uuidv4();
    const slug = toSlug(config.name, id);

    const result = await query(
      `INSERT INTO apps (id, owner_id, name, description, config, slug, version)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, req.user!.id, config.name, config.description, JSON.stringify(config), slug, config.version]
    );

    // Provision tables for entities
    if (config.entities.length > 0) {
      await ensureAppTables(id, config.entities).catch(err =>
        console.error('Table provisioning error:', err)
      );
    }

    res.status(201).json({
      app: result.rows[0],
      warnings: config._warnings,
      errors: config._errors,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create app' });
  }
});

// GET /api/apps/:id
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT a.*, u.email as owner_email, u.name as owner_name
       FROM apps a JOIN users u ON a.owner_id = u.id
       WHERE a.id = $1 AND (a.owner_id = $2 OR a.is_public = true OR a.id IN (
         SELECT app_id FROM app_members WHERE user_id = $2
       ))`,
      [req.params.id, req.user!.id]
    );
    if (!result.rows[0]) { res.status(404).json({ error: 'App not found' }); return; }
    res.json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Failed to get app' }); }
});

// PUT /api/apps/:id
router.put('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await query('SELECT * FROM apps WHERE id = $1 AND owner_id = $2', [req.params.id, req.user!.id]);
    if (!existing.rows[0]) { res.status(404).json({ error: 'App not found or unauthorized' }); return; }

    const rawConfig = req.body.config || req.body;
    const config = validateAndSanitizeConfig(rawConfig);

    const result = await query(
      `UPDATE apps SET name = $1, description = $2, config = $3, version = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [config.name, config.description, JSON.stringify(config), config.version, req.params.id]
    );

    // Re-provision tables (CREATE IF NOT EXISTS is idempotent)
    if (config.entities.length > 0) {
      await ensureAppTables(req.params.id, config.entities).catch(console.error);
    }

    res.json({ app: result.rows[0], warnings: config._warnings });
  } catch { res.status(500).json({ error: 'Failed to update app' }); }
});

// DELETE /api/apps/:id
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await query('SELECT id FROM apps WHERE id = $1 AND owner_id = $2', [req.params.id, req.user!.id]);
    if (!existing.rows[0]) { res.status(404).json({ error: 'Not found or unauthorized' }); return; }

    await dropAppTables(req.params.id).catch(console.error);
    await query('DELETE FROM apps WHERE id = $1', [req.params.id]);
    res.json({ message: 'App deleted' });
  } catch { res.status(500).json({ error: 'Failed to delete app' }); }
});

// POST /api/apps/:id/validate - validate config without saving
router.post('/validate', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const config = validateAndSanitizeConfig(req.body);
    res.json({ valid: (config._errors?.length || 0) === 0, config, errors: config._errors, warnings: config._warnings });
  } catch { res.status(500).json({ error: 'Validation failed' }); }
});

export default router;
