import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/Toast.jsx';
import { api } from '../../lib/api.js';
import { logout } from '../../lib/auth.js';
import { formatDate, inr } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import './MRDashboard.css';

const yesNo = (b) => (b ? 'Yes' : 'No');
const timeOf = (ts) => (ts ? new Date(ts.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

/** Resolves to { latitude, longitude, accuracy } or rejects with a readable message. */
const getPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('GPS not supported on this device'));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: +coords.latitude.toFixed(6), longitude: +coords.longitude.toFixed(6), accuracy: Math.round(coords.accuracy) }),
      (err) => reject(new Error(`Location unavailable: ${err.message}`)),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  });

export default function MRDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const summary = useApi('/mr/summary');
  const doctors = useApi('/mr/doctors', []);
  const targets = useApi('/targets/mine', []);
  const { data: products } = useApi('/products', []);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null); // visit being created/edited while the modal is open
  const [gps, setGps] = useState('');
  const [busy, setBusy] = useState(false);

  const loadError = summary.error ?? doctors.error ?? targets.error;
  useEffect(() => {
    if (loadError) toast(loadError.message, 'error');
  }, [loadError, toast]);

  const s = summary.data;
  const cards = [
    { icon: 'fa-user-check', title: 'Attendance', value: s?.attendance },
    { icon: 'fa-bullseye', title: "Today's Target", value: s && `${s.todayVisits.done} / ${s.todayVisits.target}` },
    { icon: 'fa-chart-line', title: 'Monthly Target', value: s && `${s.monthVisits.done} / ${s.monthVisits.target}` },
    { icon: 'fa-location-dot', title: 'Assigned Area', value: s && (s.area || '—') },
  ];

  const shown = useMemo(() => {
    const q = search.toLowerCase().trim();
    return doctors.data.filter((d) => `${d.name} ${d.phone} ${d.area} ${d.hospital}`.toLowerCase().includes(q));
  }, [doctors.data, search]);

  const attendanceAction = async () => {
    setBusy(true);
    try {
      if (s.checkIn) {
        await api.post('/attendance/check-out');
        toast('Checked out. Have a good evening!');
      } else {
        const pos = await getPosition().catch(() => ({}));
        const rec = await api.post('/attendance/check-in', pos);
        toast(`Attendance marked: ${rec.status}`);
      }
      await summary.reload();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const captureLocation = () => {
    setGps('Capturing location…');
    getPosition().then(
      (location) => {
        setForm((f) => f && { ...f, location });
        setGps('');
      },
      (e) => setGps(e.message),
    );
  };

  const openVisit = (doctor) => {
    const v = doctor.visitedToday ? doctor.lastVisit : null;
    setGps('');
    setForm({
      doctor,
      id: v?.id,
      date: formatDate(v?.visitDate ?? new Date()),
      time: v ? timeOf(v.visitedAt) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notes: v?.notes ?? '',
      products: v?.products ?? '',
      sample: yesNo(v ? v.sampleGiven : true),
      order: yesNo(v?.orderTaken),
      location: v?.latitude != null ? { latitude: v.latitude, longitude: v.longitude, accuracy: v.accuracy } : null,
    });
    if (!v) captureLocation();
  };

  const save = async () => {
    const body = {
      notes: form.notes,
      products: form.products,
      sampleGiven: form.sample === 'Yes',
      orderTaken: form.order === 'Yes',
      ...form.location,
    };
    setBusy(true);
    try {
      if (form.id) await api.put(`/mr/visits/${form.id}`, body);
      else await api.post('/mr/visits', { ...body, doctorId: form.doctor.id });
      toast('Visit details saved successfully.');
      if (!form.location) toast('Visit saved without GPS location.', 'warning');
      setForm(null);
      doctors.reload();
      summary.reload();
      targets.reload();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const field = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });
  const loc = form?.location;

  return (
    <div className="pg-mr">
      <header className="topbar">
        <h1>MR Dashboard</h1>
        <div className="company-info">
          <div className="company-text">
            <h2>MK Animal Health</h2>
            <span>ERP System</span>
          </div>
          <img src="/assets/logo.png" alt="Company Logo" className="company-logo" />
          <button className="logout-btn" onClick={() => { logout(); navigate('/login'); }} title="Logout">
            <i className="fa-solid fa-right-from-bracket" />
          </button>
        </div>
      </header>

      <main className="dashboard-container">
        {cards.map((c, i) => (
          <div key={c.title} className="dashboard-card">
            <div className="card-icon"><i className={`fa-solid ${c.icon}`} /></div>
            <div>
              <h3>{c.title}</h3>
              <p className="card-value">{c.value ?? '…'}</p>
              {i === 0 && s && !s.checkOut && (
                <button className="att-btn" onClick={attendanceAction} disabled={busy}>
                  {s.checkIn ? `Check Out (in ${timeOf(s.checkIn)})` : 'Mark Attendance'}
                </button>
              )}
              {i === 0 && s?.checkOut && <small className="att-done">{timeOf(s.checkIn)} – {timeOf(s.checkOut)}</small>}
            </div>
          </div>
        ))}
      </main>

      {targets.data.length > 0 && (
        <section className="doctor-section targets">
          <h2>My Targets</h2>
          <div className="target-grid">
            {targets.data.map((t) => {
              const fmt = (n) => (t.metric === 'sales' ? inr(n) : `${n} visits`);
              return (
                <div key={t.id} className="target">
                  <div className="target-head"><strong>{t.name}</strong><span>{t.progress}%</span></div>
                  <div className="bar"><span style={{ width: `${t.progress}%` }} /></div>
                  <small>{fmt(t.achieved)} of {fmt(t.targetValue)} · {formatDate(t.startDate)} – {formatDate(t.endDate)}</small>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="doctor-section">
        <div className="section-header">
          <h2>Doctors &amp; Pharmacies</h2>
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass" />
            <input type="text" placeholder="Search Doctor" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="table-container">
          <table className="doctor-table">
            <thead>
              <tr><th>Name</th><th>Mobile</th><th>Area</th><th>Last Visit</th><th>Status</th><th>Visit</th></tr>
            </thead>
            <tbody>
              {shown.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}<small className="sub">{d.role === 'pharmacy' ? 'Pharmacy' : d.hospital}</small></td>
                  <td>{d.phone}</td>
                  <td>{d.area}</td>
                  <td>{d.lastVisit ? formatDate(d.lastVisit.visitDate) : '—'}</td>
                  <td>
                    <span className={`status ${d.visitedToday ? 'visited' : 'pending'}`}>{d.visitedToday ? 'Visited' : 'Pending'}</span>
                  </td>
                  <td>
                    {d.visitedToday
                      ? <button className="view-btn" onClick={() => openVisit(d)}>View</button>
                      : <button className="visit-btn" onClick={() => openVisit(d)}>Visit</button>}
                  </td>
                </tr>
              ))}
              {!shown.length && (
                <tr><td colSpan="6" className="empty">{doctors.loading ? 'Loading…' : 'No assigned doctors found'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={!!form} onClose={() => setForm(null)} className="mr-modal">
        {form && (
          <div className="modal-content">
            <button className="close-btn" onClick={() => setForm(null)} aria-label="Close">&times;</button>
            <h2>Visit Details</h2>
            <div className="visit-details">
              <p><strong>{form.doctor.role === 'pharmacy' ? 'Pharmacy' : 'Doctor Name'}:</strong> {form.doctor.name}</p>
              <p><strong>Visit Date:</strong> {form.date}</p>
              <p><strong>Visit Time:</strong> {form.time}</p>
              <p className="gps">
                <strong><i className="fa-solid fa-location-crosshairs" /> Location:</strong>{' '}
                {loc
                  ? <a href={`https://maps.google.com/?q=${loc.latitude},${loc.longitude}`} target="_blank" rel="noreferrer">
                      {loc.latitude}, {loc.longitude} (±{loc.accuracy} m)
                    </a>
                  : gps || 'Not captured'}
                <button type="button" className="gps-btn" onClick={captureLocation} title="Capture location">
                  <i className="fa-solid fa-rotate-right" />
                </button>
              </p>
              <label>Discussion Notes:
                <textarea rows="4" placeholder="Enter discussion details..." {...field('notes')} />
              </label>
              <label>Products Discussed:
                <input type="text" list="mr-products" placeholder="Enter product names" {...field('products')} />
              </label>
              <datalist id="mr-products">
                {products.map((p) => <option key={p.id} value={p.name} />)}
              </datalist>
              {[['sample', 'Sample Given:'], ['order', 'Order Received:']].map(([key, label]) => (
                <label key={key}>{label}
                  <select {...field(key)}><option>Yes</option><option>No</option></select>
                </label>
              ))}
              <button className="save-btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : form.id ? 'Update' : 'Save'}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
