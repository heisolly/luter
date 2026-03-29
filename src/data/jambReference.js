/**
 * JAMB / UTME-aligned GST & common foundational courses (Nigeria).
 * Used as a deterministic layer alongside Groq and admin data.
 */

const GST_GNS = [
  { code: 'GST111', name: 'Communication in English I' },
  { code: 'GST113', name: 'Nigerian Peoples and Culture' },
  { code: 'GST121', name: 'Communication in English II' },
  { code: 'GST122', name: 'Communication in English II (alt)' },
  { code: 'GST123', name: 'History and Philosophy of Science' },
  { code: 'GST131', name: 'Introduction to Entrepreneurship' },
  { code: 'GST211', name: 'Logic and Philosophy' },
  { code: 'GST311', name: 'Peace and Conflict Resolution' },
  { code: 'GNS101', name: 'Use of English' },
  { code: 'GNS102', name: 'Philosophy and Logic' },
  { code: 'GNS103', name: 'Nigerian Constitution & Citizenship' },
]

const SCI_100_UTME = [
  { code: 'MTH101', name: 'Elementary Mathematics I' },
  { code: 'MTH102', name: 'Elementary Mathematics II' },
  { code: 'PHY101', name: 'General Physics I' },
  { code: 'PHY102', name: 'General Physics II' },
  { code: 'CHM101', name: 'General Chemistry I' },
  { code: 'CHM102', name: 'General Chemistry II' },
  { code: 'BIO101', name: 'General Biology I' },
  { code: 'BIO102', name: 'General Biology II' },
  { code: 'STA111', name: 'Introduction to Statistics' },
]

/**
 * Returns JAMB-style reference rows relevant to level (GST-heavy; science add-ons at 100L).
 */
export function getJambReferenceCourses(level, semester, departmentLabel = '') {
  const lv = parseInt(String(level).replace(/\D/g, ''), 10) || 100
  const dept = (departmentLabel || '').toLowerCase()
  const sci = /computer|math|physics|chemistry|biology|engineering|science/.test(dept)

  const out = [...GST_GNS]
  if (lv <= 100 && sci) {
    out.push(...SCI_100_UTME)
  }
  void semester
  return out
}
