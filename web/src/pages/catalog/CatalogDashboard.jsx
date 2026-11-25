import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import Modal from '../../components/Modal.jsx';
import OrderTracker from '../../components/OrderTracker.jsx';
import { useToast } from '../../components/Toast.jsx';
import { api } from '../../lib/api.js';
import { logout } from '../../lib/auth.js';
import { formatDate, inr } from '../../lib/format.js';
import { STATUS_ICON, statusClass } from '../../lib/orders.js';
import { isExpired } from '../../lib/products.js';
import { useApi } from '../../lib/useApi.js';
import './CatalogDashboard.css';

const TITLES = { doctor: 'Doctor Panel', pharmacy: 'Pharmacy Panel' };
const PAYMENT_METHODS = ['Cash on Delivery', 'UPI Payment'];
const SORTERS = {
  name: (a, b) => a.name.localeCompare(b.name),
  price: (a, b) => a.price - b.price,
  stock: (a, b) => b.stock - a.stock,
};

function stockStatus(p) {
  if (isExpired(p)) return ['Expired', 'out'];
  if (p.stock <= 0) return ['Out of Stock', 'out'];
  if (p.stock <= p.reorderLevel) return ['Low Stock', 'low'];
  return ['In Stock', 'ok'];
}

const hsn = (category) => (category === 'Veterinary Medicine' ? '3004' : '2309');
const toLine = (p, qty) => ({ productId: p.id, name: p.name, category: p.category, price: p.price, qty });

/** Preview only: the server recomputes the real totals from products + billing settings when the order is placed. */
function totals(items, { gstRate = 12, deliveryCharge = 0 } = {}) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const gst = Math.round(subtotal * gstRate) / 100;
  const delivery = items.length ? deliveryCharge : 0;
  return { subtotal, gst, gstRate, delivery, total: subtotal + gst + delivery };
}

function TargetCard({ target: t }) {
  const fmt = (v) => (t.metric === 'sales' ? inr(v) : `${v} visits`);
  return (
    <div className="target-card">
      <div className="target-header"><h2>{t.name}</h2><span>{t.progress}%</span></div>
      <div className="target-progress"><div className="target-fill" style={{ width: `${Math.min(t.progress, 100)}%` }} /></div>
      <p>{fmt(t.achieved)} of {fmt(t.targetValue)} achieved · ends {formatDate(t.endDate)}</p>
    </div>
  );
}

function Dialog({ open, onClose, icon, title, className = '', footer, children }) {
  return (
    <Modal open={open} onClose={onClose} className="cat-overlay">
      <div className={`dialog ${className}`}>
        <div className="dialog-header">
          <h2><i className={`fa-solid ${icon}`} /> {title}</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close"><i className="fa-solid fa-xmark" /></button>
        </div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-footer">{footer}</div>}
      </div>
    </Modal>
  );
}

