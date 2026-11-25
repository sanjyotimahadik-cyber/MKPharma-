import { useEffect, useMemo, useState } from 'react';
import BackLink from '../../components/BackLink.jsx';
import { useToast } from '../../components/Toast.jsx';
import { api, qs } from '../../lib/api.js';
import { formatDate } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import './Attendance.css';

const COLUMNS = ['Name', 'Code', 'Role', 'Mobile No', 'Email', 'Date', 'Status', 'Entry Time', 'Out Time'];
const CHIPS = [['', 'All', 'total'], ['Present', 'Present', 'present'], ['Late', 'Late', 'late'], ['Absent', 'Absent', 'absent'], ['Leave', 'Leave', 'leave']];
const ROLE = { employee: 'Employee', mr: 'MR' };
const localISO = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
const fmtTime = (t) => (t ? new Date(t.replace(' ', 'T')).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--');

function downloadCsv(name, lines) {
  const esc = (v) => (/[",\n]/.test(v ?? '') ? `"${String(v).replaceAll('"', '""')}"` : v ?? '');
  const url = URL.createObjectURL(new Blob([lines.map((l) => l.map(esc).join(',')).join('\n')], { type: 'text/csv' }));
  Object.assign(document.createElement('a'), { href: url, download: name }).click();
  URL.revokeObjectURL(url);
}

export default function Attendance() {
  const toast = useToast();
  const [tab, setTab] = useState('attendance');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState(localISO);
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [leaveStatus, setLeaveStatus] = useState('Pending');

  const att = useApi(`/attendance${qs({ date, role })}`);
  const leaves = useApi(`/leaves${qs({ status: leaveStatus })}`, []);
  const pending = useApi('/leaves?status=Pending', []);

  const loadError = att.error ?? leaves.error;
  useEffect(() => {
    if (loadError) toast(loadError.message, 'error');
  }, [loadError, toast]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (att.data?.rows ?? []).filter((r) =>
      (!q || [r.name, r.code, r.phone, r.email].join(' ').toLowerCase().includes(q)) && (!status || r.status === status));
  }, [att.data, search, status]);

  const summary = att.data?.summary ?? {};

  const review = async (l, next) => {
    try {
      await api.patch(`/leaves/${l.id}`, { status: next });
      toast(`Leave ${next.toLowerCase()} for ${l.user.name}`, 'success');
      leaves.reload();
      pending.reload();
      att.reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const exportCsv = () =>
    downloadCsv(`attendance-${date}.csv`, [
      COLUMNS,
      ...rows.map((r) => [r.name, r.code, ROLE[r.role], r.phone, r.email, r.date, r.status, fmtTime(r.checkIn), fmtTime(r.checkOut)]),
    ]);

  return (
    <div className="pg-attendance">
      <header className="topbar">
        <div>
          <BackLink />
          <h1>Attendance Management</h1>
        </div>
        <div className="company-info">
          <img src="/assets/logo.png" alt="Company Logo" />
          <div>
            <h3>MK Animal Health</h3>
            <p>ERP System</p>
          </div>
        </div>
      </header>

      <nav className="tabs">
        <button className={tab === 'attendance' ? 'on' : ''} onClick={() => setTab('attendance')}>
          <i className="fa-solid fa-calendar-check" /> Attendance
        </button>
        <button className={tab === 'leaves' ? 'on' : ''} onClick={() => setTab('leaves')}>
          <i className="fa-solid fa-plane-departure" /> Leave Requests
          {pending.data.length > 0 && <span className="count">{pending.data.length}</span>}
        </button>
      </nav>

      {tab === 'attendance' ? (
        <>
          <section className="filters">
            <label className="field search">
              <i className="fa-solid fa-magnifying-glass" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, code, mobile, email..." />
            </label>
            <label className="field">
              <i className="fa-solid fa-calendar-days" />
              <input type="date" value={date} max={localISO()} onChange={(e) => setDate(e.target.value || localISO())} />
            </label>
            <label className="field">
              <i className="fa-solid fa-users" />
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">All Staff</option>
                <option value="employee">Employees</option>
                <option value="mr">MRs</option>
              </select>
            </label>
            <label className="field">
              <i className="fa-solid fa-filter" />
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All Status</option>
                {CHIPS.slice(1).map(([v]) => <option key={v}>{v}</option>)}
              </select>
            </label>
            <button className="btn primary" onClick={exportCsv} disabled={!rows.length}>
              <i className="fa-solid fa-file-export" /> Export
            </button>
          </section>

          <section className="chips">
            {CHIPS.map(([value, label, key]) => (
              <button key={label} className={`chip ${key}${status === value ? ' on' : ''}`} onClick={() => setStatus(value)}>
                <strong>{summary[key] ?? 0}</strong> {label}
              </button>
            ))}
            <span className="rate">{summary.percentage ?? 0}% attendance · {formatDate(date)}</span>
          </section>

          <section className="table-card">
            <table>
              <thead>
                <tr>{COLUMNS.map((h) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.userId}>
                    <td>{r.name}</td>
                    <td>{r.code}</td>
                    <td>{ROLE[r.role]}</td>
                    <td>{r.phone ?? '—'}</td>
                    <td>{r.email ?? '—'}</td>
                    <td>{formatDate(r.date)}</td>
                    <td><span className={`status ${r.status.toLowerCase()}`}>{r.status}</span></td>
                    <td>{fmtTime(r.checkIn)}</td>
                    <td>{fmtTime(r.checkOut)}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td colSpan={COLUMNS.length} className="empty">{att.loading ? 'Loading…' : 'No attendance records found'}</td></tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      ) : (
        <>
          <section className="filters">
            <label className="field">
              <i className="fa-solid fa-filter" />
              <select value={leaveStatus} onChange={(e) => setLeaveStatus(e.target.value)}>
                <option value="">All Requests</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
            </label>
          </section>

          <section className="table-card">
            <table className="leaves">
              <thead>
                <tr>{['Name', 'Code', 'Type', 'From', 'To', 'Days', 'Reason', 'Status', 'Action'].map((h) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {leaves.data.map((l) => (
                  <tr key={l.id}>
                    <td>{l.user.name}</td>
                    <td>{l.user.code}</td>
                    <td>{l.type}</td>
                    <td>{formatDate(l.fromDate)}</td>
                    <td>{formatDate(l.toDate)}</td>
                    <td>{l.days}</td>
                    <td className="reason">{l.reason}</td>
                    <td><span className={`status ${l.status.toLowerCase()}`}>{l.status}</span></td>
                    <td>
                      {l.status === 'Pending' ? (
                        <div className="actions">
                          <button className="btn approve" onClick={() => review(l, 'Approved')}><i className="fa-solid fa-check" /> Approve</button>
                          <button className="btn reject" onClick={() => review(l, 'Rejected')}><i className="fa-solid fa-xmark" /> Reject</button>
                        </div>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
                {!leaves.data.length && <tr><td colSpan="9" className="empty">{leaves.loading ? 'Loading…' : 'No leave requests'}</td></tr>}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
