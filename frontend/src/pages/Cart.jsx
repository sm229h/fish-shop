import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/status';
import Loading from '../components/Loading';

export default function Cart() {
  const { items, subtotal, updateItem, removeItem, loading } = useCart();
  const { user } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);

  if (loading) return <Loading text="در حال بارگذاری سبد..." />;

  if (!user) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <div className="icon">🛒</div>
            <h3>برای مشاهده سبد خرید وارد شوید</h3>
            <Link to="/login" className="btn btn-primary mt-4">ورود به حساب</Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <div className="icon">🛒</div>
            <h3>سبد خرید شما خالی است</h3>
            <Link to="/products" className="btn btn-primary mt-4">مشاهده محصولات</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleUpdate = async (id, qty) => {
    setUpdating(true);
    try { await updateItem(id, qty); } catch (e) { show(e.message, 'error'); }
    finally { setUpdating(false); }
  };

  const handleRemove = async (id) => {
    try { await removeItem(id); show('حذف شد', 'info'); } catch (e) { show(e.message, 'error'); }
  };

  return (
    <div className="page">
      <div className="container">
        <h1 style={{ marginBottom: '24px', color: 'var(--ocean-deep)' }}>سبد خرید</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }} className="cart-layout">
          <div>
            {items.map(item => (
              <div key={item.id} className="card" style={{ padding: '16px', marginBottom: '12px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div className="product-card-img" style={{ width: '80px', height: '80px', borderRadius: '8px', flexShrink: 0 }}>
                  {item.image_url ? <img src={item.image_url} alt={item.name} /> : <span style={{ fontSize: '2rem', opacity: 0.3 }}>🐟</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>{item.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formatPrice(item.price)} / {item.unit}</p>
                  {!item.in_stock && <span className="badge badge-out" style={{ marginTop: '4px' }}>ناموجود</span>}
                </div>
                <div className="qty-selector">
                  <button onClick={() => handleUpdate(item.id, item.quantity - item.step)} disabled={updating}>−</button>
                  <input type="number" value={item.quantity} step={item.step} readOnly style={{ border: 'none' }} />
                  <button onClick={() => handleUpdate(item.id, item.quantity + item.step)} disabled={updating}>+</button>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--ocean-deep)', minWidth: '120px', textAlign: 'left' }}>
                  {formatPrice(item.line_total)}
                </div>
                <button onClick={() => handleRemove(item.id)} className="btn btn-ghost" style={{ color: 'var(--danger)' }}>✕</button>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: '24px', height: 'fit-content' }}>
            <h3 style={{ marginBottom: '16px' }}>خلاصه سفارش</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-light)' }}>
              <span>جمع اقلام</span><span>{formatPrice(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: 'var(--text-light)' }}>
              <span>هزینه ارسال</span><span>در زمان ثبت محاسبه می‌شود</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem' }}>
                <span>مبلغ نهایی</span><span>{formatPrice(subtotal)}</span>
              </div>
            </div>
            <button className="btn btn-primary btn-lg w-full" onClick={() => navigate('/checkout')}>
              ادامه و ثبت سفارش
            </button>
            <Link to="/products" className="btn btn-ghost w-full mt-2">ادامه خرید</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
