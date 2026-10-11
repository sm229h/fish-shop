import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import DashLayout from '../../components/DashLayout';
import Loading from '../../components/Loading';

const sidebarItems = [{
  links: [
    { to: '/account', icon: '📊', label: 'داشبورد', end: true },
    { to: '/account/orders', icon: '📦', label: 'سفارش‌های من' },
    { to: '/account/addresses', icon: '📍', label: 'نشانی‌ها' },
    { to: '/account/profile', icon: '👤', label: 'اطلاعات حساب' },
  ]
}];

export default function AccountAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { show } = useToast();
  const [form, setForm] = useState({ recipient_name: '', phone: '', full_address: '', province: '', city: '', postal_code: '', notes: '', is_default: false });

  const fetchAddrs = () => {
    api.get('/addresses').then(d => setAddresses(d.addresses || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAddrs(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/addresses/${editing}`, form);
        show('نشانی به‌روز شد', 'success');
      } else {
        await api.post('/addresses', form);
        show('نشانی اضافه شد', 'success');
      }
      setShowForm(false); setEditing(null);
      setForm({ recipient_name: '', phone: '', full_address: '', province: '', city: '', postal_code: '', notes: '', is_default: false });
      fetchAddrs();
    } catch (err) { show(err.message, 'error'); }
  };

  const handleEdit = (addr) => {
    setEditing(addr.id);
    setForm({ ...addr, is_default: addr.is_default });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف این نشانی؟')) return;
    try { await api.del(`/addresses/${id}`); show('حذف شد', 'info'); fetchAddrs(); }
    catch (err) { show(err.message, 'error'); }
  };

  if (loading) return <div className="page"><DashLayout items={sidebarItems}><Loading /></DashLayout></div>;

  return (
    <div className="page">
      <DashLayout items={sidebarItems}>
        <div className="flex justify-between items-center mb-4">
          <h1 style={{ color: 'var(--ocean-deep)' }}>نشانی‌های من</h1>
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ recipient_name: '', phone: '', full_address: '', province: '', city: '', postal_code: '', notes: '', is_default: false }); }}>
            {showForm ? 'انصراف' : '+ نشانی جدید'}
          </button>
        </div>

        {showForm && (
          <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">نام تحویل‌گیرنده *</label>
                  <input className="form-input" required value={form.recipient_name} onChange={e => setForm({ ...form, recipient_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">شماره تماس *</label>
                  <input className="form-input" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">استان *</label>
                  <input className="form-input" required value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">شهر *</label>
                  <input className="form-input" required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">نشانی کامل *</label>
                  <textarea className="form-textarea" required value={form.full_address} onChange={e => setForm({ ...form, full_address: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">کد پستی</label>
                  <input className="form-input" value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">توضیحات</label>
                  <input className="form-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.is_default} onChange={e => setForm({ ...form, is_default: e.target.checked })} />
                  <span>نشانی پیش‌فرض</span>
                </label>
              </div>
              <button className="btn btn-primary mt-4" type="submit">{editing ? 'به‌روزرسانی' : 'افزودن'}</button>
            </form>
          </div>
        )}

        {addresses.length === 0 && !showForm ? (
          <div className="empty-state"><div className="icon">📍</div><h3>نشانی ثبت نشده</h3></div>
        ) : (
          addresses.map(a => (
            <div key={a.id} className="card" style={{ padding: '20px', marginBottom: '12px' }}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex gap-2 items-center">
                    <strong>{a.recipient_name}</strong>
                    {a.is_default && <span className="badge badge-in">پیش‌فرض</span>}
                  </div>
                  <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '4px' }}>
                    📞 {a.phone} | 📍 {a.full_address}, {a.city}, {a.province}
                    {a.postal_code && ` | کد پستی: ${a.postal_code}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(a)}>ویرایش</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(a.id)}>حذف</button>
                </div>
              </div>
            </div>
          ))
        )}
      </DashLayout>
    </div>
  );
}
