import { Router } from 'express';
import { db } from '../db';

const router = Router();

// Get public site settings
router.get('/', async (req, res) => {
  try {
    const result = await db.execute('SELECT key, value FROM site_settings');
    const settings: Record<string, any> = {};

    for (const row of result.rows) {
      const key = String(row.key);
      const val = String(row.value);
      try {
        if (val.startsWith('{') || val.startsWith('[')) {
          settings[key] = JSON.parse(val);
        } else {
          settings[key] = val;
        }
      } catch {
        settings[key] = val;
      }
    }

    return res.json({ settings });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return res.status(500).json({ error: 'Failed to retrieve site settings.' });
  }
});

export default router;
