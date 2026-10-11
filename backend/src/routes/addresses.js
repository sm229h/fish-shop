import { Router } from 'express';
import { pool } from '../db/pool.js';
import { authRequired } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();
router.use(authRequired);

// GET /api/addresses
router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, id DESC',
    [req.user.id]
  );
  res.json({ addresses: rows });
}));

// POST /api/addresses
router.post('/', asyncHandler(async (req, res) => {
  const { recipient_name, phone, full_address, province, city, postal_code, notes, is_default } = req.body;
  if (!recipient_name || !phone || !full_address || !province || !city) {
    return res.status(400).json({ error: 'اطلاعات نشانی ناقص است' });
  }
  if (is_default) {
    await pool.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
  }
  const { rows } = await pool.query(
    `INSERT INTO addresses (user_id, recipient_name, phone, full_address, province, city, postal_code, notes, is_default)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [req.user.id, recipient_name, phone, full_address, province, city, postal_code || null, notes || null, is_default || false]
  );
  res.status(201).json({ address: rows[0] });
}));

// PUT /api/addresses/:id
router.put('/:id', asyncHandler(async (req, res) => {
  const { recipient_name, phone, full_address, province, city, postal_code, notes, is_default } = req.body;
  const owns = await pool.query('SELECT 1 FROM addresses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (owns.rows.length === 0) return res.status(404).json({ error: 'نشانی یافت نشد' });
  if (is_default) {
    await pool.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
  }
  const { rows } = await pool.query(
    `UPDATE addresses SET recipient_name = COALESCE($1, recipient_name), phone = COALESCE($2, phone),
     full_address = COALESCE($3, full_address), province = COALESCE($4, province), city = COALESCE($5, city),
     postal_code = COALESCE($6, postal_code), notes = COALESCE($7, notes), is_default = COALESCE($8, is_default),
     updated_at = NOW() WHERE id = $9 AND user_id = $10 RETURNING *`,
    [recipient_name, phone, full_address, province, city, postal_code, notes, is_default, req.params.id, req.user.id]
  );
  res.json({ address: rows[0] });
}));

// DELETE /api/addresses/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ message: 'نشانی حذف شد' });
}));

export default router;
