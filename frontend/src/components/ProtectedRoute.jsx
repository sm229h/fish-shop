import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, admin }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && !['admin', 'super_admin'].includes(user.role)) return <Navigate to="/" replace />;

  return children;
}
