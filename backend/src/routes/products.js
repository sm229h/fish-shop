import { Router } from 'express';
import { pool } from '../db/pool.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

// GET /api/products — public listing with filters
router.get('/', asyncHandler(async (req, res) => {
  const { search, category_id, in_stock_only, sort, page = 1, limit = 12 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(48, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = ['p.is_active = true'];
  const params = [];
  let paramIdx = 1;

  if (search) {
    conditions.push(`p.name ILIKE $${paramIdx}`);
    params.push(`%${search}%`);
    paramIdx++;
  }
  if (category_id) {
    conditions.push(`p.category_id = $${paramIdx}`);
    params.push(category_id);
    paramIdx++;
  }
  if (in_stock_only === 'true') {
    conditions.push(`p.in_stock = true`);
  }

  let orderBy = 'p.created_at DESC';
  if (sort === 'price_asc') orderBy = 'p.price ASC';
  if (sort === 'price_desc') orderBy = 'p.price DESC';
  if (sort === 'newest') orderBy = 'p.created_at DESC';

  const where = conditions.join(' AND ');

  const countResult = await pool.query(`SELECT COUNT(*) FROM products p WHERE ${where}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  const query = `
    SELECT p.*, c.name as category_name
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    WHERE ${where}
    ORDER BY ${orderBy}
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;
  params.push(limitNum, offset);

  const { rows } = await pool.query(query, params);
  res.json({
    products: rows.map(r => ({
      ...r,
      price: parseFloat(r.price),
      stock: parseFloat(r.stock),
      min_order: parseFloat(r.min_order),
      max_order: parseFloat(r.max_order),
      step: parseFloat(r.step),
    })),
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  });
}));

// GET /api/products/featured
router.get('/featured', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.*, c.name as category_name FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.is_active = true AND p.is_featured = true
     ORDER BY p.sort_order ASC, p.created_at DESC LIMIT 8`
  );
  res.json({ products: rows.map(r => ({
    ...r, price: parseFloat(r.price), stock: parseFloat(r.stock),
    min_order: parseFloat(r.min_order), max_order: parseFloat(r.max_order), step: parseFloat(r.step),
  })) });
}));

// GET /api/products/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.*, c.name as category_name FROM products p
     LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1`,
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'محصول یافت نشد' });
  const product = rows[0];

  // Related products
  const related = await pool.query(
    `SELECT id, name, price, image_url, unit, in_stock FROM products
     WHERE category_id = $1 AND id != $2 AND is_active = true LIMIT 4`,
    [product.category_id, product.id]
  );
  res.json({
    product: {
      ...product,
      price: parseFloat(product.price),
      stock: parseFloat(product.stock),
      min_order: parseFloat(product.min_order),
      max_order: parseFloat(product.max_order),
      step: parseFloat(product.step),
    },
    related: related.rows.map(r => ({ ...r, price: parseFloat(r.price) })),
  });
}));

export default router;
