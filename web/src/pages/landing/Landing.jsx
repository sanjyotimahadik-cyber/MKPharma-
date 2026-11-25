import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { getToken } from '../../lib/api.js';
import { currentUser, HOME } from '../../lib/auth.js';
import './Landing.css';

// Photos: Unsplash (free licence) — hero JZASWpKtL4o, vet vMqO4BHUgG4, pharmacy byGTytEGjBo,
// MR 8WYkI3cEZm8, warehouse BNBA1h-NgdY. Replace with MK's own photography when available.

// Company details shown in the top bar and footer (same values as Admin → Settings → Company).
const COMPANY = {
  name: 'MK Animal Health Pvt Ltd',
  city: 'Jalgaon, Maharashtra',
  address: 'Plot 42, MIDC Industrial Area, Jalgaon - 425001, Maharashtra, India',
  phone: '+91 98220 12345',
  email: 'contact@mkanimalhealth.com',
  gst: '27AABCM5678Q1Z4',
};
const YEAR = new Date().getFullYear();

const STATS = [
  ['28', 'Products in the catalogue'],
  ['3', 'Product categories'],
  ['5', 'Role-based portals'],
  ['GPS', 'Verified field visits'],
];

const AUDIENCES = [
  { role: 'doctor', photo: 'vet', title: 'Veterinary doctors', text: 'Browse the full range, order in a few taps and keep every bill in one place.' },
  { role: 'pharmacy', photo: 'pharmacy', title: 'Pharmacies & chemists', text: 'Stock-checked ordering with GST-ready invoices and purchase targets.' },
  { role: 'mr', photo: 'mr', title: 'Medical representatives', text: 'GPS check-in, assigned doctors and pharmacies, and visit targets on your phone.' },
  { role: 'employee', photo: 'warehouse', title: 'Head office & staff', text: 'Inventory, billing, attendance and approvals managed from one dashboard.' },
];

const MODULES = ['Orders & cart', 'GST billing', 'Inventory & stock', 'Branches', 'MR field visits', 'Attendance & leave', 'Targets', 'Account approvals'];

const RANGE = [
  ['ai-care', 'AI Care', 'Feed Supplement'],
  ['calf-boost', 'Calf Boost', 'Feed Supplement'],
  ['miracal-gold', 'Miracal Gold', 'Calcium'],
  ['cal-d-boost-gel', 'Cal D Boost Gel', 'Calcium'],
  ['meloxi-plus', 'Meloxi-Plus', 'Veterinary Medicine'],
  ['ceftur', 'Ceftur', 'Veterinary Medicine'],
];

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Reveal-on-scroll for [data-reveal], smooth anchor scrolling, and a light parallax driven by --scroll. */
function useScrollEffects(root) {
  useEffect(() => {
    const el = root.current;
    const html = document.documentElement;
    const prevBehavior = html.style.scrollBehavior;
    const still = reduceMotion();
    if (!still) html.style.scrollBehavior = 'smooth';

    const targets = [...el.querySelectorAll('[data-reveal]')];
    let io;
    if (still || !('IntersectionObserver' in window)) targets.forEach((t) => t.classList.add('is-in'));
    else {
      io = new IntersectionObserver(
        (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('is-in'), io.unobserve(e.target))),
        { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
      );
      targets.forEach((t) => io.observe(t));
    }

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        el.style.setProperty('--scroll', String(window.scrollY));
        el.classList.toggle('scrolled', window.scrollY > 8);
      });
    };
    if (!still) window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      io?.disconnect();
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
      html.style.scrollBehavior = prevBehavior;
    };
  }, [root]);
}

