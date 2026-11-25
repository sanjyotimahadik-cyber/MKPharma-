import { Link } from 'react-router';
import BackLink from '../../components/BackLink.jsx';
import { staffBase } from '../../lib/orders.js';
import './Inventory.css';

const OPTIONS = [
  {
    icon: 'fa-box-open',
    title: 'Product Management',
    text: 'Add new products, update existing products, view inventory and manage stock.',
    to: 'products',
  },
  {
    icon: 'fa-building',
    title: 'Branch Management',
    text: 'Manage all company branches, their managers, contacts and storage capacity.',
    to: 'branches',
    adminOnly: true,
  },
  {
    icon: 'fa-chart-line',
    title: 'Stock Analysis',
    text: 'Monitor low stock, expired products, returned stock and inventory reports.',
    to: 'stock',
  },
];

export default function Inventory() {
  const base = staffBase();
  const options = OPTIONS.filter((o) => !o.adminOnly || base === '/admin');
  return (
    <div className="pg-inventory">
      <header className="inventory-header">
        <div>
          <BackLink />
          <h1>Inventory Management</h1>
          <p>{base === '/admin' ? 'Manage products, branches and inventory analysis.' : 'Manage products, stock levels and inventory analysis.'}</p>
        </div>
        <div className="header-logo">
          <img src="/assets/logo.png" alt="MK Animal Health" />
          <h2>MK Animal Health</h2>
          <p>Distribution ERP</p>
        </div>
      </header>

      <section className="inventory-options">
        {options.map(({ icon, title, text, to }, i) => (
          <Link key={title} style={{ '--i': i }} to={`${base}/${to}`} className="inventory-card">
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
