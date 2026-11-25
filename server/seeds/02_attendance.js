// Staff directory from the old Attendance page, ~30 days of weekday attendance for every active
// employee/MR, a few leave requests and notifications. Deterministic (seeded PRNG); dates are relative to today.
import { now, today, toJson } from '../src/db.js';

// [name, mobile] — Rahul Sharma already exists as EMP001.
const STAFF = [
  ['Amit Patil', '9865231478'], ['Sneha More', '9822145632'], ['Priya Desai', '9834125678'],
  ['Rohit Jadhav', '9812345678'], ['Kiran Joshi', '9845123678'], ['Neha Kulkarni', '9873214560'],
  ['Vikas Patil', '9867412305'], ['Pooja Shinde', '9823654781'], ['Sameer Pawar', '9814562378'],
  ['Anjali Kulkarni', '9874512365'], ['Sachin More', '9898745632'], ['Meera Patil', '9812365478'],
  ['Nikhil Jadhav', '9845213678'], ['Komal Shinde', '9823476510'], ['Ajay Deshmukh', '9876541230'],
  ['Shweta Pawar', '9812457630'], ['Ramesh Chavan', '9863251478'], ['Sunita More', '9832145678'],
  ['Mahesh Patil', '9870123456'],
];
const DEPTS = [['Sales', 'Executive'], ['Accounts', 'Accountant'], ['Warehouse', 'Supervisor'], ['HR', 'Executive'], ['Dispatch', 'Assistant']];
const BRANCHES = ['Jalgaon', 'Nashik', 'Pune'];

// mulberry32
let s = 20260719;
const rand = () => {
  s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const between = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const hm = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}:${String(between(0, 59)).padStart(2, '0')}`;

const base = new Date();
const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;
/** Local date `n` days from today, nudged away from weekends. */
const day = (n) => {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + n);
  while (isWeekend(d)) d.setDate(d.getDate() + (n < 0 ? -1 : 1));
  return today(d);
};

export async function seed(knex) {
  const ts = now();
  s = 20260719;

  await knex('users').insert(
    STAFF.map(([name, phone], i) => {
      const [department, designation] = DEPTS[i % DEPTS.length];
      return {
        code: `EMP${String(i + 4).padStart(3, '0')}`, role: 'employee', name, phone,
        email: `${name.split(' ')[0].toLowerCase()}@mkhealth.com`, status: 'Active',
        meta: toJson({ department, designation, branch: BRANCHES[i % BRANCHES.length], performance: between(70, 98) }),
        created_at: ts, updated_at: ts,
      };
    }),
  );

  const staff = await knex('users').whereIn('role', ['employee', 'mr']).where({ status: 'Active' }).orderBy('id').select('id', 'code', 'role', 'name');
  const id = Object.fromEntries(staff.map((u) => [u.code, u.id]));
  const signIn = new Set(['employee', 'mr'].map((r) => staff.find((u) => u.role === r)?.id));
  const admin = await knex('users').where({ role: 'admin' }).orderBy('id').first();

  // [code, from, to, type, reason, status]
  const LEAVES = [
    ['EMP001', day(-12), day(-12), 'Sick', 'Fever and cold', 'Approved'],
    ['EMP001', day(-20), day(-19), 'Casual', 'Personal work', 'Rejected'],
    ['EMP001', day(6), day(7), 'Casual', 'Family function', 'Pending'],
    ['EMP004', day(-3), day(-2), 'Casual', 'Out of town', 'Approved'],
    ['EMP005', day(2), day(4), 'Earned', 'Vacation', 'Pending'],
    ['EMP008', day(-8), day(-8), 'Sick', 'Doctor appointment', 'Approved'],
    ['MR001', day(9), day(9), 'Casual', 'Bank work', 'Pending'],
  ].filter(([code]) => id[code]);
  await knex('leave_requests').insert(
    LEAVES.map(([code, from_date, to_date, type, reason, status]) => ({
      user_id: id[code], from_date, to_date, type, reason, status,
      reviewed_by: status === 'Pending' ? null : admin?.id ?? null, created_at: ts, updated_at: ts,
    })),
  );
  const onLeave = (userId, date) => LEAVES.some(([c, f, t, , , st]) => st === 'Approved' && id[c] === userId && f <= date && date <= t);

  const rows = [];
  const hour = base.getHours();
  for (let n = 30; n >= 0; n--) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() - n);
    if (isWeekend(d)) continue;
    const date = today(d);
    for (const u of staff) {
      // Today: only others who would plausibly be in by now; the sign-in users check in live.
      if (n === 0 && (signIn.has(u.id) || hour < 10)) continue;
      const created_at = `${date} 09:00:00`;
      if (onLeave(u.id, date)) {
        rows.push({ user_id: u.id, date, status: 'Leave', created_at });
        continue;
      }
      const r = rand();
      if (r > 0.93) {
        rows.push({ user_id: u.id, date, status: 'Absent', created_at });
        continue;
      }
      const late = r > 0.8;
      const check_in = `${date} ${hm(late ? between(556, 610) : between(525, 555))}`;
      const out = between(1065, 1125);
      rows.push({
        user_id: u.id, date, status: late ? 'Late' : 'Present', check_in, created_at: check_in,
        check_out: n === 0 && out > hour * 60 ? null : `${date} ${hm(out)}`,
        latitude: (21.0077 + (rand() - 0.5) / 50).toFixed(7), longitude: (75.5626 + (rand() - 0.5) / 50).toFixed(7),
      });
    }
  }
  await knex.batchInsert('attendance', rows, 100);

  const ago = (mins) => now(new Date(base.getTime() - mins * 60000));
  const notes = [
    ['EMP001', 'Company Notice', 'Monthly staff meeting on Friday at 3:00 PM.', 'info', false, 90],
    ['EMP001', 'Leave Rejected', `Your Casual leave from ${day(-20)} to ${day(-19)} was rejected.`, 'leave', true, 60 * 24 * 18],
    ['EMP001', 'Leave Approved', `Your Sick leave from ${day(-12)} to ${day(-12)} was approved.`, 'leave', true, 60 * 24 * 11],
    ['EMP001', 'Attendance Reminder', 'Please remember to mark your exit before leaving.', 'attendance', false, 60 * 24],
  ];
  for (const [code, from, to, type] of LEAVES.filter((l) => l[5] === 'Pending')) {
    const u = staff.find((x) => x.code === code);
    notes.push(['ADMIN', 'New Leave Request', `${u.name} (${code}) requested ${type} leave ${from} to ${to}.`, 'leave', false, between(30, 600)]);
  }
  await knex('notifications').insert(
    notes
      .filter(([code]) => (code === 'ADMIN' ? admin : id[code]))
      .map(([code, title, message, type, is_read, mins]) => ({
        user_id: code === 'ADMIN' ? admin.id : id[code], title, message, type, is_read, created_at: ago(mins),
      })),
  );
}
