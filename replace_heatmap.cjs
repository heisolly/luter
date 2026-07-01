const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/DashboardHome.jsx', 'utf8');

const startStr = 'function StreakHeatmap() {';
const endStr = 'function DailyGoalModal';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  console.log('Could not find start or end index');
  process.exit(1);
}

const replacement = `function StreakHeatmap() {
  const [heatmapData, setHeatmapData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setLoading(false)
      return () => { mounted = false }
    }

    supabase.rpc('get_user_heatmap_data')
      .then(({ data, error }) => {
        if (!mounted) return
        if (!error && data) setHeatmapData(data)
        setLoading(false)
      })

    return () => { mounted = false }
  }, [])

  // Calculate current streak
  const sortedGoalDates = heatmapData
    .filter(r => r.goal_met)
    .map(r => r.study_date)
    .sort()
    .reverse()

  let currentStreak = 0
  const checkDate = new Date()
  for (const dateStr of sortedGoalDates) {
    const d = new Date(dateStr)
    const diffDays = Math.round((checkDate - d) / (1000 * 60 * 60 * 24))
    if (diffDays <= 1) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else break
  }

  // Get current week days (Sun - Sat)
  const today = new Date()
  const currentDayOfWeek = today.getDay() // 0 = Sun, 6 = Sat
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - currentDayOfWeek)
  
  const days = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S']
  const weekDates = days.map((label, idx) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + idx)
    return {
      label,
      date: d,
      dateStr: \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2,'0')}-\${String(d.getDate()).padStart(2,'0')}\`
    }
  })

  const dataMap = {}
  heatmapData.forEach(row => {
    dataMap[row.study_date] = row
  })

  const todayStr = \`\${today.getFullYear()}-\${String(today.getMonth() + 1).padStart(2,'0')}-\${String(today.getDate()).padStart(2,'0')}\`

  return (
    <div className="dhd-heatmap-card" style={{ height: 'auto', minHeight: 'unset' }}>
      {/* Header */}
      <div className="dhd-heatmap-top" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '24px' }}>
        <div className="dhd-heatmap-streak-badge">
          <Fire size={18} weight="fill" className="dhd-streak-fire-icon" />
          <span>{currentStreak}</span>
          <small>day streak</small>
        </div>
      </div>

      {loading ? (
        <div className="dhd-heatmap-loading" style={{ minHeight: '80px' }}>
          <div className="dhd-heatmap-loading-spinner" />
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          {weekDates.map((wd, i) => {
            const row = dataMap[wd.dateStr]
            const isDone = row && (row.goal_met || row.minutes_spent > 0)
            const isToday = wd.dateStr === todayStr
            const isFuture = wd.date > today

            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                  {isDone ? (
                    <path fillRule="evenodd" clipRule="evenodd" d="M10.2903 16.2252L16.5654 8.24794C16.9417 7.76964 17.7079 8.10483 17.612 8.70578L16.7061 14.3834H20.5934C21.3322 14.3834 21.7459 15.2351 21.2891 15.8159L15.014 23.7931C14.6378 24.2714 13.8716 23.9362 13.9674 23.3353L14.8734 17.6577H10.9861C10.2472 17.6577 9.83354 16.8059 10.2903 16.2252Z" fill="#0F172A"></path>
                  ) : null}
                  <rect x="1" y="1" width="30" height="30" rx="15" stroke="#0F172A" strokeOpacity={isDone ? "0.2" : "0.05"} strokeWidth="1.5"></rect>
                </svg>
                <span style={{
                  fontSize: '14px',
                  fontWeight: isToday ? 700 : 400,
                  color: isToday || isDone ? '#0F172A' : '#94A3B8'
                }}>
                  {wd.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

`;

const newCode = code.substring(0, startIndex) + replacement + code.substring(endIndex);
fs.writeFileSync('src/components/dashboard/DashboardHome.jsx', newCode);
console.log('Replaced StreakHeatmap component successfully!');
