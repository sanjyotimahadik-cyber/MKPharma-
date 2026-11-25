import { Link } from 'react-router';

export default function BackLink({ to = '/admin', children = 'Dashboard' }) {
  return (
    <Link to={to} className="back-link">
      <i className="fa-solid fa-arrow-left" /> {children}
    </Link>
  );
}
