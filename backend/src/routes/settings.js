import { Router } from 'express';
import { pool } from '../db/pool.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

// GET /api/settings — public settings
router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT key, value FROM site_settings');
  const settings = {};
  rows.forEach(r => settings[r.key] = r.value);
  res.json({ settings });
}));

export default router;
