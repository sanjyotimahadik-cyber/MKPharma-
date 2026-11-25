import { Link } from 'react-router';
import { currentUser, HOME } from '../lib/auth.js';

/** Link back to the signed-in user's dashboard (or `to`). */
export default function BackLink({ to, children = 'Dashboard' }) {
  return (
    <Link to={to ?? HOME[currentUser()?.role] ?? '/admin'} className="back-link">
      <i className="fa-solid fa-arrow-left" /> {children}
    </Link>
  );
}
