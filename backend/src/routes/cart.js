import { Router } from 'express';
import { pool } from '../db/pool.js';
import { authRequired } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

router.use(authRequired);

// Ensure cart exists for user
async function getOrCreateCart(userId) {
  let { rows } = await pool.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
  if (rows.length === 0) {
    const created = await pool.query(
      'INSERT INTO carts (user_id) VALUES ($1) RETURNING id', [userId]
    );
    rows = created.rows;
  }
  return rows[0];
}

// GET /api/cart
router.get('/', asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  const { rows } = await pool.query(
    `SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.unit, p.image_url,
            p.in_stock, p.stock, p.is_active, p.min_order, p.max_order, p.step
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.cart_id = $1 ORDER BY ci.id`,
    [cart.id]
  );
  const items = rows.map(r => ({
    ...r,
    price: parseFloat(r.price),
    quantity: parseFloat(r.quantity),
    stock: parseFloat(r.stock),
    min_order: parseFloat(r.min_order),
    max_order: parseFloat(r.max_order),
    step: parseFloat(r.step),
    line_total: parseFloat(r.quantity) * parseFloat(r.price),
  }));
  const subtotal = items.reduce((s, i) => s + i.line_total, 0);
  res.json({ items, subtotal });
}));

// POST /api/cart/items
router.post('/items', asyncHandler(async (req, res) => {
  const { product_id, quantity } = req.body;
  if (!product_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'محصول و مقدار معتبر الزامی است' });
  }
  const { rows: prodRows } = await pool.query(
    'SELECT * FROM products WHERE id = $1 AND is_active = true', [product_id]
  );
  if (prodRows.length === 0) return res.status(404).json({ error: 'محصول یافت نشد' });
  const product = prodRows[0];
  if (!product.in_stock) return res.status(400).json({ error: 'این محصول ناموجود است' });

  const qty = parseFloat(quantity);
  if (qty < parseFloat(product.min_order)) {
    return res.status(400).json({ error: `حداقل سفارش ${product.min_order} ${product.unit} است` });
  }

  const cart = await getOrCreateCart(req.user.id);
  const existing = await pool.query(
    'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2',
    [cart.id, product_id]
  );
  let newQty = qty;
  if (existing.rows.length > 0) {
    newQty = parseFloat(existing.rows[0].quantity) + qty;
    await pool.query('UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2',
      [newQty, existing.rows[0].id]);
  } else {
    await pool.query(
      'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)',
      [cart.id, product_id, newQty]
    );
  }
  res.json({ message: 'به سبد اضافه شد', quantity: newQty });
}));

// PUT /api/cart/items/:id
router.put('/items/:id', asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'مقدار معتبر نیست' });
  }
  const cart = await getOrCreateCart(req.user.id);
  const { rows } = await pool.query(
    'SELECT ci.*, p.min_order, p.max_order FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.id = $1 AND ci.cart_id = $2',
    [req.params.id, cart.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'آیتم یافت نشد' });
  const item = rows[0];
  const qty = parseFloat(quantity);
  if (qty < parseFloat(item.min_order)) {
    return res.status(400).json({ error: `حداقل سفارش ${item.min_order} است` });
  }
  await pool.query('UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2', [qty, req.params.id]);
  res.json({ message: 'به‌روز شد' });
}));

// DELETE /api/cart/items/:id
router.delete('/items/:id', asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  await pool.query('DELETE FROM cart_items WHERE id = $1 AND cart_id = $2', [req.params.id, cart.id]);
  res.json({ message: 'حذف شد' });
}));

// DELETE /api/cart
router.delete('/', asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);
  res.json({ message: 'سبد خالی شد' });
}));

export default router;
