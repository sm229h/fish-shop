import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DashLayout from '../../components/DashLayout';

const sidebarItems = [{
  links: [
    { to: '/account', icon: '📊', label: 'داشبورد', end: true },
    { to: '/account/orders', icon: '📦', label: 'سفارش‌های من' },
    { to: '/account/addresses', icon: '📍', label: 'نشانی‌ها' },
    { to: '/account/profile', icon: '👤', label: 'اطلاعات حساب' },
  ]
}];

export default function AccountProfile() {
  const { user, updateProfile } = useAuth();
  const { show } = useToast();
  const [form, setForm] = useState({ first_name: user?.first_name || '', last_name: user?.last_name || '', phone: user?.phone || '' });
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '' });
  const [loading, setLoading] = useState(false);

  const handleProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await updateProfile(form); show('اطلاعات به‌روز شد', 'success'); }
    catch (err) { show(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const api = (await import('../../api/client')).default;
      await api.put('/auth/password', pwdForm);
      show('رمز عبور تغییر کرد', 'success');
      setPwdForm({ current_password: '', new_password: '' });
    } catch (err) { show(err.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="page">
      <DashLayout items={sidebarItems}>
        <h1 style={{ marginBottom: '20px', color: 'var(--ocean-deep)' }}>اطلاعات حساب</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="profile-layout">
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>اطلاعات شخصی</h3>
            <form onSubmit={handleProfile}>
              <div className="form-group">
                <label className="form-label">نام</label>
                <input className="form-input" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">نام خانوادگی</label>
                <input className="form-input" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">شماره تماس</label>
                <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">ایمیل</label>
                <input className="form-input" value={user?.email} disabled style={{ opacity: 0.6 }} />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading}>ذخیره تغییرات</button>
            </form>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>تغییر رمز عبور</h3>
            <form onSubmit={handlePassword}>
              <div className="form-group">
                <label className="form-label">رمز فعلی</label>
                <input className="form-input" type="password" required value={pwdForm.current_password} onChange={e => setPwdForm({ ...form, current_password: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">رمز جدید</label>
                <input className="form-input" type="password" required minLength={6} value={pwdForm.new_password} onChange={e => setPwdForm({ ...form, new_password: e.target.value })} />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading}>تغییر رمز</button>
            </form>
          </div>
        </div>
      </DashLayout>
    </div>
  );
}
