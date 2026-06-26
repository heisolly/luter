import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { House, CalendarBlank, Chalkboard, ClipboardText, GearSix, CaretDown, CaretUp } from '@phosphor-icons/react';

export default function ClassroomSidebar({ collapsed, activeNav, setActiveNav, rooms = [] }) {
  const [teachingExpanded, setTeachingExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const isEffectivelyCollapsed = collapsed && !isHovered;

  const location = useLocation();
  const isClassRoute = location.pathname.startsWith('/classrooms/c/');

  const handleNavClick = (item) => {
    if (item.id === 'teaching') {
      setTeachingExpanded(!teachingExpanded);
      return;
    }
    if (isClassRoute && ['home', 'calendar', 'review', 'settings'].includes(item.id)) {
      navigate('/classrooms', { state: { nav: item.id } });
    } else {
      if (setActiveNav) {
        setActiveNav(item.id);
      }
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: <House size={24} weight={activeNav === 'home' ? 'fill' : 'regular'} /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarBlank size={24} weight={activeNav === 'calendar' ? 'fill' : 'regular'} /> },
    { divider: true, id: 'd1' },
    { id: 'teaching', label: 'Teaching', isHeader: true, icon: <Chalkboard size={24} weight={teachingExpanded ? 'fill' : 'regular'} /> },
    ...(teachingExpanded ? [
      { id: 'review', label: 'To review', icon: <ClipboardText size={24} weight={activeNav === 'review' ? 'fill' : 'regular'} /> },
      ...rooms.map((room) => ({
        id: `room-${room.id}`,
        label: room.session_name,
        isRoom: true,
        roomId: room.id,
        icon: (
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#15803d', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600 }}>
            {room.session_name?.charAt(0)?.toUpperCase() || 'C'}
          </div>
        )
      }))
    ] : []),
    { divider: true, id: 'd2' },
    { id: 'settings', label: 'Settings', icon: <GearSix size={24} weight={activeNav === 'settings' ? 'fill' : 'regular'} /> },
  ];

  return (
    <aside 
      className={`cls-sidebar ${collapsed ? 'collapsed' : ''} ${collapsed && isHovered ? 'hover-expanded' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <nav className="cls-sidebar-nav">
        {navItems.map(item => {
          if (item.divider) {
            return <div key={item.id} style={{ height: '1px', background: '#E5E7EB', margin: '8px 0' }} />;
          }
          const isActive = activeNav === item.id || (item.id === 'home' && activeNav === 'stream');
          return (
            <div 
              key={item.id}
              className={`cls-nav-item ${isActive && !item.isHeader ? 'active' : ''}`}
              onClick={() => {
                if (item.isRoom) {
                  navigate(`/classrooms/c/${item.roomId}`);
                } else {
                  handleNavClick(item);
                }
              }}
              title={isEffectivelyCollapsed ? item.label : ''}
              style={item.isHeader ? { background: 'transparent', cursor: 'pointer' } : {}}
            >
              <div className="cls-nav-icon">
                {item.icon}
              </div>
              {!isEffectivelyCollapsed && (
                <span style={{ marginLeft: '12px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </span>
              )}
              {!isEffectivelyCollapsed && item.isHeader && (
                <div style={{ marginRight: '16px', display: 'flex', alignItems: 'center', color: '#5f6368' }}>
                  {teachingExpanded ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
