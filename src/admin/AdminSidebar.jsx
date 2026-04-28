import { NavLink } from 'react-router-dom'
import {
  House,
  Brain,
  CloudArrowUp,
  UsersThree,
  ChatCircleDots,
  Books,
  GraduationCap,
  UserList,
  GameController,
  Bell,
  Pulse,
  Cpu,
  GearSix,
  ArrowSquareOut,
  ShieldCheck,
} from '@phosphor-icons/react'
import LuterLogo from '../components/shared/LuterLogo'

const NAV = [
  { to: '/admin', end: true, icon: House, label: 'Overview' },
  { to: '/admin/notes-manager', icon: Brain, label: 'Notes Manager' },
  { to: '/admin/upload', icon: CloudArrowUp, label: 'Upload Content' },
  { to: '/admin/users', icon: UsersThree, label: 'Users' },
  { to: '/admin/requests', icon: ChatCircleDots, label: 'Study Requests' },
  { to: '/admin/courses', icon: Books, label: 'Courses' },
  { to: '/admin/syllabus', icon: GraduationCap, label: 'Syllabus manager' },
  { to: '/admin/enrollments', icon: UserList, label: 'Enrollments' },
  { to: '/admin/matches', icon: GameController, label: 'Matches' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { to: '/admin/activity', icon: Pulse, label: 'Live activity' },
  { to: '/admin/system', icon: Cpu, label: 'System' },
  { to: '/admin/settings', icon: GearSix, label: 'Admin settings' },
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
        {NAV.map(({ to, end, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
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
      </nav>

      <div className="adm-sidebar-bottom">
        <a
          href="/dashboard"
          className="adm-nav-item"
          style={{ marginBottom: 8 }}
        >
          <span className="adm-nav-icon">
            <ArrowSquareOut size={18} weight="light" />
          </span>
          Back to app
        </a>
      </div>
    </>
  )
}
