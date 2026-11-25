import { useCallback, useEffect, useState } from 'react';
import BackLink from '../../components/BackLink.jsx';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/Toast.jsx';
import { api } from '../../lib/api.js';
import { updateCurrentUser } from '../../lib/auth.js';
import { useApi } from '../../lib/useApi.js';
import './Settings.css';

const VERSION = 'MK Pharma ERP v2.0';

// [id, icon, title, description]
const GROUPS = [
  { title: 'General', items: [
    ['company', 'fa-building', 'Company Information', 'Company profile, address and GST information'],
    ['profile', 'fa-user-shield', 'Admin Profile', 'Manage administrator account'],
    ['password', 'fa-lock', 'Security & Password', 'Change your sign-in password'],
  ] },
  { title: 'Preferences', items: [
    ['notifications', 'fa-bell', 'Notifications', 'Choose which admin alerts you receive'],
    ['billing', 'fa-file-invoice', 'Billing & Tax', 'Default GST rate, delivery charge and currency'],
    ['inventory', 'fa-boxes-stacked', 'Inventory Alerts', 'Low stock warning level'],
  ] },
  { title: 'Data Management', items: [
    ['export', 'fa-file-export', 'Export & Backup', 'Download records as CSV or a full JSON backup'],
    ['import', 'fa-file-import', 'Import Users', 'Add employees, MRs, doctors or pharmacies from a CSV file'],
  ] },
  { title: 'System', items: [
    ['about', 'fa-circle-info', 'About ERP', VERSION],
    ['server', 'fa-server', 'Server Status', null],
  ] },
];

// Form definitions: [key, label, type?, inputProps?]
const FORMS = {
  company: [['name', 'Company Name'], ['tagline', 'Tagline'], ['gstNumber', 'GST Number'], ['dlNumber', 'Drug Licence No.'], ['panNumber', 'PAN Number'],
    ['email', 'Email', 'email'], ['phone', 'Phone', 'tel'], ['address', 'Address', 'textarea']],
  billing: [['gstRate', 'Default GST Rate (%)', 'number', { min: 0, max: 28, step: 0.5 }], ['deliveryCharge', 'Delivery Charge (₹)', 'number', { min: 0 }], ['currency', 'Currency Symbol']],
  inventory: [['lowStockLevel', 'Low Stock Level (units)', 'number', { min: 0 }]],
  notifications: [['order', 'New and cancelled orders', 'checkbox'], ['payment', 'Payments received', 'checkbox'], ['leave', 'Leave requests', 'checkbox'], ['stock', 'Low stock alerts', 'checkbox'], ['registration', 'New registration requests', 'checkbox']],
  profile: [['name', 'Full Name'], ['designation', 'Designation'], ['email', 'Email', 'email'], ['phone', 'Mobile Number', 'tel']],
};
const IMPORT_COLUMNS = ['role', 'name', 'phone', 'email', 'department', 'designation', 'branch', 'area', 'specialization', 'hospital', 'owner', 'location'];

const csvCell = (v) => `"${String(v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : v).replace(/"/g, '""')}"`;
function download(name, text, type) {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([text], { type })), download: name });
  a.click();
  URL.revokeObjectURL(a.href);
}
const toCSV = (rows) => {
  const keys = [...new Set(rows.flatMap(Object.keys))];
  return [keys.join(','), ...rows.map((r) => keys.map((k) => csvCell(r[k])).join(','))].join('\n');
};
/** Minimal CSV parser (quoted cells, commas, newlines) → array of objects keyed by the header row. */
function parseCSV(text) {
  const rows = [[]];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted && c === '"' && text[i + 1] === '"') {
      cell += c;
      i++;
    } else if (c === '"') quoted = !quoted;
    else if (quoted || (c !== ',' && c !== '\n')) cell += c;
    else {
      rows.at(-1).push(cell.replace(/\r$/, ''));
      cell = '';
      if (c === '\n') rows.push([]);
    }
  }
  rows.at(-1).push(cell.replace(/\r$/, ''));
  const [head, ...body] = rows.filter((r) => r.some((v) => v.trim()));
  const keys = (head ?? []).map((h) => h.trim().toLowerCase());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
}

