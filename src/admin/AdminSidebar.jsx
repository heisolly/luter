import { NavLink } from 'react-router-dom'
import {
  House,
  UsersThree,
  Books,
  GraduationCap,
  Bell,
  Pulse,
  ChartBar,
  ShieldCheck,
  Coins,
} from '@phosphor-icons/react'
import LuterLogo from '../components/shared/LuterLogo'
import { DASHBOARD_URL, getAdminPath } from '../utils/urlUtils'

const NAV_GROUPS = [
  {
    title: 'Dashboard',
    items: [
      { to: '/', end: true, icon: House, label: 'Overview' },
    ]
  },
  {
    title: 'Management',
    items: [
      { to: '/users', icon: UsersThree, label: 'Users' },
      { to: '/courses', icon: Books, label: 'Courses' },
      { to: '/syllabus', icon: GraduationCap, label: 'Syllabus manager' },
    ]
  },
  {
    title: 'Monitoring & System',
    items: [
      { to: '/config', icon: Coins, label: 'Config & Economics' },
      { to: '/audit', icon: ChartBar, label: 'Health Audit' },
      { to: '/notifications', icon: Bell, label: 'Notifications' },
      { to: '/activity', icon: Pulse, label: 'Live activity' },
    ]
  }
]

export default function AdminSidebar({ onNavigate }) {
  return (
    <>
      <div className="adm-logo-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LuterLogo size={28} fontSize={20} />
        </div>
        <span className="adm-badge">
          <ShieldCheck size={14} weight="fill" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
          Admin
        </span>
      </div>

      <nav className="adm-nav">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div className="adm-nav-group-title">{group.title}</div>
            {group.items.map(({ to, end, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={getAdminPath(to)}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) => `adm-nav-item ${isActive ? 'adm-nav-item--active' : ''}`}
              >
                {({ isActive }) => (
                  <>
                    <span className="adm-nav-icon">
                      <Icon size={20} weight={isActive ? 'fill' : 'light'} />
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </>
  )
}
