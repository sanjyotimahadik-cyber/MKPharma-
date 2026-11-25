import { useDeferredValue, useEffect, useState } from 'react';
import { Link } from 'react-router';
import BackLink from '../../components/BackLink.jsx';
import Modal from '../../components/Modal.jsx';
import OrderTracker from '../../components/OrderTracker.jsx';
import { useToast } from '../../components/Toast.jsx';
import { api } from '../../lib/api.js';
import { currentUser } from '../../lib/auth.js';
import { formatDate, inr } from '../../lib/format.js';
import { CANCELLABLE, nextStep, ORDER_FLOW, STATUS_ICON, statusClass, STEP_ACTION } from '../../lib/orders.js';
import { useApi } from '../../lib/useApi.js';
import './Orders.css';

// Order desk for admin and employees: every order from doctors and pharmacies, moved one step at a time.
const OPEN = ORDER_FLOW.slice(0, -1);
const TABS = [
  ['todo', 'To do', OPEN],
  ...ORDER_FLOW.map((s) => [s, s, [s]]),
  ['Cancelled', 'Cancelled', ['Cancelled']],
  ['all', 'All', null],
];
const ROLE = { doctor: 'Doctor', pharmacy: 'Pharmacy' };
const NOTE_HINT = {
  Confirmed: 'Optional note for the buyer',
  Packed: 'e.g. 3 cartons, batch checked',
  Dispatched: 'Vehicle or courier, e.g. Van MH-19-AB-4521',
  'Out for Delivery': 'Delivery person and phone',
  Delivered: 'Received by (name)',
  Cancelled: 'Reason (shared with the buyer)',
};
const REFRESH_MS = 60000;

const time = (ts) => new Date(ts.replace(' ', 'T')).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
const place = (b) => b?.meta?.location ?? b?.meta?.area ?? '';

