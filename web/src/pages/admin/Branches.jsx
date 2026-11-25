import { useEffect, useMemo, useState } from 'react';
import BackLink from '../../components/BackLink.jsx';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/Toast.jsx';
import { api } from '../../lib/api.js';
import { useApi } from '../../lib/useApi.js';
import './Branches.css';

const EMPTY = { code: '', name: '', city: '', manager: '', phone: '', capacity: '', status: 'Active' };
const FIELDS = [
  ['name', 'Branch Name', { required: true }],
  ['code', 'Branch Code', { placeholder: 'Auto-generated if empty' }],
  ['city', 'City', { required: true }],
  ['manager', 'Manager'],
  ['phone', 'Phone', { type: 'tel' }],
  ['capacity', 'Capacity (units)', { type: 'number', min: 0, required: true }],
];
const units = (n) => Number(n).toLocaleString('en-IN');

export default function Branches() {
  const toast = useToast();
  const { data: branches, loading, error, setData } = useApi('/branches', []);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [form, setForm] = useState(null); // null = closed; { id?, ...fields } = open
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (error) toast(error.message, 'error');
  }, [error, toast]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return branches.filter(
      (b) => (status === 'All' || b.status === status) && [b.name, b.code, b.city, b.manager].some((v) => v.toLowerCase().includes(q)),
    );
  }, [branches, query, status]);

  const active = branches.filter((b) => b.status === 'Active');
  const stats = [
    ['fa-building', 'Total Branches', branches.length, 'blue'],
    ['fa-circle-check', 'Active Branches', active.length, 'green'],
    ['fa-circle-pause', 'Inactive Branches', branches.length - active.length, 'orange'],
    ['fa-warehouse', 'Active Capacity', units(active.reduce((s, b) => s + b.capacity, 0)), 'purple'],
  ];

  // Runs a request with the busy flag and toasts the outcome.
  const run = async (fn, message) => {
    setBusy(true);
    try {
      await fn();
      toast(message, 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const save = (e) => {
    e.preventDefault();
    const { id, ...body } = form;
    run(async () => {
      const saved = id ? await api.put(`/branches/${id}`, body) : await api.post('/branches', body);
      setData((list) => (id ? list.map((b) => (b.id === id ? saved : b)) : [...list, saved]));
      setForm(null);
    }, id ? 'Branch updated' : 'Branch added');
  };

  const remove = () =>
    run(async () => {
      await api.del(`/branches/${deleting.id}`);
      setData((list) => list.filter((b) => b.id !== deleting.id));
      setDeleting(null);
    }, 'Branch deleted');

  const setField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div className="pg-branches">
      <header className="branches-header">
        <div>
          <BackLink to="/admin/inventory">Inventory</BackLink>
          <h1>Branch Management</h1>
          <p>Manage company branches, their managers and storage capacity.</p>
        </div>
        <div className="header-logo">
          <img src="/assets/logo.png" alt="MK Animal Health" />
          <div><h2>MK Animal Health</h2><p>Distribution ERP</p></div>
        </div>
      </header>

      <section className="stats">
        {stats.map(([icon, label, value, color]) => (
          <div className="stat-card" key={label}>
            <div className={`stat-icon ${color}`}><i className={`fa-solid ${icon}`} /></div>
            <div><span>{label}</span><h2>{value}</h2></div>
          </div>
        ))}
      </section>

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search branch, code, city or manager..." />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="All">All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <button className="add-btn" onClick={() => setForm(EMPTY)}><i className="fa-solid fa-plus" /> Add Branch</button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>{['Code', 'Branch', 'City', 'Manager', 'Phone', 'Capacity', 'Status', 'Action'].map((h) => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {visible.map((b) => (
                <tr key={b.id}>
                  <td>{b.code}</td>
                  <td className="strong">{b.name}</td>
                  <td>{b.city || '—'}</td>
                  <td>{b.manager || '—'}</td>
                  <td>{b.phone || '—'}</td>
                  <td>{units(b.capacity)}</td>
                  <td><span className={`status ${b.status.toLowerCase()}`}>{b.status}</span></td>
                  <td>
                    <div className="actions">
                      <button className="edit-btn" title="Edit" onClick={() => setForm(b)}><i className="fa-solid fa-pen" /></button>
                      <button className="delete-btn" title="Delete" onClick={() => setDeleting(b)}><i className="fa-solid fa-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!visible.length && <tr><td colSpan={8} className="empty">{loading ? 'Loading branches…' : 'No branches found.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={!!form} onClose={() => setForm(null)} className="br-overlay">
        {form && (
          <form className="br-dialog" onSubmit={save} autoComplete="off">
            <div className="br-dialog-header">
              <h2><i className="fa-solid fa-building" /> {form.id ? 'Edit Branch' : 'Add Branch'}</h2>
              <button type="button" className="close-btn" onClick={() => setForm(null)} aria-label="Close"><i className="fa-solid fa-xmark" /></button>
            </div>
            <div className="br-dialog-body">
              {FIELDS.map(([name, label, attrs]) => (
                <label key={name}>
                  {label}
                  <input name={name} value={form[name]} onChange={setField} {...attrs} />
                </label>
              ))}
              <label>
                Status
                <select name="status" value={form.status} onChange={setField}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </label>
            </div>
            <div className="br-buttons">
              <button type="button" className="cancel-btn" onClick={() => setForm(null)}>Cancel</button>
              <button type="submit" className="save-btn" disabled={busy}>{busy ? 'Saving…' : 'Save Branch'}</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} className="br-overlay">
        {deleting && (
          <div className="br-dialog confirm">
            <i className="fa-solid fa-triangle-exclamation" />
            <h3>Delete {deleting.name}?</h3>
            <p>This branch will be permanently removed.</p>
            <div className="br-buttons">
              <button className="cancel-btn" onClick={() => setDeleting(null)}>Cancel</button>
              <button className="save-btn danger" onClick={remove} disabled={busy}>Delete</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
