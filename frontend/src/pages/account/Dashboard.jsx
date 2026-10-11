import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import DashLayout from '../../components/DashLayout';
import StatusBadge from '../../components/StatusBadge';
import { formatPrice, formatDate } from '../../utils/status';
import Loading from '../../components/Loading';

const sidebarItems = [{
  links: [
    { to: '/account', icon: '📊', label: 'داشبورد', end: true },
    { to: '/account/orders', icon: '📦', label: 'سفارش‌های من' },
    { to: '/account/addresses', icon: '📍', label: 'نشانی‌ها' },
    { to: '/account/profile', icon: '👤', label: 'اطلاعات حساب' },
  ]
}];

export default function AccountDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders?limit=5').then(d => setOrders(d.orders || [])).finally(() => setLoading(false));
  }, []);

  const activeOrders = orders.filter(o => !['delivered', 'cancelled', 'rejected'].includes(o.status));
  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  return (
    <div className="page">
      <DashLayout items={sidebarItems}>
        <h1 style={{ marginBottom: '20px', color: 'var(--ocean-deep)' }}>
          سلام، {user?.first_name} {user?.last_name} 👋
        </h1>
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--bg-light)', color: 'var(--ocean)' }}>📦</div>
            <div className="stat-label">کل سفارش‌ها</div>
            <div className="stat-value">{orders.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>⏳</div>
            <div className="stat-label">در حال انجام</div>
            <div className="stat-value">{activeOrders.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>✅</div>
            <div className="stat-label">تحویل شده</div>
            <div className="stat-value">{deliveredOrders.length}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div className="flex justify-between items-center mb-4">
            <h3>آخرین سفارش‌ها</h3>
            <Link to="/account/orders" className="btn btn-ghost btn-sm">مشاهده همه →</Link>
          </div>
          {loading ? <Loading /> : orders.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px' }}>
              <p>هنوز سفارشی ثبت نکرده‌اید</p>
              <Link to="/products" className="btn btn-primary btn-sm mt-4">شروع خرید</Link>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>شماره سفارش</th><th>تاریخ</th><th>مبلغ</th><th>وضعیت</th><th></th></tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td>{o.order_number}</td>
                      <td>{formatDate(o.created_at)}</td>
                      <td>{formatPrice(o.total)}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td><Link to={`/account/orders/${o.id}`} className="btn btn-ghost btn-sm">جزئیات</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DashLayout>
    </div>
  );
}
