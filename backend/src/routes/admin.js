import { Router } from 'express';
import { pool } from '../db/pool.js';
import { adminRequired } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();
router.use(adminRequired);

// ── Dashboard ──
router.get('/dashboard', asyncHandler(async (req, res) => {
  const stats = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM orders) as total_orders,
      (SELECT COUNT(*) FROM orders WHERE status = 'pending_review') as pending_orders,
      (SELECT COUNT(*) FROM orders WHERE status = 'preparing') as preparing_orders,
      (SELECT COUNT(*) FROM orders WHERE status = 'shipped') as shipped_orders,
      (SELECT COUNT(*) FROM orders WHERE status = 'delivered') as delivered_orders,
      (SELECT COUNT(*) FROM products WHERE is_active = true) as active_products,
      (SELECT COUNT(*) FROM products WHERE in_stock = false OR stock <= low_stock_threshold) as low_stock_products,
      (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_customers
  `);
  const recentOrders = await pool.query(`
    SELECT o.id, o.order_number, o.status, o.total, o.created_at,
           u.first_name, u.last_name
    FROM orders o JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC LIMIT 10
  `);
  const orderTrend = await pool.query(`
    SELECT DATE(created_at) as date, COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
    FROM orders WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at) ORDER BY date
  `);
  res.json({
    stats: stats.rows[0],
    recentOrders: recentOrders.rows.map(r => ({ ...r, total: parseFloat(r.total) })),
    orderTrend: orderTrend.rows.map(r => ({ ...r, count: parseInt(r.count, 10), revenue: parseFloat(r.revenue) })),
  });
}));

// ── Orders ──
router.get('/orders', asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  let where = '1=1';
  const params = [];
  let idx = 1;
  if (status) { where += ` AND o.status = $${idx}`; params.push(status); idx++; }
  if (search) {
    where += ` AND (o.order_number ILIKE $${idx} OR u.first_name ILIKE $${idx} OR u.last_name ILIKE $${idx} OR u.phone ILIKE $${idx})`;
    params.push(`%${search}%`); idx++;
  }

  const countRes = await pool.query(`SELECT COUNT(*) FROM orders o JOIN users u ON o.user_id = u.id WHERE ${where}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const { rows } = await pool.query(
    `SELECT o.*, u.first_name, u.last_name, u.phone as user_phone, u.email as user_email
     FROM orders o JOIN users u ON o.user_id = u.id WHERE ${where}
     ORDER BY o.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limitNum, offset]
  );
  res.json({
    orders: rows.map(r => ({ ...r, subtotal: parseFloat(r.subtotal), shipping_cost: parseFloat(r.shipping_cost), total: parseFloat(r.total) })),
    total, page: pageNum, totalPages: Math.ceil(total / limitNum),
  });
}));

router.get('/orders/:id', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT o.*, u.first_name, u.last_name, u.email as user_email, u.phone as user_phone
     FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = $1`,
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'سفارش یافت نشد' });
  const order = rows[0];
  const items = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
  const history = await pool.query(
    `SELECT osh.*, u.first_name, u.last_name FROM order_status_history osh
     LEFT JOIN users u ON osh.changed_by = u.id WHERE osh.order_id = $1 ORDER BY osh.created_at`,
    [req.params.id]
  );
  res.json({
    order: {
      ...order,
      subtotal: parseFloat(order.subtotal), shipping_cost: parseFloat(order.shipping_cost), total: parseFloat(order.total),
    },
    items: items.rows.map(i => ({ ...i, quantity: parseFloat(i.quantity), unit_price: parseFloat(i.unit_price), line_total: parseFloat(i.line_total) })),
    history: history.rows,
  });
}));

// Valid status transitions
const VALID_TRANSITIONS = {
  pending_review: ['confirmed', 'rejected', 'cancelled', 'needs_contact'],
  confirmed: ['preparing', 'cancelled', 'needs_contact'],
  preparing: ['ready_to_ship', 'cancelled'],
  ready_to_ship: ['shipped', 'cancelled'],
  shipped: ['delivered', 'needs_contact'],
  delivered: [],
  rejected: [],
  cancelled: [],
  needs_contact: ['confirmed', 'cancelled', 'rejected'],
};

