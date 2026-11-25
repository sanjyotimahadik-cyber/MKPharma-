import { useEffect, useMemo, useState } from 'react';
import BackLink from '../../components/BackLink.jsx';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/Toast.jsx';
import { api, qs } from '../../lib/api.js';
import { Bar } from '../../lib/charts.js';
import { inr } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import { PERIODS, TYPES } from './UserManagement.data.js';
import './UserManagement.css';

const PHONE = /^[6-9]\d{9}$/;
const rated = (list) => list.filter((u) => u.performance != null);
const avg = (list) => (list.length ? Math.round(list.reduce((s, u) => s + u.performance, 0) / list.length) : null);
const flatten = (u) => ({ ...u.meta, ...u.stats, ...u });

function downloadCSV(name, rows) {
  const keys = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
    download: `${name}.csv`,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

function UserForm({ cfg, initial, mrs, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const editing = Boolean(initial.id);
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };
  return (
    <div className="popup">
      <div className="popup-header">
        <h2>{editing ? 'Edit' : 'Add'} {cfg.noun === 'MR' ? 'Medical Representative' : cfg.noun}</h2>
        <button type="button" className="close-popup" onClick={onClose} aria-label="Close">
          <i className="fa-solid fa-xmark" />
        </button>
      </div>
      <form onSubmit={submit}>
        <div className="form-grid">
          <label className="form-group">
            <span>{cfg.idLabel}</span>
            <input value={form.code ?? 'Auto-generated'} readOnly />
          </label>
          {cfg.fields.map(([k, label, type = 'text', optional]) => (
            <label className="form-group" key={k}>
              <span>{label}{optional && ' (optional)'}</span>
              <input type={type} value={form[k] ?? ''} onChange={set(k)} required={!optional} />
            </label>
          ))}
          {cfg.assignMr && (
            <label className="form-group">
              <span>Assigned MR</span>
              <select value={form.assignedMrId} onChange={set('assignedMrId')}>
                <option value="">Not assigned</option>
                {mrs.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.code}){m.status === 'Active' ? '' : ' – Inactive'}</option>
                ))}
              </select>
            </label>
          )}
          <label className="form-group">
            <span>Status</span>
            <select value={form.status} onChange={set('status')}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </label>
          <label className="form-group">
            <span>Login Email (optional)</span>
            <input type="email" value={form.email ?? ''} onChange={set('email')} />
          </label>
          <label className="form-group">
            <span>{editing ? 'New Password (leave blank to keep)' : 'Login Password (optional)'}</span>
            <input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" minLength={6} />
          </label>
        </div>
        <div className="popup-buttons">
          <button type="submit" disabled={saving}>{saving ? 'Saving…' : `Save ${cfg.noun}`}</button>
        </div>
      </form>
    </div>
  );
}

