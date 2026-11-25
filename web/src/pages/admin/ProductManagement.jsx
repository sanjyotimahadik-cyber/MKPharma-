import { useEffect, useMemo, useState } from 'react';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/Toast.jsx';
import { api } from '../../lib/api.js';
import { inr, formatDate } from '../../lib/format.js';
import { CATEGORIES, isExpired } from '../../lib/products.js';
import { useApi } from '../../lib/useApi.js';
import './ProductManagement.css';

const CATEGORY_LABELS = {
  'Feed Supplement': 'Feed Supplements',
  'Veterinary Medicine': 'Veterinary Medicines',
  Calcium: 'Calcium & Minerals',
};
const SORTS = {
  name: (a, b) => a.name.localeCompare(b.name),
  price: (a, b) => a.price - b.price,
  stock: (a, b) => b.stock - a.stock,
};
const LIST_FIELDS = [
  ['benefits', 'Benefits'],
  ['composition', 'Composition'],
  ['indications', 'Indications'],
];
const EMPTY_FORM = {
  name: '', category: CATEGORIES[0], price: '', stock: '', expiry: '', description: '',
  benefits: '', composition: '', indications: '', dosage: '', images: [],
};

const statusOf = (p) => {
  if (isExpired(p)) return ['Expired', 'expired'];
  if (p.stock <= 0) return ['Out of Stock', 'expired'];
  if (p.stock <= p.reorderLevel) return ['Low Stock', 'low'];
  return ['In Stock', 'ok'];
};
const toLines = (text) => text.split('\n').map((s) => s.trim()).filter(Boolean);
const readAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

