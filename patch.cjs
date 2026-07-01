const fs = require('fs');

const compPage = fs.readFileSync('src/pages/ComponentPage.jsx', 'utf8');

const checkIconStart = compPage.indexOf('const CheckIcon = () => (');
const checkIconEnd = compPage.indexOf('  const benefits = [');
const iconsCode = compPage.substring(checkIconStart, checkIconEnd);

const styleStart = compPage.indexOf('<style>{`');
const styleEnd = compPage.indexOf('`}</style>') + 10;
const styleCode = compPage.substring(styleStart, styleEnd);

const headerRowStart = compPage.indexOf('{/* Go Premium Button */}');
const headerRowEnd = compPage.indexOf('Standalone Button3D Component');
// find the div end right before Standalone Button3D Component
const actualEnd = compPage.lastIndexOf('</div>', headerRowEnd);
let headerButtons = compPage.substring(headerRowStart, actualEnd);

// Replace static "0" with dynamic XP
headerButtons = headerButtons.replace(
  /<span style={{ fontSize: '16px', fontWeight: 800, color: '#000' }}>0<\/span>/g,
  '<span style={{ fontSize: \'16px\', fontWeight: 800, color: \'#000\' }}>{xp}</span>'
);

// Replace static "0" in dropdown
headerButtons = headerButtons.replace(
  /<span style={{ fontSize: '32px', fontWeight: 800, color: '#000', lineHeight: 1 }}>0<\/span>/g,
  '<span style={{ fontSize: \'32px\', fontWeight: 800, color: \'#000\', lineHeight: 1 }}>{xp}</span>'
);

// Replace static "2" with dynamic credits
headerButtons = headerButtons.replace(
  /<span style={{ fontSize: '16px', fontWeight: 800, color: '#000' }}>2<\/span>/g,
  '<span style={{ fontSize: \'16px\', fontWeight: 800, color: \'#000\' }}>{credits >= 1000 ? Math.floor(credits/1000)+\'k\' : credits}</span>'
);

// Replace static "2" in dropdown
headerButtons = headerButtons.replace(
  /<span style={{ fontSize: '36px', fontWeight: 800, color: '#000', lineHeight: 1 }}>2<\/span>/g,
  '<span style={{ fontSize: \'36px\', fontWeight: 800, color: \'#000\', lineHeight: 1 }}>{credits >= 1000 ? Math.floor(credits/1000)+\'k\' : credits}</span>'
);


const premiumOverlayStart = compPage.indexOf('{/* Premium Overlay */}');
const premiumOverlayEnd = compPage.indexOf('{/* Subscription Plans Overlay */}');
const premiumOverlay = compPage.substring(premiumOverlayStart, premiumOverlayEnd);

const plansOverlayStart = compPage.indexOf('{/* Subscription Plans Overlay */}');
const plansOverlayEnd = compPage.lastIndexOf(')}', compPage.lastIndexOf('</div>'));
const plansOverlay = compPage.substring(plansOverlayStart, plansOverlayEnd);

let dashHome = fs.readFileSync('src/components/dashboard/DashboardHome.jsx', 'utf8');

const stateCode = `  const [isXpOpen, setIsXpOpen] = useState(false);
  const [isKeysOpen, setIsKeysOpen] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [isPlansOpen, setIsPlansOpen] = useState(false);`;

dashHome = dashHome.replace(
  'const [creditsBalance, setCreditsBalance] = useState(Infinity)',
  'const [creditsBalance, setCreditsBalance] = useState(Infinity)\n' + stateCode + '\n' + iconsCode
);

dashHome = dashHome.replace('<header className="dhd-header">', styleCode + '\n        <header className="dhd-header" style={{ padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>');

const dashHeaderStart = dashHome.indexOf('<div className="dhd-header-right">');
const dashHeaderEnd = dashHome.indexOf('</header>', dashHeaderStart);

const originalDashHeaderRight = dashHome.substring(dashHeaderStart, dashHeaderEnd);

const notifIcon = `
          {/* Notifications & Theme */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="dhd-icon-btn" 
              onClick={() => setNotificationsOpen?.(true)}
              title="Notifications"
            >
              <Bell size={20} weight="regular" />
              <span className="dhd-notif-dot" />
            </button>
  
            <button 
              className="dhd-icon-btn" 
              onClick={() => setIsDark(!isDark)}
              title="Toggle Dark Mode"
            >
              {isDark ? <Sun size={20} weight="regular" /> : <Moon size={20} weight="regular" />}
            </button>
          </div>
`;

dashHome = dashHome.replace(originalDashHeaderRight, '<div className="dhd-header-right" style={{gap: "12px", display: "flex", alignItems: "center"}}>\n' + headerButtons + notifIcon + '\n          </div>\n        ');

dashHome = dashHome.replace('      </div>\n    )\n  }', premiumOverlay + '\n' + plansOverlay + '\n      </div>\n    )\n  }');

fs.writeFileSync('src/components/dashboard/DashboardHome.jsx', dashHome);
console.log('Patched DashboardHome.jsx safely');
