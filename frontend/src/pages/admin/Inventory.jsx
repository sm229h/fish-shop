import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import DashLayout from '../../components/DashLayout';
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

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('list');
  const { show } = useToast();
  const [editStock, setEditStock] = useState({ id: null, stock: '', reason: '' });

  const fetchData = () => {
    api.get('/admin/inventory').then(d => setProducts(d.products || []));
    api.get('/admin/inventory/movements?limit=20').then(d => setMovements(d.movements || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveStock = async (id) => {
    try {
      await api.put(`/admin/inventory/${id}`, { stock: parseFloat(editStock.stock), reason: editStock.reason });
      show('موجودی به‌روز شد', 'success');
      setEditStock({ id: null, stock: '', reason: '' });
      fetchData();
    } catch (err) { show(err.message, 'error'); }
  };

  if (loading) return <div className="page"><DashLayout items={sidebarItems}><Loading /></DashLayout></div>;

  return (
    <div className="page">
      <DashLayout items={sidebarItems}>
        <h1 style={{ marginBottom: '20px', color: 'var(--ocean-deep)' }}>مدیریت موجودی</h1>

        <div className="flex gap-2 mb-4">
          <button className={`btn btn-sm ${tab === 'list' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('list')}>فهرست محصولات</button>
          <button className={`btn btn-sm ${tab === 'history' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('history')}>تاریخچه تغییرات</button>
        </div>

        {tab === 'list' ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>محصول</th><th>موجودی</th><th>واحد</th><th>وضعیت</th><th>کم‌موجود</th><th>عملیات</th></tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.stock}</td>
                    <td>{p.unit}</td>
                    <td>{p.in_stock ? <span className="badge badge-in">موجود</span> : <span className="badge badge-out">ناموجود</span>}</td>
                    <td>{p.is_low ? <span style={{ color: 'var(--danger)' }}>⚠️ بله</span> : '—'}</td>
                    <td>
                      {editStock.id === p.id ? (
                        <div className="flex gap-2">
                          <input className="form-input" type="number" step="0.1" style={{ width: '80px' }} value={editStock.stock} onChange={e => setEditStock({ ...editStock, stock: e.target.value })} placeholder="مقدار" />
                          <input className="form-input" style={{ width: '120px' }} value={editStock.reason} onChange={e => setEditStock({ ...editStock, reason: e.target.value })} placeholder="دلیل" />
                          <button className="btn btn-primary btn-sm" onClick={() => handleSaveStock(p.id)}>ذخیره</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditStock({ id: null, stock: '', reason: '' })}>✕</button>
                        </div>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditStock({ id: p.id, stock: String(p.stock), reason: '' })}>ویرایش موجودی</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>محصول</th><th>نوع</th><th>تغییر</th><th>موجودی قبلی</th><th>موجودی جدید</th><th>دلیل</th><th>کاربر</th><th>زمان</th></tr></thead>
              <tbody>
                {movements.map(m => (
                  <tr key={m.id}>
                    <td>{m.product_name}</td>
                    <td>{m.change_type === 'order' ? 'سفارش' : 'تنظیم دستی'}</td>
                    <td style={{ color: m.quantity_change < 0 ? 'var(--danger)' : 'var(--success)' }}>{m.quantity_change > 0 ? '+' : ''}{m.quantity_change}</td>
                    <td>{m.previous_stock}</td>
                    <td>{m.new_stock}</td>
                    <td>{m.reason}</td>
                    <td>{m.first_name} {m.last_name}</td>
                    <td>{new Date(m.created_at).toLocaleDateString('fa-IR')}</td>
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
