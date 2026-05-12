import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../supabaseClient'
import { 
  ChartBar, 
  CircleNotch, 
  ArrowsClockwise, 
  TrendUp, 
  WarningCircle, 
  CheckCircle,
  GraduationCap
} from '@phosphor-icons/react'

export default function AdminAudit() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: e } = await supabase
        .from('curriculum_offers')
        .select('university_name, department_label, level, semester, status')
      
      if (e) throw e
      setRows(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const stats = useMemo(() => {
    const unis = {}
    rows.forEach(r => {
      if (!unis[r.university_name]) {
        unis[r.university_name] = {
          name: r.university_name,
          depts: {},
          totalEntries: 0,
          liveCount: 0
        }
      }
      
      unis[r.university_name].totalEntries++
      if (r.status === 'live') unis[r.university_name].liveCount++
      
      if (!unis[r.university_name].depts[r.department_label]) {
        unis[r.university_name].depts[r.department_label] = new Set()
      }
      unis[r.university_name].depts[r.department_label].add(`${r.level}-${r.semester}`)
    })

    return Object.values(unis).map(u => ({
      ...u,
      deptCount: Object.keys(u.depts).length,
      // Assume a complete programme is 10 semesters (5 years)
      // This is a rough heuristic
      avgCoverage: (u.totalEntries / (Object.keys(u.depts).length * 10)) * 100
    })).sort((a, b) => b.totalEntries - a.totalEntries)
  }, [rows])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <CircleNotch className="animate-spin" size={32} color="#7a12cc" />
      </div>
    )
  }

  return (
    <>
      <h1 className="adm-page-title">Syllabus Health Audit</h1>
      <p className="adm-page-desc">
        Tracking data coverage and completeness across Nigerian Universities.
      </p>

      {error && <div className="adm-error-banner">{error}</div>}

      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-label">Universities tracked</div>
          <div className="adm-kpi-value">{stats.length}</div>
        </div>
        <div className="adm-kpi-card">
          <div className="adm-kpi-label">Total entry units</div>
          <div className="adm-kpi-value">{rows.length}</div>
        </div>
        <div className="adm-kpi-card">
          <div className="adm-kpi-label">Live coverage</div>
          <div className="adm-kpi-value">
            {Math.round((rows.filter(r => r.status === 'live').length / rows.length) * 100) || 0}%
          </div>
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-toolbar">
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Institutional Coverage</h3>
          <button className="adm-btn adm-btn--ghost" onClick={load}>
            <ArrowsClockwise size={16} /> Refresh Audit
          </button>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>University</th>
                <th>Departments</th>
                <th>Units Filled</th>
                <th>Status Mix</th>
                <th>Estimated Health</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(u => (
                <tr key={u.name}>
                  <td style={{ fontWeight: 700 }}>{u.name}</td>
                  <td>{u.deptCount}</td>
                  <td>{u.totalEntries}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <span className="adm-pill adm-pill--ok" style={{ fontSize: 10 }}>{u.liveCount} Live</span>
                      <span className="adm-pill" style={{ fontSize: 10 }}>{u.totalEntries - u.liveCount} Draft</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${Math.min(100, u.avgCoverage)}%`, 
                          height: '100%', 
                          background: u.avgCoverage > 70 ? '#059669' : u.avgCoverage > 30 ? '#d97706' : '#dc2626' 
                        }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, minWidth: 30 }}>
                        {Math.round(u.avgCoverage)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="adm-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendUp size={20} color="#059669" /> Top Performing
          </h3>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {stats.slice(0, 3).map(u => (
              <li key={u.name} style={{ padding: '12px 0', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</span>
                <span style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>{u.totalEntries} units</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="adm-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <WarningCircle size={20} color="#dc2626" /> Critical Gaps
          </h3>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {stats.filter(u => u.avgCoverage < 20).slice(0, 3).map(u => (
              <li key={u.name} style={{ padding: '12px 0', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</span>
                <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 700 }}>{u.deptCount} depts, low data</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
