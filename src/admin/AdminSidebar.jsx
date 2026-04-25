import { NavLink } from 'react-router-dom'
import {
  RiDashboardFill as LayoutDashboard,
  RiUserFill as Users,
  RiBookOpenFill as BookOpen,
  RiLinkM as Link2,
  RiSwordFill as Sword,
  RiNotificationFill as Bell,
  RiPulseFill as Activity,
  RiServerFill as Server,
  RiSettingsFill as Settings,
  RiExternalLinkLine as ExternalLink,
  RiShieldFill as Shield,
  RiGraduationCapFill as GraduationCap,
  RiUploadCloudFill as UploadCloud,
  RiBrainFill as Brain,
  RiCalendarFill as Calendar,
  RiMessage2Fill as MessageSquare,
  RiMagicFill as Sparkles,
} from 'react-icons/ri'
import LuterLogo from '../components/shared/LuterLogo'

const NAV = [
  { to: '/admin', end: true, icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/notes-manager', icon: Brain, label: 'Notes Manager' },
  { to: '/admin/upload', icon: UploadCloud, label: 'Upload Content' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/requests', icon: MessageSquare, label: 'Study Requests' },
  { to: '/admin/courses', icon: BookOpen, label: 'Courses' },
  { to: '/admin/syllabus', icon: GraduationCap, label: 'Syllabus manager' },
  { to: '/admin/enrollments', icon: Link2, label: 'Enrollments' },
  { to: '/admin/matches', icon: Sword, label: 'Matches' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { to: '/admin/activity', icon: Activity, label: 'Live activity' },
  { to: '/admin/system', icon: Server, label: 'System' },
  { to: '/admin/settings', icon: Settings, label: 'Admin settings' },
]

export default function AdminSidebar({ onNavigate }) {
  return (
    <>
      <div className="adm-logo-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LuterLogo size={28} fontSize={20} />
        </div>
        <span className="adm-badge">
          <Shield size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
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
            <span className="adm-nav-icon">
              <Icon size={20} strokeWidth={1.8} />
            </span>
            {label}
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
            <ExternalLink size={18} strokeWidth={1.8} />
          </span>
          Back to app
        </a>
      </div>
    </>
  )
}
