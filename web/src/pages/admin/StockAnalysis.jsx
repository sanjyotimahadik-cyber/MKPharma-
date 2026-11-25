import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/Toast.jsx';
import { api, qs } from '../../lib/api.js';
import { Bar, Doughnut } from '../../lib/charts.js';
import { formatDate, inr } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import './StockAnalysis.css';

const STATUSES = { in: 'In Stock', low: 'Low Stock', critical: 'Critical', out: 'Out of Stock' };
const statusOf = ({ stock, reorderLevel }) =>
  stock <= 0 ? 'out' : stock <= reorderLevel / 2 ? 'critical' : stock <= reorderLevel ? 'low' : 'in';
const batchOf = (p) =>
  p.name.split(/[\s-]+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2) + p.code.replace(/\D/g, '');
// Server timestamps are 'YYYY-MM-DD HH:MM:SS'; the T form parses in every browser.
const isoOf = (ts) => ts?.replace(' ', 'T');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const THIS_YEAR = new Date().getFullYear();
const TOP_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#7c3aed', '#dc2626', '#94a3b8'];

const tooltip = { backgroundColor: '#1f2937', cornerRadius: 8, padding: 12 };
const legendLabels = { color: '#374151', font: { size: 13, weight: '600' } };
const barOptions = {
  maintainAspectRatio: false,
  plugins: { legend: { labels: legendLabels }, tooltip },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#6b7280' } },
    y: { beginAtZero: true, grid: { color: '#e5e7eb' }, ticks: { color: '#6b7280', precision: 0 } },
  },
};
const doughnutOptions = {
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: { position: 'bottom', labels: { ...legendLabels, padding: 18, boxWidth: 16 } },
    tooltip: { ...tooltip, callbacks: { label: (c) => `${c.label} : ${c.parsed} units` } },
  },
};

const CARDS = [
  { key: 'total', title: 'Total Products', note: 'Registered Products', icon: 'fa-boxes-stacked', color: 'blue' },
  { key: 'in', title: 'In Stock', note: 'Available Products', icon: 'fa-circle-check', color: 'green' },
  { key: 'low', title: 'Low Stock', note: 'Need Restocking', icon: 'fa-triangle-exclamation', color: 'orange' },
  { key: 'out', title: 'Out of Stock', note: 'Immediate Action', icon: 'fa-ban', color: 'red' },
];
const COLUMNS = ['Product', 'Batch No.', 'Category', 'Stock', 'Price (₹)', 'Status', 'Last Updated'];

