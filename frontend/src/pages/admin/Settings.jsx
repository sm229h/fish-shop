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

const FIELDS = [
  { key: 'brand_name', label: 'نام برند' },
  { key: 'brand_slogan', label: 'شعار برند' },
  { key: 'phone', label: 'شماره تماس ۱' },
  { key: 'phone2', label: 'شماره تماس ۲' },
  { key: 'address', label: 'آدرس' },
  { key: 'working_hours', label: 'ساعات کاری' },
  { key: 'instagram', label: 'اینستاگرام' },
  { key: 'shipping_cost', label: 'هزینه ارسال (تومان)' },
  { key: 'free_shipping_threshold', label: 'حداقل سفارش برای ارسال رایگان' },
  { key: 'currency', label: 'واحد پول' },
  { key: 'about_text', label: 'متن درباره ما', textarea: true },
  { key: 'terms_text', label: 'متن قوانین ثبت سفارش', textarea: true },
  { key: 'privacy_text', label: 'متن حریم خصوصی', textarea: true },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  useEffect(() => {
    api.get('/settings').then(d => setSettings(d.settings || {})).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><DashLayout items={sidebarItems}><Loading /></DashLayout></div>;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      show('تنظیمات ذخیره شد', 'success');
    } catch (err) { show(err.message, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="page">
      <DashLayout items={sidebarItems}>
        <h1 style={{ marginBottom: '20px', color: 'var(--ocean-deep)' }}>تنظیمات سایت</h1>
        <form onSubmit={handleSave} className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {FIELDS.map(f => (
              <div key={f.key} className="form-group" style={{ gridColumn: f.textarea ? '1 / -1' : 'auto' }}>
                <label className="form-label">{f.label}</label>
                {f.textarea ? (
                  <textarea className="form-textarea" value={settings[f.key] || ''} onChange={e => setSettings({ ...settings, [f.key]: e.target.value })} />
                ) : (
                  <input className="form-input" value={settings[f.key] || ''} onChange={e => setSettings({ ...settings, [f.key]: e.target.value })} />
                )}
              </div>
            ))}
          </div>
          <button className="btn btn-primary mt-4" type="submit" disabled={saving}>{saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}</button>
        </form>
      </DashLayout>
    </div>
  );
}
