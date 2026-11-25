import { Navigate } from 'react-router';
import { getToken } from '../lib/api.js';
import { currentUser, HOME } from '../lib/auth.js';

/** role: one role or a list of roles allowed to open the page. */
export default function RequireAuth({ role, children }) {
  const user = currentUser();
  if (!user || !getToken()) return <Navigate to="/login" replace />;
  if (![role].flat().includes(user.role)) return <Navigate to={HOME[user.role]} replace />;
  return children;
}
