import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/Toast.jsx';
import { api, qs } from '../../lib/api.js';
import { currentUser, logout, updateCurrentUser } from '../../lib/auth.js';
import { formatDate } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import './EmployeeDashboard.css';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const BADGE = { Present: 'present', Late: 'late', Leave: 'leave', Absent: 'absent', 'Half Day': 'late', Pending: 'late', Approved: 'present', Rejected: 'absent' };
const LEAVE_TYPES = ['Casual', 'Sick', 'Earned', 'Unpaid'];
const THIS_YEAR = new Date().getFullYear();
const YEARS = [THIS_YEAR, THIS_YEAR - 1, THIS_YEAR - 2];
const localISO = (d = new Date()) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

// Server timestamps are local 'YYYY-MM-DD HH:MM:SS'.
const toDate = (t) => (t ? new Date(t.replace(' ', 'T')) : null);
const fmtTime = (t, seconds) =>
  t ? toDate(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', ...(seconds && { second: '2-digit' }), hour12: true }) : '--';
const ago = (t) => {
  const m = Math.round((Date.now() - toDate(t)) / 60000);
  return m < 1 ? 'Just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : formatDate(toDate(t));
};

function duration(r, now, seconds) {
  if (!r?.checkIn || (!r.checkOut && !now)) return '--';
  const diff = (r.checkOut ? toDate(r.checkOut) : now) - toDate(r.checkIn);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return seconds ? `${h}h ${m}m ${Math.floor((diff % 60000) / 1000)}s` : `${h}h ${m}m`;
}

const dayName = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long' });

/** Resolves to {latitude, longitude} or {} — never blocks check-in for more than a few seconds. */
const locate = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({});
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      () => resolve({}),
      { timeout: 5000, maximumAge: 60000 },
    );
  });

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(currentUser);
  const [now, setNow] = useState(() => new Date());
  const [menu, setMenu] = useState(null); // 'profile' | 'notif' | null
  const [dialog, setDialog] = useState(null); // 'profile' | 'password' | 'leave' | null
  const [filters, setFilters] = useState(() => ({ month: String(new Date().getMonth() + 1), year: String(THIS_YEAR), q: '' }));
  const [busy, setBusy] = useState(false);
  const menuRef = useRef(null);

  const today = useApi('/attendance/today');
  const history = useApi(`/attendance/me${qs({ month: filters.month === 'all' ? '' : filters.month, year: filters.year === 'all' ? '' : filters.year })}`);
  const notifs = useApi('/notifications', []);
  const leaves = useApi('/leaves/me', []);

  useEffect(() => {
    api.get('/users/me').then((u) => { updateCurrentUser(u); setUser(u); }).catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const close = (e) => !menuRef.current?.contains(e.target) && setMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menu]);

  const loadError = today.error ?? history.error ?? notifs.error ?? leaves.error;
  useEffect(() => {
    if (loadError) toast(loadError.message, 'error');
  }, [loadError, toast]);

  const rec = today.data;
  const [statusText, statusClass] = !rec?.checkIn
    ? [rec?.status === 'Leave' ? 'On Leave' : 'Not Checked In', rec?.status === 'Leave' ? 'leave' : 'inactive']
    : rec.checkOut ? ['Completed', 'completed'] : ['Checked In', 'active'];

  const markAttendance = async () => {
    setBusy(true);
    try {
      const checkingIn = !rec?.checkIn;
      const saved = checkingIn ? await api.post('/attendance/check-in', await locate()) : await api.post('/attendance/check-out');
      today.setData(saved);
      history.reload();
      toast(checkingIn ? `Attendance marked (${saved.status})` : 'Exit marked', 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const s = history.data?.summary ?? {};
  const period = filters.month === 'all' ? (filters.year === 'all' ? 'All Records' : filters.year) : `${MONTHS[filters.month - 1]} ${filters.year === 'all' ? '' : filters.year}`;
  const summary = [
    ['present-card', 'fa-circle-check', (s.present ?? 0) + (s.late ?? 0) + (s.halfDay ?? 0), `Present Days${s.late ? ` (${s.late} late)` : ''}`],
    ['absent-card', 'fa-circle-xmark', s.absent ?? 0, 'Absent Days'],
    ['leave-card', 'fa-calendar-minus', s.leave ?? 0, 'Leave Days'],
    ['percentage-card', 'fa-chart-pie', `${s.percentage ?? 0}%`, 'Attendance'],
  ];

  const rows = useMemo(() => {
    const q = filters.q.toLowerCase();
    return (history.data?.records ?? []).filter((r) => `${r.date} ${formatDate(r.date)} ${dayName(r.date)} ${r.status}`.toLowerCase().includes(q));
  }, [history.data, filters.q]);

  const exportCsv = () => {
    const lines = [['Date', 'Day', 'Entry Time', 'Exit Time', 'Working Hours', 'Status'],
      ...rows.map((r) => [r.date, dayName(r.date), fmtTime(r.checkIn), fmtTime(r.checkOut), duration(r), r.status])];
    const url = URL.createObjectURL(new Blob([lines.map((l) => l.join(',')).join('\n')], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), { href: url, download: `attendance-${user?.code ?? 'me'}.csv` }).click();
    URL.revokeObjectURL(url);
  };

  const setFilter = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });
  const unread = notifs.data.filter((n) => !n.isRead).length;

  const readNotif = async (n) => {
    if (n.isRead) return;
    notifs.setData((list) => list.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    await api.patch(`/notifications/${n.id}/read`).catch((e) => toast(e.message, 'error'));
  };
  const readAll = async () => {
    notifs.setData((list) => list.map((x) => ({ ...x, isRead: true })));
    await api.patch('/notifications/read-all').catch((e) => toast(e.message, 'error'));
  };

  const cancelLeave = async (l) => {
    try {
      await api.del(`/leaves/${l.id}`);
      leaves.setData((list) => list.filter((x) => x.id !== l.id));
      toast('Leave request cancelled', 'success');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const meta = user?.meta ?? {};
  const info = [
    ['Employee ID', user?.code], ['Employee Name', user?.name], ['Department', meta.department ?? '—'],
    ['Designation', meta.designation ?? '—'], ['Branch', meta.branch ?? '—'],
    ["Today's Date", now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
    ['Current Time', now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })],
  ];

  const todayBoxes = [
    ['Entry Time', fmtTime(rec?.checkIn, true)],
    ['Exit Time', fmtTime(rec?.checkOut, true)],
    ['Working Hours', duration(rec, rec?.checkIn && !rec.checkOut && now, true)],
  ];

  const openDialog = (name) => { setMenu(null); setDialog(name); };

  return (
    <div className="pg-employee">
      <header className="employee-header">
        <div className="header-left">
          <h1 className="page-title">Employee Dashboard</h1>
          <p className="welcome-text">Welcome, <span>{user?.name}</span> 👋</p>
        </div>

        <div className="header-right" ref={menuRef}>
          <div className="company-section">
            <div className="company-details">
              <h2>MK Animal Health</h2>
              <p>Distribution ERP</p>
            </div>
            <div className="company-logo"><img src="/assets/logo.png" alt="Company Logo" /></div>
          </div>

          <div className="profile-wrapper">
            <button className="icon-btn" onClick={() => setMenu(menu === 'notif' ? null : 'notif')} aria-label="Notifications">
              <i className="fa-solid fa-bell" />
              {unread > 0 && <span className="notification-dot" />}
            </button>
            {menu === 'notif' && (
              <div className="profile-dropdown notif-dropdown">
                <div className="profile-header notif-header">
                  <div><h3>Notifications</h3><p>{unread} unread</p></div>
                  {unread > 0 && <button className="link-btn" onClick={readAll}>Mark all read</button>}
                </div>
                {notifs.data.map((n) => (
                  <button key={n.id} className={`notification-item${n.isRead ? '' : ' unread'}`} onClick={() => readNotif(n)}>
                    <h4>{n.title}</h4>
                    <p>{n.message}</p>
                    <span>{ago(n.createdAt)}</span>
                  </button>
                ))}
                {!notifs.data.length && <p className="empty-note">{notifs.loading ? 'Loading…' : 'No notifications'}</p>}
              </div>
            )}
          </div>

          <div className="profile-wrapper">
            <button className="profile-btn" onClick={() => setMenu(menu === 'profile' ? null : 'profile')} aria-label="Profile">
              <i className="fa-solid fa-circle-user" />
            </button>
            {menu === 'profile' && (
              <div className="profile-dropdown">
                <div className="profile-header">
                  <h3>{user?.name}</h3>
                  <p>Employee ID : {user?.code}</p>
                </div>
                <button onClick={() => openDialog('profile')}><i className="fa-solid fa-user" /> My Profile</button>
                <button onClick={() => openDialog('password')}><i className="fa-solid fa-key" /> Change Password</button>
                <button onClick={() => { logout(); navigate('/login'); }}>
                  <i className="fa-solid fa-right-from-bracket" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="card">
        <div className="card-header">
          <h2><i className="fa-solid fa-id-card" /> Employee Information</h2>
        </div>
        <div className="grid-4">
          {info.map(([label, value]) => (
            <div key={label} className="info-box"><label>{label}</label><span>{value}</span></div>
          ))}
          <div className="info-box">
            <label>Status</label>
            <span className={`status ${user?.status === 'Active' ? 'active' : 'inactive'}`}>{user?.status ?? 'Active'}</span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h2><i className="fa-solid fa-calendar-check" /> Today&apos;s Attendance</h2>
        </div>
        <div className="grid-4 attendance-grid">
          <div className="info-box">
            <label>Attendance Status</label>
            <span className={`status ${statusClass}`}>{today.loading ? '…' : statusText}{rec?.checkIn && rec.status === 'Late' ? ' (Late)' : ''}</span>
          </div>
          {todayBoxes.map(([label, value]) => (
            <div key={label} className="info-box"><label>{label}</label><span>{value}</span></div>
          ))}
        </div>
        <div className="attendance-action">
          <button className="attendance-btn" onClick={markAttendance} disabled={busy || today.loading || !!rec?.checkOut}>
            <i className="fa-solid fa-fingerprint" />
            {busy ? 'Please wait…' : !rec?.checkIn ? 'Mark Attendance' : !rec.checkOut ? 'Mark Exit' : 'Attendance Completed'}
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h2><i className="fa-solid fa-chart-column" /> Attendance Summary</h2>
        </div>
        <div className="grid-4">
          {summary.map(([cls, icon, value, label]) => (
            <div key={cls} className={`summary-card ${cls}`}>
              <div className="summary-icon"><i className={`fa-solid ${icon}`} /></div>
              <div className="summary-content">
                <h3>{value}</h3>
                <p>{label}</p>
                <span>{period}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-header split">
          <h2><i className="fa-solid fa-plane-departure" /> Leave Requests</h2>
          <button className="export-btn" onClick={() => setDialog('leave')}><i className="fa-solid fa-plus" /> Apply Leave</button>
        </div>
        <div className="table-container">
          <table className="attendance-table">
            <thead>
              <tr><th>From</th><th>To</th><th>Days</th><th>Type</th><th>Reason</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {leaves.data.map((l) => (
                <tr key={l.id}>
                  <td>{formatDate(l.fromDate)}</td>
                  <td>{formatDate(l.toDate)}</td>
                  <td>{l.days}</td>
                  <td>{l.type}</td>
                  <td className="reason">{l.reason}</td>
                  <td><span className={`badge ${BADGE[l.status]}`}>{l.status}</span></td>
                  <td>{l.status === 'Pending' && <button className="link-btn danger" onClick={() => cancelLeave(l)}>Cancel</button>}</td>
                </tr>
              ))}
              {!leaves.data.length && <tr><td colSpan="7" className="empty">{leaves.loading ? 'Loading…' : 'No leave requests yet'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h2><i className="fa-solid fa-calendar-days" /> Monthly Attendance</h2>
        </div>
        <div className="attendance-toolbar">
          <select value={filters.month} onChange={setFilter('month')}>
            <option value="all">All Months</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={filters.year} onChange={setFilter('year')}>
            <option value="all">All Years</option>
            {YEARS.map((y) => <option key={y}>{y}</option>)}
          </select>
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass" />
            <input type="text" placeholder="Search Date or Status" value={filters.q} onChange={setFilter('q')} />
          </div>
          <button className="refresh-btn" onClick={() => { history.reload(); today.reload(); notifs.reload(); leaves.reload(); }}>
            <i className="fa-solid fa-rotate-right" /> Refresh
          </button>
          <button className="export-btn" onClick={exportCsv} disabled={!rows.length}>
            <i className="fa-solid fa-file-export" /> Export
          </button>
        </div>

        <div className="table-container">
          <table className="attendance-table">
            <thead>
              <tr><th>Date</th><th>Day</th><th>Entry Time</th><th>Exit Time</th><th>Working Hours</th><th>Status</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.date}>
                  <td>{formatDate(r.date)}</td>
                  <td>{dayName(r.date)}</td>
                  <td>{fmtTime(r.checkIn)}</td>
                  <td>{fmtTime(r.checkOut)}</td>
                  <td>{duration(r)}</td>
                  <td><span className={`badge ${BADGE[r.status] ?? 'present'}`}>{r.status}</span></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan="6" className="empty">{history.loading ? 'Loading…' : 'No attendance records found'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={dialog === 'profile'} onClose={() => setDialog(null)} className="emp-overlay">
        <ProfileForm user={user} onClose={() => setDialog(null)} onSaved={(u) => { updateCurrentUser(u); setUser(u); setDialog(null); toast('Profile updated', 'success'); }} />
      </Modal>
      <Modal open={dialog === 'password'} onClose={() => setDialog(null)} className="emp-overlay">
        <PasswordForm hasPassword={user?.hasPassword !== false} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); toast('Password changed', 'success'); }} />
      </Modal>
      <Modal open={dialog === 'leave'} onClose={() => setDialog(null)} className="emp-overlay">
        <LeaveForm onClose={() => setDialog(null)} onSaved={(l) => { leaves.setData((list) => [l, ...list]); setDialog(null); toast('Leave request submitted', 'success'); }} />
      </Modal>
    </div>
  );
}

/** Shared dialog shell: submits `onSubmit(values)`, toasts errors, disables while saving. */
function Dialog({ title, icon, initial, fields, submit, onSubmit, onClose }) {
  const toast = useToast();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setValues({ ...values, [k]: e.target.value });

  const handle = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      toast(err.message, 'error');
      setSaving(false);
    }
  };

  return (
    <form className="emp-modal" onSubmit={handle}>
      <h3><i className={`fa-solid ${icon}`} /> {title}</h3>
      {fields.map(({ key, label, options, ...input }) => (
        <label key={key}>
          {label}
          {options ? (
            <select value={values[key]} onChange={set(key)}>{options.map((o) => <option key={o}>{o}</option>)}</select>
          ) : input.type === 'textarea' ? (
            <textarea rows="3" value={values[key]} onChange={set(key)} required={input.required} />
          ) : (
            <input value={values[key]} onChange={set(key)} {...input} />
          )}
        </label>
      ))}
      <div className="emp-modal-actions">
        <button type="button" className="refresh-btn" onClick={onClose}>Cancel</button>
        <button className="export-btn" disabled={saving}>{saving ? 'Saving…' : submit}</button>
      </div>
    </form>
  );
}

function ProfileForm({ user, onClose, onSaved }) {
  return (
    <Dialog
      title="My Profile" icon="fa-user" submit="Save" onClose={onClose}
      initial={{ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' }}
      fields={[
        { key: 'name', label: 'Full Name', required: true },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Mobile', type: 'tel', pattern: '[0-9+ ]{10,15}', title: '10–15 digits' },
      ]}
      onSubmit={async (v) => onSaved(await api.patch('/users/me', { ...v, meta: user?.meta ?? {} }))}
    />
  );
}

function PasswordForm({ hasPassword, onClose, onSaved }) {
  return (
    <Dialog
      title="Change Password" icon="fa-key" submit="Update Password" onClose={onClose}
      initial={{ currentPassword: '', newPassword: '', confirm: '' }}
      fields={[
        ...(hasPassword ? [{ key: 'currentPassword', label: 'Current Password', type: 'password', required: true, autoComplete: 'current-password' }] : []),
        { key: 'newPassword', label: 'New Password', type: 'password', required: true, minLength: 6, autoComplete: 'new-password' },
        { key: 'confirm', label: 'Confirm New Password', type: 'password', required: true, autoComplete: 'new-password' },
      ]}
      onSubmit={async ({ currentPassword, newPassword, confirm }) => {
        if (newPassword !== confirm) throw new Error('New passwords do not match');
        await api.put('/users/me/password', { currentPassword: currentPassword || undefined, newPassword });
        onSaved();
      }}
    />
  );
}

function LeaveForm({ onClose, onSaved }) {
  const day = localISO();
  return (
    <Dialog
      title="Apply Leave" icon="fa-plane-departure" submit="Submit Request" onClose={onClose}
      initial={{ fromDate: day, toDate: day, type: LEAVE_TYPES[0], reason: '' }}
      fields={[
        { key: 'fromDate', label: 'From', type: 'date', required: true },
        { key: 'toDate', label: 'To', type: 'date', required: true },
        { key: 'type', label: 'Leave Type', options: LEAVE_TYPES },
        { key: 'reason', label: 'Reason', type: 'textarea', required: true },
      ]}
      onSubmit={async (v) => onSaved(await api.post('/leaves', v))}
    />
  );
}
