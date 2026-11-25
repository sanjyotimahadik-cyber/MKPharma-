import { Navigate } from 'react-router';
import { getToken } from '../lib/api.js';
import { currentUser, HOME } from '../lib/auth.js';

export default function RequireAuth({ role, children }) {
  const user = currentUser();
  if (!user || !getToken()) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={HOME[user.role]} replace />;
  return children;
}
