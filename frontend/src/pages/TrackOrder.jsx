import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import { formatPrice, formatDate } from '../utils/status';

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { show } = useToast();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      // Try to find order by order_number through the customer's orders
      const data = await api.get(`/orders`);
      const found = (data.orders || []).find(o => o.order_number === orderNumber.trim());
      if (found) {
        const detail = await api.get(`/orders/${found.id}`);
        setResult(detail);
      } else {
        show('سفارش با این شماره یافت نشد', 'error');
      }
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '600px' }}>
        <div className="section-title"><h1>پیگیری سفارش</h1></div>
        <form onSubmit={handleSearch} className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>شماره سفارش خود را وارد کنید</p>
          <div className="flex gap-2">
            <input className="form-input" placeholder="DP-XXXXXXXX-XXXX" value={orderNumber} onChange={e => setOrderNumber(e.target.value)} />
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? '...' : 'جستجو'}</button>
          </div>
        </form>

        {result && (
          <div className="card" style={{ padding: '24px' }}>
            <div className="flex justify-between items-center mb-4">
              <h3>سفارش {result.order.order_number}</h3>
              <StatusBadge status={result.order.status} />
            </div>
            <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '16px' }}>
              <div>تاریخ ثبت: {formatDate(result.order.created_at)}</div>
              <div>مبلغ: {formatPrice(result.order.total)}</div>
              {result.order.tracking_code && <div>کد رهگیری: {result.order.tracking_code}</div>}
              {result.order.visible_note && <div style={{ marginTop: '8px', padding: '10px', background: 'var(--bg-lighter)', borderRadius: '8px' }}>{result.order.visible_note}</div>}
            </div>
            <Link to={`/account/orders/${result.order.id}`} className="btn btn-outline btn-sm">مشاهده جزئیات کامل</Link>
          </div>
        )}
      </div>
    </div>
  );
}
