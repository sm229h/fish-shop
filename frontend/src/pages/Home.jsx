import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/categories'),
      api.get('/products/featured'),
      api.get('/settings'),
    ]).then(([cats, feat, sett]) => {
      setCategories(cats.categories || []);
      setFeatured(feat.products || []);
      setSettings(sett.settings || {});
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="در حال بارگذاری..." />;

  const catIcons = ['🌊', '🐠', '🦐', '🐟', '🦞', '🔪', '⭐'];

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>تازه‌ترین محصولات دریایی را آنلاین سفارش دهید</h1>
          <p>{settings.brand_slogan || 'کیفیت و تازگی را تضمین می‌کنیم'}</p>
          <div className="hero-actions">
            <Link to="/products" className="btn btn-primary btn-lg">مشاهده محصولات</Link>
            <Link to="/register" className="btn btn-outline btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}>ثبت‌نام</Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-title">
              <h2>دسته‌بندی محصولات</h2>
              <p>محصولات را بر اساس دسته مرور کنید</p>
            </div>
            <div className="cat-grid">
              {categories.map((c, i) => (
                <Link key={c.id} to={`/products?category_id=${c.id}`} className="cat-card">
                  <div className="cat-icon">{catIcons[i % catIcons.length]}</div>
                  <h4>{c.name}</h4>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="section" style={{ background: 'var(--bg-lighter)' }}>
          <div className="container">
            <div className="section-title">
              <h2>محصولات منتخب</h2>
              <p>بهترین محصولات دریایی را کشف کنید</p>
            </div>
            <div className="product-grid">
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            <div className="text-center mt-6">
              <Link to="/products" className="btn btn-ocean btn-lg">مشاهده تمام محصولات</Link>
            </div>
          </div>
        </section>
      )}

      {/* About */}
      <section className="about-section">
        <div className="container">
          <div className="section-title">
            <h2>درباره {settings.brand_name || 'دریاپاک'}</h2>
          </div>
          <p style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>{settings.about_text}</p>
          <div className="about-features">
            <div className="about-feature">
              <div className="feature-icon">🐟</div>
              <h4>تضمین تازگی</h4>
              <p>محصولات مستقیماً از بنادر صید</p>
            </div>
            <div className="about-feature">
              <div className="feature-icon">❄️</div>
              <h4>زنجیره سرد</h4>
              <p>حمل و نقل تخصصی با دمای کنترل‌شده</p>
            </div>
            <div className="about-feature">
              <div className="feature-icon">🚚</div>
              <h4>ارسال سریع</h4>
              <p>تحویل به موقع و مطمئن</p>
            </div>
            <div className="about-feature">
              <div className="feature-icon">✅</div>
              <h4>کیفیت تضمینی</h4>
              <p>کنترل کیفیت در تمام مراحل</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
