import { useDeferredValue, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import BackLink from '../../components/BackLink.jsx';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/Toast.jsx';
import { api, qs } from '../../lib/api.js';
import { formatDate, inr } from '../../lib/format.js';
import { ORDER_STATUSES, statusClass } from '../../lib/orders.js';
import { useApi } from '../../lib/useApi.js';
import './Billing.css';

// Order status is changed on the Orders page (dispatch flow); billing only shows it.
const FILTERS = [
  ['status', 'All Statuses', ORDER_STATUSES],
  ['paymentStatus', 'All Payments', ['Paid', 'Unpaid']],
  ['buyerRole', 'All Buyers', ['doctor', 'pharmacy']],
];
const ROLE = { doctor: 'Doctor', pharmacy: 'Pharmacy' };
const CSV_HEAD = ['Invoice', 'Order', 'Date', 'Buyer', 'Buyer Type', 'Status', 'Payment', 'Method', 'Subtotal', 'GST', 'Delivery', 'Total'];

const csvCell = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;

function downloadCsv(orders) {
  const rows = orders.map((o) => [
    o.invoiceNumber, o.orderNumber, o.createdAt.slice(0, 10), o.buyer?.name, ROLE[o.buyerRole], o.status,
    o.paymentStatus, o.paymentMethod, o.subtotal, o.gst, o.delivery, o.total,
  ]);
  const csv = [CSV_HEAD, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }));
  a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function Invoice({ order: o, company, onClose }) {
  return (
    <div className="invoice">
      <div className="invoice-head">
        <div>
          <img src="/assets/logo.png" alt="" />
          <h2>{company?.name ?? 'MK Animal Health'}</h2>
          {company && <p>{company.address}<br />GSTIN: {company.gstNumber} · {company.phone}</p>}
        </div>
        <div className="invoice-no">
          <h3>TAX INVOICE</h3>
          <p>{o.invoiceNumber}</p>
          <p>Order {o.orderNumber}</p>
          <p>{formatDate(o.createdAt)}</p>
        </div>
      </div>
      <div className="invoice-parties">
        <div>
          <strong>Billed To</strong>
          <p>{o.buyer?.name} ({o.buyer?.code})</p>
          <p>{ROLE[o.buyerRole]}{o.buyer?.phone && ` · ${o.buyer.phone}`}</p>
        </div>
        <div>
          <strong>Payment</strong>
          <p>{o.paymentMethod ?? '—'} · {o.paymentStatus}{o.paidAt && ` on ${formatDate(o.paidAt)}`}</p>
          <p>Order status: {o.status}</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Product</th><th>Category</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
          <tbody>
            {o.items.map((i, n) => (
              <tr key={n}><td>{n + 1}</td><td>{i.name}</td><td>{i.category}</td><td>{i.qty}</td><td>{inr(i.price)}</td><td>{inr(i.total)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="invoice-totals">
        <p><span>Subtotal</span>{inr(o.subtotal)}</p>
        <p><span>GST ({o.items[0]?.gstRate ?? 0}%)</span>{inr(o.gst)}</p>
        <p><span>Delivery</span>{inr(o.delivery)}</p>
        <p className="grand"><span>Grand Total</span>{inr(o.total)}</p>
      </div>
      <div className="invoice-actions">
        <button className="btn ghost" onClick={onClose}>Close</button>
        <button className="btn primary" onClick={() => window.print()}><i className="fa-solid fa-print" /> Print</button>
      </div>
    </div>
  );
}

export default function Billing() {
  const toast = useToast();
  const [params] = useSearchParams();
  const [filters, setFilters] = useState({ search: params.get('search') ?? '', status: '', paymentStatus: '', buyerRole: '', from: '', to: '' });
  const query = useDeferredValue(qs(filters));
  const { data: orders, loading, error, setData } = useApi(`/orders${query}`, []);
  const { data: settings } = useApi('/settings');
  const [invoiceId, setInvoiceId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (error) toast(error.message, 'error');
  }, [error, toast]);

  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  const billed = orders.filter((o) => o.status !== 'Cancelled');
  const sum = (list) => list.reduce((s, o) => s + o.total, 0);
  const collected = sum(billed.filter((o) => o.paymentStatus === 'Paid'));
  const stats = [
    ['fa-file-invoice', 'blue', 'Total Billed', inr(sum(billed)), `${billed.length} invoices`],
    ['fa-sack-dollar', 'green', 'Collected', inr(collected), `${billed.filter((o) => o.paymentStatus === 'Paid').length} paid`],
    ['fa-hourglass-half', 'orange', 'Outstanding', inr(sum(billed) - collected), `${billed.filter((o) => o.paymentStatus === 'Unpaid').length} unpaid`],
  ];
  const invoice = orders.find((o) => o.id === invoiceId);

  async function update(order, path, body, message) {
    setBusyId(order.id);
    try {
      const next = await api.patch(`/orders/${order.id}/${path}`, body);
      setData((list) => list.map((o) => (o.id === next.id ? next : o)));
      toast(message(next), 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  const togglePaid = (o) =>
    update(o, 'payment', { paymentStatus: o.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid' }, (n) => `${n.invoiceNumber} marked ${n.paymentStatus}`);

  return (
    <div className="pg-billing">
      <header className="topbar">
        <div>
          <BackLink />
          <h1>Billing &amp; Finance</h1>
        </div>
        <button className="btn primary" onClick={() => downloadCsv(orders)} disabled={!orders.length}>
          <i className="fa-solid fa-file-csv" /> Export CSV
        </button>
      </header>

      <section className="stats">
        {stats.map(([icon, color, label, value, note]) => (
          <div className="stat" key={label}>
            <div className={`stat-icon ${color}`}><i className={`fa-solid ${icon}`} /></div>
            <div><p>{label}</p><h2>{value}</h2><small>{note}</small></div>
          </div>
        ))}
      </section>

      <section className="filters">
        <label className="field search">
          <i className="fa-solid fa-magnifying-glass" />
          <input type="search" value={filters.search} onChange={set('search')} placeholder="Invoice, order or buyer..." />
        </label>
        {FILTERS.map(([key, all, options]) => (
          <select key={key} className="field" value={filters[key]} onChange={set(key)} aria-label={all}>
            <option value="">{all}</option>
            {options.map((v) => <option key={v} value={v}>{ROLE[v] ?? v}</option>)}
          </select>
        ))}
        <label className="field date"><span>From</span><input type="date" value={filters.from} onChange={set('from')} /></label>
        <label className="field date"><span>To</span><input type="date" value={filters.to} onChange={set('to')} /></label>
      </section>

      <section className="card table-wrap">
        <table>
          <thead>
            <tr><th>Invoice</th><th>Date</th><th>Buyer</th><th>Amount</th><th>Payment</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><strong>{o.invoiceNumber}</strong><small>{o.orderNumber}</small></td>
                <td>{formatDate(o.createdAt)}</td>
                <td>{o.buyer?.name}<small>{ROLE[o.buyerRole]}</small></td>
                <td><strong>{inr(o.total)}</strong><small>{o.paymentMethod}</small></td>
                <td>
                  <button
                    className={`badge ${o.paymentStatus.toLowerCase()}`}
                    onClick={() => togglePaid(o)}
                    disabled={busyId === o.id || (o.status === 'Cancelled' && o.paymentStatus === 'Unpaid')}
                    title={`Mark as ${o.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid'}`}
                  >
                    {o.paymentStatus}
                  </button>
                </td>
                <td>
                  <Link to="/admin/orders" className={`os os-${statusClass(o.status)}`} title="Manage on the Orders page">{o.status}</Link>
                </td>
                <td>
                  <button className="icon-btn" onClick={() => setInvoiceId(o.id)} title="View invoice" aria-label="View invoice">
                    <i className="fa-solid fa-eye" />
                  </button>
                </td>
              </tr>
            ))}
            {!orders.length && <tr><td colSpan={7} className="empty">{loading ? 'Loading invoices…' : 'No invoices match these filters'}</td></tr>}
          </tbody>
        </table>
      </section>

      <Modal open={!!invoice} onClose={() => setInvoiceId(null)} className="billing-overlay">
        {invoice && <Invoice order={invoice} company={settings?.company} onClose={() => setInvoiceId(null)} />}
      </Modal>
    </div>
  );
}
