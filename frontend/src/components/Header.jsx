import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../api/client';

export default function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settings, setSettings] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/settings').then(d => setSettings(d.settings || {})).catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { to: '/', label: 'صفحه اصلی' },
    { to: '/products', label: 'محصولات' },
    { to: '/about', label: 'درباره ما' },
    { to: '/contact', label: 'تماس با ما' },
    { to: '/track-order', label: 'پیگیری سفارش' },
  ];

  return (
    <header className="header">
      <div className="header-top">
        <div className="container">
          <span>📞 {settings.phone || ''} | 📍 {settings.address || ''}</span>
          <span>{settings.working_hours || ''}</span>
        </div>
      </div>
      <div className="header-main">
        <div className="container">
          <Link to="/" className="header-logo">
            <span className="logo-icon">🐟</span>
            {settings.brand_name || 'دریاپاک'}
          </Link>
          <nav className={`header-nav ${mobileOpen ? 'open' : ''}`}>
            {navItems.map(n => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'} onClick={() => setMobileOpen(false)}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <Link to="/cart" className="header-cart">
              🛒
              {count > 0 && <span className="cart-count">{count}</span>}
            </Link>
            {user ? (
              <div className="flex items-center gap-2">
                <Link to={user.role === 'customer' ? '/account' : '/admin'} className="btn btn-outline btn-sm" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}>
                  {user.role === 'customer' ? 'پنل من' : 'مدیریت'}
                </Link>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ color: '#fff' }}>خروج</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="btn btn-outline btn-sm" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}>ورود</Link>
                <Link to="/register" className="btn btn-primary btn-sm">ثبت‌نام</Link>
              </div>
            )}
            <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>☰</button>
          </div>
        </div>
      </div>
    </header>
  );
}
