import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page">
      <div className="container">
        <div className="empty-state">
          <div className="icon">🔍</div>
          <h1 style={{ fontSize: '3rem', color: 'var(--ocean-deep)' }}>۴۰۴</h1>
          <h3>صفحه مورد نظر یافت نشد</h3>
          <p style={{ marginTop: '8px' }}>آدرس اشتباه است یا صفحه حذف شده است</p>
          <Link to="/" className="btn btn-primary mt-4">بازگشت به خانه</Link>
        </div>
      </div>
    </div>
  );
}
