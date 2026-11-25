import { Link } from 'react-router';
import BackLink from '../../components/BackLink.jsx';
import './Inventory.css';

const OPTIONS = [
  {
    icon: 'fa-box-open',
    title: 'Product Management',
    text: 'Add new products, update existing products, view inventory and manage stock.',
    to: '/admin/products',
  },
  {
    icon: 'fa-building',
    title: 'Branch Management',
    text: 'Manage all company branches, their managers, contacts and storage capacity.',
    to: '/admin/branches',
  },
  {
    icon: 'fa-chart-line',
    title: 'Stock Analysis',
    text: 'Monitor low stock, expired products, returned stock and inventory reports.',
    to: '/admin/stock',
  },
];

export default function Inventory() {
  return (
    <div className="pg-inventory">
      <header className="inventory-header">
        <div>
          <BackLink />
          <h1>Inventory Management</h1>
          <p>Manage products, branches and inventory analysis.</p>
        </div>
        <div className="header-logo">
          <img src="/assets/logo.png" alt="MK Animal Health" />
          <h2>MK Animal Health</h2>
          <p>Distribution ERP</p>
        </div>
      </header>

      <section className="inventory-options">
        {OPTIONS.map(({ icon, title, text, to }, i) => (
          <Link key={title} style={{ '--i': i }} to={to} className="inventory-card">
            <div className="card-icon"><i className={`fa-solid ${icon}`} /></div>
            <div className="card-content">
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
            <div className="card-arrow"><i className="fa-solid fa-arrow-right" /></div>
          </Link>
        ))}
      </section>
    </div>
  );
}
