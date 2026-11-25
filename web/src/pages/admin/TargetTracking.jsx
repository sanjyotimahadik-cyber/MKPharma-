import { useEffect, useMemo, useState } from 'react';
import BackLink from '../../components/BackLink.jsx';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/Toast.jsx';
import { api, qs } from '../../lib/api.js';
import { formatDate, inr, todayISO } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import './TargetTracking.css';

const TYPES = { Doctors: 'doctor', Pharmacy: 'pharmacy', 'MR Team': 'mr' };
const COLUMNS = ['Target ID', 'Target Name', 'Type', 'Assigned To', 'Start Date', 'End Date', 'Target', 'Achieved', 'Status', 'Progress', 'Actions'];
const MEDALS = ['🥇', '🥈', '🥉'];
const EMPTY = { name: '', type: 'Doctors', assigneeId: '', targetValue: '', startDate: todayISO(), endDate: '', description: '' };
const label = (s) => s[0].toUpperCase() + s.slice(1);
const amount = (t, n) => (t.metric === 'sales' ? inr(n) : `${n} visits`);

export default function TargetTracking() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('');
  const { data, loading, error, reload } = useApi(`/targets${qs({ status, type, month })}`, []);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(null); // { id?, ...fields } while the editor is open
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const options = useApi(form ? `/users/options${qs({ role: TYPES[form.type] })}` : null, []);

  useEffect(() => {
    if (error) toast(error.message, 'error');
  }, [error, toast]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((t) => !q || [t.code, t.name, t.type, t.assigneeName, t.status, `${t.progress}%`].join(' ').toLowerCase().includes(q));
  }, [data, search]);

  const run = async (fn, message) => {
    setBusy(true);
    try {
      await fn();
      toast(message);
      await reload();
      return true;
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    const { id, ...body } = form;
    const ok = await run(() => (id ? api.put(`/targets/${id}`, body) : api.post('/targets', body)), id ? 'Target updated' : 'Target created');
    if (ok) setForm(null);
  };

  const toggle = (t) => {
    const next = t.status === 'active' ? 'closed' : 'active';
    run(() => api.patch(`/targets/${t.id}/status`, { status: next }), `Target ${next === 'active' ? 'reopened' : 'closed'}`);
  };

  const remove = async () => {
    if (await run(() => api.del(`/targets/${deleting.id}`), 'Target deleted')) setDeleting(null);
  };

  const edit = (t) =>
    setForm({ id: t.id, name: t.name, type: t.type, assigneeId: t.assigneeId ?? '', targetValue: t.targetValue, startDate: t.startDate, endDate: t.endDate, description: t.description });
  const field = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  return (
    <div className="pg-targets">
      <header className="topbar">
        <div>
          <BackLink />
          <h1>Target Tracking</h1>
        </div>
        <div className="company-info">
          <img src="/assets/logo.png" alt="Company Logo" />
          <div>
            <h3>MK Animal Health</h3>
            <p>ERP System</p>
          </div>
        </div>
      </header>

      <section className="filters">
        <label className="field search">
          <i className="fa-solid fa-magnifying-glass" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Target..." />
        </label>
        <label className="field">
          <i className="fa-solid fa-calendar-days" />
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>
        <label className="field">
          <i className="fa-solid fa-users" />
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All Types</option>
            {Object.keys(TYPES).map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className="field">
          <i className="fa-solid fa-filter" />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <button type="button" className="primary-btn" onClick={() => setForm({ ...EMPTY })}>
          <i className="fa-solid fa-plus" /> New Target
        </button>
      </section>

      <section className="card table-card">
        <table className="target-table">
          <thead>
            <tr>{COLUMNS.map((h) => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>{t.code}</td>
                <td>{t.name}</td>
                <td>{t.type}</td>
                <td>{t.assigneeName ?? 'Whole group'}</td>
                <td>{formatDate(t.startDate)}</td>
                <td>{formatDate(t.endDate)}</td>
                <td>{amount(t, t.targetValue)}</td>
                <td>{amount(t, t.achieved)}</td>
                <td><span className={`status ${t.status}`}>{label(t.status)}</span></td>
                <td>
                  <div className="progress" title={`${t.rawProgress}%`}>
                    <div className="bar"><span style={{ width: `${t.progress}%` }} /></div>
                    {t.rawProgress}%
                  </div>
                </td>
                <td className="actions">
                  <button type="button" title="View" onClick={() => setViewing(t)}><i className="fa-solid fa-eye" /></button>
                  <button type="button" title="Edit" onClick={() => edit(t)}><i className="fa-solid fa-pen" /></button>
                  <button type="button" title={t.status === 'active' ? 'Close' : 'Reopen'} disabled={busy} onClick={() => toggle(t)}>
                    <i className={`fa-solid ${t.status === 'active' ? 'fa-lock' : 'fa-lock-open'}`} />
                  </button>
                  <button type="button" title="Delete" className="danger" onClick={() => setDeleting(t)}><i className="fa-solid fa-trash" /></button>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={COLUMNS.length} className="empty">{loading ? 'Loading…' : 'No targets found'}</td></tr>}
          </tbody>
        </table>
      </section>

      <section className="card target-list">
        <h2>Target List</h2>
        <ul>
          {rows.map((t, i) => (
            <li key={t.id}>
              <span>{i + 1}. {t.name}</span>
              <button type="button" className="view-btn" onClick={() => setViewing(t)}>
                <i className="fa-solid fa-eye" /> View
              </button>
            </li>
          ))}
        </ul>
      </section>

      <Modal open={!!viewing} onClose={() => setViewing(null)} className="tt-overlay">
        {viewing && (
          <div className="tt-modal" role="dialog" aria-modal="true">
            <div className="tt-modal-head">
              <h2>{viewing.name}</h2>
              <button type="button" className="close-modal" aria-label="Close" onClick={() => setViewing(null)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="tt-modal-body">
              <dl className="target-info">
                <dt>Target Type :</dt><dd>{viewing.type}</dd>
                <dt>Assigned To :</dt><dd>{viewing.assigneeName ?? 'Whole group'}</dd>
                <dt>Target Period :</dt><dd>{formatDate(viewing.startDate)} - {formatDate(viewing.endDate)}</dd>
                <dt>Status :</dt><dd><span className={`status ${viewing.status}`}>{label(viewing.status)}</span></dd>
                <dt>Achieved :</dt><dd>{amount(viewing, viewing.achieved)} of {amount(viewing, viewing.targetValue)}</dd>
                <dt>Overall Completion :</dt><dd>{viewing.rawProgress}%</dd>
                {viewing.description && <><dt>Description :</dt><dd>{viewing.description}</dd></>}
              </dl>
              {!viewing.assigneeId && (
                <>
                  <h3>Top 3 Performers</h3>
                  <table className="performer-table">
                    <thead>
                      <tr><th>Rank</th><th>Name</th><th>{viewing.metric === 'sales' ? 'Sales' : 'Visits'}</th></tr>
                    </thead>
                    <tbody>
                      {viewing.performers.map((pf, i) => (
                        <tr key={pf.name}><td>{MEDALS[i]}</td><td>{pf.name}</td><td>{amount(viewing, pf.value)}</td></tr>
                      ))}
                      {!viewing.performers.length && <tr><td colSpan="3" className="empty">No activity in this period yet</td></tr>}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!form} onClose={() => setForm(null)} className="tt-overlay">
        {form && (
          <form className="tt-modal" onSubmit={save}>
            <div className="tt-modal-head">
              <h2>{form.id ? 'Edit Target' : 'New Target'}</h2>
              <button type="button" className="close-modal" aria-label="Close" onClick={() => setForm(null)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="tt-modal-body tt-form">
              <label className="wide">Target Name<input required {...field('name')} /></label>
              <label>Type
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, assigneeId: '' })}>
                  {Object.keys(TYPES).map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label>Assigned To
                <select {...field('assigneeId')}>
                  <option value="">Whole group ({form.type})</option>
                  {options.data.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.code})</option>)}
                </select>
              </label>
              <label className="wide">{form.type === 'MR Team' ? 'Target Visits' : 'Target Sales (₹)'}
                <input type="number" min="1" step="any" required {...field('targetValue')} />
              </label>
              <label>Start Date<input type="date" required {...field('startDate')} /></label>
              <label>End Date<input type="date" required min={form.startDate} {...field('endDate')} /></label>
              <label className="wide">Description<textarea rows="3" {...field('description')} /></label>
              {options.error && <p className="wide hint">Could not load {form.type} users; only whole-group targets are available.</p>}
              <button type="submit" className="primary-btn wide" disabled={busy}>{busy ? 'Saving…' : 'Save Target'}</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} className="tt-overlay">
        {deleting && (
          <div className="tt-modal tt-confirm">
            <div className="tt-modal-body">
              <h3>Delete “{deleting.name}”?</h3>
              <p>This permanently removes the target. Closing it keeps the history instead.</p>
              <div className="confirm-actions">
                <button type="button" className="view-btn ghost" onClick={() => setDeleting(null)}>Cancel</button>
                <button type="button" className="view-btn danger" disabled={busy} onClick={remove}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
