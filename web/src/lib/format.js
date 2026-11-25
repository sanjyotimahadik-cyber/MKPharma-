export const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/** Local date as 'YYYY-MM-DD' (toISOString would give the UTC date). */
export const todayISO = (d = new Date()) => d.toLocaleDateString('en-CA');
