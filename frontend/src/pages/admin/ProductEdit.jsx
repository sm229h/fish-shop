import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

export default function AdminProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '', category_id: '', short_description: '', full_description: '', price: '',
    unit: 'کیلوگرم', stock: '', min_order: '0.5', max_order: '20', step: '0.5',
    is_featured: false, is_active: true, in_stock: true, image_url: '', low_stock_threshold: '5',
  });

  useEffect(() => {
    api.get('/categories').then(d => setCategories(d.categories || []));
    if (id) {
      api.get(`/products/${id}`).then(d => {
        const p = d.product;
        setForm({
          name: p.name || '', category_id: p.category_id || '', short_description: p.short_description || '',
          full_description: p.full_description || '', price: p.price || '', unit: p.unit || 'کیلوگرم',
          stock: p.stock || '', min_order: p.min_order || '0.5', max_order: p.max_order || '20',
          step: p.step || '0.5', is_featured: p.is_featured, is_active: p.is_active,
          in_stock: p.in_stock, image_url: p.image_url || '', low_stock_threshold: p.low_stock_threshold || '5',
        });
      }).finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="page"><DashLayout items={sidebarItems}><Loading /></DashLayout></div>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, price: parseFloat(form.price), stock: parseFloat(form.stock || 0) };
      if (id) {
        await api.put(`/admin/products/${id}`, body);
        show('محصول به‌روز شد', 'success');
      } else {
        await api.post('/admin/products', body);
        show('محصول ایجاد شد', 'success');
      }
      navigate('/admin/products');
    } catch (err) { show(err.message, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="page">
      <DashLayout items={sidebarItems}>
        <h1 style={{ marginBottom: '20px', color: 'var(--ocean-deep)' }}>{id ? 'ویرایش محصول' : 'محصول جدید'}</h1>
        <form onSubmit={handleSubmit} className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">نام محصول *</label>
              <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">دسته‌بندی</label>
              <select className="form-select" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                <option value="">بدون دسته</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">توضیح کوتاه</label>
              <input className="form-input" value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">توضیح کامل</label>
              <textarea className="form-textarea" value={form.full_description} onChange={e => setForm({ ...form, full_description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">قیمت (تومان) *</label>
              <input className="form-input" type="number" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">واحد فروش</label>
              <input className="form-input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">موجودی</label>
              <input className="form-input" type="number" step="0.1" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">حد هشدار موجودی</label>
              <input className="form-input" type="number" value={form.low_stock_threshold} onChange={e => setForm({ ...form, low_stock_threshold: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">حداقل سفارش</label>
              <input className="form-input" type="number" step="0.1" value={form.min_order} onChange={e => setForm({ ...form, min_order: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">حداکثر سفارش</label>
              <input className="form-input" type="number" step="0.1" value={form.max_order} onChange={e => setForm({ ...form, max_order: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">گام افزایش</label>
              <input className="form-input" type="number" step="0.1" value={form.step} onChange={e => setForm({ ...form, step: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">آدرس تصویر</label>
              <input className="form-input" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', gap: '24px' }}>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} />
                <span>محصول ویژه</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                <span>فعال</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.in_stock} onChange={e => setForm({ ...form, in_stock: e.target.checked })} />
                <span>موجود</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'در حال ذخیره...' : 'ذخیره'}</button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/products')}>انصراف</button>
          </div>
        </form>
      </DashLayout>
    </div>
  );
}
