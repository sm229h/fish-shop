import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/status';
import Loading from '../components/Loading';

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { show } = useToast();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddr, setSelectedAddr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({
    recipient_name: '', phone: '', full_address: '', province: '', city: '', postal_code: '', notes: '', customer_notes: '',
  });

  useEffect(() => {
    api.get('/addresses').then(d => {
      setAddresses(d.addresses || []);
      if (d.addresses && d.addresses.length > 0) {
        const def = d.addresses.find(a => a.is_default) || d.addresses[0];
        setSelectedAddr(def.id);
        fillForm(def);
      }
    }).finally(() => setLoading(false));
  }, []);

  const fillForm = (addr) => {
    setForm(f => ({
      ...f,
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      full_address: addr.full_address,
      province: addr.province,
      city: addr.city,
      postal_code: addr.postal_code || '',
      notes: addr.notes || '',
    }));
  };

  if (loading) return <Loading text="در حال بارگذاری..." />;
  if (items.length === 0) {
    return <div className="empty-state"><div className="icon">🛒</div><h3>سبد خرید خالی است</h3></div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) { show('تأیید قوانین الزامی است', 'error'); return; }
    setSubmitting(true);
    try {
      const data = await api.post('/orders', form);
      await clearCart();
      show(`سفارش ${data.order_number} ثبت شد`, 'success');
      navigate(`/account/orders/${data.order_id}`);
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <h1 style={{ marginBottom: '24px', color: 'var(--ocean-deep)' }}>ثبت سفارش</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }} className="checkout-layout">
            <div>
              {addresses.length > 0 && (
                <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
                  <h3 style={{ marginBottom: '12px' }}>نشانی‌های ذخیره شده</h3>
                  {addresses.map(a => (
                    <label key={a.id} style={{ display: 'flex', gap: '10px', padding: '10px', borderRadius: '8px', cursor: 'pointer', border: `2px solid ${selectedAddr === a.id ? 'var(--turquoise)' : 'var(--border)'}`, marginBottom: '8px' }}>
                      <input type="radio" name="address" checked={selectedAddr === a.id}
                        onChange={() => { setSelectedAddr(a.id); fillForm(a); }} />
                      <div>
                        <strong>{a.recipient_name}</strong> — {a.phone}
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{a.full_address}, {a.city}, {a.province}</div>
                      </div>
                    </label>
                  ))}
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSelectedAddr(null); setForm({ recipient_name: '', phone: '', full_address: '', province: '', city: '', postal_code: '', notes: '', customer_notes: '' }); }}>
                    + نشانی جدید
                  </button>
                </div>
              )}

              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>اطلاعات تحویل</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">نام تحویل‌گیرنده *</label>
                    <input className="form-input" required value={form.recipient_name} onChange={e => setForm({ ...form, recipient_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">شماره تماس *</label>
                    <input className="form-input" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">استان *</label>
                    <input className="form-input" required value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">شهر *</label>
                    <input className="form-input" required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">نشانی کامل *</label>
                    <textarea className="form-textarea" required value={form.full_address} onChange={e => setForm({ ...form, full_address: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">کد پستی</label>
                    <input className="form-input" value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">توضیحات سفارش</label>
                    <textarea className="form-textarea" value={form.customer_notes} onChange={e => setForm({ ...form, customer_notes: e.target.value })} placeholder="توضیحات اختیاری..." />
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '24px', height: 'fit-content' }}>
              <h3 style={{ marginBottom: '16px' }}>خلاصه سفارش</h3>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span>{item.name} ({item.quantity} {item.unit})</span>
                  <span>{formatPrice(item.line_total)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border)', marginTop: '12px', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-light)' }}>
                  <span>جمع اقلام</span><span>{formatPrice(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-light)' }}>
                  <span>هزینه ارسال</span><span>در پایان محاسبه می‌شود</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', marginTop: '8px' }}>
                  <span>مبلغ برآوردی</span><span>{formatPrice(subtotal)}</span>
                </div>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                ⚠️ پرداخت در سایت انجام نمی‌شود. تسویه در زمان تحویل خواهد بود.
              </p>
              <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: '16px', fontSize: '0.88rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: '4px' }} />
                <span>قوانین ثبت سفارش را خوانده و تأیید می‌کنم</span>
              </label>
              <button type="submit" className="btn btn-primary btn-lg w-full mt-4" disabled={submitting}>
                {submitting ? 'در حال ثبت...' : 'ثبت نهایی سفارش'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
