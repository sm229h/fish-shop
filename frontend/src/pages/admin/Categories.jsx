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

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { show } = useToast();
  const [form, setForm] = useState({ name: '', description: '', sort_order: 0, is_active: true });

  const fetchCats = () => {
    api.get('/categories').then(d => setCategories(d.categories || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCats(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/admin/categories/${editing}`, form);
        show('دسته‌بندی به‌روز شد', 'success');
      } else {
        await api.post('/admin/categories', form);
        show('دسته‌بندی ایجاد شد', 'success');
      }
      setShowForm(false); setEditing(null);
      setForm({ name: '', description: '', sort_order: 0, is_active: true });
      fetchCats();
    } catch (err) { show(err.message, 'error'); }
  };

  const handleEdit = (c) => { setEditing(c.id); setForm({ name: c.name, description: c.description || '', sort_order: c.sort_order, is_active: c.is_active }); setShowForm(true); };

  const handleDelete = async (id) => {
    if (!confirm('حذف این دسته‌بندی؟ محصولات این دسته بدون دسته می‌شوند.')) return;
    try { await api.del(`/admin/categories/${id}`); show('حذف شد', 'info'); fetchCats(); }
    catch (err) { show(err.message, 'error'); }
  };

  if (loading) return <div className="page"><DashLayout items={sidebarItems}><Loading /></DashLayout></div>;

  return (
    <div className="page">
      <DashLayout items={sidebarItems}>
        <div className="flex justify-between items-center mb-4">
          <h1 style={{ color: 'var(--ocean-deep)' }}>مدیریت دسته‌بندی‌ها</h1>
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', description: '', sort_order: 0, is_active: true }); }}>
            {showForm ? 'انصراف' : '+ دسته جدید'}
          </button>
        </div>

        {showForm && (
          <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">نام *</label>
                  <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">ترتیب نمایش</label>
                  <input className="form-input" type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">توضیحات</label>
                  <input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                  <span>فعال</span>
                </label>
              </div>
              <button className="btn btn-primary mt-4" type="submit">{editing ? 'به‌روزرسانی' : 'افزودن'}</button>
            </form>
          </div>
        )}

        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>نام</th><th>توضیحات</th><th>ترتیب</th><th>فعال</th><th>عملیات</th></tr></thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.description}</td>
                  <td>{c.sort_order}</td>
                  <td>{c.is_active ? '✅' : '❌'}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(c)}>ویرایش</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(c.id)}>حذف</button>
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
