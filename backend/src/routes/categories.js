import { Router } from 'express';
import { pool } from '../db/pool.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

// GET /api/categories — public list
router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM categories WHERE is_active = true ORDER BY sort_order ASC, id ASC'
  );
  res.json({ categories: rows });
}));

export default router;
