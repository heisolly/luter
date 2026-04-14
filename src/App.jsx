import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
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
import CompetePage from './components/dashboard/CompetePageEnhanced'
import StandaloneBattle from './components/StandaloneBattle'
import BattleExamPage from './components/dashboard/BattleExamPage'
import PricingPage from './components/dashboard/PricingPage'
import ExamSessionView from './components/ExamSessionView'
import SharedFlashcardsView from './components/SharedFlashcardsView'
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
import AdminSyllabusManager from './admin/pages/AdminSyllabusManager'
import AdminNotesManager from './admin/pages/AdminNotesManager'
import LuterAdminUploadPage from './admin/pages/LuterAdminUploadPage'
import StudyMaterialsPage from './components/dashboard/StudyMaterialsPage'
import FilesPage from './components/dashboard/FilesPage'
import AssignmentsPage from './components/dashboard/AssignmentsPage'
import AINotesPage from './components/dashboard/AINotesPage'
import StudyMaterialsWeekPage from './components/dashboard/StudyMaterialsWeekPage'
import SemesterNotesPage from './components/dashboard/SemesterNotesPage'
import UserUpload from './components/dashboard/UserUpload'

function CompeteRedirect() {
  const { search } = useLocation()
  return <Navigate to={`/dashboard/compete${search}`} replace />
}

const OFFLINE_BAR_PT = '2.75rem'

function useNavigatorOffline() {
  const [offline, setOffline] = useState(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  )

  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  return offline
}

export default function App() {
  const offline = useNavigatorOffline()

  return (
    <>
      {offline ? (
        <div
          role="status"
          className="fixed top-0 left-0 right-0 z-[10000] px-4 py-2.5 text-center text-sm text-white shadow-md"
          style={{ background: 'var(--primary-dark, #7a12cc)', fontFamily: 'var(--font-outfit, system-ui, sans-serif)' }}
        >
          You are offline. The app will use cached pages and study data where possible; reconnect to sync.
        </div>
      ) : null}
      <div style={{ paddingTop: offline ? OFFLINE_BAR_PT : undefined }}>
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
            <Route path="courses/:courseId/materials/:weekId" element={<StudyMaterialsWeekPage />} />
            <Route path="courses/:courseId/materials" element={<StudyMaterialsPage />} />
            <Route path="courses/:courseId/semester-notes" element={<SemesterNotesPage />} />
            <Route path="files" element={<FilesPage />} />
            <Route path="ai-notes" element={<AINotesPage />} />
            <Route path="assignments" element={<AssignmentsPage />} />
            <Route path="courses/:courseId/learn" element={<CourseWorkstationRoute workstationMode={true} />} />
            <Route path="courses/:courseId" element={<CourseWorkstationRoute workstationMode={false} />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="workstation" element={<WorkstationPage />} />
            <Route path="mock-exam" element={<MockExamPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="upgrade" element={<UpgradePage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="streak" element={<StreakPage />} />
            <Route path="refer" element={<ReferPage />} />
            <Route path="compete" element={<CompetePage />} />
            <Route path="upload" element={<UserUpload />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          <Route path="/exam-session/:sessionId" element={<ExamSessionView />} />
          <Route path="/share/flashcards/:bundleId" element={<SharedFlashcardsView />} />
          <Route path="/compete" element={<CompeteRedirect />} />
          <Route path="/battle/:sessionId" element={<StandaloneBattle />} />
          <Route path="/battle-exam/:sessionId" element={<BattleExamPage />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="notes-manager" element={<AdminNotesManager />} />
            <Route path="upload" element={<LuterAdminUploadPage />} />
            <Route path="users/:userId" element={<AdminUserDetail />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="enrollments" element={<AdminEnrollments />} />
            <Route path="matches" element={<AdminMatches />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="activity" element={<AdminActivity />} />
            <Route path="system" element={<AdminSystem />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="syllabus" element={<AdminSyllabusManager />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </div>
    </>
  )
}
