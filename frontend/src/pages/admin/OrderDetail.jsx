import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import DashLayout from '../../components/DashLayout';
import StatusBadge from '../../components/StatusBadge';
import OrderTimeline from '../../components/OrderTimeline';
import { formatPrice, formatDateTime, STATUS_LABELS } from '../../utils/status';
import Loading from '../../components/Loading';

const sidebarItems = [{
  links: [
    { to: '/admin', icon: '📊', label: 'داشبورد', end: true },
    { to: '/admin/products', icon: '🐟', label: 'محصولات' },
    { to: '/admin/categories', icon: '📁', label: 'دسته‌بندی‌ها' },
    { to: '/admin/orders', icon: '📦', label: 'سفارش‌ها' },
    { to: '/admin/customers', icon: '👥', label: 'مشتریان' },
    { to: '/admin/inventory', icon: '📊', label: 'موجودی' },
    { to: '/admin/settings', icon: '⚙️', label: 'تنظیمات' },
  ]
}];

const TRANSITIONS = {
  pending_review: ['confirmed', 'rejected', 'cancelled', 'needs_contact'],
  confirmed: ['preparing', 'cancelled', 'needs_contact'],
  preparing: ['ready_to_ship', 'cancelled'],
  ready_to_ship: ['shipped', 'cancelled'],
  shipped: ['delivered', 'needs_contact'],
  needs_contact: ['confirmed', 'cancelled', 'rejected'],
};

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { show } = useToast();
  const [statusForm, setStatusForm] = useState({ status: '', note: '', tracking_code: '', shipping_cost: '', visible_note: '', rejection_reason: '' });

  const fetchData = () => {
    api.get(`/admin/orders/${id}`).then(setData).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id]);

  if (loading) return <div className="page"><DashLayout items={sidebarItems}><Loading /></DashLayout></div>;
  if (!data) return <div className="page"><DashLayout items={sidebarItems}><div className="empty-state"><h3>سفارش یافت نشد</h3></div></DashLayout></div>;

  const { order, items, history } = data;
  const allowedNext = TRANSITIONS[order.status] || [];

  const handleStatusChange = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/admin/orders/${id}/status`, statusForm);
      show('وضعیت به‌روز شد', 'success');
      setStatusForm({ status: '', note: '', tracking_code: '', shipping_cost: '', visible_note: '', rejection_reason: '' });
      fetchData();
    } catch (err) { show(err.message, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="page">
      <DashLayout items={sidebarItems}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <Link to="/admin/orders" style={{ color: 'var(--ocean)', fontSize: '0.9rem' }}>→ بازگشت به سفارش‌ها</Link>
            <h1 style={{ marginTop: '8px', color: 'var(--ocean-deep)' }}>سفارش {order.order_number}</h1>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="admin-order-layout">
          <div>
            <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px' }}>اطلاعات مشتری</h3>
              <div style={{ color: 'var(--text-light)', lineHeight: 1.8, fontSize: '0.9rem' }}>
                <div>👤 {order.first_name} {order.last_name}</div>
                <div>📧 {order.user_email}</div>
                <div>📞 {order.user_phone}</div>
              </div>
              <h3 style={{ marginTop: '16px', marginBottom: '12px' }}>اطلاعات تحویل</h3>
              <div style={{ color: 'var(--text-light)', lineHeight: 1.8, fontSize: '0.9rem' }}>
                <div>👤 {order.recipient_name} — {order.phone}</div>
                <div>📍 {order.full_address}, {order.city}, {order.province}</div>
                {order.postal_code && <div>📮 {order.postal_code}</div>}
                {order.customer_notes && <div>📝 {order.customer_notes}</div>}
              </div>
            </div>

            <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '16px' }}>اقلام سفارش</h3>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div><strong>{item.product_name}</strong> — {item.quantity} {item.unit} × {formatPrice(item.unit_price)}</div>
                  <span style={{ fontWeight: 600 }}>{formatPrice(item.line_total)}</span>
                </div>
              ))}
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '2px solid var(--border)' }}>
                <div className="flex justify-between mb-2" style={{ color: 'var(--text-light)' }}><span>جمع اقلام</span><span>{formatPrice(order.subtotal)}</span></div>
                <div className="flex justify-between mb-2" style={{ color: 'var(--text-light)' }}><span>هزینه ارسال</span><span>{order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : '—'}</span></div>
                <div className="flex justify-between" style={{ fontWeight: 700, fontSize: '1.1rem' }}><span>مبلغ نهایی</span><span>{formatPrice(order.total)}</span></div>
              </div>
            </div>

            {order.tracking_code && (
              <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
                <strong>🚚 کد رهگیری: </strong>{order.tracking_code}
              </div>
            )}
            {order.visible_note && (
              <div className="card" style={{ padding: '16px', marginBottom: '20px', background: 'var(--bg-lighter)' }}>
                <strong>💬 یادداشت برای مشتری: </strong>{order.visible_note}
              </div>
            )}
            {order.rejection_reason && (
              <div className="card" style={{ padding: '16px', marginBottom: '20px', background: 'var(--danger-bg)' }}>
                <strong style={{ color: 'var(--danger)' }}>⚠️ دلیل رد/لغو: </strong>{order.rejection_reason}
              </div>
            )}
          </div>

          <div>
            {allowedNext.length > 0 && (
              <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '16px' }}>تغییر وضعیت</h3>
                <form onSubmit={handleStatusChange}>
                  <div className="form-group">
                    <label className="form-label">وضعیت جدید</label>
                    <select className="form-select" required value={statusForm.status} onChange={e => setStatusForm({ ...statusForm, status: e.target.value })}>
                      <option value="">انتخاب کنید...</option>
                      {allowedNext.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">یادداشت (اختیاری)</label>
                    <input className="form-input" value={statusForm.note} onChange={e => setStatusForm({ ...statusForm, note: e.target.value })} />
                  </div>
                  {(statusForm.status === 'shipped' || order.status === 'ready_to_ship') && (
                    <div className="form-group">
                      <label className="form-label">کد رهگیری</label>
                      <input className="form-input" value={statusForm.tracking_code} onChange={e => setStatusForm({ ...statusForm, tracking_code: e.target.value })} placeholder="کد پستی..." />
                    </div>
                  )}
                  {statusForm.status === 'rejected' || statusForm.status === 'cancelled' ? (
                    <div className="form-group">
                      <label className="form-label">دلیل</label>
                      <input className="form-input" value={statusForm.rejection_reason} onChange={e => setStatusForm({ ...statusForm, rejection_reason: e.target.value })} />
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">یادداشت قابل مشاهده برای مشتری</label>
                      <input className="form-input" value={statusForm.visible_note} onChange={e => setStatusForm({ ...statusForm, visible_note: e.target.value })} />
                    </div>
                  )}
                  <button className="btn btn-primary" type="submit" disabled={saving || !statusForm.status}>{saving ? '...' : 'اعمال تغییر وضعیت'}</button>
                </form>
              </div>
            )}

            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: '16px' }}>تاریخچه وضعیت</h3>
              <OrderTimeline history={history} currentStatus={order.status} />
            </div>
          </div>
        </div>
      </DashLayout>
    </div>
  );
}
