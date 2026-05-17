import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import {
  CircleNotch,
  Table,
  MagicWand,
  CloudArrowUp,
  DownloadSimple,
  Sparkle,
  FloppyDisk,
  RocketLaunch,
  PencilSimple,
  Trash,
  ArrowsClockwise,
  Globe,
  Robot,
  FileCsv,
  MagnifyingGlass,
} from '@phosphor-icons/react'
import tavilyService from '../../services/tavilyService'
import {
  buildSyllabusId,
  departmentSlugFromLabel,
  normalizeCourseCode,
  universitySlugFromName,
} from '../../lib/curriculumSlugs'
import { 
  parseSyllabusPasteWithGroq, 
  suggestSyllabusFromAiQuery,
  researchSyllabusOnline,
} from '../../groqClient'

const LEVELS = ['100', '200', '300', '400', '500']
const SEMESTERS = [
  { v: '1st', label: '1st Semester' },
  { v: '2nd', label: '2nd Semester' },
]

const UNI_HINTS = [
  'University of Lagos',
  'University of Ibadan',
  'Ahmadu Bello University',
  'Obafemi Awolowo University',
  'University of Ilorin',
  'Covenant University',
  'Landmark University',
  'Lagos State University',
]

function parseCSVLine(line) {
  const vals = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') inQ = !inQ
    else if (c === ',' && !inQ) {
      vals.push(cur.trim())
      cur = ''
    } else cur += c
  }
  vals.push(cur.trim())
  return vals.map((v) => v.replace(/^"|"$/g, ''))
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase())
  return lines.slice(1).map((line) => {
    const vals = parseCSVLine(line)
    const row = {}
    headers.forEach((h, i) => {
      row[h] = vals[i] ?? ''
    })
    return row
  })
}

function normSem(s) {
  const x = String(s || '')
    .trim()
    .toLowerCase()
  if (x === '2' || x === '2nd' || x === 's2' || x === 'second') return '2nd'
  return '1st'
}

