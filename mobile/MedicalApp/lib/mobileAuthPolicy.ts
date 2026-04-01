/** Staff roles use the web portal; this app is patient-only. */
const STAFF_ROLES = new Set(['ADMIN', 'RECEPTIONIST', 'DOCTOR']);

function normalizeRole(name: string): string {
  const u = name.trim().toUpperCase();
  return u.startsWith('ROLE_') ? u.slice(5) : u;
}

/**
 * Allowed: has PATIENT and no staff role.
 * Rejects staff-only accounts and mixed staff+patient.
 */
export function isAllowedPatientAppUser(roles: string[] | undefined | null): boolean {
  const list = (roles ?? []).map(normalizeRole).filter(Boolean);
  if (!list.includes('PATIENT')) return false;
  return !list.some((r) => STAFF_ROLES.has(r));
}

export const PATIENT_APP_ACCESS_DENIED_MESSAGE =
  'This app is for patients only. Staff accounts should sign in on the web portal.';