export default function UserManagement() {
  const toast = useToast();
  const [type, setType] = useState('employee');
  const [period, setPeriod] = useState('month');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [editor, setEditor] = useState(null); // form data; no id = new user
  const [confirm, setConfirm] = useState(null); // user row to delete

  const cfg = TYPES[type];
  const { data, loading, error, reload } = useApi(`/users${qs({ role: type, period })}`, []);
  const { data: mrs } = useApi(cfg.assignMr ? '/users/options?role=mr' : null, []);
  useEffect(() => {
    if (error) toast(error.message, 'error');
  }, [error, toast]);

  const list = useMemo(() => (data ?? []).map(flatten), [data]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const keys = ['code', 'email', ...cfg.columns.map(([k]) => k)];
    return list.filter((u) => (status === 'All' || u.status === status)
      && (!q || keys.some((k) => String(u[k] ?? '').toLowerCase().includes(q))));
  }, [list, search, status, cfg]);
  const ranked = useMemo(() => rated(list).sort((a, b) => b.performance - a.performance), [list]);
  const best = ranked[0];
  const top3 = ranked.slice(0, 3);
  const average = avg(ranked);
  const grower = list.filter((u) => u.growth != null).sort((a, b) => b.growth - a.growth)[0];
  const active = list.filter((u) => u.status === 'Active').length;
  const pctText = (v) => (v == null ? '--' : `${v}%`);

  const stats = [
    ['total-users', 'fa-users', list.length, cfg.total],
    ['active-users', 'fa-user-check', active, 'Active Users'],
    ['inactive-users', 'fa-user-xmark', list.length - active, 'Inactive Users'],
    ['performance-users', 'fa-chart-line', pctText(average), 'Average Performance'],
  ];
  const cards = [
    ['fa-trophy', 'Best Performer', best?.name ?? '--', `Performance : ${pctText(best?.performance)}`],
    ['fa-chart-line', 'Average Performance', pctText(average), PERIODS[period]],
    ['fa-arrow-trend-up', 'Highest Growth', grower ? `${grower.growth > 0 ? '+' : ''}${grower.growth}${cfg.growthUnit}` : '--',
      grower ? `${grower.name} · vs previous period` : 'Compared to Previous Period'],
  ];

  const changeType = (t) => {
    setType(t);
    setSearch('');
    setStatus('All');
  };
  const blank = { status: 'Active', email: '', password: '', assignedMrId: '', ...Object.fromEntries(cfg.fields.map(([k]) => [k, ''])) };
  const openEdit = (u) => setEditor({ ...blank, ...u, email: u.email ?? '', assignedMrId: u.assigned_mr_id ?? '', password: '' });

  const save = async (form) => {
    const body = { role: type, status: form.status, email: form.email.trim(), ...Object.fromEntries(cfg.fields.map(([k]) => [k, String(form[k] ?? '').trim()])) };
    if (cfg.fields.some(([k, , , optional]) => !optional && !body[k])) return toast('Please fill all required fields.', 'error');
    if (!PHONE.test(body.phone)) return toast('Enter a valid 10-digit mobile number.', 'error');
    if (form.password) {
      if (form.password.length < 6) return toast('Password must be at least 6 characters.', 'error');
      if (!body.email && !form.username) return toast('Add a login email to set a password.', 'error');
      body.password = form.password;
    }
    if (cfg.assignMr) body.assignedMrId = form.assignedMrId || null;
    try {
      await (form.id ? api.put(`/users/${form.id}`, body) : api.post('/users', body));
      toast(`${cfg.noun} ${form.id ? 'updated' : 'added'}`, 'success');
      setEditor(null);
      reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const remove = async () => {
    try {
      const res = await api.del(`/users/${confirm.id}`);
      toast(res.message, res.deleted ? 'success' : 'info');
      reload();
    } catch (e) {
      toast(e.message, 'error');
    }
    setConfirm(null);
  };

  const exportCSV = () => (rows.length
    ? downloadCSV(type, rows.map((u) => ({
      [cfg.idLabel]: u.code,
      ...Object.fromEntries(cfg.columns.map(([k, label]) => [label, u[k]])),
      Email: u.email,
      Status: u.status,
      Performance: u.performance,
    })))
    : toast('No data available.', 'warning'));
  const refresh = async () => {
    setSearch('');
    setStatus('All');
    if (await reload()) toast('Data refreshed', 'info');
  };

  return (
    <div className="pg-users">
      <header className="page-header">
        <BackLink />
        <h1>User Management</h1>
        <p>Manage Employees, Medical Representatives, Doctors and Pharmacies</p>
      </header>

      <nav className="user-category-section">
        {Object.entries(TYPES).map(([key, t]) => (
          <button key={key} className={`category-btn${key === type ? ' active' : ''}`} onClick={() => changeType(key)}>
            <i className={`fa-solid ${t.icon}`} /> {t.tab}
          </button>
        ))}
      </nav>

      <section className="toolbar">
        <div className="search-container">
          <i className="fa-solid fa-magnifying-glass" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search here..." />
        </div>
        <div className="toolbar-right">
          <select className="status-filter" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="All">All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <button className="btn refresh-btn" onClick={refresh}><i className="fa-solid fa-rotate-right" /> Refresh</button>
          <button className="btn export-btn" onClick={exportCSV}><i className="fa-solid fa-file-export" /> Export</button>
          <button className="btn add-user-btn" onClick={() => setEditor(blank)}><i className="fa-solid fa-plus" /> Add {cfg.noun}</button>
        </div>
      </section>

      <section className="statistics-section">
        {stats.map(([cls, icon, value, label]) => (
          <div className="stat-card" key={cls}>
            <div className={`stat-icon ${cls}`}><i className={`fa-solid ${icon}`} /></div>
            <div className="stat-details">
              <h4>{value}</h4>
              <p>{label}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="table-section">
        <div className="table-header">
          <h2>{cfg.title}</h2>
          <p>{cfg.desc} Figures are for {PERIODS[period].toLowerCase()}.</p>
        </div>
        {rows.length ? (
          <div className="table-container">
            <table className="user-table">
              <thead>
                <tr>
                  <th>{cfg.idLabel}</th>
                  {cfg.columns.map(([k, label]) => <th key={k}>{label}</th>)}
                  <th>Status</th>
                  <th>Performance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => (
                  <tr key={user.id}>
                    <td>{user.code}</td>
                    {cfg.columns.map(([k, , fmt]) => <td key={k}>{fmt === 'money' ? inr(user[k]) : (user[k] ?? '--')}</td>)}
                    <td><span className={`status ${user.status.toLowerCase()}`}>{user.status}</span></td>
                    <td><span className="performance">{pctText(user.performance)}</span></td>
                    <td>
                      <div className="actions">
                        <button className="edit-btn" aria-label="Edit" onClick={() => openEdit(user)}>
                          <i className="fa-solid fa-pen" />
                        </button>
                        <button className="delete-btn" aria-label="Delete" onClick={() => setConfirm(user)}>
                          <i className="fa-solid fa-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : loading ? (
          <div className="empty-table"><p>Loading…</p></div>
        ) : (
          <div className="empty-table">
            <i className={`fa-solid ${cfg.empty[0]}`} />
            <h3>{cfg.empty[1]}</h3>
            <p>Click <strong>Add {cfg.noun}</strong> {cfg.empty[2]}</p>
          </div>
        )}
      </section>

      <section className="analytics-section">
        <div className="analytics-header">
          <div>
            <h2>{cfg.analytics}</h2>
            <p>{cfg.sub}</p>
          </div>
          <select className="analytics-period" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {Object.entries(PERIODS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </div>
        <div className="analytics-cards">
          {cards.map(([icon, label, value, note]) => (
            <div className="analytics-card" key={label}>
              <i className={`fa-solid ${icon}`} />
              <h4>{label}</h4>
              <h3>{value}</h3>
              <p>{note}</p>
            </div>
          ))}
        </div>
        <div className="performance-chart-card">
          <h3>Top 3 Performance Comparison</h3>
          <div className="chart-wrap">
            <Bar
              data={{
                labels: top3.map((u) => u.name),
                datasets: [{ label: 'Performance %', data: top3.map((u) => u.performance), borderWidth: 1 }],
              }}
              options={{ maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } }, plugins: { legend: { display: false } } }}
            />
          </div>
        </div>
      </section>

      <Modal open={!!editor} onClose={() => setEditor(null)} className="popup-overlay">
        {editor && (
          <UserForm key={`${type}-${editor.id ?? 'new'}`} cfg={cfg} initial={editor} mrs={mrs ?? []} onSave={save} onClose={() => setEditor(null)} />
        )}
      </Modal>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} className="popup-overlay">
        <div className="popup confirm">
          <h2>Delete this record?</h2>
          <p>{confirm?.name} will be removed. Users with order, visit or attendance history are set to Inactive instead.</p>
          <div className="popup-buttons">
            <button type="button" className="ghost" onClick={() => setConfirm(null)}>Cancel</button>
            <button type="button" className="danger" onClick={remove}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