router.patch('/orders/:id/status', asyncHandler(async (req, res) => {
  const { status: newStatus, note, tracking_code, shipping_cost, admin_notes, visible_note, rejection_reason } = req.body;
  const { rows: orderRows } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  if (orderRows.length === 0) return res.status(404).json({ error: 'سفارش یافت نشد' });
  const order = orderRows[0];

  const allowed = VALID_TRANSITIONS[order.status] || [];
  if (!allowed.includes(newStatus)) {
    return res.status(400).json({ error: `تغییر وضعیت از «${order.status}» به «${newStatus}» مجاز نیست` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updates = ['status = $1', 'updated_at = NOW()'];
    const params = [newStatus];
    let idx = 2;
    if (tracking_code !== undefined) { updates.push(`tracking_code = $${idx}`); params.push(tracking_code); idx++; }
    if (shipping_cost !== undefined) { updates.push(`shipping_cost = $${idx}`); params.push(shipping_cost); idx++; }
    if (admin_notes !== undefined) { updates.push(`admin_notes = $${idx}`); params.push(admin_notes); idx++; }
    if (visible_note !== undefined) { updates.push(`visible_note = $${idx}`); params.push(visible_note); idx++; }
    if (rejection_reason !== undefined) { updates.push(`rejection_reason = $${idx}`); params.push(rejection_reason); idx++; }
    params.push(req.params.id);

    await client.query(`UPDATE orders SET ${updates.join(', ')} WHERE id = $${idx}`, params);
    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.params.id, order.status, newStatus, req.user.id, note || null]
    );
    await client.query(
      `INSERT INTO admin_activity_logs (admin_id, action, entity_type, entity_id, details)
       VALUES ($1, 'order_status_change', 'order', $2, $3)`,
      [req.user.id, req.params.id, `${order.status} -> ${newStatus}`]
    );
    await client.query('COMMIT');
    res.json({ message: 'وضعیت سفارش به‌روز شد' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}));

// ── Products ──
router.post('/products', asyncHandler(async (req, res) => {
  const { name, category_id, short_description, full_description, price, unit, stock,
    min_order, max_order, step, is_featured, is_active, in_stock, image_url, low_stock_threshold } = req.body;
  if (!name || price === undefined) return res.status(400).json({ error: 'نام و قیمت الزامی است' });
  const { rows } = await pool.query(
    `INSERT INTO products (name, category_id, short_description, full_description, price, unit, stock,
      min_order, max_order, step, is_featured, is_active, in_stock, image_url, low_stock_threshold)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [name, category_id || null, short_description || null, full_description || null, price,
     unit || 'کیلوگرم', stock || 0, min_order || 0.5, max_order || 20, step || 0.5,
     is_featured || false, is_active !== false, in_stock !== false, image_url || null, low_stock_threshold || 5]
  );
  res.status(201).json({ product: { ...rows[0], price: parseFloat(rows[0].price), stock: parseFloat(rows[0].stock) } });
}));

router.put('/products/:id', asyncHandler(async (req, res) => {
  const fields = ['name', 'category_id', 'short_description', 'full_description', 'price', 'unit', 'stock',
    'min_order', 'max_order', 'step', 'is_featured', 'is_active', 'in_stock', 'image_url', 'low_stock_threshold', 'sort_order'];
  const sets = [];
  const params = [];
  let idx = 1;
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      sets.push(`${f} = $${idx}`);
      params.push(req.body[f]);
      idx++;
    }
  }
  if (sets.length === 0) return res.status(400).json({ error: 'فیلدی برای به‌روزرسانی وجود ندارد' });
  sets.push('updated_at = NOW()');
  params.push(req.params.id);
  const { rows } = await pool.query(
    `UPDATE products SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  );
  if (rows.length === 0) return res.status(404).json({ error: 'محصول یافت نشد' });
  res.json({ product: { ...rows[0], price: parseFloat(rows[0].price), stock: parseFloat(rows[0].stock) } });
}));

router.delete('/products/:id', asyncHandler(async (req, res) => {
  // Soft delete: check if product has been ordered
  const ordered = await pool.query('SELECT 1 FROM order_items WHERE product_id = $1 LIMIT 1', [req.params.id]);
  if (ordered.rows.length > 0) {
    await pool.query('UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1', [req.params.id]);
    return res.json({ message: 'محصول غیرفعال شد (در سفارش‌ها استفاده شده)' });
  }
  await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
  res.json({ message: 'محصول حذف شد' });
}));

router.patch('/products/:id/toggle', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE products SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING is_active',
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'محصول یافت نشد' });
  res.json({ is_active: rows[0].is_active });
}));

// ── Categories ──
router.post('/categories', asyncHandler(async (req, res) => {
  const { name, description, image_url, sort_order, is_active } = req.body;
  if (!name) return res.status(400).json({ error: 'نام دسته‌بندی الزامی است' });
  const { rows } = await pool.query(
    'INSERT INTO categories (name, description, image_url, sort_order, is_active) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [name, description || null, image_url || null, sort_order || 0, is_active !== false]
  );
  res.status(201).json({ category: rows[0] });
}));

router.put('/categories/:id', asyncHandler(async (req, res) => {
  const { name, description, image_url, sort_order, is_active } = req.body;
  const { rows } = await pool.query(
    `UPDATE categories SET name = COALESCE($1, name), description = COALESCE($2, description),
     image_url = COALESCE($3, image_url), sort_order = COALESCE($4, sort_order),
     is_active = COALESCE($5, is_active), updated_at = NOW() WHERE id = $6 RETURNING *`,
    [name, description, image_url, sort_order, is_active, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'دسته‌بندی یافت نشد' });
  res.json({ category: rows[0] });
}));

