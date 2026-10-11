import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import DashLayout from '../../components/DashLayout';
import StatusBadge from '../../components/StatusBadge';
import { formatPrice, formatDate, STATUS_LABELS } from '../../utils/status';
import Loading from '../../components/Loading';

const sidebarItems = [{
  links: [
    { to: '/account', icon: '📊', label: 'داشبورد', end: true },
    { to: '/account/orders', icon: '📦', label: 'سفارش‌های من' },
    { to: '/account/addresses', icon: '📍', label: 'نشانی‌ها' },
    { to: '/account/profile', icon: '👤', label: 'اطلاعات حساب' },
  ]
}];

export default function AccountOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get(`/orders${filter ? `?status=${filter}` : ''}`).then(d => setOrders(d.orders || [])).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="page">
      <DashLayout items={sidebarItems}>
        <h1 style={{ marginBottom: '20px', color: 'var(--ocean-deep)' }}>سفارش‌های من</h1>

        <div className="filters-bar">
          <select className="form-select" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">همه وضعیت‌ها</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {loading ? <Loading /> : orders.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📦</div>
            <h3>سفارشی یافت نشد</h3>
            <Link to="/products" className="btn btn-primary mt-4">شروع خرید</Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>شماره سفارش</th><th>تاریخ</th><th>مبلغ</th><th>وضعیت</th><th></th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td><strong>{o.order_number}</strong></td>
                    <td>{formatDate(o.created_at)}</td>
                    <td>{formatPrice(o.total)}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td><Link to={`/account/orders/${o.id}`} className="btn btn-ghost btn-sm">جزئیات →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashLayout>
    </div>
  );
}
