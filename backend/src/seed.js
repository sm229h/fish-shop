import bcrypt from 'bcryptjs';
import { pool } from './db/pool.js';

async function seed() {
  // Admin user
  const adminExists = await pool.query("SELECT 1 FROM users WHERE email = 'admin@daryapak.ir'");
  if (adminExists.rows.length === 0) {
    const hash = await bcrypt.hash('admin123456', 10);
    await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
       VALUES ('admin@daryapak.ir', $1, 'مدیر', 'سیستم', '02112345678', 'super_admin')`,
      [hash]
    );
    console.log('[seed] Admin user created: admin@daryapak.ir / admin123456');
  }

  // Categories
  const catExists = await pool.query('SELECT COUNT(*) FROM categories');
  if (parseInt(catExists.rows[0].count, 10) === 0) {
    const categories = [
      { name: 'ماهی‌های دریایی', description: 'ماهی‌های صید شده از دریا', sort_order: 1 },
      { name: 'ماهی‌های پرورشی', description: 'ماهی‌های پرورشی با کیفیت', sort_order: 2 },
      { name: 'ماهی‌های جنوب', description: 'ماهیان آب‌های جنوب ایران', sort_order: 3 },
      { name: 'ماهی‌های شمال', description: 'ماهیان دریای خزر', sort_order: 4 },
      { name: 'میگو', description: 'انواع میگوی تازه', sort_order: 5 },
      { name: 'محصولات پاک‌شده', description: 'محصولات آماده طبخ', sort_order: 6 },
      { name: 'محصولات ویژه', description: 'محصولات فصلی و خاص', sort_order: 7 },
    ];
    for (const c of categories) {
      await pool.query(
        'INSERT INTO categories (name, description, sort_order, is_active) VALUES ($1, $2, $3, true)',
        [c.name, c.description, c.sort_order]
      );
    }
    console.log('[seed] Categories created');
  }

  // Products
  const prodExists = await pool.query('SELECT COUNT(*) FROM products');
  if (parseInt(prodExists.rows[0].count, 10) === 0) {
    const catRows = await pool.query('SELECT id, name FROM categories ORDER BY id');
    const catMap = {};
    catRows.rows.forEach(r => catMap[r.name] = r.id);

    const products = [
      { name: 'سالمون نروژی', cat: 'ماهی‌های دریایی', desc: 'سالمون تازه نروژی', price: 850000, unit: 'کیلوگرم', stock: 50, featured: true },
      { name: 'ماهی تن', cat: 'ماهی‌های دریایی', desc: 'تن دریایی درجه یک', price: 720000, unit: 'کیلوگرم', stock: 30, featured: true },
      { name: 'ماهی شوریده', cat: 'ماهی‌های جنوب', desc: 'شوریده تازه خلیج فارس', price: 380000, unit: 'کیلوگرم', stock: 40, featured: false },
      { name: 'ماهی سنگسر', cat: 'ماهی‌های جنوب', desc: 'سنگسر جنوبی', price: 420000, unit: 'کیلوگرم', stock: 25, featured: false },
      { name: 'ماهی قزل‌آلا', cat: 'ماهی‌های پرورشی', desc: 'قزل‌آلا پرورشی درجه یک', price: 320000, unit: 'کیلوگرم', stock: 60, featured: true },
      { name: 'ماهی کپور', cat: 'ماهی‌های پرورشی', desc: 'کپور پرورشی تازه', price: 180000, unit: 'کیلوگرم', stock: 80, featured: false },
      { name: 'ماهی سفید', cat: 'ماهی‌های شمال', desc: 'سفید دریای خزر', price: 450000, unit: 'کیلوگرم', stock: 20, featured: false },
      { name: 'ماهی کفال', cat: 'ماهی‌های شمال', desc: 'کفال دریای خزر', price: 390000, unit: 'کیلوگرم', stock: 15, featured: false },
      { name: 'میگوی سفید', cat: 'میگو', desc: 'میگوی سفید تازه', price: 650000, unit: 'کیلوگرم', stock: 35, featured: true },
      { name: 'میگوی سوخته', cat: 'میگو', desc: 'میگوی پخته و آماده', price: 780000, unit: 'کیلوگرم', stock: 20, featured: false },
      { name: 'فیله سالمون', cat: 'محصولات پاک‌شده', desc: 'فیله آماده طبخ', price: 920000, unit: 'کیلوگرم', stock: 25, featured: true },
      { name: 'فیله ماهی سفید', cat: 'محصولات پاک‌شده', desc: 'فیله پاک‌شده و آماده', price: 520000, unit: 'کیلوگرم', stock: 30, featured: false },
      { name: 'خارگوش دریایی', cat: 'محصولات ویژه', desc: 'خارگوش تازه دریایی', price: 1100000, unit: 'کیلوگرم', stock: 10, featured: true },
      { name: 'مارماهی دودی', cat: 'محصولات ویژه', desc: 'مارماهی دودی خاص', price: 980000, unit: 'کیلوگرم', stock: 8, featured: false },
    ];

    for (const p of products) {
      await pool.query(
        `INSERT INTO products (category_id, name, short_description, full_description, price, unit, stock,
          min_order, max_order, step, is_featured, is_active, in_stock, low_stock_threshold)
         VALUES ($1, $2, $3, $3, $4, $5, $6, 0.5, 20, 0.5, $7, true, true, 5)`,
        [catMap[p.cat] || null, p.name, p.desc, p.price, p.unit, p.stock, p.featured]
      );
    }
    console.log('[seed] Products created');
  }

  // Site settings
  const settingsExist = await pool.query('SELECT COUNT(*) FROM site_settings');
  if (parseInt(settingsExist.rows[0].count, 10) === 0) {
    const settings = {
      brand_name: 'دریاپاک',
      brand_slogan: 'تازه‌ترین محصولات دریایی',
      phone: '021-12345678',
      phone2: '0912-3456789',
      address: 'تهران، خیابان ولیعصر، نرسیده به میدان ونک، پلاک ۱۲۳',
      working_hours: 'شنبه تا پنجشنبه، ۸ صبح تا ۸ شب',
      about_text: 'دریاپاک با بیش از یک دهه تجربه در عرضه محصولات دریایی تازه، تضمین کیفیت و تازگی را به شما می‌دهد. محصولات ما مستقیماً از بنادر صید شده و با زنجیره سرد تخصصی به دست شما می‌رسد.',
      shipping_cost: '50000',
      free_shipping_threshold: '500000',
      currency: 'تومان',
      show_out_of_stock: 'true',
      instagram: 'https://instagram.com/daryapak',
      terms_text: 'سفارش‌ها پس از تأیید مدیریت آماده و ارسال می‌شوند. لغو سفارش تنها در مرحله در انتظار بررسی امکان‌پذیر است.',
      privacy_text: 'اطلاعات شخصی شما محفوظ بوده و تنها برای پردازش سفارش استفاده می‌شود.',
    };
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        'INSERT INTO site_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
        [key, value]
      );
    }
    console.log('[seed] Settings created');
  }

  console.log('[seed] Done');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}

export default seed;
