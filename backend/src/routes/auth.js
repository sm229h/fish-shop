import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/pool.js';
import { authRequired, signToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

// POST /api/auth/register
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, first_name, last_name, phone } = req.body;
  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ error: 'ایمیل، رمز عبور، نام و نام خانوادگی الزامی است' });
  }
  const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
  if (exists.rows.length > 0) {
    return res.status(409).json({ error: 'این ایمیل قبلاً ثبت شده است' });
  }
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
     VALUES ($1, $2, $3, $4, $5, 'customer') RETURNING id, email, first_name, last_name, phone, role`,
    [email, hash, first_name, last_name, phone || null]
  );
  const user = rows[0];
  const token = signToken(user);
  res.status(201).json({ token, user });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'ایمیل و رمز عبور الزامی است' });
  }
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (rows.length === 0) {
    return res.status(401).json({ error: 'ایمیل یا رمز عبور نادرست است' });
  }
  const user = rows[0];
  if (!user.is_active) {
    return res.status(403).json({ error: 'حساب شما غیرفعال شده است' });
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'ایمیل یا رمز عبور نادرست است' });
  }
  delete user.password_hash;
  const token = signToken(user);
  res.json({ token, user });
}));

// GET /api/auth/me
router.get('/me', authRequired, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, email, phone, first_name, last_name, role, is_active, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'کاربر یافت نشد' });
  res.json({ user: rows[0] });
}));

// PUT /api/auth/profile
router.put('/profile', authRequired, asyncHandler(async (req, res) => {
  const { first_name, last_name, phone } = req.body;
  const { rows } = await pool.query(
    `UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name),
     phone = COALESCE($3, phone), updated_at = NOW()
     WHERE id = $4 RETURNING id, email, phone, first_name, last_name, role`,
    [first_name, last_name, phone, req.user.id]
  );
  res.json({ user: rows[0] });
}));

// PUT /api/auth/password
router.put('/password', authRequired, asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'رمز فعلی و رمز جدید الزامی است' });
  }
  const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  const valid = await bcrypt.compare(current_password, rows[0].password_hash);
  if (!valid) {
    return res.status(400).json({ error: 'رمز فعلی نادرست است' });
  }
  const hash = await bcrypt.hash(new_password, 10);
  await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.id]);
  res.json({ message: 'رمز عبور تغییر کرد' });
}));

export default router;
