import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/Toast.jsx';
import { api, qs } from '../../lib/api.js';
import { currentUser, logout } from '../../lib/auth.js';
import { Bar, Doughnut } from '../../lib/charts.js';
import { formatDate, inr } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import './Dashboard.css';

const MENU = [
  { icon: 'fa-house', label: 'Dashboard', to: '/admin' },
  { icon: 'fa-boxes-stacked', label: 'Inventory Management', to: '/admin/inventory' },
  { icon: 'fa-users-gear', label: 'User Management', to: '/admin/users' },
  { icon: 'fa-user-plus', label: 'Registration Requests', to: '/admin/registrations', badge: 'registrations' },
  { icon: 'fa-calendar-check', label: 'Attendance Management', to: '/admin/attendance' },
  { icon: 'fa-bullseye', label: 'Target Tracking', to: '/admin/targets' },
  { icon: 'fa-file-invoice-dollar', label: 'Billing & Finance', to: '/admin/billing' },
  { icon: 'fa-gear', label: 'Settings', to: '/admin/settings' },
];

const KPIS = [
  { key: 'sales', icon: 'fa-cart-shopping', color: 'blue', label: 'Total Sales (This Year)', money: true },
  { key: 'orders', icon: 'fa-box', color: 'green', label: 'Total Orders (This Year)' },
  { key: 'doctors', icon: 'fa-user-doctor', color: 'purple', label: 'Active Doctors' },
  { key: 'revenue', icon: 'fa-sack-dollar', color: 'orange', label: 'Revenue Collected', money: true },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const COLORS = ['#2F80ED', '#44C776', '#8B5CF6', '#F9A826', '#EF4444', '#06B6D4'];

const salesOptions = {
  maintainAspectRatio: false,
  animation: { duration: 1800 },
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${inr(c.raw)}` } } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, grid: { color: '#EEF3F8' }, ticks: { callback: (v) => `₹${(v / 100000).toFixed(1)}L` } },
  },
};
const overviewOptions = {
  maintainAspectRatio: false,
  cutout: '72%',
  plugins: {
    legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 18, font: { size: 13 } } },
    tooltip: { callbacks: { label: (c) => ` ${c.label}: ${inr(c.raw)}` } },
  },
};

function useCountUp(target, frames = 120) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    let raf;
    const tick = () => {
      frame += 1;
      setValue(Math.floor((target * frame) / frames));
      if (frame < frames) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, frames]);
  return value;
}

function KpiCard({ icon, color, label, money, value = 0, change, i }) {
  const count = useCountUp(value);
  const down = change < 0;
  return (
    <div className="card rise" style={{ '--i': i }}>
      <div className={`card-icon ${color}`}><i className={`fa-solid ${icon}`} /></div>
      <div className="card-info">
        <h4>{label}</h4>
        <h2>{money ? inr(count) : count.toLocaleString('en-IN')}</h2>
        {change == null ? (
          <p className="increase flat"><i className="fa-solid fa-minus" />No change data vs last month</p>
        ) : (
          <p className={down ? 'increase decrease' : 'increase'}>
            <i className={`fa-solid fa-arrow-trend-${down ? 'down' : 'up'}`} />{Math.abs(change)}% vs last month
          </p>
        )}
      </div>
    </div>
  );
}

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
};

export default function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [year, setYear] = useState('');
  const { data, error, setData } = useApi(`/dashboard${qs({ year })}`);
  const pendingRegistrations = useApi('/registrations?status=Pending').data?.counts.Pending ?? 0;
  const [collapsed, setCollapsed] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [search, setSearch] = useState('');
  const name = currentUser()?.name ?? 'Administrator';

  useEffect(() => {
    if (error) toast(error.message, 'error');
  }, [error, toast]);

  const q = search.trim().toLowerCase();
  const matches = (...fields) => !q || fields.join(' ').toLowerCase().includes(q);
  const recent = (data?.recentOrders ?? []).filter((o) => matches(o.orderNumber, o.buyer?.name, o.status));
  const lowStock = (data?.lowStock ?? []).filter((p) => matches(p.name, p.code));
  const notes = data?.notifications ?? { unread: 0, items: [] };

  const salesData = useMemo(() => ({
    labels: MONTHS,
    datasets: [{ label: 'Sales', data: data?.monthlySales ?? [], backgroundColor: '#2F80ED', borderRadius: 8, borderSkipped: false, maxBarThickness: 28 }],
  }), [data?.monthlySales]);
  const overviewData = useMemo(() => ({
    labels: (data?.categories ?? []).map((c) => c.category),
    datasets: [{ data: (data?.categories ?? []).map((c) => c.total), backgroundColor: COLORS, borderWidth: 0, hoverOffset: 15 }],
  }), [data?.categories]);

  const markRead = (ids, unread) =>
    setData((d) => ({ ...d, notifications: { unread, items: d.notifications.items.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n)) } }));

  async function readOne(n) {
    if (n.isRead) return;
    try {
      await api.patch(`/notifications/${n.id}/read`);
      markRead([n.id], Math.max(0, notes.unread - 1));
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  async function readAll() {
    try {
      await api.patch('/notifications/read-all');
      markRead(notes.items.map((n) => n.id), 0);
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  const doLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`pg-admin-dashboard${collapsed ? ' collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/assets/logo.png" alt="MK Animal Health" />
          <h2>MK Animal Health</h2>
          <p>Distribution ERP</p>
        </div>
        <nav className="menu">
          {MENU.map(({ icon, label, to, badge }) => (
            <Link key={label} to={to} className={`menu-item${to === '/admin' ? ' active' : ''}`} title={label}>
              <i className={`fa-solid ${icon}`} /><span>{label}</span>
              {badge === 'registrations' && pendingRegistrations > 0 && <b className="menu-badge">{pendingRegistrations}</b>}
            </Link>
          ))}
          <button className="menu-item" onClick={() => setConfirmLogout(true)} title="Logout">
            <i className="fa-solid fa-right-from-bracket" /><span>Logout</span>
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setCollapsed((c) => !c)} aria-label="Toggle menu">
            <i className="fa-solid fa-bars" />
          </button>
          <form className="search-box" onSubmit={(e) => { e.preventDefault(); if (q) navigate(`/admin/billing${qs({ search: search.trim() })}`); }}>
            <i className="fa-solid fa-magnifying-glass" />
            <input type="search" placeholder="Filter orders & stock, Enter to search billing" value={search} onChange={(e) => setSearch(e.target.value)} />
          </form>
          <a href="#notifications" className="bell" aria-label={`${notes.unread} unread notifications`}>
            <i className="fa-solid fa-bell" />
            {notes.unread > 0 && <span>{notes.unread > 99 ? '99+' : notes.unread}</span>}
          </a>
          <div className="admin-profile">
            <div className="admin-avatar"><i className="fa-solid fa-user-shield" /></div>
            <div className="admin-details">
              <h4>{name}</h4>
              <p>{currentUser()?.meta?.designation ?? 'Administrator'}</p>
            </div>
          </div>
        </header>

        <section className="welcome rise">
          <h1>{greeting()} 👋</h1>
          <p>Welcome back, {name}. Manage your inventory, billing, users and reports from one place.</p>
        </section>

        <section className="cards">
          {KPIS.map((k, i) => <KpiCard key={k.key} {...k} {...data?.kpis[k.key]} i={i + 1} />)}
        </section>

        <section className="chart-section">
          <div className="panel rise" style={{ '--i': 5 }}>
            <div className="chart-header">
              <h2>Monthly Sales</h2>
              <select value={data?.year ?? ''} onChange={(e) => setYear(e.target.value)} aria-label="Year">
                {(data?.years ?? []).map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="chart"><Bar data={salesData} options={salesOptions} /></div>
          </div>
          <div className="panel rise" style={{ '--i': 6 }}>
            <div className="chart-header"><h2>Sales by Category</h2></div>
            <div className="chart">
              {data && !data.categories.length ? <p className="muted">No sales in {data.year}</p> : <Doughnut data={overviewData} options={overviewOptions} />}
            </div>
          </div>
        </section>

        <section className="panel rise" style={{ '--i': 7 }}>
          <div className="chart-header">
            <h2>Recent Orders</h2>
            <Link to="/admin/billing" className="panel-link">View all <i className="fa-solid fa-arrow-right" /></Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td>{o.orderNumber}</td>
                    <td>{o.buyer?.name}</td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td>{inr(o.total)}</td>
                    <td><span className={`badge ${o.status.toLowerCase()}`}>{o.status}</span></td>
                  </tr>
                ))}
                {!recent.length && <tr><td colSpan={5} className="muted">{data ? 'No matching orders' : 'Loading…'}</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bottom-grid">
          <div className="panel rise" style={{ '--i': 8 }} id="notifications">
            <div className="chart-header">
              <h2>Notifications</h2>
              {notes.unread > 0 && <button className="panel-link" onClick={readAll}>Mark all read</button>}
            </div>
            <ul className="notifications">
              {notes.items.map((n) => (
                <li key={n.id} className={n.isRead ? 'read' : ''} onClick={() => readOne(n)} title={n.isRead ? '' : 'Mark as read'}>
                  <div><strong>{n.title}</strong><p>{n.message}</p><small>{formatDate(n.createdAt)}</small></div>
                </li>
              ))}
              {!notes.items.length && <li className="read">{data ? 'You are all caught up' : 'Loading…'}</li>}
            </ul>
          </div>
          <div className="panel rise" style={{ '--i': 9 }}>
            <div className="chart-header">
              <h2>Low Stock Products</h2>
              <Link to="/admin/inventory" className="panel-link">Inventory <i className="fa-solid fa-arrow-right" /></Link>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Product</th><th>Stock</th></tr></thead>
                <tbody>
                  {lowStock.slice(0, 5).map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td><span className="badge low">{p.stock} Left</span></td>
                    </tr>
                  ))}
                  {!lowStock.length && <tr><td colSpan={2} className="muted">{data ? 'All products are well stocked' : 'Loading…'}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <Modal open={confirmLogout} onClose={() => setConfirmLogout(false)} className="admin-dash-logout">
        <div className="logout-popup">
          <div className="logout-popup-icon"><i className="fa-solid fa-right-from-bracket" /></div>
          <h2>Logout</h2>
          <p>Are you sure you want to logout from <strong>MK Animal Health ERP</strong>?</p>
          <div className="logout-actions">
            <button className="cancel" onClick={() => setConfirmLogout(false)}>Cancel</button>
            <button className="confirm" onClick={doLogout}>Logout</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
