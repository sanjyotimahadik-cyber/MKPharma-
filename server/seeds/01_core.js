// Core seed: one sign-in user per role, the user directory from User Management, products, settings.
// Seeds only insert; `npm run db:reset` rebuilds the database from scratch.
import { now, toJson } from '../src/db.js';
import { hashPassword } from '../src/password.js';
import { PRODUCTS } from '../src/seed-data/products.js';

const A = 'Active';
const I = 'Inactive';

// Demo accounts with an email sign in with DEMO_PASSWORD. The admin has no password here on purpose:
// admin sign-in comes from ADMIN_EMAIL / ADMIN_PASSWORD in server/.env (src/bootstrap.js).
export const DEMO_PASSWORD = 'demo1234';
const USERS = [
  { code: 'ADM001', role: 'admin', username: 'admin100', name: 'Administrator', email: 'admin@mkanimalhealth.com', phone: '9822012345', meta: { designation: 'System Admin' } },

  { code: 'EMP001', role: 'employee', username: 'emp100', name: 'Rahul Sharma', email: 'employee@mkanimalhealth.com', phone: '9876543210', meta: { department: 'Sales', designation: 'Manager', branch: 'Jalgaon', performance: 92 } },
  { code: 'EMP002', role: 'employee', name: 'Priya Patel', phone: '9123456789', meta: { department: 'Accounts', designation: 'Executive', branch: 'Jalgaon', performance: 88 } },
  { code: 'EMP003', role: 'employee', name: 'Amit Verma', phone: '9988776655', status: I, meta: { department: 'HR', designation: 'Officer', branch: 'Pune', performance: 75 } },

  { code: 'MR001', role: 'mr', username: 'mr100', name: 'Rohit Mehta', email: 'mr@mkanimalhealth.com', phone: '9876512345', meta: { area: 'Jalgaon', performance: 94 } },
  { code: 'MR002', role: 'mr', name: 'Kunal Patil', phone: '9876522222', meta: { area: 'Nashik', performance: 89 } },
  { code: 'MR003', role: 'mr', name: 'Ajay More', phone: '9876533333', status: I, meta: { area: 'Pune', performance: 73 } },

  { code: 'DOC001', role: 'doctor', username: 'doc100', name: 'Dr. Joshi', email: 'doctor@mkanimalhealth.com', phone: '9876541111', mr: 'MR001', meta: { specialization: 'Veterinary', hospital: 'City Vet Hospital', area: 'Jalgaon', performance: 95 } },
  { code: 'DOC002', role: 'doctor', name: 'Dr. Deshmukh', phone: '9876542222', mr: 'MR002', meta: { specialization: 'Veterinary', hospital: 'Animal Care Clinic', area: 'Nashik', performance: 87 } },
  { code: 'DOC003', role: 'doctor', name: 'Dr. Kulkarni', phone: '9876543333', mr: 'MR003', status: I, meta: { specialization: 'Veterinary', hospital: 'Pet Health Centre', area: 'Pune', performance: 72 } },

  { code: 'PH001', role: 'pharmacy', username: 'pharma100', name: 'ABC Medical', email: 'pharmacy@mkanimalhealth.com', phone: '9876500001', mr: 'MR001', meta: { owner: 'Suresh Patil', location: 'Jalgaon', performance: 96 } },
  { code: 'PH002', role: 'pharmacy', name: 'Life Care Pharma', phone: '9876500002', mr: 'MR002', meta: { owner: 'Rakesh Shah', location: 'Nashik', performance: 90 } },
  { code: 'PH003', role: 'pharmacy', name: 'Health Plus', phone: '9876500003', mr: 'MR003', status: I, meta: { owner: 'Mahesh Jain', location: 'Pune', performance: 74 } },
];

const SETTINGS = {
  company: {
    name: 'MK Animal Health Pvt Ltd',
    tagline: 'Smart Distribution Management System',
    gstNumber: '27AABCM5678Q1Z4',
    dlNumber: 'MH-WZ2-124578',
    panNumber: 'AABCM5678Q',
    email: 'contact@mkanimalhealth.com',
    phone: '+91 98220 12345',
    address: 'Plot 42, MIDC Industrial Area, Jalgaon - 425001, Maharashtra, India',
  },
  billing: { gstRate: 12, deliveryCharge: 50, currency: '₹' },
  inventory: { lowStockLevel: 40 },
};

export async function seed(knex) {
  const ts = now();
  const demoHash = await hashPassword(DEMO_PASSWORD);

  for (const { mr: _mr, meta, status = A, ...u } of USERS) {
    const password_hash = u.email && u.role !== 'admin' ? demoHash : null;
    await knex('users').insert({ ...u, status, password_hash, meta: toJson(meta), created_at: ts, updated_at: ts });
  }
  const ids = Object.fromEntries((await knex('users').select('id', 'code')).map((r) => [r.code, r.id]));
  for (const u of USERS.filter((x) => x.mr)) {
    await knex('users').where({ code: u.code }).update({ assigned_mr_id: ids[u.mr] });
  }

  await knex.batchInsert(
    'products',
    PRODUCTS.map(({ id, benefits, composition, indications, images, ...p }) => ({
      ...p,
      code: `MK-${String(id).padStart(3, '0')}`,
      mrp: Math.round(p.price * 1.1),
      gst_rate: 12,
      reorder_level: 40,
      benefits: toJson(benefits),
      composition: toJson(composition),
      indications: toJson(indications),
      images: toJson(images),
      created_at: ts,
      updated_at: ts,
    })),
    50,
  );

  await knex('settings').insert(
    Object.entries(SETTINGS).map(([key, value]) => ({ key, value: toJson(value), updated_at: ts })),
  );
}
