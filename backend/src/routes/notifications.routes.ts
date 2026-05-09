import { Router, Request, Response } from 'express';
import { query } from '../db/pool';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

// GET /api/apps/:appId/notifications
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { appId } = req.params as { appId: string };
    const result = await query(
      `SELECT * FROM notifications WHERE user_id = $1 AND (app_id = $2 OR $2 IS NULL)
       ORDER BY created_at DESC LIMIT 50`,
      [req.user!.id, appId || null]
    );
    const unread = result.rows.filter(n => !n.read).length;
    res.json({ notifications: result.rows, unread });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// PUT /api/apps/:appId/notifications/:id/read
router.put('/:id/read', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    await query('UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2', [req.params.id, req.user!.id]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// PUT /api/apps/:appId/notifications/read-all
router.put('/read-all', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { appId } = req.params as { appId: string };
    await query('UPDATE notifications SET read = true WHERE user_id = $1 AND app_id = $2', [req.user!.id, appId]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// Helper to create notification (used internally)
export async function createNotification(
  userId: string, appId: string, title: string, body: string, type = 'info', metadata = {}
): Promise<void> {
  await query(
    `INSERT INTO notifications (user_id, app_id, title, body, type, metadata) VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, appId, title, body, type, JSON.stringify(metadata)]
  ).catch(console.error);
}

export default router;
