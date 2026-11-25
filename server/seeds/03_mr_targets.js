// MR seed: doctors/pharmacies assigned to MRs, ~2 months of visit history, and campaign + personal targets.
// Dates are relative to the day the seed runs so the dashboards always have current data.
import { now, toJson, today } from '../src/db.js';
import { nextCode } from '../src/http.js';

const CLIENTS = [
  { mr: 'MR001', role: 'doctor', name: 'Dr. Sharma', phone: '9876543210', meta: { specialization: 'Veterinary', hospital: 'Sharma Vet Clinic', area: 'Jalgaon' } },
  { mr: 'MR001', role: 'doctor', name: 'Dr. Patil', phone: '9876501234', meta: { specialization: 'Veterinary', hospital: 'Patil Animal Hospital', area: 'Yawal' } },
  { mr: 'MR001', role: 'doctor', name: 'Dr. Desai', phone: '9765432101', meta: { specialization: 'Veterinary', hospital: 'Desai Pet Care', area: 'Amalner' } },
  { mr: 'MR001', role: 'doctor', name: 'Dr. S. Kulkarni', phone: '9988776655', meta: { specialization: 'Veterinary', hospital: 'Kulkarni Livestock Clinic', area: 'Bhusawal' } },
  { mr: 'MR001', role: 'pharmacy', name: 'Shree Medical', phone: '9876500004', meta: { owner: 'Nitin Chaudhari', location: 'Pachora' } },
  { mr: 'MR001', role: 'pharmacy', name: 'Om Vet Pharma', phone: '9876500005', meta: { owner: 'Vijay Mahajan', location: 'Bhusawal' } },
  { mr: 'MR002', role: 'doctor', name: 'Dr. Wagh', phone: '9876544444', meta: { specialization: 'Veterinary', hospital: 'Wagh Veterinary Centre', area: 'Nashik' } },
  { mr: 'MR002', role: 'doctor', name: 'Dr. Pawar', phone: '9876545555', meta: { specialization: 'Veterinary', hospital: 'Pawar Cattle Clinic', area: 'Malegaon' } },
];

// Campaigns from the original Target Tracking page; dates shifted so TG001 starts on the 1st of this month.
const CAMPAIGNS = [
  { name: 'July Antibiotic Campaign', type: 'Doctors', start: '2026-07-01', end: '2026-07-31', value: 500000 },
  { name: 'Monsoon Sales Drive', type: 'Pharmacy', start: '2026-07-05', end: '2026-08-05', value: 800000 },
  { name: 'Vaccine Promotion', type: 'MR Team', start: '2026-06-01', end: '2026-06-30', value: 220, status: 'closed' },
  { name: 'Pain Relief Campaign', type: 'Doctors', start: '2026-07-10', end: '2026-07-31', value: 300000 },
  { name: 'Deworming Awareness', type: 'Pharmacy', start: '2026-07-15', end: '2026-08-15', value: 600000 },
  { name: 'Calcium Booster Campaign', type: 'Doctors', start: '2026-07-20', end: '2026-08-20', value: 400000 },
];

const NOTES = [
  'Routine follow-up visit completed.',
  'Discussed new product range and pricing.',
  'Doctor requested more samples next visit.',
  'Shared clinical literature on dosage.',
  'Follow-up on previous order delivery.',
  'Positive feedback on calcium supplements.',
];

const DAY = 864e5;
const iso = (d) => today(d);
const addDays = (s, n) => iso(new Date(Date.parse(`${s}T00:00:00`) + n * DAY));

// Small deterministic PRNG (mulberry32) so every reset produces the same history.
function prng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function seed(knex) {
  const ts = now();
  const day = today();
  const users = () => knex('users');
  const id = async (code) => (await users().where({ code }).first('id'))?.id;
  const mrIds = { MR001: await id('MR001'), MR002: await id('MR002') };

  for (const { mr, meta, ...c } of CLIENTS) {
    const code = await nextCode(users(), 'code', c.role === 'doctor' ? 'DOC' : 'PH', 3);
    await users().insert({ ...c, code, status: 'Active', assigned_mr_id: mrIds[mr], meta: toJson(meta), created_at: ts, updated_at: ts });
  }

  // Visit history: each working day an MR visits each active assigned client with ~60% chance.
  const rand = prng(20261125);
  const products = await knex('products').orderBy('id').pluck('name');
  const mrs = await users().where({ role: 'mr' }).select('id');
  const visits = [];
  for (const { id: mrId } of mrs) {
    const clients = await users().where({ assigned_mr_id: mrId, status: 'Active' }).pluck('id');
    for (let back = 60; back >= 0; back--) {
      const date = new Date(Date.now() - back * DAY);
      if (date.getDay() === 0) continue;
      const visitDate = iso(date);
      for (const doctorId of clients) {
        if (rand() > (back === 0 ? 0.3 : 0.6)) continue;
        const at = `${visitDate} ${String(9 + Math.floor(rand() * 9)).padStart(2, '0')}:${String(Math.floor(rand() * 60)).padStart(2, '0')}:00`;
        visits.push({
          mr_id: mrId,
          doctor_id: doctorId,
          visit_date: visitDate,
          visited_at: at,
          status: 'Completed',
          notes: NOTES[Math.floor(rand() * NOTES.length)],
          products: [0, 1].map(() => products[Math.floor(rand() * products.length)]).filter((p, i, a) => p && a.indexOf(p) === i).join(', '),
          sample_given: rand() < 0.6,
          order_taken: rand() < 0.4,
          created_at: at,
          updated_at: at,
        });
      }
    }
  }
  await knex.batchInsert('mr_visits', visits, 100);

  // Targets
  const admin = await id('ADM001');
  const monthStart = `${day.slice(0, 8)}01`;
  const [y, m] = day.split('-').map(Number);
  const monthEnd = iso(new Date(y, m, 0));
  const quarterStart = iso(new Date(y, Math.floor((m - 1) / 3) * 3, 1));
  const quarterEnd = iso(new Date(y, Math.floor((m - 1) / 3) * 3 + 3, 0));
  const shift = Math.round((Date.parse(monthStart) - Date.parse('2026-07-01')) / DAY);

  const row = (code, t) => ({
    code,
    metric: t.type === 'MR Team' ? 'visits' : 'sales',
    status: 'active',
    assignee_id: null,
    created_by: admin,
    created_at: ts,
    updated_at: ts,
    ...t,
  });
  const targets = CAMPAIGNS.map(({ start, end, value, ...t }) => ({ ...t, start_date: addDays(start, shift), end_date: addDays(end, shift), target_value: value }));
  const personal = [
    ['DOC001', 'Doctors', 'Monthly Purchase Target', monthStart, monthEnd, 50000],
    ['DOC001', 'Doctors', 'Quarterly Purchase Target', quarterStart, quarterEnd, 150000],
    ['PH001', 'Pharmacy', 'Monthly Purchase Target', monthStart, monthEnd, 120000],
    ['PH001', 'Pharmacy', 'Quarterly Purchase Target', quarterStart, quarterEnd, 350000],
    ['MR001', 'MR Team', 'Monthly Visit Target', monthStart, monthEnd, 120],
    ['MR001', 'MR Team', 'Daily Visit Target', day, day, 6],
    ['MR002', 'MR Team', 'Monthly Visit Target', monthStart, monthEnd, 50],
  ];
  for (const [code, type, name, start_date, end_date, target_value] of personal) {
    targets.push({ type, name, start_date, end_date, target_value, assignee_id: await id(code) });
  }
  await knex('targets').insert(targets.map((t, i) => row(`TG${String(i + 1).padStart(3, '0')}`, t)));
}
