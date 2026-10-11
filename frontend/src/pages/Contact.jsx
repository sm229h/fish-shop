import { useState, useEffect } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';

export default function Contact() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const { show } = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  useEffect(() => {
    api.get('/settings').then(d => setSettings(d.settings || {})).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="در حال بارگذاری..." />;

  const handleSubmit = (e) => {
    e.preventDefault();
    show('پیام شما ثبت شد. به‌زودی پاسخ خواهیم داد.', 'success');
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="section-title"><h1>تماس با ما</h1></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="contact-layout">
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--ocean-deep)' }}>اطلاعات تماس</h3>
            <div style={{ lineHeight: 2, color: 'var(--text-light)' }}>
              <div>📞 {settings.phone}</div>
              <div>📱 {settings.phone2}</div>
              <div>📍 {settings.address}</div>
              <div>🕐 {settings.working_hours}</div>
              {settings.instagram && <div>📷 <a href={settings.instagram} target="_blank" rel="noreferrer" style={{ color: 'var(--turquoise-dark)' }}>اینستاگرام</a></div>}
            </div>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--ocean-deep)' }}>فرم تماس</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">نام</label>
                <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">ایمیل</label>
                <input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">پیام</label>
                <textarea className="form-textarea" required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              </div>
              <button className="btn btn-primary w-full" type="submit">ارسال پیام</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
