import { Router } from 'express';
import { pool } from '../db/pool.js';
import { authRequired } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();
router.use(authRequired);

function generateOrderNumber() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `DP-${ymd}-${rand}`;
}

// POST /api/orders
router.post('/', asyncHandler(async (req, res) => {
  const {
    recipient_name, phone, full_address, province, city, postal_code,
    notes, address_id, customer_notes
  } = req.body;

  if (!recipient_name || !phone || !full_address || !province || !city) {
    return res.status(400).json({ error: 'اطلاعات تحویل ناقص است' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get cart
    const cartRes = await client.query('SELECT id FROM carts WHERE user_id = $1', [req.user.id]);
    if (cartRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'سبد خرید خالی است' });
    }
    const cartId = cartRes.rows[0].id;

    const itemsRes = await client.query(
      `SELECT ci.product_id, ci.quantity, p.name, p.price, p.unit, p.stock, p.in_stock, p.is_active, p.min_order
       FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = $1`,
      [cartId]
    );
    if (itemsRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'سبد خرید خالی است' });
    }

    // Validate all items
    let subtotal = 0;
    const orderItems = [];
    for (const item of itemsRes.rows) {
      if (!item.is_active || !item.in_stock) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `محصول «${item.name}» ناموجود است` });
      }
      if (parseFloat(item.quantity) < parseFloat(item.min_order)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `حداقل سفارش «${item.name}» ${item.min_order} ${item.unit} است` });
      }
      const lineTotal = parseFloat(item.quantity) * parseFloat(item.price);
      subtotal += lineTotal;
      orderItems.push({
        product_id: item.product_id,
        product_name: item.name,
        unit: item.unit,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.price),
        line_total: lineTotal,
      });
    }

    // Get shipping cost from settings
    const settingsRes = await client.query("SELECT key, value FROM site_settings WHERE key IN ('shipping_cost', 'free_shipping_threshold')");
    const settings = {};
    settingsRes.rows.forEach(r => settings[r.key] = r.value);
    let shippingCost = parseFloat(settings.shipping_cost || '0');
    const freeThreshold = parseFloat(settings.free_shipping_threshold || '0');
    if (freeThreshold > 0 && subtotal >= freeThreshold) shippingCost = 0;

    const total = subtotal + shippingCost;
    const orderNumber = generateOrderNumber();

    // Create order
    const orderRes = await client.query(
      `INSERT INTO orders (order_number, user_id, status, recipient_name, phone, full_address,
        province, city, postal_code, notes, subtotal, shipping_cost, total, customer_notes)
       VALUES ($1, $2, 'pending_review', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, order_number`,
      [orderNumber, req.user.id, recipient_name, phone, full_address, province, city,
       postal_code || null, notes || null, subtotal, shippingCost, total, customer_notes || null]
    );
    const orderId = orderRes.rows[0].id;

    // Create order items and decrement stock
    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit, quantity, unit_price, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [orderId, item.product_id, item.product_name, item.unit, item.quantity, item.unit_price, item.line_total]
      );
      const stockRes = await client.query(
        'UPDATE products SET stock = stock - $1, in_stock = (stock - $1 > 0), updated_at = NOW() WHERE id = $2 RETURNING stock',
        [item.quantity, item.product_id]
      );
      const newStock = parseFloat(stockRes.rows[0].stock);
      await client.query(
        `INSERT INTO inventory_movements (product_id, change_type, quantity_change, previous_stock, new_stock, reason, changed_by)
         VALUES ($1, 'order', $2, $3, $4, $5, $6)`,
        [item.product_id, -item.quantity, newStock + item.quantity, newStock, `Order ${orderNumber}`, req.user.id]
      );
    }

    // Status history
    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note)
       VALUES ($1, NULL, 'pending_review', $2, 'سفارش ثبت شد')`,
      [orderId, req.user.id]
    );

    // Clear cart
    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

    await client.query('COMMIT');
    res.status(201).json({
      message: 'سفارش با موفقیت ثبت شد',
      order_id: orderId,
      order_number: orderNumber,
      total,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}));

// GET /api/orders — my orders
router.get('/', asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  let where = 'user_id = $1';
  const params = [req.user.id];
  let idx = 2;
  if (status) { where += ` AND status = $${idx}`; params.push(status); idx++; }

  const countRes = await pool.query(`SELECT COUNT(*) FROM orders WHERE ${where}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const { rows } = await pool.query(
    `SELECT id, order_number, status, total, created_at, updated_at FROM orders WHERE ${where}
     ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limitNum, offset]
  );
  res.json({
    orders: rows.map(r => ({ ...r, total: parseFloat(r.total) })),
    total, page: pageNum, totalPages: Math.ceil(total / limitNum),
  });
}));

// GET /api/orders/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'سفارش یافت نشد' });
  const order = rows[0];

  const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
  const historyRes = await pool.query(
    `SELECT osh.*, u.first_name, u.last_name FROM order_status_history osh
     LEFT JOIN users u ON osh.changed_by = u.id WHERE osh.order_id = $1 ORDER BY osh.created_at`,
    [req.params.id]
  );

  res.json({
    order: {
      ...order,
      subtotal: parseFloat(order.subtotal),
      shipping_cost: parseFloat(order.shipping_cost),
      total: parseFloat(order.total),
    },
    items: itemsRes.rows.map(i => ({
      ...i, quantity: parseFloat(i.quantity), unit_price: parseFloat(i.unit_price), line_total: parseFloat(i.line_total),
    })),
    history: historyRes.rows,
  });
}));

// POST /api/orders/:id/cancel
router.post('/:id/cancel', asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const { rows } = await pool.query(
    "SELECT * FROM orders WHERE id = $1 AND user_id = $2 AND status = 'pending_review'",
    [req.params.id, req.user.id]
  );
  if (rows.length === 0) {
    return res.status(400).json({ error: 'لغو سفارش در این مرحله ممکن نیست' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("UPDATE orders SET status = 'cancelled', rejection_reason = $1, updated_at = NOW() WHERE id = $2", [reason || 'درخواست مشتری', req.params.id]);
    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note)
       VALUES ($1, 'pending_review', 'cancelled', $2, $3)`,
      [req.params.id, req.user.id, reason || 'لغو توسط مشتری']
    );
    // Restore stock
    const itemsRes = await client.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [req.params.id]);
    for (const item of itemsRes.rows) {
      await client.query('UPDATE products SET stock = stock + $1, in_stock = true WHERE id = $2', [item.quantity, item.product_id]);
    }
    await client.query('COMMIT');
    res.json({ message: 'سفارش لغو شد' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}));

export default router;