function downloadCsv(rows) {
  const lines = [COLUMNS, ...rows.map((r) => [r.name, r.batch, r.category, r.stock, r.price, STATUSES[r.status], formatDate(r.updated)])];
  const csv = lines.map((l) => l.map((v) => `"${v}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'Inventory_Report.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

function StockForm({ product, busy, onCancel, onSave }) {
  const [qty, setQty] = useState('');
  const [type, setType] = useState('add');
  const [remarks, setRemarks] = useState('');
  const submit = (e) => {
    e.preventDefault();
    onSave({ quantity: Number(qty), type, reason: remarks });
  };
  return (
    <form onSubmit={submit}>
      <div className="form-group"><label>Product Name</label><input value={product.name} readOnly /></div>
      <div className="form-group"><label>Current Stock</label><input type="number" value={product.stock} readOnly /></div>
      <div className="form-group">
        <label>Update Quantity</label>
        <input type="number" min="1" required value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Enter Quantity" autoFocus />
      </div>
      <div className="form-group">
        <label>Update Type</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="add">Add Stock</option>
          <option value="remove">Remove Stock</option>
        </select>
      </div>
      <div className="form-group">
        <label>Remarks</label>
        <textarea rows="3" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Enter Remarks (Optional)" />
      </div>
      <div className="modal-buttons">
        <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="save-btn" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</button>
      </div>
    </form>
  );
}

function StockHistory({ productId }) {
  const { data, loading } = useApi(`/products/stock/transactions${qs({ productId, limit: 5 })}`, []);
  return (
    <div className="history">
      <h4>Recent Stock Movements</h4>
      {!data.length && <p>{loading ? 'Loading…' : 'No stock movements recorded.'}</p>}
      <ul>
        {data.map((t) => (
          <li key={t.id}>
            <span className={t.quantity < 0 ? 'out' : 'in'}>{t.quantity > 0 ? `+${t.quantity}` : t.quantity}</span>
            <div>
              <b>{t.reason || t.type}</b>
              <small>{formatDate(isoOf(t.createdAt))} · {t.user || '—'}</small>
            </div>
            <em>Bal. {t.newQuantity}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Dialog({ icon, title, onClose, children }) {
  return (
    <div className="stock-modal-content">
      <div className="stock-modal-header">
        <h2><i className={`fa-solid ${icon}`} /> {title}</h2>
        <button className="close-modal" onClick={onClose} aria-label="Close"><i className="fa-solid fa-xmark" /></button>
      </div>
      <div className="stock-modal-body">{children}</div>
    </div>
  );
}

export default function StockAnalysis() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: products, loading, error, setData: setProducts } = useApi('/products', []);
  const [year, setYear] = useState(THIS_YEAR);
  const summary = useApi(`/products/stock/summary${qs({ year })}`);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null); // { kind: 'view' | 'update' | 'delete', id }
  const [busy, setBusy] = useState(false);

  const loadError = error ?? summary.error;
  useEffect(() => {
    if (loadError) toast(loadError.message, 'error');
  }, [loadError, toast]);

  const rows = useMemo(
    () => products.map((p) => ({ ...p, batch: batchOf(p), status: statusOf(p), updated: isoOf(p.updatedAt) })),
    [products],
  );
  const counts = useMemo(() => {
    const c = { total: rows.length, in: 0, low: 0, critical: 0, out: 0 };
    rows.forEach((r) => c[r.status]++);
    return { ...c, low: c.low + c.critical };
  }, [rows]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) => (filter === 'all' || r.status === filter) && [r.name, r.batch, r.category].some((v) => v.toLowerCase().includes(q)),
    );
  }, [rows, query, filter]);

  const stats = summary.data;
  const barData = useMemo(
    () => ({
      labels: MONTHS,
      datasets: [{
        label: 'Units Sold',
        data: stats?.monthly ?? [],
        backgroundColor: '#2563eb',
        hoverBackgroundColor: '#1d4ed8',
        borderRadius: 8,
        borderSkipped: false,
      }],
    }),
    [stats],
  );
  const doughnutData = useMemo(
    () => ({
      labels: stats?.top.map((t) => t.name),
      datasets: [{ data: stats?.top.map((t) => t.units), backgroundColor: TOP_COLORS, borderColor: '#fff', borderWidth: 3, hoverOffset: 12 }],
    }),
    [stats],
  );

  const current = modal && rows.find((r) => r.id === modal.id);
  const close = () => setModal(null);

  // Runs a request with the busy flag, closes the dialog on success and toasts the outcome.
  const run = async (fn, message) => {
    setBusy(true);
    try {
      await fn();
      toast(message, 'success');
      close();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  const saveStock = (body) =>
    run(async () => {
      const saved = await api.post(`/products/${current.id}/stock`, body);
      setProducts((list) => list.map((p) => (p.id === saved.id ? saved : p)));
    }, 'Stock updated successfully.');
  const remove = () =>
    run(async () => {
      await api.del(`/products/${current.id}`);
      setProducts((list) => list.filter((p) => p.id !== current.id));
    }, `"${current.name}" removed from inventory.`);

  return (
    <div className="pg-stock">
      <header className="top-navbar">
        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products, batches, categories..." />
        </div>
        <div className="company-info">
          <img src="/assets/logo.png" alt="Company Logo" />
          <div><h3>MK Animal Health</h3><p>Admin Panel</p></div>
        </div>
      </header>

      <section className="page-header">
        <h1>Stock Analysis</h1>
        <p>
          Dashboard <i className="fa-solid fa-angle-right" /> Inventory Management <i className="fa-solid fa-angle-right" />
          <span>Stock Analysis</span>
        </p>
      </section>

      <section className="inventory-overview">
        <div className="section-title">
          <div>
            <h2>Inventory Overview</h2>
            <p>Monitor product availability and stock performance.</p>
          </div>
          <div className="overview-actions">
            <button className="btn-export" onClick={() => downloadCsv(visible)}><i className="fa-solid fa-file-export" /> Export</button>
            <button className="btn-add-product" onClick={() => navigate('/admin/products')}><i className="fa-solid fa-plus" /> Add Product</button>
          </div>
        </div>
        <div className="inventory-cards">
          {CARDS.map((c) => (
            <div key={c.key} className="inventory-card">
              <div className={`card-icon ${c.color}`}><i className={`fa-solid ${c.icon}`} /></div>
              <div className="card-details">
                <h3>{c.title}</h3>
                <h2>{counts[c.key]}</h2>
                <span>{c.note}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="charts-section">
        <div className="chart-card">
          <div className="chart-header">
            <div><h2>Monthly Product Sales</h2><p>Units sold per month across all orders</p></div>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {(stats?.years ?? [year]).map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div className="chart-body"><Bar data={barData} options={barOptions} /></div>
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <div><h2>Top Selling Products</h2><p>Best performing products by units sold in {year}</p></div>
          </div>
          <div className="chart-body">
            {stats?.top.length ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : (
              <p className="chart-empty">{summary.loading ? 'Loading…' : `No sales recorded in ${year}.`}</p>
            )}
          </div>
        </div>
      </section>

      <section className="inventory-table-section">
        <div className="table-header">
          <div><h2>Product Inventory</h2><p>Manage inventory and monitor stock levels.</p></div>
          <div className="table-actions">
            <div className="table-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Product..." />
            </div>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Status</option>
              {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="table-container">
          <table className="inventory-table">
            <thead>
              <tr>{[...COLUMNS, 'Action'].map((h) => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.batch}</td>
                  <td>{r.category}</td>
                  <td>{r.stock}</td>
                  <td>{r.price}</td>
                  <td><span className={`status ${r.status}`}>{STATUSES[r.status]}</span></td>
                  <td>{formatDate(r.updated)}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="view-btn" title="View" onClick={() => setModal({ kind: 'view', id: r.id })}><i className="fa-solid fa-eye" /></button>
                      <button className="edit-btn" title="Edit" onClick={() => navigate('/admin/products')}><i className="fa-solid fa-pen" /></button>
                      <button className="update-btn" title="Update Stock" onClick={() => setModal({ kind: 'update', id: r.id })}><i className="fa-solid fa-box" /></button>
                      <button className="delete-btn" title="Delete" onClick={() => setModal({ kind: 'delete', id: r.id })}><i className="fa-solid fa-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!visible.length && <tr><td colSpan={8} className="empty">{loading ? 'Loading products…' : 'No products found.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={!!current} onClose={close} className="stock-modal">
        {modal?.kind === 'update' && (
          <Dialog icon="fa-box-open" title="Update Stock" onClose={close}>
            <StockForm product={current} busy={busy} onCancel={close} onSave={saveStock} />
          </Dialog>
        )}
        {modal?.kind === 'view' && (
          <Dialog icon="fa-eye" title="Product Details" onClose={close}>
            <dl className="details">
              {[['Product', current.name], ['Batch', current.batch], ['Category', current.category], ['Stock', current.stock],
                ['Reorder Level', current.reorderLevel], ['Price', inr(current.price)], ['Status', STATUSES[current.status]],
                ['Expiry', formatDate(current.expiry)], ['Last Updated', formatDate(current.updated)]].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
            <StockHistory productId={current.id} />
          </Dialog>
        )}
        {modal?.kind === 'delete' && (
          <Dialog icon="fa-trash" title="Delete Product" onClose={close}>
            <p className="confirm-text">Remove <b>{current.name}</b> from inventory? Past orders keep their history.</p>
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={close}>Cancel</button>
              <button className="save-btn danger" onClick={remove} disabled={busy}>Delete</button>
            </div>
          </Dialog>
        )}
      </Modal>
    </div>
  );
}
