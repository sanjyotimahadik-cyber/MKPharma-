# MK Animal Health ERP
> Veterinary distribution management system — React web app + Node.js API

Distribution management and field-force app for a veterinary pharmaceutical company, connecting head office, medical representatives (MRs), veterinary doctors, pharmacies and staff.

- **`web/`** — React 19 + Vite single-page app.
- **`server/`** — Node.js REST API (Express 5 + Knex). Uses SQLite out of the box (`server/data/dev.sqlite3`, created and seeded automatically on first start); switch to PostgreSQL (e.g. Supabase) or MySQL with `server/.env` (see `server/.env.example`).
- **`Database/`** — original MySQL schema drafts (the live schema is `server/migrations/`).

---

## 🚀 Quick Start

Requires Node.js 22+.

```bash
npm run setup      # install root, server and web dependencies
npm run dev        # API on http://localhost:4000 + web on http://localhost:5173
npm run db:reset   # rebuild the database with fresh demo data
npm run build      # production build of the web app (web/dist)
```

### Signing in

Sign in with email and password at `/login`.

- **Register:** new users open `/register`, pick a role (MR, Doctor, Pharmacy or Employee; **Admin is never offered**) and fill in their details. This creates a *pending request*, and they cannot sign in yet.
- **Approve:** admins review requests under **Admin → Registration Requests** (`/admin/registrations`). They can **approve** as requested, **change the role** (and its details) before approving, or **reject** with an optional reason. Approval creates the account with the next code (e.g. `MR004`) and the password the user chose.
- **Admin accounts** never come from registration. On start, the API makes sure the admin in `server/.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) exists and can sign in; an existing admin's password is not overwritten. Further admins can be added directly in the database.

Demo accounts (seeded):

| Role | Email | Password | Portal |
| :--- | :--- | :--- | :--- |
| **Administrator** | `ADMIN_EMAIL` from `server/.env` | `ADMIN_PASSWORD` | `/admin` |
| **Medical Representative** | mr@mkanimalhealth.com | demo1234 | `/mr` |
| **Veterinary Doctor** | doctor@mkanimalhealth.com | demo1234 | `/doctor` |
| **Pharmacy / Chemist** | pharmacy@mkanimalhealth.com | demo1234 | `/pharmacy` |
| **Employee** | employee@mkanimalhealth.com | demo1234 | `/employee` |

Three pending registration requests are seeded too, so there is something to review straight away.

### Orders and delivery

Doctors and pharmacies place orders from their catalogue portal; stock is reserved immediately and every admin and employee is notified.
Admins (**Admin → Orders**, `/admin/orders`) and employees (**Work → Orders**, `/employee/orders`) share the same order desk and move each order one step at a time:

`Placed → Confirmed → Packed → Dispatched → Out for Delivery → Delivered`

- Each step is timestamped with who made it and an optional note (vehicle, receiver name…); buyers see it as a tracking timeline in **Order History** and get a notification.
- **Cancelling** returns the items to stock. Staff can cancel until the order is dispatched; buyers only while it is still *Placed*.
- Payments can be marked paid from the order desk (including "payment collected" when marking an order delivered) or from **Billing & Finance**.
- Employees also manage **Inventory** (products, prices, stock in/out, stock analysis); branches, users, billing reports and settings stay admin-only.

### Using PostgreSQL (Supabase)

In `server/.env` set `DB_CLIENT=postgres`, `DATABASE_URL` to the **Session pooler** connection string from Supabase → Connect (without the password) and `DB_PASSWORD` to the database password, then run `npm run db:reset` (or just start the API — an empty database is migrated and seeded automatically). Any other Postgres works the same way; add `DB_SSL=false` for a local server without TLS.

### Using MySQL

Create the database (`CREATE DATABASE mk_animal_health;`), copy `server/.env.example` to `server/.env`, set `DB_CLIENT=mysql` and your credentials, then run `npm run db:reset`.

---

## 🌟 Portals

1. **Administrator** (`/admin`): live dashboard (sales KPIs and trends, monthly sales, sales by category, recent orders, low stock, notifications), billing & invoices (status, payments, printable invoices, CSV), products (CRUD, image upload), stock analysis (adjustments with history, sales charts), branches, user management (employees, MRs, doctors, pharmacies; MR assignment; CSV import/export), attendance & leave approvals, target tracking, settings (company, profile, password, billing/GST, inventory alerts, notification switches, backups).
2. **Medical Representative** (`/mr`): check-in/out with GPS, assigned doctors & pharmacies, visit logging with GPS, visit and target progress.
3. **Veterinary Doctor** (`/doctor`) and **Pharmacy** (`/pharmacy`): catalogue, cart and checkout (stock-checked, GST from settings), order history, bills, cancelling pending orders, personal targets.
4. **Employee** (`/employee`): check-in/out, attendance history and summary, leave requests, notifications, profile and password.

---

## 🗂️ Project Structure

```
server/
  migrations/           database schema (Knex)
  seeds/                demo data (01_core … 06_stock)
  src/
    app.js              Express app, route mounting, error handling
    auth.js             token auth + requireRole
    routes/             one router per area (products, orders, users, attendance, mr, targets, ...)
web/
  public/assets/        logo and product images
  src/
    App.jsx             routes (pages are lazy-loaded)
    components/         Modal, Toast, BackLink, RequireAuth
    lib/                api client, useApi hook, auth session, charts, formatters
    pages/              one folder per portal; each page has its own scoped CSS
Database/               original MySQL schema drafts
```

Page styles are scoped under a root class (e.g. `.pg-products`) using native CSS nesting, so styles from one page never leak into another.

---

## 🗄️ Database Schemas

[`Database/`](Database) holds the MySQL schema definitions for the planned backend:
- `schema.sql`: core foundation, roles, products, inventory, transactions.
- `billing.sql`: orders, invoices, line items, payments.
- `doctors.sql` & `doctor_management.sql`: doctor profiles, clinic links, targets.
- `mr_*.sql`: MR field visits, GPS tracking, photo proofs, feedback, monthly summaries.
- `announcements.sql`: internal communications and notices.