router.delete('/categories/:id', asyncHandler(async (req, res) => {
  await pool.query('UPDATE products SET category_id = NULL WHERE category_id = $1', [req.params.id]);
  await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
  res.json({ message: 'دسته‌بندی حذف شد' });
}));

// ── Customers ──
router.get('/customers', asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  let where = "role = 'customer'";
  const params = [];
  let idx = 1;
  if (search) {
    where += ` AND (first_name ILIKE $${idx} OR last_name ILIKE $${idx} OR email ILIKE $${idx} OR phone ILIKE $${idx})`;
    params.push(`%${search}%`); idx++;
  }
  const countRes = await pool.query(`SELECT COUNT(*) FROM users WHERE ${where}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const { rows } = await pool.query(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.is_active, u.created_at,
            (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count,
            (SELECT COALESCE(SUM(total),0) FROM orders WHERE user_id = u.id) as total_spent
     FROM users u WHERE ${where} ORDER BY u.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limitNum, offset]
  );
  res.json({
    customers: rows.map(r => ({ ...r, total_spent: parseFloat(r.total_spent), order_count: parseInt(r.order_count, 10) })),
    total, page: pageNum, totalPages: Math.ceil(total / limitNum),
  });
}));

router.get('/customers/:id', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, first_name, last_name, email, phone, is_active, created_at FROM users WHERE id = $1 AND role = $2',
    [req.params.id, 'customer']
  );
  if (rows.length === 0) return res.status(404).json({ error: 'مشتری یافت نشد' });
  const orders = await pool.query(
    'SELECT id, order_number, status, total, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
    [req.params.id]
  );
  res.json({
    customer: rows[0],
    orders: orders.rows.map(r => ({ ...r, total: parseFloat(r.total) })),
  });
}));

router.patch('/customers/:id/toggle', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 AND role = $2 RETURNING is_active',
    [req.params.id, 'customer']
  );
  if (rows.length === 0) return res.status(404).json({ error: 'مشتری یافت نشد' });
  res.json({ is_active: rows[0].is_active });
}));

// ── Inventory ──
router.get('/inventory', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, unit, stock, low_stock_threshold, in_stock, is_active,
            (stock <= low_stock_threshold) as is_low
     FROM products WHERE is_active = true ORDER BY (stock <= low_stock_threshold) DESC, stock ASC`
  );
  res.json({ products: rows.map(r => ({ ...r, stock: parseFloat(r.stock), low_stock_threshold: parseFloat(r.low_stock_threshold) })) });
}));

router.put('/inventory/:id', asyncHandler(async (req, res) => {
  const { stock, reason } = req.body;
  if (stock === undefined) return res.status(400).json({ error: 'موجودی الزامی است' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const prev = await client.query('SELECT stock FROM products WHERE id = $1', [req.params.id]);
    if (prev.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'محصول یافت نشد' }); }
    const prevStock = parseFloat(prev.rows[0].stock);
    const newStock = parseFloat(stock);
    await client.query(
      'UPDATE products SET stock = $1, in_stock = $1 > 0, updated_at = NOW() WHERE id = $2',
      [newStock, req.params.id]
    );
    await client.query(
      `INSERT INTO inventory_movements (product_id, change_type, quantity_change, previous_stock, new_stock, reason, changed_by)
       VALUES ($1, 'adjustment', $2, $3, $4, $5, $6)`,
      [req.params.id, newStock - prevStock, prevStock, newStock, reason || 'تنظیم دستی', req.user.id]
    );
    await client.query('COMMIT');
    res.json({ message: 'موجودی به‌روز شد', stock: newStock });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}));

router.get('/inventory/movements', asyncHandler(async (req, res) => {
  const { product_id, page = 1, limit = 30 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;
  let where = '1=1';
  const params = [];
  let idx = 1;
  if (product_id) { where += ` AND im.product_id = $${idx}`; params.push(product_id); idx++; }
  const { rows } = await pool.query(
    `SELECT im.*, p.name as product_name, u.first_name, u.last_name
     FROM inventory_movements im
     JOIN products p ON im.product_id = p.id
     LEFT JOIN users u ON im.changed_by = u.id
     WHERE ${where} ORDER BY im.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limitNum, offset]
  );
  res.json({ movements: rows.map(r => ({ ...r, quantity_change: parseFloat(r.quantity_change), previous_stock: parseFloat(r.previous_stock), new_stock: parseFloat(r.new_stock) })) });
}));

// ── Settings ──
router.put('/settings', asyncHandler(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [key, value] of Object.entries(req.body)) {
      await client.query(
        `INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, String(value)]
      );
    }
    await client.query('COMMIT');
    res.json({ message: 'تنظیمات ذخیره شد' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}));

// ── Activity Logs ──
router.get('/activity-logs', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT al.*, u.first_name, u.last_name FROM admin_activity_logs al
     JOIN users u ON al.admin_id = u.id ORDER BY al.created_at DESC LIMIT 50`
  );
  res.json({ logs: rows });
}));

export default router;
