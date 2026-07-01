const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/DashboardHome.jsx', 'utf8');

const matchStr = `              {/* Text */}
              <span style={{ fontSize: '15px', color: '#475569', margin: 0, fontWeight: 500 }}>
                Solve <strong style={{ color: '#000', fontWeight: 800 }}>2</strong> more problems to start a streak.
              </span>

              {/* Days */}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '8px' }}>
                {[
                  { label: 'T', active: true },
                  { label: 'W', active: false },
                  { label: 'Th', active: false },
                  { label: 'F', active: false },
                  { label: 'S', active: false },
                ].map((d, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: d.active ? '#FF90E0' : 'transparent',
                      color: d.active ? '#fff' : 'transparent',
                      border: d.active ? 'none' : '1.5px solid #E2E8F0'
                    }}>
                      {d.active && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: d.active ? 800 : 600, color: d.active ? '#000' : '#94A3B8' }}>{d.label}</span>
                  </div>
                ))}
              </div>

              {/* Max Streak / Lessons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginTop: '16px' }}>
                <div style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#000' }}>183</span>
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>Max streak</span>
                </div>
                <div style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#000' }}>183</span>
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>Lessons complete</span>
                </div>
              </div>`;

const newStr = `              {/* Level Progress */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700 }}>
                  <span style={{ color: '#1E293B' }}>Level {level}</span>
                  <span style={{ color: '#F7C325' }}>{(xp % 500)} / 500 XP</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: '#F1F5F9', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: \`\${((xp % 500) / 500) * 100}%\`, height: '100%', background: 'linear-gradient(90deg, #F9D25C, #FF90E0)' }} />
                </div>
              </div>

              {/* Text */}
              <span style={{ fontSize: '15px', color: '#475569', margin: 0, fontWeight: 500, textAlign: 'center', marginTop: '12px' }}>
                Earn <strong style={{ color: '#000', fontWeight: 800 }}>{500 - (xp % 500)}</strong> more XP to reach Level {level + 1}!
              </span>
              
              <Link to="/explore" style={{
                width: '100%',
                padding: '16px 24px',
                borderRadius: '16px',
                background: 'linear-gradient(86deg, #7491FF -7.44%, #FF90E0 44.8%, #F7C325 102.54%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'center',
                textDecoration: 'none',
                display: 'block',
                marginTop: '8px',
                boxShadow: '0 4px 15px rgba(255, 144, 224, 0.4)'
              }}>
                Earn more XP
              </Link>`;

if (code.includes(matchStr)) {
  code = code.replace(matchStr, newStr);
  fs.writeFileSync('src/components/dashboard/DashboardHome.jsx', code);
  console.log('XP popover updated');
} else {
  // try replacing with regex ignoring whitespace
  const strippedMatch = matchStr.replace(/\s+/g, '');
  const strippedCode = code.replace(/\s+/g, '');
  if (strippedCode.includes(strippedMatch)) {
     console.log('Found match with whitespace stripped. Will do manual replace.');
     const index = code.indexOf('{/* Text */}');
     const endIndex = code.indexOf('</div>\n            </div>\n          )}\n        </div>\n      </div>\n\n      {/* Right Column / Content */}') - 1;
     // Fallback to simpler replacement
  }
  console.log('Match string not found verbatim. Probably line endings.');
}
