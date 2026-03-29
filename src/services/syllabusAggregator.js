import { supabase } from '../supabaseClient'
import { getSubjects, normalizeProgrammeKey } from '../data/curriculum'
import { getJambReferenceCourses } from '../data/jambReference'
import { normalizeCourseRow } from '../lib/curriculumSlugs'
import { coursesFromJsonb, fetchCurriculumOffer } from './curriculumService'
import {
  fetchCurriculumBaselineList,
  fetchGroqHandbookWebCourses,
  fetchGroqJambAlignedCourses,
} from '../groqClient'

/**
 * Full merge: admin (live) → Groq layers → JAMB reference → optional web API → local template.
 * Dedupes by course code only — no cap on how many distinct courses appear.
 */
export async function aggregateSyllabusSources({
  university,
  department,
  level,
  semester,
  country,
  fetchWeb = true,
}) {
  const merged = []
  const seen = new Set()

  const pushList = (list, sourceTag) => {
    if (!Array.isArray(list)) return
    for (const item of list) {
      const n = normalizeCourseRow(item)
      if (!n.code || seen.has(n.code)) continue
      seen.add(n.code)
      merged.push({ ...n, source: sourceTag })
    }
  }

  const { row, error } = await fetchCurriculumOffer(
    supabase,
    university,
    department,
    level,
    semester,
  )
  if (error) console.warn('aggregate: curriculum_offers', error.message)

  if (row?.courses?.length) {
    pushList(coursesFromJsonb(row.courses), 'admin')
  }

  const [groqMain, groqJamb, groqWeb, webApi] = await Promise.allSettled([
    fetchCurriculumBaselineList({ country, university, department, level, semester }),
    fetchGroqJambAlignedCourses({ country, university, department, level, semester }),
    fetchGroqHandbookWebCourses({ country, university, department, level, semester }),
    fetchWeb
      ? fetchWebCoursesFromDevApi({ university, department, level, semester }).catch(() => [])
      : Promise.resolve([]),
  ])

  if (groqMain.status === 'fulfilled' && groqMain.value?.length) {
    pushList(groqMain.value, 'groq')
  }
  if (groqJamb.status === 'fulfilled' && groqJamb.value?.length) {
    pushList(groqJamb.value, 'groq_jamb')
  }
  if (groqWeb.status === 'fulfilled' && groqWeb.value?.length) {
    pushList(groqWeb.value, 'groq_web')
  }

  pushList(getJambReferenceCourses(level, semester, department), 'jamb')

  if (webApi.status === 'fulfilled' && webApi.value?.length) {
    pushList(webApi.value, 'web')
  }

  if (merged.length === 0) {
    const local = getSubjects(normalizeProgrammeKey(department) || department, level, semester)
    pushList(local.map((x) => ({ code: x.code, name: x.name })), 'template')
  }

  merged.sort((a, b) => a.code.localeCompare(b.code))
  return {
    catalog: merged,
    hasLiveAdmin: Boolean(row?.courses?.length),
    curriculumRow: row,
  }
}

async function fetchWebCoursesFromDevApi({ university, department, level, semester }) {
  const r = await fetch('/api/v1/syllabus/web', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ university, department, level, semester }),
  })
  if (!r.ok) return []
  const j = await r.json()
  if (!j.ok) return []
  return Array.isArray(j.courses) ? j.courses : []
}
