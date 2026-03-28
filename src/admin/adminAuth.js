/**
 * Admin access is granted if ANY of:
 * - profiles.role === 'admin'
 * - profiles.is_admin === true
 * - user email is listed in VITE_ADMIN_EMAILS (comma-separated, for bootstrap)
 *
 * Pair with supabase/migrations/001_admin_rls.sql for database policies.
 */

export function getAdminEmailAllowlist() {
  const raw = import.meta.env.VITE_ADMIN_EMAILS || ''
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminUser(profile, email) {
  if (!email) return false
  if (getAdminEmailAllowlist().includes(email.toLowerCase())) return true
  if (profile?.role === 'admin') return true
  if (profile?.is_admin === true) return true
  return false
}
