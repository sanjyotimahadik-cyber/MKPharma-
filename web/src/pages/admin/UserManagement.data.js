// Per-user-type config: table columns (between ID and Status), form fields and copy.
// Column tuple: [key, header, 'money'?]. Field tuple: [key, label, inputType?, optional?].
// Row keys come from the API user flattened as { ...meta, ...stats, ...user } (see UserManagement.jsx).
export const PERIODS = { week: 'This Week', month: 'This Month', year: 'This Year' };

export const TYPES = {
  employee: {
    tab: 'Employees', icon: 'fa-users', noun: 'Employee', idLabel: 'ID',
    total: 'Total Employees', title: 'Employee List', desc: 'Manage all employees of MK Animal Health.',
    analytics: 'Employee Performance Analytics', sub: 'Performance is the attendance rate for the selected period.',
    empty: ['fa-users-slash', 'No Employees Found', 'to create the first employee.'],
    columns: [['name', 'Employee Name'], ['department', 'Department'], ['designation', 'Designation'], ['branch', 'Branch'], ['phone', 'Phone']],
    fields: [['name', 'Employee Name'], ['department', 'Department'], ['designation', 'Designation'], ['branch', 'Branch', 'text', true], ['phone', 'Phone', 'tel']],
    growthUnit: ' pts',
  },
  mr: {
    tab: 'Medical Representatives', icon: 'fa-user-tie', noun: 'MR', idLabel: 'MR ID',
    total: 'Total Medical Representatives', title: 'Medical Representatives', desc: 'Manage all Medical Representatives of MK Animal Health.',
    analytics: 'MR Performance Analytics', sub: 'Sales of assigned doctors and pharmacies, relative to the top MR.',
    empty: ['fa-user-tie', 'No Medical Representatives Found', 'to register the first Medical Representative.'],
    columns: [['name', 'Representative Name'], ['area', 'Assigned Area'], ['doctors', 'Doctors / Pharmacies'], ['sales', 'Sales', 'money']],
    fields: [['name', 'Representative Name'], ['area', 'Assigned Area'], ['phone', 'Phone', 'tel']],
    growthUnit: '%',
  },
  doctor: {
    tab: 'Doctors', icon: 'fa-user-doctor', noun: 'Doctor', idLabel: 'Doctor ID',
    total: 'Total Doctors', title: 'Doctor Management', desc: 'Manage all registered doctors associated with MK Animal Health.',
    analytics: 'Doctor Performance Analytics', sub: 'Purchases in the selected period, relative to the top doctor.',
    empty: ['fa-user-doctor', 'No Doctors Found', 'to register the first doctor.'],
    columns: [['name', 'Doctor Name'], ['specialization', 'Specialization'], ['hospital', 'Hospital / Clinic'], ['phone', 'Contact Number'], ['mrName', 'MR Assigned'], ['orders', 'Orders']],
    fields: [['name', 'Doctor Name'], ['specialization', 'Specialization'], ['hospital', 'Hospital / Clinic'], ['area', 'Area', 'text', true], ['phone', 'Phone', 'tel']],
    assignMr: true,
    growthUnit: '%',
  },
  pharmacy: {
    tab: 'Pharmacies', icon: 'fa-prescription-bottle-medical', noun: 'Pharmacy', idLabel: 'Pharmacy ID',
    total: 'Total Pharmacies', title: 'Pharmacy Management', desc: 'Manage all pharmacies associated with MK Animal Health.',
    analytics: 'Pharmacy Performance Analytics', sub: 'Purchases in the selected period, relative to the top pharmacy.',
    empty: ['fa-prescription-bottle-medical', 'No Pharmacies Found', 'to register the first pharmacy.'],
    columns: [['name', 'Pharmacy Name'], ['owner', 'Owner Name'], ['location', 'Location'], ['phone', 'Contact Number'], ['mrName', 'Assigned MR'], ['orders', 'Orders'], ['purchase', 'Total Purchase', 'money']],
    fields: [['name', 'Pharmacy Name'], ['owner', 'Owner Name'], ['location', 'Location'], ['phone', 'Phone', 'tel']],
    assignMr: true,
    growthUnit: '%',
  },
};
