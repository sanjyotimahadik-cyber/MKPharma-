// Roles a person can register for (admin is never offered) and the details each one needs.
// Mirrors ROLE in server/src/accounts.js. Field tuple: [key, label, optional?].
export const ROLES = {
  mr: {
    label: 'Medical Representative', short: 'MR', icon: 'fa-briefcase-medical', nameLabel: 'Full Name',
    fields: [['area', 'Area / Territory']],
  },
  doctor: {
    label: 'Veterinary Doctor', short: 'Doctor', icon: 'fa-user-doctor', nameLabel: 'Full Name',
    fields: [['specialization', 'Specialization'], ['hospital', 'Hospital / Clinic'], ['area', 'Area', true]],
  },
  pharmacy: {
    label: 'Pharmacy / Chemist', short: 'Pharmacy', icon: 'fa-prescription-bottle-medical', nameLabel: 'Pharmacy Name',
    fields: [['owner', 'Owner Name'], ['location', 'Location']],
  },
  employee: {
    label: 'Employee', short: 'Employee', icon: 'fa-id-badge', nameLabel: 'Full Name',
    fields: [['department', 'Department'], ['designation', 'Designation'], ['branch', 'Branch', true]],
  },
};

export const BUYERS = ['doctor', 'pharmacy'];
