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
  CreditCard,
  ChartBar,
  Robot,
  MonitorPlay,
  Factory,
  ChartLineUp,
  Wrench,
} from '@phosphor-icons/react'
import LuterLogo from '../components/shared/LuterLogo'
import { DASHBOARD_URL } from '../utils/urlUtils'

const NAV = [
  { to: '/admin', end: true, icon: House, label: 'Overview' },
  { to: '/admin/notes-manager', icon: Brain, label: 'Notes Manager' },
  { to: '/admin/upload', icon: CloudArrowUp, label: 'Upload Content' },
  { to: '/admin/users', icon: UsersThree, label: 'Users' },
  { to: '/admin/requests', icon: ChatCircleDots, label: 'Study Requests' },
  { to: '/admin/courses', icon: Books, label: 'Courses' },
  { to: '/admin/syllabus', icon: GraduationCap, label: 'Syllabus manager' },
  { to: '/admin/audit', icon: ChartBar, label: 'Health Audit' },
  { to: '/admin/analytics', icon: ChartLineUp, label: 'Analytics & APIs' },
  { to: '/admin/enrollments', icon: UserList, label: 'Enrollments' },
  { to: '/admin/matches', icon: GameController, label: 'Matches' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { to: '/admin/activity', icon: Pulse, label: 'Live activity' },
  { to: '/admin/system', icon: Cpu, label: 'System' },
  { to: '/admin/payment-settings', icon: CreditCard, label: 'Payment Settings' },
  { to: '/admin/settings', icon: GearSix, label: 'Admin settings' },
]

const AGENT_NAV = [
  { to: '/admin/agents',         icon: Robot,       label: 'Agent Directory' },
  { to: '/admin/agents/monitor', icon: MonitorPlay,  label: 'Control Room' },
  { to: '/admin/agents/factory', icon: Factory,      label: 'Agent Factory' },
  { to: '/admin/controls',       icon: Wrench,       label: 'System Controls' },
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

        {/* Agent System section */}
        <div style={{ margin: '12px 0 4px', padding: '0 12px', fontSize: 9, fontWeight: 900, color: '#7a12cc', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          🤖 Agent System
        </div>
        {AGENT_NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
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
          href={`${DASHBOARD_URL}/dashboard`}
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