function ItemsTable({ items, subtotal }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr><th>HSN</th><th>Product Name</th><th>Quantity</th><th>M.R.P.</th><th>Cost</th></tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.productId}>
              <td>{hsn(i.category)}</td>
              <td>{i.name}</td>
              <td>{i.qty}</td>
              <td>{inr(i.price)}</td>
              <td>{inr(i.price * i.qty)}</td>
            </tr>
          ))}
          {subtotal != null && (
            <tr className="total-row"><td colSpan={4}>Subtotal</td><td>{inr(subtotal)}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Summary({ subtotal, gst, gstRate, delivery, total }) {
  const rows = [['Subtotal', subtotal], [`GST (${gstRate}%)`, gst], ['Delivery Charge', delivery], ['Grand Total', total]];
  return (
    <div className="summary">
      {rows.map(([label, value], i) => (
        <div key={label} className={`summary-row${i === rows.length - 1 ? ' grand-total' : ''}`}>
          <span>{label}</span><strong>{inr(value)}</strong>
        </div>
      ))}
    </div>
  );
}

function ProductDetails({ product: p, onClose, onAdd, onBuy }) {
  const [img, setImg] = useState(0);
  const n = p.images.length;
  const details = [
    ['Description', p.description],
    ['Benefits', p.benefits],
    ['Composition', p.composition],
    ['Indications', p.indications],
    ['Dosage', p.dosage],
    ['Available Stock', `${p.stock} Units`],
    ['Expiry Date', formatDate(p.expiry)],
  ];
  return (
    <div className="product-modal">
      <button className="close-btn close-modal" onClick={onClose} aria-label="Close"><i className="fa-solid fa-xmark" /></button>
      <div className="modal-left">
        {n > 1 && (
          <button className="slider-btn prev" onClick={() => setImg((i) => (i - 1 + n) % n)} aria-label="Previous image">
            <i className="fa-solid fa-chevron-left" />
          </button>
        )}
        <img src={p.images[img]} alt={p.name} />
        {n > 1 && (
          <button className="slider-btn next" onClick={() => setImg((i) => (i + 1) % n)} aria-label="Next image">
            <i className="fa-solid fa-chevron-right" />
          </button>
        )}
      </div>
      <div className="modal-right">
        <h2>{p.name}</h2>
        <h3>{inr(p.price)}</h3>
        {details.map(([title, value]) => (
          <div className="detail-box" key={title}>
            <h4>{title}</h4>
            {Array.isArray(value) ? <ul>{value.map((v) => <li key={v}>{v}</li>)}</ul> : <p>{value}</p>}
          </div>
        ))}
        <div className="modal-actions">
          <button className="update-btn" onClick={() => onAdd(p)}><i className="fa-solid fa-cart-plus" /> Add to Cart</button>
          <button className="delete-btn" onClick={() => onBuy(p)}><i className="fa-solid fa-bag-shopping" /> Buy Product</button>
        </div>
      </div>
    </div>
  );
}

export default function CatalogDashboard({ portal }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: products, loading, error, reload: reloadProducts } = useApi('/products', []);
  const { data: orders, setData: setOrders, reload: reloadOrders } = useApi('/orders', []);
  const { data: settings } = useApi('/settings');
  const { data: targets } = useApi('/targets/mine', []);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [viewId, setViewId] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState(null);
  const [payMethod, setPayMethod] = useState(PAYMENT_METHODS[0]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [billId, setBillId] = useState(null);
  const [cancelId, setCancelId] = useState(null);
  const [busy, setBusy] = useState(false);

  const billing = settings?.billing;
  const company = settings?.company;
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => p.name.toLowerCase().includes(q));
    return SORTERS[sort] ? list.sort(SORTERS[sort]) : list;
  }, [products, search, sort]);
  const cartLines = cart.flatMap(({ productId, qty }) => (byId.has(productId) ? [toLine(byId.get(productId), qty)] : []));
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const viewed = byId.get(viewId);
  const bill = orders.find((o) => o.id === billId);
  const cancelling = orders.find((o) => o.id === cancelId);

  const available = (p) => {
    if (stockStatus(p)[1] !== 'out') return true;
    toast(`${p.name} is not available right now`, 'error');
    return false;
  };

  function addToCart(p) {
    if (!available(p)) return;
    const inCart = cart.find((c) => c.productId === p.id)?.qty ?? 0;
    if (inCart >= p.stock) return toast(`Only ${p.stock} units of ${p.name} available`, 'warning');
    setCart((c) => (inCart ? c.map((x) => (x.productId === p.id ? { ...x, qty: x.qty + 1 } : x)) : [...c, { productId: p.id, qty: 1 }]));
    toast(`${p.name} added to cart`, 'success');
  }

  function changeQty(id, delta) {
    const next = (cart.find((c) => c.productId === id)?.qty ?? 0) + delta;
    if (next < 1) return;
    if (next > byId.get(id).stock) return toast(`Only ${byId.get(id).stock} units available`, 'warning');
    setCart((c) => c.map((x) => (x.productId === id ? { ...x, qty: next } : x)));
  }

  function buyNow(p) {
    if (!available(p)) return;
    setViewId(null);
    setCheckout({ items: [toLine(p, 1)], fromCart: false });
  }

  function placeOrder() {
    if (!cartLines.length) return toast('Your cart is empty', 'warning');
    setCartOpen(false);
    setCheckout({ items: cartLines, fromCart: true });
  }

  function closePayment() {
    if (checkout?.fromCart) setCartOpen(true);
    setCheckout(null);
  }

  // Runs an order request with a busy flag; stock is reloaded afterwards because orders change it.
  async function run(request, success) {
    setBusy(true);
    try {
      const order = await request();
      toast(success(order), 'success');
      reloadProducts();
      return order;
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function confirmOrder() {
    const { items, fromCart } = checkout;
    const body = { items: items.map(({ productId, qty }) => ({ productId, qty })), paymentMethod: payMethod };
    const order = await run(() => api.post('/orders', body), (o) => `Order ${o.orderNumber} placed successfully`);
    if (!order) return;
    setOrders((list) => [order, ...list]);
    if (fromCart) setCart([]);
    setCheckout(null);
  }

  async function cancelOrder() {
    const order = await run(() => api.patch(`/orders/${cancelId}/status`, { status: 'Cancelled' }), (o) => `Order ${o.orderNumber} cancelled`);
    if (order) setOrders((list) => list.map((x) => (x.id === order.id ? order : x)));
    setCancelId(null);
  }

  return (
    <div className="pg-catalog">
      <header className="page-header">
        <div className="header-left">
          <h1>{TITLES[portal]}</h1>
          <p>Order products, check your target status, stock availability and product information.</p>
        </div>
        <div className="header-right">
          <div className="logo-wrapper"><img src="/assets/logo.png" alt="MK Animal Health" className="company-logo" /></div>
          <div className="company-details">
            <h2>MK Animal Health</h2>
            <span>Distribution ERP</span>
          </div>
          <button className="logout-btn" onClick={() => { logout(); navigate('/login'); }} aria-label="Logout" title="Logout">
            <i className="fa-solid fa-right-from-bracket" />
          </button>
        </div>
      </header>

      <section className="toolbar">
        <button className="tool-btn" onClick={() => setCartOpen(true)}>
          <i className="fa-solid fa-cart-shopping" /> View Cart{cartCount > 0 && <span className="cart-count">{cartCount}</span>}
        </button>
        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass" />
          <input type="text" placeholder="Search Product" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="tool-btn" onClick={() => { reloadOrders(); setHistoryOpen(true); }}>
          <i className="fa-solid fa-clock-rotate-left" /> History
        </button>
        <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">Sort By</option>
          <option value="name">Product Name</option>
          <option value="price">Price</option>
          <option value="stock">Stock</option>
        </select>
      </section>

      <section className="target-dashboard">
        {targets.slice(0, 2).map((t) => <TargetCard key={t.id} target={t} />)}
        {targets.length === 0 && (
          <div className="target-card no-targets"><i className="fa-solid fa-bullseye" /><p>No active targets right now</p></div>
        )}
      </section>

      <section className="product-grid">
        {loading && !products.length && <div className="empty">Loading products…</div>}
        {error && !products.length && <div className="empty">{error.message}</div>}
        {!loading && !error && visible.length === 0 && <div className="empty">No Products Found</div>}
        {visible.map((p) => {
          const [label, cls] = stockStatus(p);
          return (
            <div className="product-card" key={p.id} onClick={() => setViewId(p.id)}>
              <div className="product-slider"><img src={p.images[0]} alt={p.name} className="product-image" /></div>
              <div className="product-info">
                <h2>{p.name}</h2>
                <h3>{inr(p.price)}</h3>
                <p>{p.category}</p>
                <span className={`status-badge ${cls}`}>{label}</span>
              </div>
              <div className="product-buttons" onClick={(e) => e.stopPropagation()}>
                <button className="update-btn" onClick={() => addToCart(p)}><i className="fa-solid fa-cart-plus" /> Add to Cart</button>
                <button className="delete-btn" onClick={() => buyNow(p)}><i className="fa-solid fa-bag-shopping" /> Buy Product</button>
              </div>
            </div>
          );
        })}
      </section>

      <Modal open={!!viewed} onClose={() => setViewId(null)} className="cat-overlay">
        <ProductDetails product={viewed} onClose={() => setViewId(null)} onAdd={addToCart} onBuy={buyNow} />
      </Modal>

      <Dialog
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        icon="fa-cart-shopping"
        title="Shopping Cart"
        className="cart-dialog"
        footer={
          <>
            <Summary {...totals(cartLines, billing)} />
            <div className="dialog-actions">
              <button className="btn-secondary" onClick={() => setCartOpen(false)}><i className="fa-solid fa-arrow-left" /> Continue Shopping</button>
              <button className="btn-primary" onClick={placeOrder}><i className="fa-solid fa-bag-shopping" /> Place Order</button>
            </div>
          </>
        }
      >
        {cartLines.length === 0 && <div className="empty">Your cart is empty</div>}
        {cartLines.map((l) => (
          <div className="cart-item" key={l.productId}>
            <img src={byId.get(l.productId).images[0]} alt={l.name} />
            <div className="cart-name"><h3>{l.name}</h3><p>{l.category}</p></div>
            <div className="cart-price">{inr(l.price)}</div>
            <div className="cart-quantity">
              <button onClick={() => changeQty(l.productId, -1)} aria-label="Decrease"><i className="fa-solid fa-minus" /></button>
              <span>{l.qty}</span>
              <button onClick={() => changeQty(l.productId, 1)} aria-label="Increase"><i className="fa-solid fa-plus" /></button>
            </div>
            <div className="cart-price">{inr(l.price * l.qty)}</div>
            <button className="remove-item" onClick={() => setCart((c) => c.filter((x) => x.productId !== l.productId))} aria-label="Remove">
              <i className="fa-solid fa-trash" />
            </button>
          </div>
        ))}
      </Dialog>

      <Dialog
        open={!!checkout}
        onClose={closePayment}
        icon="fa-credit-card"
        title="Payment Summary"
        footer={
          <div className="dialog-actions">
            <button className="btn-secondary" onClick={closePayment}>Cancel</button>
            <button className="btn-primary" onClick={confirmOrder} disabled={busy}>
              <i className="fa-solid fa-circle-check" /> {busy ? 'Placing…' : 'Confirm Order'}
            </button>
          </div>
        }
      >
        {checkout && (
          <>
            <ItemsTable items={checkout.items} />
            <Summary {...totals(checkout.items, billing)} />
            <div className="panel">
              <h3>Select Payment Method</h3>
              {PAYMENT_METHODS.map((m) => (
                <label className="payment-option" key={m}>
                  <input type="radio" name="paymentMethod" checked={payMethod === m} onChange={() => setPayMethod(m)} />
                  <span>{m}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </Dialog>

      <Dialog
        open={historyOpen}
        onClose={() => !bill && !cancelling && setHistoryOpen(false)}
        icon="fa-clock-rotate-left"
        title="Order History"
        className="history-dialog"
      >
        {orders.length === 0 && <div className="empty">No orders yet</div>}
        {orders.map((o) => {
          const open = expanded === o.id;
          return (
            <div className="order-card" key={o.id}>
              <div className="order-top">
                <div>
                  <h3>Order #{o.orderNumber}</h3>
                  <p>Invoice : {o.invoiceNumber}</p>
                  <p>Date : {formatDate(o.createdAt)}</p>
                </div>
                <span className={`os os-${statusClass(o.status)}`}><i className={`fa-solid ${STATUS_ICON[o.status]}`} /> {o.status}</span>
              </div>
              {/* Delivery tracking: step bar, and the full timeline (with staff notes) when expanded */}
              <div className="order-track"><OrderTracker order={o} compact={!open} showStaff={false} /></div>
              <div className="order-summary">
                <div><strong>Items</strong><p>{o.items.length} Products</p></div>
                <div><strong>Total Amount</strong><p>{inr(o.total)} · {o.paymentStatus}</p></div>
              </div>
              <div className="order-actions">
                <button className="btn-primary" onClick={() => setExpanded(open ? null : o.id)}>
                  <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'}`} /> {open ? 'Hide details' : 'Track & view products'}
                </button>
                <button className="btn-success" onClick={() => setBillId(o.id)}><i className="fa-solid fa-file-invoice" /> View Bill</button>
                {o.status === 'Placed' && (
                  <button className="btn-danger" onClick={() => setCancelId(o.id)}><i className="fa-solid fa-ban" /> Cancel Order</button>
                )}
              </div>
              {open && <ItemsTable items={o.items} subtotal={o.subtotal} />}
            </div>
          );
        })}
      </Dialog>

      <Dialog open={!!bill} onClose={() => setBillId(null)} icon="fa-file-invoice" title="Invoice" className="bill-dialog">
        {bill && (
          <>
            {company && (
              <div className="bill-company">
                <h3>{company.name}</h3>
                <p>{company.address}</p>
                <p>GSTIN: {company.gstNumber}{company.phone && ` · ${company.phone}`}{company.email && ` · ${company.email}`}</p>
              </div>
            )}
            <div className="bill-meta">
              <p><strong>Invoice</strong>{bill.invoiceNumber}</p>
              <p><strong>Order</strong>{bill.orderNumber}</p>
              <p><strong>Date</strong>{formatDate(bill.createdAt)}</p>
              <p><strong>Billed To</strong>{bill.buyer?.name}</p>
              <p><strong>Payment</strong>{bill.paymentMethod ?? '—'} ({bill.paymentStatus})</p>
              <p><strong>Status</strong>{bill.status}</p>
            </div>
            <ItemsTable items={bill.items} />
            <Summary {...bill} gstRate={bill.items[0]?.gstRate ?? billing?.gstRate ?? 12} />
          </>
        )}
      </Dialog>

      <Dialog
        open={!!cancelling}
        onClose={() => setCancelId(null)}
        icon="fa-ban"
        title="Cancel Order"
        className="confirm-dialog"
        footer={
          <div className="dialog-actions">
            <button className="btn-secondary" onClick={() => setCancelId(null)}>Keep Order</button>
            <button className="btn-danger" onClick={cancelOrder} disabled={busy}>{busy ? 'Cancelling…' : 'Cancel Order'}</button>
          </div>
        }
      >
        <p>Cancel order {cancelling?.orderNumber}? The items will be released back to stock.</p>
      </Dialog>
    </div>
  );
}
