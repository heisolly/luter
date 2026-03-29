/** Normalized keys for curriculum_offers + /api/v1/curriculum */

const UNI_ALIASES = {
  unilag: 'unilag',
  'university-of-lagos': 'unilag',
  universityoflagos: 'unilag',
  abu: 'abu',
  'ahmadu-bello-university': 'abu',
  ui: 'ui',
  'university-of-ibadan': 'ui',
  oau: 'oau',
  'obafemi-awolowo-university': 'oau',
  uniilorin: 'uniilorin',
  'university-of-ilorin': 'uniilorin',
  futa: 'futa',
  lautech: 'lautech',
  'ladoke-akintola-university-of-technology': 'lautech',
  lasu: 'lasu',
  'lagos-state-university': 'lasu',
  covenant: 'covenant-university',
  'covenant-university': 'covenant-university',
  landmark: 'landmark-university',
  'landmark-university': 'landmark-university',
}

export function slugify(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function universitySlugFromName(name) {
  const raw = slugify(name || '')
  if (!raw) return ''
  if (UNI_ALIASES[raw]) return UNI_ALIASES[raw]
  const compact = raw.replace(/-/g, '')
  if (UNI_ALIASES[compact]) return UNI_ALIASES[compact]
  return raw
}

const DEPT_ALIASES = {
  csc: 'computer-science',
  cs: 'computer-science',
  eco: 'economics',
  econ: 'economics',
  mth: 'mathematics',
  math: 'mathematics',
}

export function departmentSlugFromLabel(label) {
  return slugify(label || '') || 'general'
}

/** Query-param helper: ?dept=csc or ?dept=Computer+Science */
export function resolveDepartmentSlugParam(param) {
  if (!param || typeof param !== 'string') return 'general'
  const p = param.trim().toLowerCase()
  if (DEPT_ALIASES[p]) return DEPT_ALIASES[p]
  const slug = slugify(param)
  return slug || 'general'
}

/** Query-param helper: ?uni=unilag or full university name */
export function resolveUniversitySlugParam(param) {
  if (!param || typeof param !== 'string') return ''
  const trimmed = param.trim()
  const lower = slugify(trimmed)
  if (UNI_ALIASES[lower]) return UNI_ALIASES[lower]
  const compact = lower.replace(/-/g, '')
  if (UNI_ALIASES[compact]) return UNI_ALIASES[compact]
  if (trimmed.includes(' ')) return universitySlugFromName(trimmed)
  return lower
}

export function normalizeSemesterParam(sem) {
  if (sem == null || sem === '') return '1st'
  const s = String(sem).toLowerCase()
  if (s === '2' || s === '2nd' || s === 'second') return '2nd'
  return '1st'
}

/** Stable key e.g. UNILAG_COMPUT_100_S2 (matches app + admin wizard). */
export function buildSyllabusId(universitySlug, departmentSlug, level, semester) {
  const u = (universitySlug || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10) || 'UNI'
  const d = (departmentSlug || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8) || 'DEPT'
  const lv = String(level ?? '100').replace(/\D/g, '') || '100'
  const sem =
    semester === '2nd' ||
    semester === 'S2' ||
    semester === 2 ||
    semester === '2'
      ? 'S2'
      : 'S1'
  return `${u}_${d}_${lv}_${sem}`
}

/** Normalize course code for keys / cards (e.g. "MTH 101" -> "MTH101") */
export function normalizeCourseCode(code) {
  if (!code || typeof code !== 'string') return 'COURSE'
  return code.replace(/\s+/g, '').toUpperCase().slice(0, 16)
}

export function normalizeCourseRow(row) {
  const code = normalizeCourseCode(row.code ?? row.course_code ?? '')
  const name = (row.name ?? row.course_title ?? row.title ?? 'Course').trim()
  const is_elective = Boolean(row.is_elective)
  return { code, name, is_elective }
}
