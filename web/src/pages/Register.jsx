import { useState } from 'react';
import { Link, Navigate } from 'react-router';
import { getToken } from '../lib/api.js';
import { currentUser, HOME, register } from '../lib/auth.js';
import { ROLES } from '../lib/roles.js';
import './Login.css';

const BLANK = { name: '', email: '', phone: '', password: '', confirm: '' };

export default function Register() {
  const [role, setRole] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const existing = currentUser();
  if (existing && getToken()) return <Navigate to={HOME[existing.role]} replace />;

  const cfg = role && ROLES[role];
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setBusy(true);
    try {
      const { confirm: _c, ...body } = form;
      await register({ ...body, role });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pg-login">
      <div className="logo-section">
        <img src="/assets/logo.png" className="logo" alt="MK Animal Health" />
        <h2>MK Animal Health</h2>
        <p>Distribution ERP</p>
      </div>

      <div className={`login-card${cfg && !done ? ' wide' : ''}`}>
        {done ? (
          <div className="submitted">
            <i className="fa-solid fa-hourglass-half" />
            <h1>Request Sent</h1>
            <p>
              Your registration as <strong>{cfg.label}</strong> was sent to the administrator.
              You can sign in with <strong>{form.email}</strong> once it is approved.
            </p>
            <Link to="/login" className="primary-btn">Go to Sign In</Link>
          </div>
        ) : !cfg ? (
          <>
            <h1>Register</h1>
            <p>Who are you registering as?</p>
            <div className="role-grid">
              {Object.entries(ROLES).map(([key, r]) => (
                <button key={key} type="button" className="role-btn" onClick={() => setRole(key)}>
                  <i className={`fa-solid ${r.icon}`} />
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
            <p className="switch">Already have an account? <Link to="/login">Sign in</Link></p>
          </>
        ) : (
          <>
            <h1>Register</h1>
            <p>
              <i className={`fa-solid ${cfg.icon}`} /> {cfg.label} ·{' '}
              <button type="button" className="link-btn" onClick={() => setRole(null)}>Change role</button>
            </p>

            <form className="auth-form grid" onSubmit={submit}>
              <label className="full">
                <span>{cfg.nameLabel}</span>
                <input value={form.name} onChange={set('name')} required autoFocus />
              </label>
              <label>
                <span>Email</span>
                <input type="email" autoComplete="email" value={form.email} onChange={set('email')} required />
              </label>
              <label>
                <span>Mobile Number</span>
                <input type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} pattern="[6-9][0-9]{9}" title="10-digit mobile number" required />
              </label>
              {cfg.fields.map(([key, label, optional]) => (
                <label key={key}>
                  <span>{label}{optional && ' (optional)'}</span>
                  <input value={form[key] ?? ''} onChange={set(key)} required={!optional} />
                </label>
              ))}
              <label>
                <span>Password</span>
                <input type="password" autoComplete="new-password" minLength={6} value={form.password} onChange={set('password')} required />
              </label>
              <label>
                <span>Confirm Password</span>
                <input type="password" autoComplete="new-password" minLength={6} value={form.confirm} onChange={set('confirm')} required />
              </label>

              {error && <div className="form-error full" role="alert"><i className="fa-solid fa-circle-exclamation" /> {error}</div>}

              <button type="submit" className="primary-btn full" disabled={busy}>
                {busy ? <><i className="fa-solid fa-spinner fa-spin" /> Sending…</> : 'Send Registration Request'}
              </button>
            </form>
            <p className="switch">Your account will be active after an administrator approves it.</p>
          </>
        )}

        <Link to="/login" className="back">← Back to Sign In</Link>
      </div>
    </div>
  );
}