function SettingsForm({ fields, initial, submitLabel = 'Save Changes', onSubmit }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await onSubmit(form);
    setBusy(false);
  };
  return (
    <form onSubmit={submit}>
      <div className="form-grid">
        {fields.map(([k, label, type = 'text', props]) =>
          type === 'checkbox' ? (
            <label key={k} className="check-row">
              <input type="checkbox" checked={Boolean(form[k])} onChange={(e) => set(k, e.target.checked)} />
              <span>{label}</span>
            </label>
          ) : (
            <label key={k} className={`field${type === 'textarea' ? ' wide' : ''}`}>
              <span>{label}</span>
              {type === 'textarea'
                ? <textarea rows={3} value={form[k] ?? ''} onChange={(e) => set(k, e.target.value)} />
                : <input type={type} value={form[k] ?? ''} onChange={(e) => set(k, e.target.value)} {...props} />}
            </label>
          ))}
      </div>
      <div className="dialog-actions">
        <button type="submit" className="save-btn" disabled={busy}>
          <i className="fa-solid fa-floppy-disk" /> {busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function Settings() {
  const toast = useToast();
  const [open, setOpen] = useState(null);
  const [health, setHealth] = useState(null); // null = checking, else { ok, ms }
  const [busy, setBusy] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const { data: settings, setData, error } = useApi('/settings');
  const { data: me, setData: setMe } = useApi('/users/me');

  useEffect(() => {
    if (error) toast(error.message, 'error');
  }, [error, toast]);

  const checkServer = useCallback(async () => {
    const t = performance.now();
    try {
      await api.get('/health');
      setHealth({ ok: true, ms: Math.round(performance.now() - t) });
      return true;
    } catch {
      setHealth({ ok: false });
      return false;
    }
  }, []);
  useEffect(() => {
    checkServer();
  }, [checkServer]);

  const close = () => setOpen(null);
  /** Runs an API action, toasts the outcome and closes the dialog on success. */
  const run = async (fn, message) => {
    try {
      await fn();
      toast(message, 'success');
      close();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const saveSetting = (key) => (form) =>
    run(async () => {
      const value = await api.put(`/settings/${key}`, form);
      setData((s) => ({ ...s, [key]: value }));
    }, 'Settings saved');

  const saveProfile = ({ name, email, phone, designation }) =>
    run(async () => {
      const user = await api.patch('/users/me', { name, email, phone, meta: { designation } });
      updateCurrentUser(user);
      setMe((m) => ({ ...m, ...user }));
    }, 'Profile updated');

  const savePassword = ({ currentPassword, newPassword, confirm }) => {
    if (newPassword.length < 6) return toast('Password must be at least 6 characters', 'error');
    if (newPassword !== confirm) return toast('Passwords do not match', 'error');
    return run(async () => {
      await api.put('/users/me/password', { currentPassword, newPassword });
      setMe((m) => ({ ...m, hasPassword: true }));
    }, 'Password updated');
  };

  const exportData = async (what) => {
    setBusy(true);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      if (what === 'backup') {
        const [users, products, orders] = await Promise.all(['/users', '/products', '/orders'].map((p) => api.get(p)));
        download(`mk-backup-${stamp}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), settings, users, products, orders }, null, 2), 'application/json');
      } else {
        const rows = await api.get(`/${what}`);
        if (!rows?.length) return toast('No records to export', 'warning');
        download(`mk-${what}-${stamp}.csv`, toCSV(rows), 'text/csv');
      }
      toast('Download started', 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const importUsers = async (file) => {
    if (!file) return;
    const rows = parseCSV(await file.text());
    if (!rows.length) return toast('The file has no data rows', 'warning');
    setBusy(true);
    const failed = [];
    for (const [i, row] of rows.entries()) {
      try {
        await api.post('/users', { ...row, role: row.role?.toLowerCase(), status: 'Active' });
      } catch (e) {
        failed.push(`Row ${i + 2}: ${e.message}`);
      }
    }
    setBusy(false);
    setImportResult({ added: rows.length - failed.length, failed });
    toast(`${rows.length - failed.length} of ${rows.length} users imported`, failed.length ? 'warning' : 'success');
  };

  const company = settings?.company ?? {};
  const loadingBody = <p className="muted">Loading…</p>;
  const dlg = (title, body) => ({ title, body });
  const DIALOGS = {
    company: dlg('Company Information', settings && <SettingsForm fields={FORMS.company} initial={company} onSubmit={saveSetting('company')} />),
    billing: dlg('Billing & Tax', settings && <SettingsForm fields={FORMS.billing} initial={settings.billing} onSubmit={saveSetting('billing')} />),
    inventory: dlg('Inventory Alerts', settings && (
      <>
        <p className="muted">Products at or below this quantity are flagged as low stock.</p>
        <SettingsForm fields={FORMS.inventory} initial={settings.inventory} onSubmit={saveSetting('inventory')} />
      </>
    )),
    notifications: dlg('Notifications', settings && <SettingsForm fields={FORMS.notifications} initial={settings.notifications} onSubmit={saveSetting('notifications')} />),
    profile: dlg('Admin Profile', me && <SettingsForm fields={FORMS.profile} initial={{ ...me, designation: me.meta?.designation ?? '' }} onSubmit={saveProfile} />),
    password: dlg('Security & Password', me && (
      <SettingsForm
        fields={[
          ...(me.hasPassword ? [['currentPassword', 'Current Password', 'password', { required: true, autoComplete: 'current-password' }]] : []),
          ['newPassword', 'New Password', 'password', { required: true, minLength: 6, autoComplete: 'new-password' }],
          ['confirm', 'Confirm New Password', 'password', { required: true, autoComplete: 'new-password' }],
        ]}
        initial={{ currentPassword: '', newPassword: '', confirm: '' }}
        submitLabel="Update Password"
        onSubmit={savePassword}
      />
    )),
    export: dlg('Export & Backup', (
      <div className="action-list">
        {[['users', 'fa-users', 'All users (CSV)'], ['products', 'fa-capsules', 'Products (CSV)'], ['orders', 'fa-cart-shopping', 'Orders (CSV)'], ['backup', 'fa-database', 'Full backup (JSON)']].map(([k, icon, label]) => (
          <button key={k} type="button" className="action-btn" disabled={busy} onClick={() => exportData(k)}>
            <i className={`fa-solid ${icon}`} /> {label}
          </button>
        ))}
      </div>
    )),
    import: dlg('Import Users', (
      <>
        <p className="muted">
          CSV columns: <code>{IMPORT_COLUMNS.join(', ')}</code>. Role is employee, mr, doctor or pharmacy; fill the columns that apply to it.
        </p>
        <div className="action-list">
          <button type="button" className="action-btn" onClick={() => download('mk-users-template.csv', `${IMPORT_COLUMNS.join(',')}\nemployee,Sample Name,9876543210,,Sales,Executive,Jalgaon,,,,,\n`, 'text/csv')}>
            <i className="fa-solid fa-download" /> Download template
          </button>
          <label className={`action-btn${busy ? ' disabled' : ''}`}>
            <i className="fa-solid fa-upload" /> {busy ? 'Importing…' : 'Choose CSV file'}
            <input type="file" accept=".csv,text/csv" hidden disabled={busy} onChange={(e) => { importUsers(e.target.files[0]); e.target.value = ''; }} />
          </label>
        </div>
        {importResult && (
          <div className="import-result">
            <strong>{importResult.added} added</strong>
            {importResult.failed.map((f) => <p key={f}>{f}</p>)}
          </div>
        )}
      </>
    )),
    about: dlg('About ERP', (
      <dl className="about">
        <dt>Application</dt><dd>{VERSION}</dd>
        <dt>Company</dt><dd>{company.name || '—'}</dd>
        <dt>Tagline</dt><dd>{company.tagline || '—'}</dd>
        <dt>GST / DL</dt><dd>{[company.gstNumber, company.dlNumber].filter(Boolean).join(' · ') || '—'}</dd>
        <dt>Contact</dt><dd>{[company.email, company.phone].filter(Boolean).join(' · ') || '—'}</dd>
        <dt>Signed in as</dt><dd>{me ? `${me.name} (${me.code})` : '—'}</dd>
      </dl>
    )),
  };

  const serverText = health == null ? 'Checking…' : health.ok ? `● Online · ${health.ms} ms` : '● Offline';
  const clickRow = async (id) => {
    setImportResult(null);
    if (id !== 'server') return setOpen(id);
    const ok = await checkServer();
    toast(ok ? 'Server is online' : 'Server is not reachable', ok ? 'success' : 'error');
  };
  const dialog = open && DIALOGS[open];

  return (
    <section className="pg-settings">
      <div className="settings-header">
        <BackLink />
        <h1>Settings</h1>
        <p>Manage your ERP configuration and application preferences</p>
      </div>

      <div className="settings-wrapper">
        {GROUPS.map(({ title, items }) => (
          <div key={title} className="settings-group">
            <h3>{title}</h3>
            {items.map(([id, icon, name, desc]) => (
              <button key={id} className="setting-item" onClick={() => clickRow(id)}>
                <i className={`fa-solid ${icon} setting-icon`} />
                <span className="setting-text">
                  <strong>{name}</strong>
                  {id === 'server'
                    ? <span className={health?.ok === false ? 'offline-status' : 'online-status'}>{serverText}</span>
                    : <span>{desc}</span>}
                </span>
                <i className={`fa-solid ${id === 'server' ? 'fa-rotate-right' : 'fa-chevron-right'} chevron`} />
              </button>
            ))}
          </div>
        ))}
      </div>

      <Modal open={!!dialog} onClose={close} className="settings-overlay">
        {dialog && (
          <div className="settings-dialog" role="dialog" aria-label={dialog.title}>
            <header>
              <h2>{dialog.title}</h2>
              <button type="button" className="close-btn" onClick={close} aria-label="Close"><i className="fa-solid fa-xmark" /></button>
            </header>
            <div className="dialog-body">{dialog.body || loadingBody}</div>
          </div>
        )}
      </Modal>
    </section>
  );
}
