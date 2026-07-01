const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/DashboardHome.jsx', 'utf8');

const matchStr = `  const profile = bundle?.profile?.data || bundle?.profile
  const username = profile?.username
  const displayName = username || profile?.full_name?.split(' ')[0] || 'Scholar'
  const credits = typeof creditsBalance === 'number' ? creditsBalance : profile?.credits ?? 20000
  const isFree = (profile?.subscription_tier || profile?.subscription_type || 'free').toLowerCase() === 'free'
  
  const stats = bundle?.stats?.data || {}
  const xp = stats?.total_xp ?? 0
  const level = Math.floor(xp / 500) + 1`;

const newStr = `  const [offlineXP, setOfflineXP] = useState(() => parseInt(localStorage.getItem('luter_offline_xp') || '0', 10));
  const [offlineCredits, setOfflineCredits] = useState(() => parseInt(localStorage.getItem('luter_offline_credits') || '0', 10));

  useEffect(() => {
    const s = bundle?.stats?.data || bundle?.stats;
    if (s && typeof s.total_xp === 'number') {
      localStorage.setItem('luter_offline_xp', s.total_xp.toString());
      setOfflineXP(s.total_xp);
    }
  }, [bundle?.stats]);

  useEffect(() => {
    const p = bundle?.profile?.data || bundle?.profile;
    if (p && typeof p.credits === 'number') {
      localStorage.setItem('luter_offline_credits', p.credits.toString());
      setOfflineCredits(p.credits);
    }
  }, [bundle?.profile]);

  const profile = bundle?.profile?.data || bundle?.profile;
  const username = profile?.username;
  const displayName = username || profile?.full_name?.split(' ')[0] || 'Scholar';
  
  const hasProfileCredits = profile && typeof profile.credits === 'number';
  const credits = typeof creditsBalance === 'number' 
     ? creditsBalance 
     : (hasProfileCredits ? profile.credits : (offlineCredits || 20000));

  const isFree = (profile?.subscription_tier || profile?.subscription_type || 'free').toLowerCase() === 'free';
  
  const stats = bundle?.stats?.data || bundle?.stats || {};
  const hasStatsXP = typeof stats.total_xp === 'number';
  const xp = hasStatsXP ? stats.total_xp : offlineXP;
  const level = Math.floor(xp / 500) + 1;`;

const strippedMatch = matchStr.replace(/\s+/g, '');
const strippedCode = code.replace(/\s+/g, '');

if (strippedCode.includes(strippedMatch)) {
  const startTarget = "const profile = bundle?.profile?.data || bundle?.profile";
  const endTarget = "const level = Math.floor(xp / 500) + 1";
  
  // Find the LAST occurrence of startTarget, because ExploreLuter has a similar one
  const startIndex = code.lastIndexOf(startTarget);
  const endIndex = code.indexOf(endTarget, startIndex) + endTarget.length;
  
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const before = code.substring(0, startIndex);
    const after = code.substring(endIndex);
    code = before + newStr + after;
    fs.writeFileSync('src/components/dashboard/DashboardHome.jsx', code);
    console.log('Successfully updated offline XP/Credits logic.');
  } else {
    console.log('Could not find start/end exact match in code.');
  }
} else {
  console.log('Could not find match in stripped code.');
}
