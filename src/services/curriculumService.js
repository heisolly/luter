import {
  buildSyllabusId,
  departmentSlugFromLabel,
  normalizeCourseRow,
  universitySlugFromName,
} from '../lib/curriculumSlugs'

export function buildCurriculumKeyContext(universityName, deptLabel, level, semester) {
  return {
    uni_slug: universitySlugFromName(universityName),
    dept_slug: departmentSlugFromLabel(deptLabel),
    level: String(level || ''),
    semester: semester === '1st' || semester === '2nd' ? semester : '1st',
  }
}

export function coursesFromJsonb(courses) {
  if (!Array.isArray(courses)) return []
  const out = []
  const seen = new Set()
  for (const row of courses) {
    const n = normalizeCourseRow(row)
    if (!n.code || seen.has(n.code)) continue
    seen.add(n.code)
    out.push(n)
  }
  return out
}

export async function fetchCurriculumOffer(supabase, universityName, deptLabel, level, semester) {
  const ctx = buildCurriculumKeyContext(universityName, deptLabel, level, semester)
  const { data, error } = await supabase
    .from('curriculum_offers')
    .select('*')
    .eq('university_slug', ctx.uni_slug)
    .eq('department_slug', ctx.dept_slug)
    .eq('level', ctx.level)
    .eq('semester', ctx.semester)
    .eq('status', 'live')
    .maybeSingle()

  return { row: data, error, ctx }
}

/**
 * Pioneer publish: full visible catalog (what the student confirmed exists) for this slot.
 */
export async function publishCrowdCurriculum(supabase, {
  ctx,
  universityName,
  departmentLabel,
  catalogCourses,
  contributorId,
  facultyLabel = '',
}) {
  const courses = catalogCourses.map((c) => {
    const n = normalizeCourseRow(c)
    return { code: n.code, name: n.name, is_elective: n.is_elective }
  })
  const syllabus_id = buildSyllabusId(ctx.uni_slug, ctx.dept_slug, ctx.level, ctx.semester)
  const payload = {
    syllabus_id,
    university_slug: ctx.uni_slug,
    university_name: universityName,
    faculty: facultyLabel || 'General',
    department_slug: ctx.dept_slug,
    department_label: departmentLabel,
    level: ctx.level,
    semester: ctx.semester,
    source: 'crowd',
    status: 'draft',
    courses,
    contributor_id: contributorId,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('curriculum_offers')
    .upsert(payload, {
      onConflict: 'university_slug,department_slug,level,semester',
    })
    .select()
    .maybeSingle()

  return { data, error }
}
