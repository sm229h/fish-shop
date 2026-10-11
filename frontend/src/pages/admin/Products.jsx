import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import DashLayout from '../../components/DashLayout';
import { formatPrice } from '../../utils/status';
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

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  const fetchProducts = () => {
    api.get('/products?limit=48').then(d => setProducts(d.products || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleToggle = async (id) => {
    try { await api.patch(`/admin/products/${id}/toggle`); show('وضعیت تغییر کرد', 'success'); fetchProducts(); }
    catch (err) { show(err.message, 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف این محصول؟')) return;
    try { await api.del(`/admin/products/${id}`); show('محصول حذف شد', 'success'); fetchProducts(); }
    catch (err) { show(err.message, 'error'); }
  };

  if (loading) return <div className="page"><DashLayout items={sidebarItems}><Loading /></DashLayout></div>;

  return (
    <div className="page">
      <DashLayout items={sidebarItems}>
        <div className="flex justify-between items-center mb-4">
          <h1 style={{ color: 'var(--ocean-deep)' }}>مدیریت محصولات</h1>
          <Link to="/admin/products/new" className="btn btn-primary">+ محصول جدید</Link>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>نام</th><th>قیمت</th><th>موجودی</th><th>واحد</th><th>ویژه</th><th>فعال</th><th>عملیات</th></tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td>{formatPrice(p.price)}</td>
                  <td>{p.stock} {p.unit}</td>
                  <td>{p.unit}</td>
                  <td>{p.is_featured ? '⭐' : '—'}</td>
                  <td>{p.is_active ? '✅' : '❌'}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link to={`/admin/products/${p.id}/edit`} className="btn btn-ghost btn-sm">ویرایش</Link>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(p.id)}>{p.is_active ? 'غیرفعال' : 'فعال'}</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(p.id)}>حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashLayout>
    </div>
  );
}
