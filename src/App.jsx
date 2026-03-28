import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import Pricing from './components/Pricing'
import About from './components/About'
import SignIn from './components/SignIn'
import SignUp from './components/SignUp'
import Onboarding from './components/Onboarding'
import Dashboard from './components/dashboard/Dashboard'
import DashboardHome from './components/dashboard/DashboardHome'
import CoursesPage from './components/dashboard/CoursesPage'
import WorkstationPage from './components/dashboard/WorkstationPage'
import MockExamPage from './components/dashboard/MockExamPage'
import AnalyticsPage from './components/dashboard/AnalyticsPage'
import CourseWorkstationRoute from './components/dashboard/CourseWorkstationRoute'
import SettingsPage from './components/dashboard/SettingsPage'
import UpgradePage from './components/dashboard/UpgradePage'
import StreakPage from './components/dashboard/StreakPage'
import ReferPage from './components/dashboard/ReferPage'
import CompetePage from './components/dashboard/CompetePage'
import AdminLayout from './admin/AdminLayout'
import AdminOverview from './admin/pages/AdminOverview'
import AdminUsers from './admin/pages/AdminUsers'
import AdminUserDetail from './admin/pages/AdminUserDetail'
import AdminCourses from './admin/pages/AdminCourses'
import AdminEnrollments from './admin/pages/AdminEnrollments'
import AdminMatches from './admin/pages/AdminMatches'
import AdminNotifications from './admin/pages/AdminNotifications'
import AdminActivity from './admin/pages/AdminActivity'
import AdminSystem from './admin/pages/AdminSystem'
import AdminSettings from './admin/pages/AdminSettings'

function CompeteRedirect() {
  const { search } = useLocation()
  return <Navigate to={`/dashboard/compete${search}`} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/features" element={<Features />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/about" element={<About />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/onboarding" element={<Onboarding />} />

      <Route path="/dashboard" element={<Dashboard />}>
        <Route index element={<DashboardHome />} />
        <Route path="courses/:courseId" element={<CourseWorkstationRoute />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="workstation" element={<WorkstationPage />} />
        <Route path="mock-exam" element={<MockExamPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="upgrade" element={<UpgradePage />} />
        <Route path="streak" element={<StreakPage />} />
        <Route path="refer" element={<ReferPage />} />
        <Route path="compete" element={<CompetePage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="/compete" element={<CompeteRedirect />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminOverview />} />
        <Route path="users/:userId" element={<AdminUserDetail />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="courses" element={<AdminCourses />} />
        <Route path="enrollments" element={<AdminEnrollments />} />
        <Route path="matches" element={<AdminMatches />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="activity" element={<AdminActivity />} />
        <Route path="system" element={<AdminSystem />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  )
}
