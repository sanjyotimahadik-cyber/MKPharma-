import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { getToken } from '../lib/api.js';
import { currentUser, HOME, login } from '../lib/auth.js';
import { useToast } from '../components/Toast.jsx';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const existing = currentUser();
  if (existing && getToken()) return <Navigate to={HOME[existing.role]} replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(form.email.trim(), form.password);
      toast(`Welcome, ${user.name}`);
      navigate(HOME[user.role]);
    } catch (err) {
      setError(err.message);
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

      <div className="login-card">
        <h1>Sign In</h1>
        <p>Use the email and password you registered with</p>

        <form className="auth-form" onSubmit={submit}>
          <label>
            <span>Email</span>
            <div className="input-icon">
              <i className="fa-solid fa-envelope" />
              <input type="text" autoComplete="username" value={form.email} onChange={set('email')} placeholder="you@example.com" required autoFocus />
            </div>
          </label>
          <label>
            <span>Password</span>
            <div className="input-icon">
              <i className="fa-solid fa-lock" />
              <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={set('password')} required />
              <button type="button" className="eye" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>
          </label>

          {error && <div className="form-error" role="alert"><i className="fa-solid fa-circle-exclamation" /> {error}</div>}

          <button type="submit" className="primary-btn" disabled={busy}>
            {busy ? <><i className="fa-solid fa-spinner fa-spin" /> Signing in…</> : 'Sign In'}
          </button>
        </form>

        <p className="switch">New to MK Animal Health? <Link to="/register">Register</Link></p>
        <Link to="/" className="back">← Back</Link>
      </div>
    </div>
  );
}
