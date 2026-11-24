# MK Animal Health ERP
> Smart Enterprise Resource Planning & Veterinary Distribution Management System

MK Animal Health ERP is a specialized distribution management and field-force automation system engineered for the veterinary pharmaceutical industry. It bridges headquarters, manufacturing branches, medical representatives (MRs), veterinary doctors, and retail pharmacies into a unified platform.

---

## 🌟 Key Functional Portals

1. **Administrator Portal (`/Frontend/admin/`)**:
   - Real-time executive dashboard with monthly sales, revenue, orders, and dynamic Chart.js analytics.
   - Comprehensive Product Management catalog with veterinary formulations, pricing, and stock controls.
   - Live Stock Analysis & Expiry risk tracking.
   - Target Tracking & Incentive management for territory teams.
   - Branch Management & Stock Inter-depot transfers.
   - Billing & GST Invoicing engine with printable tax invoices.
   - Attendance & Shift oversight.
   - Multi-role User Management (Admins, MRs, Doctors, Pharmacies, Employees).

2. **Medical Representative (MR) Portal (`/Frontend/mr/`)**:
   - Field force automation with one-click HTML5 GPS Geo-location capture.
   - Clinic & Dairy farm doctor visit logging with geo-tagged photo proofs.
   - Sample distribution records and product detailing notes.
   - Assigned territory target progress tracking.

3. **Veterinary Doctor Portal (`/Frontend/doctor/`)**:
   - Clinical product monograph catalog (indications, composition, dosage guides).
   - Instant clinical sample request dispatch to assigned MR.
   - Direct medicine ordering and prescription reorder history.
   - Target and annual incentive dashboard.

4. **Veterinary Pharmacy Portal (`/Frontend/chemist/`)**:
   - B2B wholesale trade ordering with bulk slab pricing and GST calculation.
   - Order history with downloadable tax invoices.
   - Damaged/Expired goods return claim submission.

5. **Employee Portal (`/Frontend/Employees/`)**:
   - Staff clock-in/clock-out shift timer.
   - Leave request management and attendance history.
   - Internal announcements and department circulars.

---

## 🚀 Quick Start

Open `Frontend/index.html` in any modern web browser or run a local static web server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve Frontend
```

### Demo Credentials

| Role | Username | Password | Default Portal |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin100` | `1234500` | Admin Dashboard |
| **Medical Representative** | `mr100` | `1234` | MR Field Dashboard |
| **Veterinary Doctor** | `doc100` | `567800` | Doctor Clinical Portal |
| **Pharmacy / Chemist** | `pharma100` | `5678` | Pharmacy B2B Portal |
| **Employee** | `emp100` | `12345` | Staff Workspace |

---

## 🗄️ Database Schemas

The [Database/](file:///c:/Users/Sanjyoti/OneDrive/Desktop/MK-Animal-Health-ERP/Database) folder contains 12 production-ready MySQL SQL schema definitions:
- `schema.sql`: Core foundation, RBAC roles, products, inventory, transactions.
- `billing.sql`: Orders, invoices, line items, payments.
- `doctors.sql` & `doctor_management.sql`: Doctor profiles, clinic links, targets.
- `mr_*.sql`: MR field visits, GPS tracking, photo proof logs, feedback, monthly summaries.
- `announcements.sql`: Internal communications and notices.