export default function ProductManagement() {
  const { data: products, loading, error, setData: setProducts } = useApi('/products', []);
  const toast = useToast();
  const [busy, setBusy] = useState(''); // 'upload' | 'save' | 'delete' while a request runs
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('default');
  const [viewId, setViewId] = useState(null);
  const [form, setForm] = useState(null); // null = closed; { id?, ...fields } = open
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    if (error) toast(error.message, 'error');
  }, [error, toast]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter(
      (p) => p.name.toLowerCase().includes(q) && (category === 'All' || p.category === category),
    );
    return SORTS[sort] ? list.sort(SORTS[sort]) : list;
  }, [products, search, category, sort]);

  const stats = [
    [products.length, 'Total Products'],
    [products.filter((p) => p.category === 'Feed Supplement').length, 'Feed Supplements'],
    [products.filter((p) => p.category === 'Veterinary Medicine').length, 'Medicines'],
    [products.filter((p) => p.stock > 0 && p.stock <= p.reorderLevel).length, 'Low Stock'],
    [products.filter(isExpired).length, 'Expired'],
  ];

  const viewing = products.find((p) => p.id === viewId);
  const deleting = products.find((p) => p.id === deleteId);

  const openForm = (p) =>
    setForm(
      p
        ? { ...p, expiry: p.expiry ?? '', ...Object.fromEntries(LIST_FIELDS.map(([k]) => [k, p[k].join('\n')])) }
        : EMPTY_FORM,
    );
  const setField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Runs one request at a time with a busy flag and toasts failures.
  const run = async (kind, fn) => {
    setBusy(kind);
    try {
      await fn();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy('');
    }
  };

  const onImages = (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    if (!files.length) return;
    run('upload', async () => {
      const urls = await Promise.all(
        files.map(async (file) => (await api.post('/products/uploads', { name: file.name, dataUrl: await readAsDataURL(file) })).url),
      );
      setForm((f) => ({ ...f, images: urls }));
    });
  };

  const save = (e) => {
    e.preventDefault();
    const body = {
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      expiry: form.expiry || null,
      description: form.description,
      dosage: form.dosage,
      images: form.images,
      ...Object.fromEntries(LIST_FIELDS.map(([k]) => [k, toLines(form[k])])),
    };
    run('save', async () => {
      const saved = form.id ? await api.put(`/products/${form.id}`, body) : await api.post('/products', body);
      setProducts((list) => (form.id ? list.map((p) => (p.id === saved.id ? saved : p)) : [...list, saved]));
      toast(form.id ? 'Product updated' : 'Product added', 'success');
      setForm(null);
    });
  };

  const confirmDelete = () =>
    run('delete', async () => {
      await api.del(`/products/${deleteId}`);
      setProducts((list) => list.filter((p) => p.id !== deleteId));
      if (viewId === deleteId) setViewId(null);
      setDeleteId(null);
      toast('Product deleted', 'success');
    });

  return (
    <div className="pg-products">
      <div className="container">
        <header className="page-header">
          <div className="header-left">
            <h1>Product Management</h1>
            <p>Manage veterinary products, pricing, inventory, stock availability and product information.</p>
          </div>
          <div className="header-right">
            <div className="logo-wrapper">
              <img src="/assets/logo.png" alt="MK Animal Health" className="company-logo" />
            </div>
            <div className="company-details">
              <h2>MK Animal Health</h2>
              <span>Distribution ERP</span>
            </div>
          </div>
        </header>

        <section className="toolbar">
          <button className="add-btn" onClick={() => openForm()}>
            <i className="fa-solid fa-plus" /> Add Product
          </button>
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Product" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="default">Sort By</option>
            <option value="name">Product Name</option>
            <option value="price">Price</option>
            <option value="stock">Stock</option>
          </select>
        </section>

        <section className="stats">
          {stats.map(([value, label]) => (
            <div className="stat-card" key={label}>
              <h2>{value}</h2>
              <p>{label}</p>
            </div>
          ))}
        </section>

        <section className="product-grid">
          {visible.length === 0 && <div className="empty">{loading ? 'Loading products…' : 'No Products Found'}</div>}
          {visible.map((p) => {
            const [status, tone] = statusOf(p);
            return (
              <div className="product-card" key={p.id} onClick={() => setViewId(p.id)}>
                <div className="product-slider">
                  <img src={p.images[0]} alt={p.name} className="product-image" />
                </div>
                <div className="product-info">
                  <h2>{p.name}</h2>
                  <h3>{inr(p.price)}</h3>
                  <p>{p.category}</p>
                  <span className={`status-badge ${tone}`}>{status}</span>
                </div>
                <div className="product-buttons" onClick={(e) => e.stopPropagation()}>
                  <button className="update-btn" onClick={() => openForm(p)}>
                    <i className="fa-solid fa-pen" /> Update
                  </button>
                  <button className="delete-btn" onClick={() => setDeleteId(p.id)}>
                    <i className="fa-solid fa-trash" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      </div>

      <Modal open={!!viewing} onClose={() => setViewId(null)} className="pm-overlay">
        {viewing && (
          <ProductDetails
            key={viewing.id}
            product={viewing}
            onClose={() => setViewId(null)}
            onEdit={() => { setViewId(null); openForm(viewing); }}
            onDelete={() => setDeleteId(viewing.id)}
          />
        )}
      </Modal>

      <Modal open={!!form} onClose={() => setForm(null)} className="pm-overlay form-overlay">
        {form && (
          <div className="form-container">
            <button className="close-form" onClick={() => setForm(null)} aria-label="Close">
              <i className="fa-solid fa-xmark" />
            </button>
            <h2>{form.id ? 'Update Product' : 'Add Product'}</h2>
            <form className="product-form" onSubmit={save} autoComplete="off">
              <div className="form-row">
                <Field label="Product Name">
                  <input name="name" value={form.name} onChange={setField} required />
                </Field>
                <Field label="Category">
                  <select name="category" value={form.category} onChange={setField}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <div className="form-row three">
                <Field label="Price (₹)">
                  <input type="number" min="0" name="price" value={form.price} onChange={setField} required />
                </Field>
                <Field label="Stock">
                  <input type="number" min="0" name="stock" value={form.stock} onChange={setField} required />
                </Field>
                <Field label="Expiry Date">
                  <input type="date" name="expiry" value={form.expiry} onChange={setField} />
                </Field>
              </div>
              <Field label="Description">
                <textarea name="description" rows="3" value={form.description} onChange={setField} />
              </Field>
              <div className="form-row">
                {LIST_FIELDS.map(([k, label]) => (
                  <Field key={k} label={label} hint="(One per line)">
                    <textarea name={k} rows="5" value={form[k]} onChange={setField} />
                  </Field>
                ))}
                <Field label="Dosage">
                  <textarea name="dosage" rows="5" value={form.dosage} onChange={setField} />
                </Field>
              </div>
              <Field label="Product Images">
                <input type="file" className="file-input" multiple accept="image/jpeg,image/png,image/webp" onChange={onImages} disabled={busy === 'upload'} />
                {busy === 'upload' && <small>Uploading images…</small>}
                <div className="image-preview">
                  {form.images.map((src, i) => <img key={i} src={src} alt="Preview" />)}
                </div>
              </Field>
              <div className="form-buttons">
                <button type="button" className="cancel-btn" onClick={() => setForm(null)}>Cancel</button>
                <button type="submit" className="save-btn" disabled={!!busy}>
                  {busy === 'save' ? 'Saving…' : form.id ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleteId(null)} className="pm-overlay confirm-overlay">
        {deleting && (
          <div className="confirm-box">
            <i className="fa-solid fa-triangle-exclamation" />
            <h3>Delete {deleting.name}?</h3>
            <p>It will be removed from the catalogue; past orders keep their history.</p>
            <div className="form-buttons">
              <button className="cancel-btn" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="delete-btn" onClick={confirmDelete} disabled={busy === 'delete'}>Delete</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="form-group">
      <label>
        {label}
        {hint && <small>{hint}</small>}
      </label>
      {children}
    </div>
  );
}

function ProductDetails({ product: p, onClose, onEdit, onDelete }) {
  const [index, setIndex] = useState(0);
  const count = p.images.length;
  const step = (d) => setIndex((i) => (i + d + count) % count);

  const boxes = [
    ['Description', p.description],
    ...LIST_FIELDS.map(([k, label]) => [label, p[k]]),
    ['Dosage', p.dosage],
    ['Available Stock', `${p.stock} Units`],
    ['Expiry Date', formatDate(p.expiry)],
  ];

  return (
    <div className="modal-container">
      <button className="close-modal" onClick={onClose} aria-label="Close">
        <i className="fa-solid fa-xmark" />
      </button>
      <div className="modal-left">
        {count > 1 && (
          <button className="slider-btn prev" onClick={() => step(-1)} aria-label="Previous image">
            <i className="fa-solid fa-chevron-left" />
          </button>
        )}
        <img src={p.images[index]} alt={p.name} />
        {count > 1 && (
          <button className="slider-btn next" onClick={() => step(1)} aria-label="Next image">
            <i className="fa-solid fa-chevron-right" />
          </button>
        )}
      </div>
      <div className="modal-right">
        <h2>{p.name}</h2>
        <h3>{inr(p.price)}</h3>
        {boxes.map(([title, value]) =>
          (Array.isArray(value) ? value.length : value) ? (
            <div className="detail-box" key={title}>
              <h4>{title}</h4>
              {Array.isArray(value) ? (
                <ul>{value.map((v) => <li key={v}>{v}</li>)}</ul>
              ) : (
                <p>{value}</p>
              )}
            </div>
          ) : null,
        )}
        <div className="modal-actions">
          <button className="update-btn" onClick={onEdit}>
            <i className="fa-solid fa-pen" /> Update Product
          </button>
          <button className="delete-btn" onClick={onDelete}>
            <i className="fa-solid fa-trash" /> Delete Product
          </button>
        </div>
      </div>
    </div>
  );
}
