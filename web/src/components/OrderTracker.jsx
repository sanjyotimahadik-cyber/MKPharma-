import { ORDER_FLOW, STATUS_ICON, statusClass } from '../lib/orders.js';
import './OrderTracker.css';

const ROLE_TAG = { admin: 'Admin', employee: 'Staff' };

const when = (ts) =>
  ts ? new Date(ts.replace(' ', 'T')).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';

/**
 * Delivery progress for one order: a step bar (Placed → Delivered) and, unless `compact`, the timeline of
 * every change with who made it and any note. Used by the staff order desk and the buyer portals.
 */
export default function OrderTracker({ order, compact = false, showStaff = true }) {
  const cancelled = order.status === 'Cancelled';
  const reachedAt = Object.fromEntries(order.events.map((e) => [e.status, e.at]));
  // A cancelled order shows how far it got before it was cancelled.
  const done = cancelled
    ? Math.max(0, ...order.events.map((e) => ORDER_FLOW.indexOf(e.status)))
    : ORDER_FLOW.indexOf(order.status);

  return (
    <div className={`otk${cancelled ? ' cancelled' : ''}`}>
      <ol className="otk-steps" aria-label="Delivery progress">
        {ORDER_FLOW.map((s, i) => {
          const state = i < done || (i === done && (cancelled || s === 'Delivered')) ? 'done' : i === done ? 'current' : 'todo';
          return (
            <li key={s} className={state} aria-current={state === 'current' ? 'step' : undefined}>
              <span className="dot"><i className={`fa-solid ${state === 'done' ? 'fa-check' : STATUS_ICON[s]}`} /></span>
              <b>{s}</b>
              {!compact && <small>{when(reachedAt[s])}</small>}
            </li>
          );
        })}
      </ol>
      {cancelled && (
        <p className="otk-cancelled"><i className="fa-solid fa-ban" /> Cancelled {when(reachedAt.Cancelled)}</p>
      )}

      {!compact && (
        <ul className="otk-log">
          {[...order.events].reverse().map((e, i) => (
            <li key={i}>
              <span className={`os os-${statusClass(e.status)}`}><i className={`fa-solid ${STATUS_ICON[e.status] ?? 'fa-circle'}`} /> {e.status}</span>
              <div>
                <time>{when(e.at)}</time>
                {showStaff && e.by && <span className="by">by {e.by}{ROLE_TAG[e.byRole] && ` (${ROLE_TAG[e.byRole]})`}</span>}
                {e.note && <p>{e.note}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