export default function Orders() {
  const toast = useToast();
  const isAdmin = currentUser()?.role === 'admin';
  const { data: orders, loading, error, reload, setData } = useApi('/orders', []);
  const [tab, setTab] = useState('todo');
  const [buyerRole, setBuyerRole] = useState('');
  const [search, setSearch] = useState('');
  const query = useDeferredValue(search.trim().toLowerCase());
  const [detailId, setDetailId] = useState(null);
  const [step, setStep] = useState(null); // { id, status }
  const [note, setNote] = useState('');
  const [collect, setCollect] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (error) toast(error.message, 'error');
  }, [error, toast]);

  // New orders arrive while the desk is open.
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === 'visible' && reload(), REFRESH_MS);
    return () => clearInterval(t);
  }, [reload]);

  const counts = Object.fromEntries(TABS.map(([key, , statuses]) => [key, statuses ? orders.filter((o) => statuses.includes(o.status)).length : orders.length]));
  const statuses = TABS.find(([key]) => key === tab)[2];
  const shown = orders.filter((o) =>
    (!statuses || statuses.includes(o.status)) &&
    (!buyerRole || o.buyerRole === buyerRole) &&
    (!query || [o.orderNumber, o.invoiceNumber, o.buyer?.name, o.buyer?.code, o.buyer?.phone, place(o.buyer)].some((v) => v?.toLowerCase().includes(query))),
  );
  // Work queue: oldest first, so nothing waits too long. History tabs: newest first.
  if (tab === 'todo' || OPEN.includes(tab)) shown.reverse();

  const detail = orders.find((o) => o.id === detailId);
  const stepping = step && orders.find((o) => o.id === step.id);

  const replace = (next) => setData((list) => list.map((o) => (o.id === next.id ? next : o)));

  function openStep(o, status) {
    setNote('');
    setCollect(false);
    setStep({ id: o.id, status });
  }

  async function applyStep() {
    setBusy(true);
    try {
      let next = await api.patch(`/orders/${stepping.id}/status`, { status: step.status, note });
      if (collect && next.paymentStatus !== 'Paid') next = await api.patch(`/orders/${next.id}/payment`, { paymentStatus: 'Paid' });
      replace(next);
      toast(`${next.orderNumber} ${step.status === 'Cancelled' ? 'cancelled' : `marked ${step.status}`}`, 'success');
      setStep(null);
    } catch (e) {
      toast(e.message, 'error');
      reload();
    } finally {
      setBusy(false);
    }
  }

  async function togglePaid(o) {
    setBusy(true);
    try {
      const next = await api.patch(`/orders/${o.id}/payment`, { paymentStatus: o.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid' });
      replace(next);
      toast(`${next.orderNumber} marked ${next.paymentStatus}`, 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  /** The "move to next step" button for an order, or nothing once it is delivered or cancelled. */
  function stepButton(o, small) {
    const s = nextStep(o.status);
    if (!s) return null;
    const [label, icon] = STEP_ACTION[s];
    return (
      <button className={`btn primary${small ? ' sm' : ''}`} onClick={() => openStep(o, s)} disabled={busy}>
        <i className={`fa-solid ${icon}`} /> {label}
      </button>
    );
  }

  return (
    <div className="pg-orders">
      <header className="topbar">
        <div>
          <BackLink />
          <h1>Orders</h1>
          <p>Confirm, pack, dispatch and deliver orders from doctors and pharmacies.</p>
        </div>
        <button className="btn ghost" onClick={reload} disabled={loading}>
          <i className={`fa-solid fa-rotate${loading ? ' fa-spin' : ''}`} /> Refresh
        </button>
      </header>

      <nav className="pipeline" aria-label="Order status">
        {TABS.map(([key, label]) => (
          <button key={key} className={`stage${tab === key ? ' active' : ''}${key === 'todo' ? ' todo' : ''}`} onClick={() => setTab(key)} aria-pressed={tab === key}>
            {STATUS_ICON[key] && <i className={`fa-solid ${STATUS_ICON[key]}`} />}
            <span>{label}</span>
            <b>{counts[key]}</b>
          </button>
        ))}
      </nav>

      <section className="filters">
        <label className="field search">
          <i className="fa-solid fa-magnifying-glass" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order, buyer, phone or town…" />
        </label>
        <select className="field" value={buyerRole} onChange={(e) => setBuyerRole(e.target.value)} aria-label="Buyer type">
          <option value="">All buyers</option>
          <option value="doctor">Doctors</option>
          <option value="pharmacy">Pharmacies</option>
        </select>
      </section>

      <section className="card list">
        <table>
          <thead>
            <tr><th>Order</th><th>Buyer</th><th>Items</th><th>Payment</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {shown.map((o) => (
              <tr key={o.id}>
                <td data-label="Order">
                  <button className="link" onClick={() => setDetailId(o.id)}>{o.orderNumber}</button>
                  <small>{formatDate(o.createdAt)} · {time(o.createdAt)}</small>
                </td>
                <td data-label="Buyer">
                  <strong>{o.buyer?.name}</strong>
                  <small>{ROLE[o.buyerRole]}{place(o.buyer) && ` · ${place(o.buyer)}`}</small>
                </td>
                <td data-label="Items">
                  <strong>{inr(o.total)}</strong>
                  <small>{o.items.length} product{o.items.length === 1 ? '' : 's'} · {o.items.reduce((n, i) => n + i.qty, 0)} units</small>
                </td>
                <td data-label="Payment">
                  <button
                    className={`pay ${o.paymentStatus.toLowerCase()}`}
                    onClick={() => togglePaid(o)}
                    disabled={busy || (o.status === 'Cancelled' && o.paymentStatus === 'Unpaid')}
                    title={`${o.paymentMethod} · click to mark ${o.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid'}`}
                  >
                    {o.paymentStatus}
                  </button>
                  <small>{o.paymentMethod}</small>
                </td>
                <td data-label="Status">
                  <span className={`os os-${statusClass(o.status)}`}><i className={`fa-solid ${STATUS_ICON[o.status]}`} /> {o.status}</span>
                </td>
                <td className="actions">
                  {stepButton(o, true)}
                  <button className="icon-btn" onClick={() => setDetailId(o.id)} title="Order details" aria-label={`Details for ${o.orderNumber}`}>
                    <i className="fa-solid fa-eye" />
                  </button>
                </td>
              </tr>
            ))}
            {!shown.length && (
              <tr className="empty-row">
                <td colSpan={6} className="empty">
                  {loading ? 'Loading orders…' : tab === 'todo' && !query && !buyerRole ? 'All caught up. No orders waiting.' : 'No orders match these filters'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <Modal open={!!detail} onClose={() => setDetailId(null)} className="orders-overlay">
        {detail && (
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="order-title">
            <header className="sheet-head">
              <div>
                <h2 id="order-title">{detail.orderNumber}</h2>
                <p>{detail.invoiceNumber} · placed {formatDate(detail.createdAt)} at {time(detail.createdAt)}</p>
              </div>
              <span className={`os os-${statusClass(detail.status)}`}><i className={`fa-solid ${STATUS_ICON[detail.status]}`} /> {detail.status}</span>
              <button className="icon-btn close" onClick={() => setDetailId(null)} aria-label="Close"><i className="fa-solid fa-xmark" /></button>
            </header>

            <div className="sheet-body">
              <OrderTracker order={detail} />

              <div className="cols">
                <section className="box">
                  <h3><i className="fa-solid fa-location-dot" /> Deliver to</h3>
                  <p className="name">{detail.buyer?.name} <small>{detail.buyer?.code} · {ROLE[detail.buyerRole]}</small></p>
                  {detail.buyer?.meta?.hospital && <p>{detail.buyer.meta.hospital}</p>}
                  {detail.buyer?.meta?.owner && <p>Owner: {detail.buyer.meta.owner}</p>}
                  {place(detail.buyer) && <p>{place(detail.buyer)}</p>}
                  {detail.buyer?.phone && <p><a href={`tel:${detail.buyer.phone}`}><i className="fa-solid fa-phone" /> {detail.buyer.phone}</a></p>}
                </section>
                <section className="box">
                  <h3><i className="fa-solid fa-wallet" /> Payment</h3>
                  <p className="name">{inr(detail.total)}</p>
                  <p>{detail.paymentMethod}</p>
                  <p>
                    <button className={`pay ${detail.paymentStatus.toLowerCase()}`} onClick={() => togglePaid(detail)}
                      disabled={busy || (detail.status === 'Cancelled' && detail.paymentStatus === 'Unpaid')}>
                      {detail.paymentStatus}
                    </button>
                    {detail.paidAt && <small> on {formatDate(detail.paidAt)}</small>}
                  </p>
                </section>
              </div>

              <section className="box items">
                <h3><i className="fa-solid fa-boxes-stacked" /> Items to pack</h3>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Product</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
                    <tbody>
                      {detail.items.map((i, n) => (
                        <tr key={n}><td>{i.name}<small>{i.category}</small></td><td><b>{i.qty}</b></td><td>{inr(i.price)}</td><td>{inr(i.total)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <dl className="totals">
                  <div><dt>Subtotal</dt><dd>{inr(detail.subtotal)}</dd></div>
                  <div><dt>GST</dt><dd>{inr(detail.gst)}</dd></div>
                  <div><dt>Delivery</dt><dd>{inr(detail.delivery)}</dd></div>
                  <div className="grand"><dt>Total</dt><dd>{inr(detail.total)}</dd></div>
                </dl>
              </section>
            </div>

            <footer className="sheet-foot">
              {CANCELLABLE.includes(detail.status) && (
                <button className="btn danger-ghost" onClick={() => openStep(detail, 'Cancelled')} disabled={busy}>
                  <i className="fa-solid fa-ban" /> Cancel order
                </button>
              )}
              <span className="spacer" />
              {isAdmin && <Link className="btn ghost" to={`/admin/billing?search=${detail.invoiceNumber}`}><i className="fa-solid fa-file-invoice" /> Invoice</Link>}
              {stepButton(detail)}
            </footer>
          </div>
        )}
      </Modal>

      <Modal open={!!stepping} onClose={() => !busy && setStep(null)} className="orders-overlay">
        {stepping && (
          <form className="confirm" onSubmit={(e) => { e.preventDefault(); applyStep(); }}>
            <h2>
              <i className={`fa-solid ${STATUS_ICON[step.status]}`} />{' '}
              {step.status === 'Cancelled' ? 'Cancel order?' : `${STEP_ACTION[step.status][0]}?`}
            </h2>
            <p>
              {stepping.orderNumber} for <b>{stepping.buyer?.name}</b>
              {step.status === 'Cancelled'
                ? ' will be cancelled and its items returned to stock. The buyer is notified.'
                : ` moves to “${step.status}”. The buyer sees this in their order tracking.`}
            </p>
            <label className="note">
              <span>Note {step.status === 'Cancelled' ? '' : '(optional)'}</span>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={NOTE_HINT[step.status]} maxLength={255} autoFocus required={step.status === 'Cancelled'} />
            </label>
            {step.status === 'Delivered' && stepping.paymentStatus !== 'Paid' && (
              <label className="check">
                <input type="checkbox" checked={collect} onChange={(e) => setCollect(e.target.checked)} />
                <span>Payment of <b>{inr(stepping.total)}</b> collected ({stepping.paymentMethod})</span>
              </label>
            )}
            <div className="confirm-actions">
              <button type="button" className="btn ghost" onClick={() => setStep(null)} disabled={busy}>{step.status === 'Cancelled' ? 'Keep order' : 'Back'}</button>
              <button type="submit" className={`btn ${step.status === 'Cancelled' ? 'danger' : 'primary'}`} disabled={busy}>
                {busy ? 'Saving…' : step.status === 'Cancelled' ? 'Cancel order' : STEP_ACTION[step.status][0]}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