export default function Landing() {
  const root = useRef(null);
  useScrollEffects(root);
  const user = getToken() ? currentUser() : null;

  return (
    <div className="pg-landing" ref={root}>
      <div className="utility">
        <div className="wrap">
          <span><i className="fa-solid fa-location-dot" /> {COMPANY.city}</span>
          <span className="contact">
            <a href={`tel:${COMPANY.phone.replace(/\s/g, '')}`}><i className="fa-solid fa-phone" /> {COMPANY.phone}</a>
            <a href={`mailto:${COMPANY.email}`}><i className="fa-solid fa-envelope" /> {COMPANY.email}</a>
          </span>
        </div>
      </div>

      <header className="masthead">
        <div className="wrap">
          <Link to="/" className="brand">
            <img src="/assets/logo.png" alt="" />
            <span><b>MK Animal Health</b><small>Distribution ERP</small></span>
          </Link>
          <nav aria-label="Sections">
            <a href="#portals">Portals</a>
            <a href="#platform">Platform</a>
            <a href="#range">Products</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="auth">
            {user ? (
              <Link to={HOME[user.role]} className="btn primary">Open dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn quiet">Sign in</Link>
                <Link to="/register" className="btn primary">Register</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero: full-bleed photograph with a content card */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-media" aria-hidden="true">
            <img src="/assets/landing/photo-hero.webp" alt="" fetchPriority="high" />
          </div>
          <div className="wrap hero-inner">
            <div className="hero-card">
              <p className="eyebrow">Veterinary distribution · {COMPANY.city}</p>
              <h1 id="hero-title">Animal health products, delivered and tracked end to end.</h1>
              <p className="lead">
                MK Animal Health connects our head office, medical representatives, veterinary doctors and
                pharmacies, from the first order to the final invoice.
              </p>
              <div className="cta">
                {user ? (
                  <Link to={HOME[user.role]} className="btn primary lg">Open your dashboard <i className="fa-solid fa-arrow-right" /></Link>
                ) : (
                  <>
                    <Link to="/register" className="btn primary lg">Create an account <i className="fa-solid fa-arrow-right" /></Link>
                    <Link to="/login" className="btn outline lg">Sign in</Link>
                  </>
                )}
              </div>
              {!user && <p className="fine"><i className="fa-solid fa-shield-halved" /> Every new account is reviewed and approved by head office.</p>}
            </div>
          </div>
        </section>

        {/* Key numbers */}
        <section className="stats" aria-label="At a glance">
          <div className="wrap">
            {STATS.map(([n, label], i) => (
              <div key={label} className="stat" data-reveal style={{ '--i': i }}>
                <b>{n}</b><span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Audiences */}
        <section className="section portals" id="portals" aria-labelledby="portals-title">
          <div className="wrap">
            <header className="section-head" data-reveal>
              <p className="eyebrow">Portals</p>
              <h2 id="portals-title">A dedicated portal for everyone we work with</h2>
              <p>Sign in once and land in the workspace built for your role.</p>
            </header>
            <div className="audiences">
              {AUDIENCES.map((a, i) => (
                <article key={a.role} className="audience" data-reveal style={{ '--i': i }}>
                  <div className="photo"><img src={`/assets/landing/photo-${a.photo}.webp`} alt="" loading="lazy" decoding="async" /></div>
                  <div className="body">
                    <h3>{a.title}</h3>
                    <p>{a.text}</p>
                    <Link to={user ? HOME[user.role] : `/register?role=${a.role}`} className="more">
                      {user ? 'Open dashboard' : 'Register'} <i className="fa-solid fa-arrow-right" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Platform: copy + real product screenshot */}
        <section className="section platform" id="platform" aria-labelledby="platform-title">
          <div className="wrap split">
            <div className="copy" data-reveal>
              <p className="eyebrow">The platform</p>
              <h2 id="platform-title">Everything distribution needs, on one dashboard</h2>
              <p>
                Sales, orders, stock levels and field activity update as they happen, so head office always
                sees the real picture, and every team works from the same numbers.
              </p>
              <ul className="modules">
                {MODULES.map((m) => <li key={m}><i className="fa-solid fa-check" /> {m}</li>)}
              </ul>
            </div>
            <figure className="screen" data-reveal style={{ '--i': 1 }}>
              <div className="chrome"><i /><i /><i /><span>MK Animal Health · Admin dashboard</span></div>
              <img src="/assets/landing/app-dashboard.webp" alt="The MK Animal Health admin dashboard showing sales, orders and charts" loading="lazy" decoding="async" width="1440" height="900" />
            </figure>
          </div>
        </section>

        {/* Product range */}
        <section className="section range" id="range" aria-labelledby="range-title">
          <div className="wrap">
            <header className="section-head row" data-reveal>
              <div>
                <p className="eyebrow">Our range</p>
                <h2 id="range-title">Feed supplements, calcium and veterinary medicines</h2>
              </div>
              <Link to={user ? HOME[user.role] : '/login'} className="btn outline">View full catalogue <i className="fa-solid fa-arrow-right" /></Link>
            </header>
            <div className="products">
              {RANGE.map(([img, name, cat], i) => (
                <figure key={img} className="product" data-reveal style={{ '--i': i % 3 }}>
                  <div className="shot"><img src={`/assets/landing/${img}.webp`} alt={name} loading="lazy" decoding="async" width="480" height="360" /></div>
                  <figcaption><span>{cat}</span><b>{name}</b></figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="footer" id="contact">
        <div className="wrap cols">
          <div className="about">
            <div className="brand light">
              <img src="/assets/logo.png" alt="" />
              <span><b>{COMPANY.name}</b><small>Smart Distribution Management System</small></span>
            </div>
            <p>{COMPANY.address}</p>
            <p className="gst">GSTIN {COMPANY.gst}</p>
          </div>
          <div>
            <h4>Contact</h4>
            <a href={`tel:${COMPANY.phone.replace(/\s/g, '')}`}>{COMPANY.phone}</a>
            <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
          </div>
          <div>
            <h4>Portals</h4>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Register</Link>
            <a href="#portals">Who it&apos;s for</a>
          </div>
          <div>
            <h4>Company</h4>
            <a href="#platform">Platform</a>
            <a href="#range">Products</a>
          </div>
        </div>
        <div className="wrap legal">
          <span>© {YEAR} {COMPANY.name}. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
