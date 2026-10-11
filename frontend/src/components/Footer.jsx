import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function Footer() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    api.get('/settings').then(d => setSettings(d.settings || {})).catch(() => {});
  }, []);

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
              <span className="logo-icon" style={{ width: '36px', height: '36px', background: 'var(--turquoise)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🐟</span>
              {settings.brand_name || 'دریاپاک'}
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>{settings.about_text || ''}</p>
          </div>
          <div>
            <h4>دسترسی سریع</h4>
            <ul>
              <li><Link to="/products">محصولات</Link></li>
              <li><Link to="/about">درباره ما</Link></li>
              <li><Link to="/contact">تماس با ما</Link></li>
              <li><Link to="/track-order">پیگیری سفارش</Link></li>
            </ul>
          </div>
          <div>
            <h4>قوانین</h4>
            <ul>
              <li><Link to="/terms">قوانین ثبت سفارش</Link></li>
              <li><Link to="/privacy">حریم خصوصی</Link></li>
            </ul>
          </div>
          <div>
            <h4>تماس با ما</h4>
            <ul>
              <li>📞 {settings.phone || ''}</li>
              <li>📱 {settings.phone2 || ''}</li>
              <li>📍 {settings.address || ''}</li>
              <li>🕐 {settings.working_hours || ''}</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} {settings.brand_name || 'دریاپاک'} — تمامی حقوق محفوظ است
        </div>
      </div>
    </footer>
  );
}
