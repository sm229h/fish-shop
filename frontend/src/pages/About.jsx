import { useState, useEffect } from 'react';
import api from '../api/client';
import Loading from '../components/Loading';

export default function About() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings').then(d => setSettings(d.settings || {})).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="در حال بارگذاری..." />;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="section-title">
          <h1>درباره {settings.brand_name || 'دریاپاک'}</h1>
        </div>
        <div className="card" style={{ padding: '32px' }}>
          <p style={{ lineHeight: 1.9, fontSize: '1rem', color: 'var(--text-light)' }}>{settings.about_text}</p>
          <div className="about-features" style={{ marginTop: '32px' }}>
            <div className="about-feature" style={{ background: 'var(--bg-lighter)' }}>
              <div className="feature-icon">🐟</div>
              <h4 style={{ color: 'var(--ocean-deep)' }}>تضمین تازگی</h4>
              <p style={{ color: 'var(--text-light)' }}>محصولات مستقیماً از بنادر صید</p>
            </div>
            <div className="about-feature" style={{ background: 'var(--bg-lighter)' }}>
              <div className="feature-icon">❄️</div>
              <h4 style={{ color: 'var(--ocean-deep)' }}>زنجیره سرد</h4>
              <p style={{ color: 'var(--text-light)' }}>حمل و نقل تخصصی با دمای کنترل‌شده</p>
            </div>
            <div className="about-feature" style={{ background: 'var(--bg-lighter)' }}>
              <div className="feature-icon">🚚</div>
              <h4 style={{ color: 'var(--ocean-deep)' }}>ارسال سریع</h4>
              <p style={{ color: 'var(--text-light)' }}>تحویل به موقع و مطمئن</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
