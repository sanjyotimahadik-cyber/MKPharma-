import { useEffect, useState } from 'react';
import BackLink from '../../components/BackLink.jsx';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/Toast.jsx';
import { api, qs } from '../../lib/api.js';
import { formatDate } from '../../lib/format.js';
import { BUYERS, ROLES } from '../../lib/roles.js';
import { useApi } from '../../lib/useApi.js';
import './Registrations.css';

const STATUSES = [
  ['Pending', 'fa-hourglass-half', 'orange'],
  ['Approved', 'fa-circle-check', 'green'],
  ['Rejected', 'fa-circle-xmark', 'red'],
];
const roleName = (r) => ROLES[r]?.short ?? r;
const details = (r) => (ROLES[r.role]?.fields ?? []).map(([k]) => r.meta[k]).filter(Boolean).join(' · ') || '—';

/** Approve as requested, change the role/details and approve, or reject with a reason. */
function Review({ request, onDone, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({ role: request.role, name: request.name, assignedMrId: '', ...request.meta });
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const cfg = ROLES[form.role];
  const { data: mrs } = useApi(BUYERS.includes(form.role) ? '/users/options?role=mr' : null, []);
  const changed = form.role !== request.role;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const send = async (path, body, message) => {
    setBusy(true);
    try {
      await api.post(`/registrations/${request.id}/${path}`, body);
      toast(message);
      onDone();
    } catch (err) {
      toast(err.message, 'error');
      setBusy(false);
    }
  };

  const approve = (e) => {
    e.preventDefault();
    const body = { role: form.role, name: form.name, assignedMrId: form.assignedMrId || null, ...Object.fromEntries(cfg.fields.map(([k]) => [k, form[k] ?? ''])) };
    send('approve', body, `${form.name} approved as ${cfg.label}`);
  };

  if (rejecting) {
    return (
      <form className="rq-dialog confirm" onSubmit={(e) => { e.preventDefault(); send('reject', { note }, `Request from ${request.name} rejected`); }}>
        <i className="fa-solid fa-user-xmark" />
        <h3>Reject {request.name}?</h3>
        <p>They will not get an account. They can register again later.</p>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (optional, shown to the person when they try to sign in)" rows={3} maxLength={500} autoFocus />
        <div className="rq-buttons">
          <button type="button" className="cancel-btn" onClick={() => setRejecting(false)}>Back</button>
          <button type="submit" className="save-btn danger" disabled={busy}>Reject Request</button>
        </div>
      </form>
    );
  }

  return (
    <form className="rq-dialog" onSubmit={approve} autoComplete="off">
      <div className="rq-dialog-header">
        <h2><i className="fa-solid fa-user-check" /> Review Registration</h2>
        <button type="button" className="close-btn" onClick={onClose} aria-label="Close"><i className="fa-solid fa-xmark" /></button>
      </div>

      <div className="rq-summary">
        <div><span>Requested role</span><strong>{ROLES[request.role]?.label ?? request.role}</strong></div>
        <div><span>Email</span><strong>{request.email}</strong></div>
        <div><span>Mobile</span><strong>{request.phone}</strong></div>
        <div><span>Requested on</span><strong>{formatDate(request.createdAt)}</strong></div>
      </div>

      <div className="rq-dialog-body">
        <label className="full">
          Approve as role
          <select value={form.role} onChange={set('role')}>
            {Object.entries(ROLES).map(([k, r]) => <option key={k} value={k}>{r.label}{k === request.role ? ' (requested)' : ''}</option>)}
          </select>
        </label>
        {changed && (
          <p className="full rq-note"><i className="fa-solid fa-circle-info" /> Role changed from {ROLES[request.role]?.label}. Fill in the details for the new role.</p>
        )}
        <label className="full">
          {cfg.nameLabel}
          <input value={form.name} onChange={set('name')} required />
        </label>
        {cfg.fields.map(([k, label, optional]) => (
          <label key={k}>
            {label}{optional && ' (optional)'}
            <input value={form[k] ?? ''} onChange={set(k)} required={!optional} />
          </label>
        ))}
        {BUYERS.includes(form.role) && (
          <label>
            Assigned MR (optional)
            <select value={form.assignedMrId} onChange={set('assignedMrId')}>
              <option value="">Not assigned</option>
              {mrs.filter((m) => m.status === 'Active').map((m) => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
            </select>
          </label>
        )}
      </div>

      <div className="rq-buttons">
        <button type="button" className="save-btn danger" onClick={() => setRejecting(true)} disabled={busy}>
          <i className="fa-solid fa-xmark" /> Reject
        </button>
        <button type="submit" className="save-btn" disabled={busy}>
          <i className="fa-solid fa-check" /> {changed ? `Approve as ${cfg.short}` : 'Approve'}
        </button>
      </div>
    </form>
  );
}

export default function Registrations() {
  const toast = useToast();
  const [status, setStatus] = useState('Pending');
  const { data, loading, error, reload } = useApi(`/registrations${qs({ status })}`);
  const [reviewing, setReviewing] = useState(null);

  useEffect(() => {
    if (error) toast(error.message, 'error');
  }, [error, toast]);

  const requests = data?.requests ?? [];

  return (
    <div className="pg-registrations">
      <header className="rq-header">
        <div>
          <BackLink />
          <h1>Registration Requests</h1>
          <p>Approve new accounts as requested, change their role before approving, or reject them.</p>
        </div>
        <div className="header-logo">
          <img src="/assets/logo.png" alt="MK Animal Health" />
          <div><h2>MK Animal Health</h2><p>Distribution ERP</p></div>
        </div>
      </header>

      <section className="stats">
        {STATUSES.map(([s, icon, color]) => (
          <button key={s} className={`stat-card${status === s ? ' selected' : ''}`} onClick={() => setStatus(s)}>
            <div className={`stat-icon ${color}`}><i className={`fa-solid ${icon}`} /></div>
            <div><span>{s}</span><h2>{data?.counts[s] ?? '–'}</h2></div>
          </button>
        ))}
      </section>

      <section className="panel">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {['Requested On', 'Name', 'Role', 'Email', 'Mobile', 'Details', status === 'Pending' ? 'Action' : 'Outcome'].map((h) => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.createdAt)}</td>
                  <td className="strong">{r.name}</td>
                  <td><span className="role-chip">{roleName(r.role)}</span></td>
                  <td>{r.email}</td>
                  <td>{r.phone}</td>
                  <td className="details">{details(r)}</td>
                  <td>
                    {r.status === 'Pending' ? (
                      <button className="review-btn" onClick={() => setReviewing(r)}><i className="fa-solid fa-user-check" /> Review</button>
                    ) : r.status === 'Approved' ? (
                      <span className="status approved">
                        Approved{r.approvedRole && r.approvedRole !== r.role ? ` as ${roleName(r.approvedRole)}` : ''} · {formatDate(r.reviewedAt)}
                      </span>
                    ) : (
                      <span className="status rejected" title={r.note ?? ''}>Rejected · {formatDate(r.reviewedAt)}{r.note ? ` · ${r.note}` : ''}</span>
                    )}
                  </td>
                </tr>
              ))}
              {!requests.length && (
                <tr><td colSpan={7} className="empty">{loading ? 'Loading requests…' : `No ${status.toLowerCase()} requests.`}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={!!reviewing} onClose={() => setReviewing(null)} className="rq-overlay">
        {reviewing && <Review request={reviewing} onClose={() => setReviewing(null)} onDone={() => { setReviewing(null); reload(); }} />}
      </Modal>
    </div>
  );
}
