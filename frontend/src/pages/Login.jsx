import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      show('ورود موفق', 'success');
      navigate(user.role === 'customer' ? '/account' : '/admin');
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>ورود به حساب</h2>
        <p className="subtitle">به دریاپاک خوش آمدید</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">ایمیل</label>
            <input className="form-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" />
          </div>
          <div className="form-group">
            <label className="form-label">رمز عبور</label>
            <input className="form-input" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
            {loading ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>
        <p className="text-center mt-4" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          حساب ندارید؟ <Link to="/register" style={{ color: 'var(--turquoise-dark)', fontWeight: 600 }}>ثبت‌نام کنید</Link>
        </p>
        <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-light)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-light)' }}>
          ورود مدیر: admin@daryapak.ir / admin123456
        </div>
      </div>
    </div>
  );
}
