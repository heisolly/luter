import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabaseClient'
import {
  Loader2,
  Table2,
  Wand2,
  Upload,
  Download,
  Sparkles,
  Save,
  Rocket,
  Pencil,
  Trash2,
  RefreshCw,
  Globe,
  FileSpreadsheet,
} from 'lucide-react'
import {
  buildSyllabusId,
  departmentSlugFromLabel,
  normalizeCourseCode,
  universitySlugFromName,
} from '../../lib/curriculumSlugs'
import { parseSyllabusPasteWithGroq, suggestSyllabusFromAiQuery } from '../../groqClient'

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

  const [bulkText, setBulkText] = useState('')
  const [bulkResult, setBulkResult] = useState(null)

  const syllabusIdPreview = useMemo(() => {
    const us = universitySlugFromName(univ)
    const ds = departmentSlugFromLabel(dept)
    return buildSyllabusId(us, ds, level, semester)
  }, [univ, dept, level, semester])

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: e } = await supabase
      .from('curriculum_offers')
      .select('*')
      .order('updated_at', { ascending: false })
    if (e) setError(e.message)
    setRows(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUserId(session?.user?.id ?? null))
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

  const runPasteParser = async () => {
    setBusy(true)
    setError(null)
    const list = await parseSyllabusPasteWithGroq(paste)
    if (!list.length) setError('Parser returned no courses. Check Groq API key or paste content.')
    setPreview(list.map((c) => ({ code: c.code, title: c.title, is_elective: c.is_elective })))
    setBusy(false)
  }

  const runAiAssist = async () => {
    setBusy(true)
    setError(null)
    const list = await suggestSyllabusFromAiQuery(aiQuery)
    if (!list.length) setError('Assistant returned no rows. Try a clearer query and ensure VITE_GROQ_API_KEY is set.')
    else {
      setPreview(list.map((c) => ({ code: c.code, title: c.title, is_elective: c.is_elective })))
      setError(null)
    }
    setBusy(false)
  }

  const savePayload = async (status) => {
    if (!preview.length) {
      setError('Add at least one course.')
      return
    }
    const university_slug = universitySlugFromName(univ)
    const department_slug = departmentSlugFromLabel(dept)
    const syllabus_id = buildSyllabusId(university_slug, department_slug, level, semester)
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
    const { error: e } = await supabase.from('curriculum_offers').upsert(base, {
      onConflict: 'university_slug,department_slug,level,semester',
    })
    if (e) setError(e.message)
    else {
      resetWizard()
      setView('table')
      await reload()
    }
    setBusy(false)
  }

  const publishRow = async (id) => {
    if (!userId) return
    setBusy(true)
    const { error: e } = await supabase
      .from('curriculum_offers')
      .update({
        status: 'live',
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (e) setError(e.message)
    else await reload()
    setBusy(false)
  }

  const deleteRow = async (id, st) => {
    if (st === 'live' && !window.confirm('This syllabus is Live for students. Delete anyway?')) return
    if (st === 'draft' && !window.confirm('Delete this draft?')) return
    setBusy(true)
    const { error: e } = await supabase.from('curriculum_offers').delete().eq('id', id)
    if (e) setError(e.message)
    else await reload()
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

  return (
    <>
      <h1 className="adm-page-title">Syllabus Manager</h1>
      <p className="adm-page-desc">
        Curate <strong>curriculum_offers</strong>: Draft → review → Live. Students only consume{' '}
        <span className="adm-mono">status = live</span> during onboarding.
      </p>

      {error && (
        <div className="adm-error-banner" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="adm-card" style={{ padding: 12, marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {[
          { id: 'table', label: 'Data table', icon: Table2 },
          { id: 'wizard', label: 'Creation wizard', icon: Wand2 },
          { id: 'bulk', label: 'Bulk CSV', icon: FileSpreadsheet },
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
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {view === 'table' && (
        <div className="adm-card" style={{ padding: 0, overflow: 'auto' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <Loader2 className="animate-spin" style={{ display: 'inline-block' }} />
            </div>
          ) : (
            <table className="adm-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#fafafa', textAlign: 'left' }}>
                  <th style={{ padding: 12 }}>Syllabus ID</th>
                  <th style={{ padding: 12 }}>University</th>
                  <th style={{ padding: 12 }}>Faculty</th>
                  <th style={{ padding: 12 }}>Department</th>
                  <th style={{ padding: 12 }}>Lv / Sem</th>
                  <th style={{ padding: 12 }}>Status</th>
                  <th style={{ padding: 12 }}>#</th>
                  <th style={{ padding: 12 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: 12, fontFamily: 'monospace', fontSize: 11 }}>{r.syllabus_id}</td>
                    <td style={{ padding: 12 }}>{r.university_name}</td>
                    <td style={{ padding: 12 }}>{r.faculty}</td>
                    <td style={{ padding: 12 }}>{r.department_label}</td>
                    <td style={{ padding: 12 }}>
                      {r.level} / {r.semester}
                    </td>
                    <td style={{ padding: 12 }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontWeight: 800,
                          fontSize: 11,
                          background: r.status === 'live' ? '#faf5ff' : '#fef3c7',
                          color: r.status === 'live' ? '#7a12cc' : '#92400e',
                        }}
                      >
                        {r.status === 'live' ? 'Live' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>{Array.isArray(r.courses) ? r.courses.length : 0}</td>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {r.status === 'draft' && (
                          <button
                            type="button"
                            className="adm-btn adm-btn--primary"
                            style={{ padding: '6px 10px', fontSize: 12 }}
                            disabled={busy}
                            onClick={() => publishRow(r.id)}
                          >
                            <Rocket size={14} /> Publish
                          </button>
                        )}
                        <button
                          type="button"
                          className="adm-btn"
                          style={{ padding: '6px 10px', fontSize: 12 }}
                          disabled={busy}
                          onClick={() => loadRowIntoWizard(r)}
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          className="adm-btn"
                          style={{ padding: '6px 10px', fontSize: 12, color: '#b91c1c' }}
                          disabled={busy}
                          onClick={() => deleteRow(r.id, r.status)}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                {busy ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
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
                {busy ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                Process with AI
              </button>
            </div>
          </div>

          <h4 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 10px' }}>Preview ({preview.length})</h4>
          <div style={{ overflow: 'auto', border: '1px solid #e4e4e7', borderRadius: 10, marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  <th style={{ textAlign: 'left', padding: 10 }}>Code</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Title</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Elective</th>
                  <th style={{ padding: 10 }} />
                </tr>
              </thead>
              <tbody>
                {preview.map((p, i) => (
                  <tr key={`${p.code}-${i}`} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: 8 }}>
                      <input className="adm-input" style={{ width: 100 }} value={p.code} onChange={(e) => updatePreviewRow(i, 'code', e.target.value)} />
                    </td>
                    <td style={{ padding: 8 }}>
                      <input className="adm-input" style={{ width: '100%', minWidth: 200 }} value={p.title} onChange={(e) => updatePreviewRow(i, 'title', e.target.value)} />
                    </td>
                    <td style={{ padding: 8 }}>
                      <input type="checkbox" checked={p.is_elective} onChange={(e) => updatePreviewRow(i, 'is_elective', e.target.checked)} />
                    </td>
                    <td style={{ padding: 8 }}>
                      <button type="button" className="adm-btn" style={{ padding: '4px 8px' }} onClick={() => removePreviewRow(i)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button type="button" className="adm-btn" disabled={busy} onClick={() => savePayload('draft')}>
              <Save size={16} /> Save as Draft
            </button>
            <button type="button" className="adm-btn adm-btn--primary" disabled={busy} onClick={() => savePayload('live')}>
              <Rocket size={16} /> Save &amp; Publish Live
            </button>
            <button type="button" className="adm-btn" onClick={resetWizard}>
              Clear form
            </button>
          </div>
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
            <Download size={16} /> Download template
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
              <Upload size={16} />
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
              {busy ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
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
