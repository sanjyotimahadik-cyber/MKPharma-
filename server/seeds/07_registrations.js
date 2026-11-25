// A few registrations waiting for admin review (Admin → Registration Requests). Their password is DEMO_PASSWORD.
import { now, toJson } from '../src/db.js';
import { hashPassword } from '../src/password.js';
import { DEMO_PASSWORD } from './01_core.js';

const REQUESTS = [
  { role: 'mr', name: 'Sneha Kale', email: 'sneha.kale@example.com', phone: '9822011111', meta: { area: 'Aurangabad' } },
  { role: 'doctor', name: 'Dr. Pawar', email: 'dr.pawar@example.com', phone: '9822022222', meta: { specialization: 'Large Animals', hospital: 'Pawar Vet Clinic', area: 'Dhule' } },
  { role: 'pharmacy', name: 'Shree Medicals', email: 'shree.medicals@example.com', phone: '9822033333', meta: { owner: 'Vijay Shinde', location: 'Bhusawal' } },
];

export async function seed(knex) {
  const ts = now();
  const password_hash = await hashPassword(DEMO_PASSWORD);
  await knex('registration_requests').insert(
    REQUESTS.map(({ meta, ...r }) => ({ ...r, meta: toJson(meta), password_hash, status: 'Pending', created_at: ts, updated_at: ts })),
  );
}