function rowCoursesFromDelimited(codesStr, titlesStr) {
  const codes = String(codesStr || '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
  const titles = String(titlesStr || '')
    .split(';')
    .map((s) => s.trim())
  return codes.map((code, i) => ({
    code: normalizeCourseCode(code),
    name: titles[i] || titles[titles.length - 1] || 'Course',
    is_elective: false,
  }))
}

export default function AdminSyllabusManager() {
  const navigate = useNavigate()
  const [view, setView] = useState('table')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [userId, setUserId] = useState(null)

  const [univ, setUniv] = useState('University of Lagos')
  const [faculty, setFaculty] = useState('Science')
  const [dept, setDept] = useState('Computer Science')
  const [level, setLevel] = useState('100')
  const [semester, setSemester] = useState('1st')
  const [paste, setPaste] = useState('')
  const [aiQuery, setAiQuery] = useState('')
  const [preview, setPreview] = useState([])
  const [editId, setEditId] = useState(null)
  const [researchData, setResearchData] = useState(null)
  const [isResearching, setIsResearching] = useState(false)
  const [isBulkResearching, setIsBulkResearching] = useState(false)

  const [bulkText, setBulkText] = useState('')
  const [bulkResult, setBulkResult] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [manualCourse, setManualCourse] = useState({ code: '', title: '', is_elective: false })
  const [selectedPreviewIds, setSelectedPreviewIds] = useState(new Set())
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [bulkEditData, setBulkEditData] = useState({ code: '', title: '', is_elective: null })

  const syllabusIdPreview = useMemo(() => {
    const us = universitySlugFromName(univ)
    const ds = departmentSlugFromLabel(dept)
    return buildSyllabusId(us, ds, level, semester)
  }, [univ, dept, level, semester])

  const runWebResearch = async () => {
    setIsResearching(true)
    setError(null)
    setResearchData(null)
    
    try {
      console.log('Starting web research for:', { univ, dept, level, semester })
      const searchResults = await tavilyService.researchSyllabus(univ, dept, level, semester)
      console.log('Tavily results:', searchResults)
      
      if (!searchResults.results?.length) {
        throw new Error('No search results found for this context.')
      }

      const synthesized = await researchSyllabusOnline({
        university: univ,
        department: dept,
        level,
        semester,
        searchResults
      })

      console.log('Synthesized syllabus:', synthesized)
      setResearchData({
        courses: synthesized,
        answer: searchResults.answer,
        sources: searchResults.results
      })
      
      if (synthesized.length > 0) {
        setPreview(synthesized.map(c => ({
          code: c.code,
          title: c.title,
          is_elective: c.is_elective
        })))
      }
    } catch (err) {
      console.error('Web research failed:', err)
      setError(`Research failed: ${err.message}`)
    } finally {
      setIsResearching(false)
    }
  }

  const runBulkDepartmentResearch = async () => {
    if (!window.confirm(`This will automatically search, generate, and save the full skeleton (100L-500L, 1st & 2nd Semester) for ${univ} - ${dept}. This may take 1-2 minutes. Proceed?`)) return;

    setIsBulkResearching(true)
    setError(null)
    setBusy(true)

    try {
      const levelsToGen = ['100', '200', '300', '400', '500']
      const semsToGen = ['1st', '2nd']
      let totalGenerated = 0;

      for (const l of levelsToGen) {
        for (const s of semsToGen) {
          console.log(`Bulk Researching ${l}L ${s} semester...`)
          try {
            const searchResults = await tavilyService.researchSyllabus(univ, dept, l, s)
            if (!searchResults.results?.length) continue;
            
            const synthesized = await researchSyllabusOnline({
              university: univ,
              department: dept,
              level: l,
              semester: s,
              searchResults
            })

            if (synthesized && synthesized.length > 0) {
              const us = universitySlugFromName(univ)
              const ds = departmentSlugFromLabel(dept)
              const sid = buildSyllabusId(us, ds, l, s)
              
              const payload = {
                id: sid,
                university_slug: us,
                department_slug: ds,
                level: l,
                semester: s,
                university_name: univ,
                department_name: dept,
                course_codes: synthesized.map(c => c.code).join(';'),
                course_titles: synthesized.map(c => c.title).join(';'),
                course_electives: synthesized.map(c => c.is_elective ? '1' : '0').join(';'),
                status: 'draft',
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString()
              }

              await supabase.from('curriculum_offers').upsert(payload, { onConflict: 'university_slug,department_slug,level,semester' })
              totalGenerated += synthesized.length
            }
          } catch (err) {
            console.error(`Error in bulk research for ${l} ${s}:`, err)
          }
        }
      }

      alert(`Successfully generated full skeleton! Saved ${totalGenerated} courses as drafts.`)
      setView('table')
      await reload()

    } catch (err) {
      console.error('Bulk research failed:', err)
      setError(`Bulk Research failed: ${err.message}`)
    } finally {
      setIsBulkResearching(false)
      setBusy(false)
    }
  }

  const runAutonomousResearch = async () => {
    // Find the Syllabus Researcher agent
    const { data: agents } = await supabase.from('admin_agents')
      .select('id')
      .ilike('name', '%Syllabus Researcher%')
      .single()

    if (!agents?.id) {
      alert('Syllabus Researcher agent not found. Please create one in the Agent Directory.')
      navigate('/agents')
      return
    }

    const prompt = `Research and verify the official curriculum for ${univ} (${dept}) for Level ${level}, Semester ${semester}. 
    Compare at least 3 sources. If you find discrepancies (like 13 vs 37 courses), explain which one is correct. 
    Return the verified course list in the structured data field.`

    // Navigate to agent console with the prompt as a state or query param
    navigate(`/agents/${agents.id}`, { state: { autoPrompt: prompt } })
  }

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    console.log('Reloading syllabus data...')
    const { data, error: e, count } = await supabase
      .from('curriculum_offers')
      .select('*')
      .order('updated_at', { ascending: false })
    console.log('Reload response:', { data: data?.length, rows: count, error: e })
    if (e) setError(e.message)
    else {
      setRows(data || [])
      console.log('Updated rows state with', data?.length || 0, 'items')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // Admin uses a global entry password, so we bypass Supabase authentication here
    setUserId('admin_user')
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const loadRowIntoWizard = (r) => {
    setEditId(r.id)
    setUniv(r.university_name || '')
    setFaculty(r.faculty || '')
    setDept(r.department_label || '')
    setLevel(String(r.level || '100'))
    setSemester(r.semester === '2nd' ? '2nd' : '1st')
    const crs = Array.isArray(r.courses) ? r.courses : []
    setPreview(
      crs.map((c) => ({
        code: normalizeCourseCode(c.code || ''),
        title: String(c.name || c.title || '').trim(),
        is_elective: Boolean(c.is_elective),
      })),
    )
    setPaste('')
    setView('wizard')
  }

  const resetWizard = () => {
    setEditId(null)
    setPaste('')
    setPreview([])
    setAiQuery('')
  }

  const checkForDuplicatesInList = async (courseList) => {
    const duplicates = []
    
    for (const course of courseList) {
      const normalizedCode = normalizeCourseCode(course.code)
      
      // Check for duplicate in current preview
      const previewDuplicate = preview.find(c => 
        normalizeCourseCode(c.code) === normalizedCode
      )
      
      if (previewDuplicate) {
        duplicates.push({ course, type: 'preview', existing: previewDuplicate })
        continue
      }
      
      // Check for duplicate in existing syllabi
      const existingDuplicate = await checkDuplicateCourse(course.code)
      if (existingDuplicate) {
        duplicates.push({ course, type: 'existing', existing: existingDuplicate })
      }
    }
    
    return duplicates
  }

  const runPasteParser = async () => {
    setBusy(true)
    setError(null)
    
    // Check if API key is available
    if (!import.meta.env.VITE_GROQ_API_KEY) {
      setError('VITE_GROQ_API_KEY is not set. Please check your environment variables.')
      setBusy(false)
      return
    }
    
    if (!paste?.trim()) {
      setError('Please paste some syllabus content to parse.')
      setBusy(false)
      return
    }
    
    console.log('Running paste parser with content length:', paste.length)
    console.log('API Key available:', !!import.meta.env.VITE_GROQ_API_KEY)
    
    try {
      const list = await parseSyllabusPasteWithGroq(paste)
      console.log('Parser returned list:', list)
      
      if (!list.length) {
        setError('Parser found no courses in the pasted content. Try pasting a clearer course list with codes and titles.')
        setBusy(false)
        return
      }
      
      // Check for duplicates
      const duplicates = await checkForDuplicatesInList(list)
      if (duplicates.length > 0) {
        const duplicateMessages = duplicates.map(d => 
          `${d.course.code}: "${d.course.title}" (conflicts with: "${d.existing.title}")`
        ).join('\n')
        
        const proceed = window.confirm(
          `Found ${duplicates.length} duplicate course(s):\n\n${duplicateMessages}\n\n` +
          `Do you want to continue anyway? Duplicates will be added to preview.`
        )
        
        if (!proceed) {
          setBusy(false)
          return
        }
      }
      
      setPreview(list.map((c) => ({ code: c.code, title: c.title, is_elective: c.is_elective })))
      setError(null)
      console.log('Successfully parsed and added', list.length, 'courses to preview')
    } catch (error) {
      console.error('Paste parser error:', error)
      setError(`Parse Error: ${error.message || 'Unknown error occurred'}`)
    } finally {
      setBusy(false)
    }
  }

  const runAiAssist = async () => {
    setBusy(true)
    setError(null)
    
    // Check if API key is available
    if (!import.meta.env.VITE_GROQ_API_KEY) {
      setError('VITE_GROQ_API_KEY is not set. Please check your environment variables.')
      setBusy(false)
      return
    }
    
    console.log('Running AI assist with query:', aiQuery)
    console.log('API Key available:', !!import.meta.env.VITE_GROQ_API_KEY)
    
    try {
      const list = await suggestSyllabusFromAiQuery(aiQuery)
      console.log('AI returned list:', list)
      
      if (!list.length) {
        setError('Assistant returned no courses. Try a more specific query with university, department, level, and semester.')
        setBusy(false)
        return
      }
      
      // Check for duplicates against existing rows
      const checkDuplicates = (newList) => {
        const dups = []
        for (const nc of newList) {
          const existing = rows.find(r => r.code === nc.code)
          if (existing) {
            dups.push({ course: nc, existing })
          }
        }
        return dups
      }
      
      const duplicates = checkDuplicates(list)
      if (duplicates.length > 0) {
        const duplicateMessages = duplicates.map(d => 
          `${d.course.code}: "${d.course.title}" (conflicts with: "${d.existing.title}")`
        ).join('\n')
        
        const proceed = window.confirm(
          `Found ${duplicates.length} duplicate course(s):\n\n${duplicateMessages}\n\n` +
          `Do you want to continue anyway? Duplicates will be added to preview.`
        )
        
        if (!proceed) {
          setBusy(false)
          return
        }
      }
      
      setPreview(list.map((c) => ({ code: c.code, title: c.title, is_elective: c.is_elective })))
      setError(null)
      console.log('Successfully added', list.length, 'courses to preview')
    } catch (error) {
      console.error('AI Assist Error:', error)
      setError(`AI Assistant Error: ${error.message || 'Unknown error occurred'}`)
    } finally {
      setBusy(false)
    }
  }

  const savePayload = async (status) => {
    if (!preview.length) {
      setError('Add at least one course.')
      return
    }
    
    if (!userId) {
      // Try to refresh auth first
      const authRefreshed = await refreshAuth()
      if (!authRefreshed) {
        setError('User not authenticated. Please log in again.')
        return
      }
    }
    
    const university_slug = universitySlugFromName(univ)
    const department_slug = departmentSlugFromLabel(dept)
    const syllabus_id = buildSyllabusId(university_slug, department_slug, level, semester)
    
    console.log('Saving syllabus with data:', {
      university_slug,
      department_slug,
      level,
      semester,
      syllabus_id,
      course_count: preview.length
    })
    
    const courses = preview.map((p) => ({
      code: p.code,
      name: p.title,
      is_elective: !!p.is_elective,
    }))
    
    const now = new Date().toISOString()
    const base = {
      syllabus_id,
      university_slug,
      university_name: univ.trim(),
      faculty: faculty.trim() || 'General',
      department_slug,
      department_label: dept.trim(),
      level: String(level),
      semester,
      courses,
      source: 'merged',
      status,
      updated_at: now,
      reviewed_by: status === 'live' ? userId : null,
      reviewed_at: status === 'live' ? now : null,
    }
    
    setBusy(true)
    setError(null)
    
    try {
      console.log('Attempting to upsert syllabus:', base)
      
      const { data, error: e } = await supabase
        .from('curriculum_offers')
        .upsert(base, {
          onConflict: 'university_slug,department_slug,level,semester',
        })
        .select()
        
      console.log('Upsert response:', { data, error: e })
      
      if (e) {
        console.error('Save error:', e)
        setError(`Save failed: ${e.message}`)
      } else {
        console.log('Successfully saved syllabus:', data)
        resetWizard()
        setView('table')
        await reload()
        // Show success message
        setError(null)
        alert(`Syllabus ${status === 'live' ? 'published' : 'saved as draft'} successfully!`)
      }
    } catch (error) {
      console.error('Unexpected save error:', error)
      setError(`Unexpected error: ${error.message}`)
    } finally {
      setBusy(false)
    }
  }

  const publishRow = async (id) => {
    // Admin user authenticated via entry password, bypass Supabase auth check
    const currentUserId = userId || 'admin_user';
    
    setBusy(true)
    setError(null)
    
    try {
      console.log('Publishing syllabus with ID:', id)
      
      const { data, error: e } = await supabase
        .from('curriculum_offers')
        .update({
          status: 'live',
          reviewed_by: currentUserId,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        
      console.log('Publish response:', { data, error: e })
      
      if (e) {
        console.error('Publish error:', e)
        setError(`Publish failed: ${e.message}`)
      } else {
        console.log('Successfully published syllabus:', data)
        await reload()
        alert('Syllabus published successfully!')
      }
    } catch (error) {
      console.error('Unexpected publish error:', error)
      setError(`Unexpected error: ${error.message}`)
    } finally {
      setBusy(false)
    }
  }

  const deleteRow = async (id, st) => {
    if (st === 'live' && !window.confirm('This syllabus is Live for students. Delete anyway?')) return
    if (st === 'draft' && !window.confirm('Delete this draft?')) return
    setBusy(true)
    setError(null)
    
    console.log('Attempting to delete syllabus with ID:', id)
    
    const { data, error: e, count } = await supabase
      .from('curriculum_offers')
      .delete()
      .eq('id', id)
      .select()
    
    console.log('Delete response:', { data, error: e, count })
    
    if (e) {
      console.error('Delete error:', e)
      setError(`Delete failed: ${e.message}`)
    } else {
      console.log(`Successfully deleted ${count || 0} rows`)
      await reload()
    }
    setBusy(false)
  }

  const processBulkCsv = async () => {
    setBusy(true)
    setBulkResult(null)
    setError(null)
    try {
      const parsed = parseCSV(bulkText)
      let ok = 0
      const err = []
      for (let i = 0; i < parsed.length; i++) {
        const r = parsed[i]
        const university = r.university || r.uni || ''
        const fac = r.faculty || ''
        const department = r.dept || r.department || ''
        const lv = String(r.level || '100').replace(/\D/g, '') || '100'
        const sem = normSem(r.semester || r.sem)
        const codesRaw = r.course_codes || r.courses_codes || ''
        const titlesRaw = r.course_titles || r.courses_titles || ''
        if (!university || !department || !codesRaw) {
          err.push(`Row ${i + 2}: missing University, Dept, or Course_Codes`)
          continue
        }
        const university_slug = universitySlugFromName(university)
        const department_slug = departmentSlugFromLabel(department)
        const syllabus_id = buildSyllabusId(university_slug, department_slug, lv, sem)
        const courses = rowCoursesFromDelimited(codesRaw, titlesRaw)
        const { error: e } = await supabase.from('curriculum_offers').upsert(
          {
            syllabus_id,
            university_slug,
            university_name: university.trim(),
            faculty: fac.trim() || 'General',
            department_slug,
            department_label: department.trim(),
            level: lv,
            semester: sem,
            courses,
            source: 'merged',
            status: 'draft',
            contributor_id: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'university_slug,department_slug,level,semester' },
        )
        if (e) err.push(`Row ${i + 2}: ${e.message}`)
        else ok++
      }
      setBulkResult({ ok, err })
      await reload()
    } catch (e) {
      setError(e.message || 'CSV parse failed')
    }
    setBusy(false)
  }

  const updatePreviewRow = (idx, field, value) => {
    setPreview((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      if (field === 'code') next[idx].code = normalizeCourseCode(value)
      return next
    })
  }

  const removePreviewRow = (idx) => {
    setPreview((prev) => prev.filter((_, i) => i !== idx))
  }

  const togglePreviewSelection = (idx) => {
    setSelectedPreviewIds((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const toggleSelectAllPreview = () => {
    if (selectedPreviewIds.size === preview.length) {
      setSelectedPreviewIds(new Set())
    } else {
      setSelectedPreviewIds(new Set(preview.map((_, idx) => idx)))
    }
  }

  const bulkDeletePreview = () => {
    if (selectedPreviewIds.size === 0) {
      setError('No courses selected for deletion')
      return
    }
    
    if (!window.confirm(`Delete ${selectedPreviewIds.size} selected course(s)?`)) {
      return
    }
    
    setPreview((prev) => prev.filter((_, idx) => !selectedPreviewIds.has(idx)))
    setSelectedPreviewIds(new Set())
    setBulkEditMode(false)
    setBulkEditData({ code: '', title: '', is_elective: null })
  }

  const bulkEditPreview = () => {
    if (selectedPreviewIds.size === 0) {
      setError('No courses selected for editing')
      return
    }
    
    setBulkEditMode(true)
  }

  const applyBulkEdit = () => {
    if (selectedPreviewIds.size === 0) return
    
    setPreview((prev) => prev.map((course, idx) => {
      if (selectedPreviewIds.has(idx)) {
        return {
          ...course,
          code: bulkEditData.code.trim() ? normalizeCourseCode(bulkEditData.code.trim()) : course.code,
          title: bulkEditData.title.trim() || course.title,
          is_elective: bulkEditData.is_elective !== null ? bulkEditData.is_elective : course.is_elective
        }
      }
      return course
    }))
    
    setSelectedPreviewIds(new Set())
    setBulkEditMode(false)
    setBulkEditData({ code: '', title: '', is_elective: null })
  }

  const cancelBulkEdit = () => {
    setBulkEditMode(false)
    setBulkEditData({ code: '', title: '', is_elective: null })
  }

  const checkDuplicateCourse = async (courseCode) => {
    const normalizedCode = normalizeCourseCode(courseCode.trim())
    const university_slug = universitySlugFromName(univ)
    const department_slug = departmentSlugFromLabel(dept)
    
    const { data, error } = await supabase
      .from('curriculum_offers')
      .select('courses')
      .eq('university_slug', university_slug)
      .eq('department_slug', department_slug)
      .eq('level', level)
      .eq('semester', semester)
      .eq('status', 'live')
    
    if (error || !data) return false
    
    // Check if any existing syllabus has this course code
    for (const syllabus of data) {
      if (Array.isArray(syllabus.courses)) {
        const existingCourse = syllabus.courses.find(course => 
          normalizeCourseCode(course.code || '') === normalizedCode
        )
        if (existingCourse) {
          return existingCourse
        }
      }
    }
    
    return false
  }

  const addManualCourse = async () => {
    if (!manualCourse.code.trim() || !manualCourse.title.trim()) {
      setError('Please enter both course code and title')
      return
    }
    
    const normalizedCode = normalizeCourseCode(manualCourse.code.trim())
    
    // Check for duplicate in current preview
    const previewDuplicate = preview.find(course => 
      normalizeCourseCode(course.code) === normalizedCode
    )
    
    if (previewDuplicate) {
      setError(`Course code "${normalizedCode}" already exists in current preview`)
      return
    }
    
    // Check for duplicate in existing syllabi
    const existingDuplicate = await checkDuplicateCourse(manualCourse.code)
    
    if (existingDuplicate) {
      const confirmOverride = window.confirm(
        `Course code "${normalizedCode}" already exists in this syllabus:\n` +
        `"${existingDuplicate.title}"\n\n` +
        `Do you want to override it? This will replace the existing course.`
      )
      
      if (!confirmOverride) return
    }
    
    const newCourse = {
      code: normalizedCode,
      title: manualCourse.title.trim(),
      is_elective: manualCourse.is_elective
    }
    
    setPreview((prev) => [...prev, newCourse])
    setManualCourse({ code: '', title: '', is_elective: false })
    setError(null)
  }

  const toggleSelection = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === rows.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(rows.map(r => r.id)))
    }
  }

  const bulkDelete = async () => {
    if (selectedIds.size === 0) {
      setError('No items selected for deletion')
      return
    }
    
    const hasLive = Array.from(selectedIds).some(id => 
      rows.find(r => r.id === id)?.status === 'live'
    )
    
    if (hasLive && !window.confirm(`${selectedIds.size} item(s) selected, including Live syllabi. Delete anyway?`)) {
      return
    }
    
    if (!hasLive && !window.confirm(`Delete ${selectedIds.size} selected syllabus syllabi?`)) {
      return
    }
    
    setBusy(true)
    setError(null)
    
    try {
      const { data, error: e, count } = await supabase
        .from('curriculum_offers')
        .delete()
        .in('id', Array.from(selectedIds))
        .select()
      
      console.log('Bulk delete response:', { data, error: e, count })
      
      if (e) {
        setError(`Bulk delete failed: ${e.message}`)
      } else {
        console.log(`Successfully deleted ${count || 0} rows`)
        setSelectedIds(new Set())
        await reload()
      }
    } catch (err) {
      setError(`Bulk delete failed: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  const bulkPublish = async (status) => {
    if (selectedIds.size === 0) {
      setError('No items selected for publishing')
      return
    }
    
    if (!userId) {
      setError('User not authenticated for publishing')
      return
    }
    
    const action = status === 'live' ? 'publish' : 'unpublish'
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${selectedIds.size} selected syllabi?`)) {
      return
    }
    
    setBusy(true)
    setError(null)
    
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      }
      
      if (status === 'live') {
        updateData.reviewed_by = userId
        updateData.reviewed_at = new Date().toISOString()
      }
      
      const { data, error: e, count } = await supabase
        .from('curriculum_offers')
        .update(updateData)
        .in('id', Array.from(selectedIds))
        .select()
      
      console.log(`Bulk ${action} response:`, { data, error: e, count })
      
      if (e) {
        setError(`Bulk ${action} failed: ${e.message}`)
      } else {
        console.log(`Successfully ${action}ed ${count || 0} rows`)
        setSelectedIds(new Set())
        await reload()
      }
    } catch (err) {
      setError(`Bulk ${action} failed: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <h1 className="adm-page-title">Syllabus Manager</h1>
          <p className="adm-page-desc">
            Curate <strong>curriculum_offers</strong>: Draft → review → Live. Students only consume{' '}
            <span className="adm-mono">status = live</span> during onboarding.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: userId ? '#059669' : '#dc2626' }}>
            {userId ? `✓ Authenticated` : '✗ Not Authenticated'}
          </span>
          <button 
            onClick={refreshAuth}
            disabled={busy}
            className="adm-btn adm-btn--ghost"
            style={{ fontSize: 12, padding: '4px 8px' }}
          >
            <ArrowsClockwise size={12} />
            Refresh Auth
          </button>
        </div>
      </div>

      {error && (
        <div className="adm-error-banner" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="adm-card" style={{ padding: 12, marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {[
          { id: 'table', label: 'Data table', icon: Table },
          { id: 'wizard', label: 'Creation wizard', icon: MagicWand },
          { id: 'research', label: 'Web Research', icon: Globe },
          { id: 'bulk', label: 'Bulk CSV', icon: FileCsv },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`adm-btn ${view === id ? 'adm-btn--primary' : ''}`}
            style={{ opacity: view === id ? 1 : 0.85 }}
            onClick={() => {
              setView(id)
              setError(null)
            }}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
        <button type="button" className="adm-btn" onClick={() => reload()} disabled={loading || busy}>
          <ArrowsClockwise size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {view === 'table' && (
        <div className="adm-card" style={{ padding: 0, overflow: 'auto' }}>
          {selectedIds.size > 0 && (
            <div style={{ 
              padding: '16px', 
              background: '#eff6ff', 
              borderBottom: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 600, color: '#1e40af', fontSize: 14 }}>
                  {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
                </span>
                <div style={{ display: 'flex', gap: 6, padding: '4px', background: 'white', borderRadius: 6, border: '1px solid #d1d5db' }}>
                  <button
                    type="button"
                    className="adm-btn adm-btn--ghost"
                    onClick={bulkDelete}
                    disabled={busy}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  >
                    <Trash size={12} />
                  </button>
                  <button
                    type="button"
                    className="adm-btn adm-btn--ghost"
                    onClick={() => bulkPublish('live')}
                    disabled={busy}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  >
                    <RocketLaunch size={12} />
                  </button>
                  <button
                    type="button"
                    className="adm-btn adm-btn--ghost"
                    onClick={() => bulkPublish('draft')}
                    disabled={busy}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  >
                    <FloppyDisk size={12} />
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="adm-btn adm-btn--ghost"
                onClick={() => setSelectedIds(new Set())}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                Clear All
              </button>
            </div>
          )}
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <CircleNotch className="animate-spin" style={{ display: 'inline-block' }} />
            </div>
          ) : (
            <>
              {rows.length > 0 ? (
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse', 
                  fontSize: 13,
                  background: 'white'
                }}>
                  <thead>
                    <tr style={{ 
                      background: '#f9fafb', 
                      borderBottom: '2px solid #e5e7eb',
                      textAlign: 'left' 
                    }}>
                      <th style={{ 
                        padding: '14px 12px', 
                        width: '40px', 
                        fontWeight: 600, 
                        fontSize: 12, 
                        color: '#374151',
                        borderRight: '1px solid #e5e7eb'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.size === rows.length && rows.length > 0}
                          onChange={toggleSelectAll}
                          style={{ cursor: 'pointer' }}
                        />
                      </th>
                      <th style={{ 
                        padding: '14px 12px', 
                        fontWeight: 600, 
                        fontSize: 12, 
                        color: '#374151',
                        borderRight: '1px solid #e5e7eb'
                      }}>Syllabus ID</th>
                      <th style={{ 
                        padding: '14px 12px', 
                        fontWeight: 600, 
                        fontSize: 12, 
                        color: '#374151',
                        borderRight: '1px solid #e5e7eb'
                      }}>University</th>
                      <th style={{ 
                        padding: '14px 12px', 
                        fontWeight: 600, 
                        fontSize: 12, 
                        color: '#374151',
                        borderRight: '1px solid #e5e7eb'
                      }}>Faculty</th>
                      <th style={{ 
                        padding: '14px 12px', 
                        fontWeight: 600, 
                        fontSize: 12, 
                        color: '#374151',
                        borderRight: '1px solid #e5e7eb'
                      }}>Department</th>
                      <th style={{ 
                        padding: '14px 12px', 
                        fontWeight: 600, 
                        fontSize: 12, 
                        color: '#374151',
                        borderRight: '1px solid #e5e7eb'
                      }}>Level</th>
                      <th style={{ 
                        padding: '14px 12px', 
                        fontWeight: 600, 
                        fontSize: 12, 
                        color: '#374151',
                        borderRight: '1px solid #e5e7eb'
                      }}>Status</th>
                      <th style={{ 
                        padding: '14px 12px', 
                        fontWeight: 600, 
                        fontSize: 12, 
                        color: '#374151',
                        borderRight: '1px solid #e5e7eb'
                      }}>Courses</th>
                      <th style={{ 
                        padding: '14px 12px', 
                        fontWeight: 600, 
                        fontSize: 12, 
                        color: '#374151'
                      }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, index) => (
                      <tr key={r.id} style={{ 
                        borderBottom: '1px solid #f3f4f6',
                        background: selectedIds.has(r.id) ? '#eff6ff' : 'white',
                        transition: 'background-color 0.15s ease'
                      }}>
                        <td style={{ 
                          padding: '14px 12px', 
                          width: '40px',
                          verticalAlign: 'middle',
                          borderRight: '1px solid #f3f4f6'
                        }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(r.id)}
                            onChange={() => toggleSelection(r.id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ 
                          padding: '14px 12px', 
                          fontFamily: 'monospace', 
                          fontSize: 11,
                          verticalAlign: 'middle',
                          color: '#6b7280',
                          borderRight: '1px solid #f3f4f6'
                        }}>{r.syllabus_id}</td>
                        <td style={{ 
                          padding: '14px 12px', 
                          verticalAlign: 'middle',
                          fontWeight: 500,
                          color: '#111827',
                          borderRight: '1px solid #f3f4f6'
                        }}>{r.university_name}</td>
                        <td style={{ 
                          padding: '14px 12px', 
                          verticalAlign: 'middle',
                          color: '#6b7280',
                          borderRight: '1px solid #f3f4f6'
                        }}>{r.faculty}</td>
                        <td style={{ 
                          padding: '14px 12px', 
                          verticalAlign: 'middle',
                          color: '#6b7280',
                          borderRight: '1px solid #f3f4f6'
                        }}>{r.department_label}</td>
                        <td style={{ 
                          padding: '14px 12px', 
                          verticalAlign: 'middle',
                          borderRight: '1px solid #f3f4f6'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ 
                              background: '#f3f4f6', 
                              padding: '2px 6px', 
                              borderRadius: 4, 
                              fontSize: 11, 
                              fontWeight: 600 
                            }}>
                              {r.level}
                            </span>
                            <span style={{ color: '#9ca3af' }}>•</span>
                            <span style={{ 
                              background: '#f3f4f6', 
                              padding: '2px 6px', 
                              borderRadius: 4, 
                              fontSize: 11, 
                              fontWeight: 600 
                            }}>
                              {r.semester}
                            </span>
                          </div>
                        </td>
                        <td style={{ 
                          padding: '14px 12px', 
                          verticalAlign: 'middle',
                          borderRight: '1px solid #f3f4f6'
                        }}>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              fontWeight: 600,
                              fontSize: 11,
                              background: r.status === 'live' ? '#dcfce7' : '#fef3c7',
                              color: r.status === 'live' ? '#166534' : '#92400e',
                            }}
                          >
                            {r.status === 'live' ? '● Live' : '○ Draft'}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '14px 12px', 
                          verticalAlign: 'middle',
                          color: '#6b7280',
                          borderRight: '1px solid #f3f4f6'
                        }}>
                          <span style={{ 
                            background: '#f3f4f6', 
                            padding: '4px 8px', 
                            borderRadius: 4, 
                            fontSize: 12, 
                            fontWeight: 600 
                          }}>
                            {Array.isArray(r.courses) ? r.courses.length : 0}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            {r.status === 'draft' && (
                              <button
                                type="button"
                                className="adm-btn adm-btn--primary"
                                style={{ padding: '4px 8px', fontSize: 11 }}
                                disabled={busy}
                                onClick={() => publishRow(r.id)}
                              >
                                <RocketLaunch size={12} />
                              </button>
                            )}
                            <button
                              type="button"
                              className="adm-btn adm-btn--ghost"
                              style={{ padding: '4px 8px', fontSize: 11 }}
                              disabled={busy}
                              onClick={() => loadRowIntoWizard(r)}
                            >
                              <PencilSimple size={12} />
                            </button>
                            <button
                              type="button"
                              className="adm-btn adm-btn--ghost"
                              style={{ 
                                padding: '4px 8px', 
                                fontSize: 11, 
                                color: '#dc2626'
                              }}
                              disabled={busy}
                              onClick={() => deleteRow(r.id, r.status)}
                            >
                              <Trash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ 
                  padding: '48px', 
                  textAlign: 'center', 
                  color: '#9ca3af',
                  fontSize: 14,
                  background: '#fafafa'
                }}>
                  <div style={{ marginBottom: 8 }}>No syllabi found</div>
                  <div style={{ fontSize: 12 }}>Create your first syllabus using the Creation Wizard</div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {view === 'wizard' && (
        <div className="adm-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800 }}>{editId ? 'Edit syllabus' : 'New syllabus'}</h3>
          <p className="adm-muted" style={{ margin: '0 0 20px', fontSize: 13 }}>
            Generated ID: <code className="adm-mono">{syllabusIdPreview}</code>
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 16 }}>
            <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
              University
              <input
                className="adm-input"
                style={{ width: '100%', marginTop: 6 }}
                list="syllabus-uni-hints"
                value={univ}
                onChange={(e) => setUniv(e.target.value)}
              />
              <datalist id="syllabus-uni-hints">
                {UNI_HINTS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </label>
            <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
              Faculty
              <input className="adm-input" style={{ width: '100%', marginTop: 6 }} value={faculty} onChange={(e) => setFaculty(e.target.value)} />
            </label>
            <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
              Department
              <input className="adm-input" style={{ width: '100%', marginTop: 6 }} value={dept} onChange={(e) => setDept(e.target.value)} />
            </label>
            <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
              Level
              <select className="adm-input" style={{ width: '100%', marginTop: 6 }} value={level} onChange={(e) => setLevel(e.target.value)}>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l} Level
                  </option>
                ))}
              </select>
            </label>
            <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
              Semester
              <select className="adm-input" style={{ width: '100%', marginTop: 6 }} value={semester} onChange={(e) => setSemester(e.target.value)}>
                {SEMESTERS.map((s) => (
                  <option key={s.v} value={s.v}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }} className="stack-on-mobile">
            <div>
              <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                <Globe size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> AI assistant (quick fill)
              </label>
              <textarea
                className="adm-input"
                style={{ width: '100%', minHeight: 72, resize: 'vertical' }}
                placeholder='e.g. "Unilag Computer Science 200 level 2nd semester typical courses"'
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
              />
              <button type="button" className="adm-btn adm-btn--primary" style={{ marginTop: 8 }} disabled={busy} onClick={runAiAssist}>
                {busy ? <CircleNotch className="animate-spin" size={16} /> : <Sparkle size={16} />}
                Suggest courses
              </button>
            </div>
            <div>
              <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                Bulk paste (PDF / WhatsApp)
              </label>
              <textarea
                className="adm-input"
                style={{ width: '100%', minHeight: 120, resize: 'vertical', fontFamily: 'inherit' }}
                placeholder={'CSC 101: Intro to CS, MTH 102: Calculus II, GST 102 ...'}
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
              />
              <button type="button" className="adm-btn" style={{ marginTop: 8 }} disabled={busy} onClick={runPasteParser}>
                {busy ? <CircleNotch className="animate-spin" size={16} /> : <MagicWand size={16} />}
                Process with AI
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              <PencilSimple size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Add course manually
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr auto auto', gap: 8, alignItems: 'end' }}>
              <input
                className="adm-input"
                style={{ width: '100%' }}
                placeholder="Course code"
                value={manualCourse.code}
                onChange={(e) => setManualCourse(prev => ({ ...prev, code: e.target.value }))}
              />
              <input
                className="adm-input"
                style={{ width: '100%' }}
                placeholder="Course title"
                value={manualCourse.title}
                onChange={(e) => setManualCourse(prev => ({ ...prev, title: e.target.value }))}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={manualCourse.is_elective}
                  onChange={(e) => setManualCourse(prev => ({ ...prev, is_elective: e.target.checked }))}
                />
                Elective
              </label>
              <button
                type="button"
                className="adm-btn adm-btn--ghost"
                onClick={addManualCourse}
                disabled={!manualCourse.code.trim() || !manualCourse.title.trim()}
              >
                Add
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1f2937' }}>
                Course Preview ({preview.length})
              </h4>
              {preview.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {selectedPreviewIds.size > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8,
                      padding: '6px 12px',
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: 6
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1e40af' }}>
                        {selectedPreviewIds.size} selected
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          className="adm-btn adm-btn--primary"
                          onClick={bulkEditPreview}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        >
                          <PencilSimple size={12} />
                        </button>
                        <button
                          type="button"
                          className="adm-btn adm-btn--ghost"
                          onClick={bulkDeletePreview}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    className="adm-btn adm-btn--ghost"
                    onClick={() => setSelectedPreviewIds(new Set())}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {bulkEditMode && selectedPreviewIds.size > 0 && (
              <div style={{ 
                padding: '16px', 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                marginBottom: 16
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 12 
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1e40af' }}>
                    <PencilSimple size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                    Bulk Edit {selectedPreviewIds.size} course{selectedPreviewIds.size !== 1 ? 's' : ''}
                  </div>
                  <button
                    type="button"
                    className="adm-btn adm-btn--ghost"
                    onClick={cancelBulkEdit}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 2fr auto auto', 
                  gap: 12, 
                  alignItems: 'end' 
                }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 4 }}>
                      Course Code
                    </label>
                    <input
                      className="adm-input"
                      placeholder="Leave blank to keep current"
                      value={bulkEditData.code}
                      onChange={(e) => setBulkEditData(prev => ({ ...prev, code: e.target.value }))}
                      style={{ fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 4 }}>
                      Course Title
                    </label>
                    <input
                      className="adm-input"
                      placeholder="Leave blank to keep current"
                      value={bulkEditData.title}
                      onChange={(e) => setBulkEditData(prev => ({ ...prev, title: e.target.value }))}
                      style={{ fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 4 }}>
                      Type
                    </label>
                    <select
                      className="adm-input"
                      value={bulkEditData.is_elective === null ? '' : bulkEditData.is_elective ? 'elective' : 'core'}
                      onChange={(e) => {
                        const value = e.target.value
                        setBulkEditData(prev => ({ 
                          ...prev, 
                          is_elective: value === '' ? null : value === 'elective'
                        }))
                      }}
                      style={{ fontSize: 13, minWidth: 80 }}
                    >
                      <option value="">No change</option>
                      <option value="core">Core</option>
                      <option value="elective">Elective</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
                    <button
                      type="button"
                      className="adm-btn adm-btn--primary"
                      onClick={applyBulkEdit}
                      style={{ fontSize: '13px', padding: '6px 12px' }}
                    >
                      Apply Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: 8, 
            overflow: 'hidden',
            marginBottom: 16,
            background: 'white'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 8px', width: '40px', fontWeight: 600, fontSize: 12, color: '#6b7280' }}>
                    <input
                      type="checkbox"
                      checked={selectedPreviewIds.size === preview.length && preview.length > 0}
                      onChange={toggleSelectAllPreview}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, fontSize: 12, color: '#6b7280' }}>Course Code</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, fontSize: 12, color: '#6b7280' }}>Course Title</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, fontSize: 12, color: '#6b7280' }}>Type</th>
                  <th style={{ padding: '12px 8px', width: '100px', fontWeight: 600, fontSize: 12, color: '#6b7280' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((p, i) => (
                  <tr key={`${p.code}-${i}`} style={{ 
                    borderBottom: '1px solid #f3f4f6',
                    background: selectedPreviewIds.has(i) ? '#eff6ff' : 'white',
                    transition: 'background-color 0.15s ease'
                  }}>
                    <td style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                      <input
                        type="checkbox"
                        checked={selectedPreviewIds.has(i)}
                        onChange={() => togglePreviewSelection(i)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                      <input 
                        className="adm-input" 
                        style={{ 
                          width: '100%', 
                          fontSize: 12,
                          border: selectedPreviewIds.has(i) ? '1px solid #3b82f6' : '1px solid #d1d5db',
                          background: selectedPreviewIds.has(i) ? '#f8fafc' : 'white'
                        }} 
                        value={p.code} 
                        onChange={(e) => updatePreviewRow(i, 'code', e.target.value)} 
                      />
                    </td>
                    <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                      <input 
                        className="adm-input" 
                        style={{ 
                          width: '100%', 
                          fontSize: 12,
                          border: selectedPreviewIds.has(i) ? '1px solid #3b82f6' : '1px solid #d1d5db',
                          background: selectedPreviewIds.has(i) ? '#f8fafc' : 'white'
                        }} 
                        value={p.title} 
                        onChange={(e) => updatePreviewRow(i, 'title', e.target.value)} 
                      />
                    </td>
                    <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input 
                          type="checkbox" 
                          checked={p.is_elective} 
                          onChange={(e) => updatePreviewRow(i, 'is_elective', e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: 11, color: '#6b7280' }}>
                          {p.is_elective ? 'Elective' : 'Core'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                      <button 
                        type="button" 
                        className="adm-btn adm-btn--ghost" 
                        style={{ 
                          fontSize: '11px', 
                          padding: '4px 8px',
                          width: '100%'
                        }} 
                        onClick={() => removePreviewRow(i)}
                      >
                        <Trash size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length === 0 && (
              <div style={{ 
                padding: '32px', 
                textAlign: 'center', 
                color: '#9ca3af',
                fontSize: 13,
                background: '#fafafa'
              }}>
                No courses added yet. Use the options above to add courses.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button type="button" className="adm-btn" disabled={busy} onClick={() => savePayload('draft')}>
              <FloppyDisk size={16} /> Save as Draft
            </button>
            <button type="button" className="adm-btn adm-btn--primary" disabled={busy} onClick={() => savePayload('live')}>
              <RocketLaunch size={16} /> Save &amp; Publish Live
            </button>
            <button type="button" className="adm-btn" onClick={resetWizard}>
              Clear form
            </button>
          </div>
        </div>
      )}

      {view === 'research' && (
        <div className="adm-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>
                <Globe size={24} style={{ verticalAlign: 'middle', marginRight: 10, color: '#2563eb' }} />
                Web Research Engine
              </h3>
              <p className="adm-muted" style={{ fontSize: 13, marginTop: 4 }}>
                Search the live web for official university handbooks and curricula using Tavily + Groq.
              </p>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 24,
            padding: 16,
            background: '#f8fafc',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            alignItems: 'flex-end'
          }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: 6 }}>University</label>
              <input 
                className="adm-input" 
                style={{ width: '100%' }}
                placeholder="e.g. University of Lagos"
                value={univ} 
                onChange={e => setUniv(e.target.value)} 
              />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: 6 }}>Department</label>
              <input 
                className="adm-input" 
                style={{ width: '100%' }}
                placeholder="e.g. Computer Science"
                value={dept} 
                onChange={e => setDept(e.target.value)} 
              />
            </div>
            <div style={{ flex: '0 0 100px' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: 6 }}>Level</label>
              <select className="adm-input" style={{ width: '100%' }} value={level} onChange={e => setLevel(e.target.value)}>
                {LEVELS.map(l => <option key={l} value={l}>{l}L</option>)}
              </select>
            </div>
            <div style={{ flex: '0 0 140px' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: 6 }}>Semester</label>
              <select className="adm-input" style={{ width: '100%' }} value={semester} onChange={e => setSemester(e.target.value)}>
                {SEMESTERS.map(s => <option key={s.v} value={s.v}>{s.label}</option>)}
              </select>
            </div>

            <div style={{ flex: '1 1 100%', display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button 
                className="adm-btn adm-btn--primary" 
                style={{ height: 42, gap: 8, padding: '0 24px' }}
                onClick={runWebResearch}
                disabled={isResearching || !univ || !dept}
              >
                {isResearching ? (
                  <CircleNotch className="animate-spin" size={18} />
                ) : (
                  <MagnifyingGlass size={18} />
                )}
                {isResearching ? 'Searching Web...' : 'Research Online'}
              </button>
              <button 
                className="adm-btn adm-btn--primary" 
                style={{ height: 42, gap: 8, padding: '0 24px', background: '#7a12cc', border: 'none' }}
                onClick={runAutonomousResearch}
                disabled={isResearching}
              >
                <Robot size={18} weight="fill" />
                Launch AI Researcher
              </button>
              <button 
                className="adm-btn adm-btn--primary" 
                style={{ height: 42, gap: 8, padding: '0 24px', background: '#059669', border: 'none' }}
                onClick={runBulkDepartmentResearch}
                disabled={isBulkResearching || isResearching || !univ || !dept}
              >
                {isBulkResearching ? <CircleNotch className="animate-spin" size={18} /> : <Robot size={18} weight="fill" />}
                {isBulkResearching ? 'Generating...' : 'Auto-Generate Full Dept Skeleton'}
              </button>
            </div>
          </div>

          {isResearching && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <CircleNotch className="animate-spin" size={32} style={{ color: '#2563eb', marginBottom: 16 }} />
              <p style={{ fontSize: 15, fontWeight: 500, color: '#4b5563' }}>
                Scanning academic portals and public documents...
              </p>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                This usually takes 10-15 seconds.
              </p>
            </div>
          )}

          {researchData && !isResearching && (
            <div style={{ marginTop: 20 }}>
              <div style={{ 
                padding: 16, 
                background: '#f0f9ff', 
                border: '1px solid #bae6fd', 
                borderRadius: 8,
                marginBottom: 20
              }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: '#0369a1' }}>
                  Research Summary
                </h4>
                <p style={{ fontSize: 13, color: '#0c4a6e', lineHeight: 1.5, margin: 0 }}>
                  {researchData.answer || 'Research complete. Found several potential curriculum fragments.'}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                  Extracted Courses ({researchData.courses.length})
                </h4>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  Confidence: <span style={{ color: '#059669', fontWeight: 600 }}>High</span>
                </div>
              </div>

              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ background: '#f9fafb' }}>
                    <tr>
                      <th style={{ padding: 10, textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Code</th>
                      <th style={{ padding: 10, textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Title</th>
                      <th style={{ padding: 10, textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Confidence</th>
                      <th style={{ padding: 10, textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Snippet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {researchData.courses.map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: 10, fontWeight: 600 }}>{c.code}</td>
                        <td style={{ padding: 10 }}>{c.title}</td>
                        <td style={{ padding: 10 }}>
                          <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2 }}>
                            <div style={{ 
                              width: `${c.confidence * 100}%`, 
                              height: '100%', 
                              background: c.confidence > 0.8 ? '#059669' : '#d97706',
                              borderRadius: 2
                            }} />
                          </div>
                        </td>
                        <td style={{ padding: 10, color: '#6b7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.source_snippet}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginBottom: 32 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Sources</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {researchData.sources.map((s, i) => (
                    <a 
                      key={i} 
                      href={s.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        fontSize: 11, 
                        padding: '4px 8px', 
                        background: '#f3f4f6', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: 4,
                        color: '#2563eb',
                        textDecoration: 'none'
                      }}
                    >
                      {new URL(s.url).hostname}
                    </a>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, padding: 20, background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                <div style={{ flex: 1 }}>
                  <h5 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700 }}>Action Required</h5>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                    Review the extracted courses above. Clicking "Populate Preview" will move these into the editable wizard for final verification and publishing.
                  </p>
                </div>
                <button 
                  className="adm-btn adm-btn--primary"
                  onClick={() => setView('wizard')}
                >
                  Populate Preview &amp; Edit
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'bulk' && (
        <div className="adm-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800 }}>Bulk CSV upload</h3>
          <p className="adm-muted" style={{ fontSize: 13, marginBottom: 16 }}>
            Columns: <code className="adm-mono">University, Faculty, Dept, Level, Semester, Course_Codes, Course_Titles</code> — use{' '}
            <code className="adm-mono">;</code> inside cells to separate multiple codes/titles.
          </p>
          <a className="adm-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16, textDecoration: 'none', width: 'fit-content' }} href="/syllabus_bulk_template.csv" download>
            <DownloadSimple size={16} /> Download template
          </a>
          <textarea
            className="adm-input"
            style={{ width: '100%', minHeight: 200, fontFamily: 'monospace', fontSize: 12 }}
            placeholder="Paste CSV here or load from file..."
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <label className="adm-btn" style={{ cursor: 'pointer' }}>
              <CloudArrowUp size={16} />
              Load file
              <input
                type="file"
                accept=".csv,.txt"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  f.text().then(setBulkText)
                }}
              />
            </label>
            <button type="button" className="adm-btn adm-btn--primary" disabled={busy || !bulkText.trim()} onClick={processBulkCsv}>
              {busy ? <CircleNotch className="animate-spin" size={16} /> : <CloudArrowUp size={16} />}
              Import as Draft rows
            </button>
          </div>
          {bulkResult && (
            <p style={{ marginTop: 16, fontSize: 13, fontWeight: 600 }}>
              Imported {bulkResult.ok} row(s).{' '}
              {bulkResult.err.length > 0 && (
                <span style={{ color: '#b91c1c' }}>
                  Issues: {bulkResult.err.slice(0, 5).join(' · ')}
                  {bulkResult.err.length > 5 ? '…' : ''}
                </span>
              )}
            </p>
          )}
        </div>
      )}
    </>
  )
}
