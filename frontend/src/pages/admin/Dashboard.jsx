import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import DashLayout from '../../components/DashLayout';
import StatusBadge from '../../components/StatusBadge';
import { formatPrice, formatDate } from '../../utils/status';
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

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><DashLayout items={sidebarItems}><Loading /></DashLayout></div>;

  const s = data.stats || {};
  const stats = [
    { label: 'کل سفارش‌ها', value: s.total_orders, icon: '📦', bg: 'var(--bg-light)', color: 'var(--ocean)' },
    { label: 'در انتظار بررسی', value: s.pending_orders, icon: '⏳', bg: 'var(--warning-bg)', color: 'var(--warning)' },
    { label: 'در حال آماده‌سازی', value: s.preparing_orders, icon: '🐟', bg: '#ede7f6', color: '#5e35b1' },
    { label: 'ارسال شده', value: s.shipped_orders, icon: '🚚', bg: '#e0f7fa', color: '#00838f' },
    { label: 'تحویل شده', value: s.delivered_orders, icon: '✅', bg: 'var(--success-bg)', color: 'var(--success)' },
    { label: 'محصولات فعال', value: s.active_products, icon: '🐟', bg: 'var(--bg-light)', color: 'var(--ocean)' },
    { label: 'کم‌موجودی', value: s.low_stock_products, icon: '⚠️', bg: 'var(--danger-bg)', color: 'var(--danger)' },
    { label: 'مشتریان', value: s.total_customers, icon: '👥', bg: 'var(--bg-light)', color: 'var(--ocean)' },
  ];

  return (
    <div className="page">
      <DashLayout items={sidebarItems}>
        <h1 style={{ marginBottom: '20px', color: 'var(--ocean-deep)' }}>داشبورد مدیریت</h1>
        <div className="stat-grid">
          {stats.map((st, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon" style={{ background: st.bg, color: st.color }}>{st.icon}</div>
              <div className="stat-label">{st.label}</div>
              <div className="stat-value">{st.value}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div className="flex justify-between items-center mb-4">
            <h3>آخرین سفارش‌ها</h3>
            <Link to="/admin/orders" className="btn btn-ghost btn-sm">مشاهده همه →</Link>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>شماره</th><th>مشتری</th><th>مبلغ</th><th>تاریخ</th><th>وضعیت</th><th></th></tr></thead>
              <tbody>
                {(data.recentOrders || []).map(o => (
                  <tr key={o.id}>
                    <td><strong>{o.order_number}</strong></td>
                    <td>{o.first_name} {o.last_name}</td>
                    <td>{formatPrice(o.total)}</td>
                    <td>{formatDate(o.created_at)}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td><Link to={`/admin/orders/${o.id}`} className="btn btn-ghost btn-sm">جزئیات</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {(data.orderTrend || []).length > 0 && (
          <div className="card" style={{ padding: '20px', marginTop: '20px' }}>
            <h3 style={{ marginBottom: '16px' }}>روند سفارش‌ها (۳۰ روز اخیر)</h3>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '120px' }}>
              {data.orderTrend.map((d, i) => {
                const max = Math.max(...data.orderTrend.map(x => x.count), 1);
                const h = (d.count / max) * 100;
                return (
                  <div key={i} title={`${d.date}: ${d.count} سفارش`} style={{ flex: 1, height: `${h}%`, background: 'var(--turquoise)', borderRadius: '4px 4px 0 0', minHeight: '2px' }} />
                );
              })}
            </div>
          </div>
        )}
      </DashLayout>
    </div>
  );
}
