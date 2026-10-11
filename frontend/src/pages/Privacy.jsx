import { useState, useEffect } from 'react';
import api from '../api/client';
import Loading from '../components/Loading';

export default function Privacy() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings').then(d => setSettings(d.settings || {})).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="در حال بارگذاری..." />;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="section-title"><h1>حریم خصوصی</h1></div>
        <div className="card" style={{ padding: '32px', lineHeight: 1.9, color: 'var(--text-light)' }}>
          <p>{settings.privacy_text || 'متن حریم خصوصی توسط مدیریت تنظیم می‌شود.'}</p>
        </div>
      </div>
    </div>
  );
}
