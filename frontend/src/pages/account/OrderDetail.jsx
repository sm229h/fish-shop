import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import DashLayout from '../../components/DashLayout';
import StatusBadge from '../../components/StatusBadge';
import OrderTimeline from '../../components/OrderTimeline';
import { formatPrice, formatDateTime } from '../../utils/status';
import Loading from '../../components/Loading';

const sidebarItems = [{
  links: [
    { to: '/account', icon: '📊', label: 'داشبورد', end: true },
    { to: '/account/orders', icon: '📦', label: 'سفارش‌های من' },
    { to: '/account/addresses', icon: '📍', label: 'نشانی‌ها' },
    { to: '/account/profile', icon: '👤', label: 'اطلاعات حساب' },
  ]
}];

export default function AccountOrderDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  useEffect(() => {
    api.get(`/orders/${id}`).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page"><DashLayout items={sidebarItems}><Loading /></DashLayout></div>;
  if (!data) return <div className="page"><DashLayout items={sidebarItems}><div className="empty-state"><h3>سفارش یافت نشد</h3></div></DashLayout></div>;

  const { order, items, history } = data;

  const handleCancel = async () => {
    if (!confirm('لغو این سفارش؟')) return;
    try {
      await api.post(`/orders/${id}/cancel`, { reason: 'درخواست مشتری' });
      show('سفارش لغو شد', 'info');
      const fresh = await api.get(`/orders/${id}`);
      setData(fresh);
    } catch (err) { show(err.message, 'error'); }
  };

  const canCancel = order.status === 'pending_review';

  return (
    <div className="page">
      <DashLayout items={sidebarItems}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <Link to="/account/orders" style={{ color: 'var(--ocean)', fontSize: '0.9rem' }}>→ بازگشت به سفارش‌ها</Link>
            <h1 style={{ marginTop: '8px', color: 'var(--ocean-deep)' }}>سفارش {order.order_number}</h1>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="order-detail-layout">
          <div>
            <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '16px' }}>اقلام سفارش</h3>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <strong>{item.product_name}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}> — {item.quantity} {item.unit} × {formatPrice(item.unit_price)}</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>{formatPrice(item.line_total)}</span>
                </div>
              ))}
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '2px solid var(--border)' }}>
                <div className="flex justify-between mb-2" style={{ color: 'var(--text-light)' }}>
                  <span>جمع اقلام</span><span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between mb-2" style={{ color: 'var(--text-light)' }}>
                  <span>هزینه ارسال</span><span>{order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : 'رایگان'}</span>
                </div>
                <div className="flex justify-between" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  <span>مبلغ نهایی</span><span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: '12px' }}>اطلاعات تحویل</h3>
              <div style={{ color: 'var(--text-light)', lineHeight: 1.8, fontSize: '0.9rem' }}>
                <div>👤 {order.recipient_name}</div>
                <div>📞 {order.phone}</div>
                <div>📍 {order.full_address}, {order.city}, {order.province}</div>
                {order.postal_code && <div>📮 {order.postal_code}</div>}
                {order.tracking_code && <div>🚚 کد رهگیری: {order.tracking_code}</div>}
                {order.customer_notes && <div>📝 {order.customer_notes}</div>}
                <div>🕐 ثبت: {formatDateTime(order.created_at)}</div>
                <div>🔄 به‌روزرسانی: {formatDateTime(order.updated_at)}</div>
              </div>
              {order.visible_note && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-lighter)', borderRadius: '8px', fontSize: '0.9rem' }}>
                  💬 {order.visible_note}
                </div>
              )}
              {order.rejection_reason && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'var(--danger-bg)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--danger)' }}>
                  ⚠️ {order.rejection_reason}
                </div>
              )}
              {canCancel && (
                <button className="btn btn-danger btn-sm mt-4" onClick={handleCancel}>لغو سفارش</button>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '16px' }}>مراحل سفارش</h3>
            <OrderTimeline history={history} currentStatus={order.status} />
          </div>
        </div>
      </DashLayout>
    </div>
  );
}
