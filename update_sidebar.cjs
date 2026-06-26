const fs = require('fs');

const sidebarCode = `import React from 'react';
import { House, CalendarBlank, Chalkboard, ClipboardText, GearSix } from '@phosphor-icons/react';

export default function ClassroomSidebar({ collapsed, activeNav, setActiveNav }) {
  const handleNavClick = (nav) => {
    if (setActiveNav) {
      setActiveNav(nav);
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: <House size={24} weight={activeNav === 'home' ? 'fill' : 'regular'} /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarBlank size={24} weight={activeNav === 'calendar' ? 'fill' : 'regular'} /> },
    { divider: true, id: 'd1' },
    { id: 'teaching', label: 'Teaching', icon: <Chalkboard size={24} weight={activeNav === 'teaching' ? 'fill' : 'regular'} /> },
    { id: 'review', label: 'To review', icon: <ClipboardText size={24} weight={activeNav === 'review' ? 'fill' : 'regular'} /> },
    { divider: true, id: 'd2' },
    { id: 'settings', label: 'Settings', icon: <GearSix size={24} weight={activeNav === 'settings' ? 'fill' : 'regular'} /> },
  ];

  return (
    <aside className={\`cls-sidebar \${collapsed ? 'collapsed' : ''}\`}>
      <nav className="cls-sidebar-nav">
        {navItems.map(item => {
          if (item.divider) {
            return <div key={item.id} style={{ height: '1px', background: '#E5E7EB', margin: '8px 0' }} />;
          }
          const isActive = activeNav === item.id || (item.id === 'home' && activeNav === 'stream');
          return (
            <div 
              key={item.id}
              className={\`cls-nav-item \${isActive ? 'active' : ''}\`}
              onClick={() => handleNavClick(item.id)}
              title={collapsed ? item.label : ''}
            >
              <div className="cls-nav-icon">
                {item.icon}
              </div>
              {!collapsed && <span style={{ marginLeft: '12px' }}>{item.label}</span>}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
`;

fs.writeFileSync('c:/Softwares/Luter/src/classroom/ClassroomSidebar.jsx', sidebarCode, 'utf8');
