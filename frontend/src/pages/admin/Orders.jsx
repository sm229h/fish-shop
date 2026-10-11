import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import DashLayout from '../../components/DashLayout';
import StatusBadge from '../../components/StatusBadge';
import { formatPrice, formatDate, STATUS_LABELS } from '../../utils/status';
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

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    params.set('page', page);
    api.get(`/admin/orders?${params.toString()}`)
      .then(d => { setOrders(d.orders || []); setTotalPages(d.totalPages || 1); })
      .finally(() => setLoading(false));
  }, [status, search, page]);

  return (
    <div className="page">
      <DashLayout items={sidebarItems}>
        <h1 style={{ marginBottom: '20px', color: 'var(--ocean-deep)' }}>مدیریت سفارش‌ها</h1>

        <div className="filters-bar">
          <input className="form-input" placeholder="🔍 شماره سفارش یا نام مشتری..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <select className="form-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">همه وضعیت‌ها</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {loading ? <Loading /> : orders.length === 0 ? (
          <div className="empty-state"><div className="icon">📦</div><h3>سفارشی یافت نشد</h3></div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>شماره</th><th>مشتری</th><th>مبلغ</th><th>تاریخ</th><th>وضعیت</th><th></th></tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td><strong>{o.order_number}</strong></td>
                      <td>{o.first_name} {o.last_name}<br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{o.user_phone}</span></td>
                      <td>{formatPrice(o.total)}</td>
                      <td>{formatDate(o.created_at)}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td><Link to={`/admin/orders/${o.id}`} className="btn btn-ghost btn-sm">جزئیات →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>قبلی</button>
                <span style={{ padding: '8px 14px' }}>{page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>بعدی</button>
              </div>
            )}
          </>
        )}
      </DashLayout>
    </div>
  );
}
