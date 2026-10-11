import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import DashLayout from '../../components/DashLayout';
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

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { show } = useToast();

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', page);
    api.get(`/admin/customers?${params.toString()}`)
      .then(d => { setCustomers(d.customers || []); setTotalPages(d.totalPages || 1); })
      .finally(() => setLoading(false));
  }, [search, page]);

  const handleToggle = async (id) => {
    try { await api.patch(`/admin/customers/${id}/toggle`); show('وضعیت تغییر کرد', 'success'); } catch (err) { show(err.message, 'error'); }
  };

  return (
    <div className="page">
      <DashLayout items={sidebarItems}>
        <h1 style={{ marginBottom: '20px', color: 'var(--ocean-deep)' }}>مدیریت مشتریان</h1>
        <div className="filters-bar">
          <input className="form-input" placeholder="🔍 نام، ایمیل یا شماره تماس..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        {loading ? <Loading /> : customers.length === 0 ? (
          <div className="empty-state"><div className="icon">👥</div><h3>مشتری‌ای یافت نشد</h3></div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>نام</th><th>ایمیل</th><th>تماس</th><th>سفارش‌ها</th><th>مجموع خرید</th><th>فعال</th><th>عملیات</th></tr></thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id}>
                      <td><strong>{c.first_name} {c.last_name}</strong></td>
                      <td>{c.email}</td>
                      <td>{c.phone}</td>
                      <td>{c.order_count}</td>
                      <td>{formatPrice(c.total_spent)}</td>
                      <td>{c.is_active ? '✅' : '❌'}</td>
                      <td>
                        <div className="flex gap-2">
                          <Link to={`/admin/customers`} className="btn btn-ghost btn-sm" onClick={e => e.preventDefault()}>جزئیات</Link>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(c.id)}>{c.is_active ? 'غیرفعال' : 'فعال'}</button>
                        </div>
                      </td>
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
