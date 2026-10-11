import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/status';
import Loading from '../components/Loading';
import ProductCard from '../components/ProductCard';

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { show } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(0.5);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${id}`).then(d => {
      setData(d);
      setQuantity(parseFloat(d.product.min_order) || 0.5);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading text="در حال بارگذاری..." />;
  if (!data) return <div className="empty-state"><div className="icon">🔍</div><h3>محصول یافت نشد</h3></div>;

  const p = data.product;

  const handleAddToCart = async () => {
    if (!user) { show('برای افزودن به سبد ابتدا وارد شوید', 'info'); return; }
    if (!p.in_stock) { show('این محصول ناموجود است', 'error'); return; }
    setAdding(true);
    try {
      await addItem(p.id, quantity);
      show('به سبد خرید اضافه شد', 'success');
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setAdding(false);
    }
  };

  const adjustQty = (delta) => {
    const step = parseFloat(p.step) || 0.5;
    const min = parseFloat(p.min_order) || 0.5;
    const max = parseFloat(p.max_order) || 20;
    const newQty = Math.min(max, Math.max(min, quantity + delta * step));
    setQuantity(newQty);
  };

  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: '16px' }}>
          <Link to="/products" style={{ color: 'var(--ocean)', fontSize: '0.9rem' }}>→ بازگشت به محصولات</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }} className="detail-grid">
          <div className="product-card-img" style={{ borderRadius: 'var(--radius)', aspectRatio: '1', minHeight: '300px' }}>
            {p.image_url ? <img src={p.image_url} alt={p.name} /> : <span className="placeholder" style={{ fontSize: '5rem' }}>🐟</span>}
          </div>
          <div>
            <div className="flex gap-2 mb-2">
              {p.is_featured && <span className="badge badge-featured">ویژه</span>}
              {p.in_stock ? <span className="badge badge-in">موجود</span> : <span className="badge badge-out">ناموجود</span>}
            </div>
            <h1 style={{ marginBottom: '8px' }}>{p.name}</h1>
            <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>{p.short_description}</p>

            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--ocean-deep)', marginBottom: '20px' }}>
              {formatPrice(p.price)} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ {p.unit}</span>
            </div>

            {p.full_description && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '8px' }}>توضیحات</h3>
                <p style={{ color: 'var(--text-light)', lineHeight: 1.8 }}>{p.full_description}</p>
              </div>
            )}

            <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>موجودی: </span>
                <span style={{ fontWeight: 600 }}>{p.stock} {p.unit}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>حداقل سفارش: </span>
                <span style={{ fontWeight: 600 }}>{p.min_order} {p.unit}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>گام افزایش: </span>
                <span style={{ fontWeight: 600 }}>{p.step} {p.unit}</span>
              </div>
            </div>

            {p.in_stock && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div className="qty-selector">
                  <button onClick={() => adjustQty(-1)}>−</button>
                  <input type="number" value={quantity} step={p.step} min={p.min_order} max={p.max_order}
                    onChange={e => setQuantity(Math.max(parseFloat(p.min_order), Math.min(parseFloat(p.max_order), parseFloat(e.target.value) || 0)))} />
                  <button onClick={() => adjustQty(1)}>+</button>
                </div>
                <span style={{ color: 'var(--text-muted)' }}>{p.unit}</span>
                <span style={{ fontWeight: 700, color: 'var(--ocean-deep)' }}>{formatPrice(p.price * quantity)}</span>
              </div>
            )}

            <button className="btn btn-primary btn-lg" onClick={handleAddToCart} disabled={adding || !p.in_stock}>
              {adding ? 'در حال افزودن...' : 'افزودن به سبد خرید'}
            </button>
          </div>
        </div>

        {data.related && data.related.length > 0 && (
          <div>
            <h2 style={{ marginBottom: '20px', color: 'var(--ocean-deep)' }}>محصولات مرتبط</h2>
            <div className="product-grid">
              {data.related.map(r => <ProductCard key={r.id} product={r} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
