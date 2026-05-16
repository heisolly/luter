import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import LandingPage from './components/LandingPage'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import Pricing from './components/Pricing'
import About from './components/About'
import PathCalculator from './components/PathCalculator'
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
import PlaygroundPage from './components/dashboard/PlaygroundPage'
import PricingPage from './components/dashboard/PricingPage'
import PaymentSuccess from './components/dashboard/PaymentSuccess'
import PaystackCheckout from './components/PaystackCheckout'
import StandalonePricingPage from './components/StandalonePricingPage'
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
import AdminAudit from './admin/pages/AdminAudit'
import AdminAgents from './admin/pages/AdminAgents'
import AdminAgentBuilder from './admin/pages/AdminAgentBuilder'
import AdminAgentConsole from './admin/pages/AdminAgentConsole'
import AdminAgentMonitor from './admin/pages/AdminAgentMonitor'
import AdminAgentFactory from './admin/pages/AdminAgentFactory'
import AdminAnalytics from './admin/pages/AdminAnalytics'
import AdminSystemControls from './admin/pages/AdminSystemControls'
import PaymentSettings from './components/admin/PaymentSettings'
import LuterAdminUploadPage from './admin/pages/LuterAdminUploadPage'
import StudyMaterialsPage from './components/dashboard/StudyMaterialsPage'
import FilesPage from './components/dashboard/FilesPage'
import AssignmentsPage from './components/dashboard/AssignmentsPage'
import AINotesPage from './components/dashboard/AINotesPage'
import StudyMaterialsWeekPage from './components/dashboard/StudyMaterialsWeekPage'
import SemesterNotesPage from './components/dashboard/SemesterNotesPage'
import UserUpload from './components/dashboard/UserUpload'
import NotesRequestsAdmin from './components/dashboard/NotesRequestsAdmin'
import StudyRequestsPage from './components/dashboard/StudyRequestsPage'
import ExamSessionPage from './components/dashboard/ExamSessionPage'
import StudyGroupsPage from './components/dashboard/StudyGroupsPage'
import StudyGroupDetailsPage from './components/dashboard/StudyGroupDetailsPage'
import JoinGroupPage from './components/dashboard/JoinGroupPage'
import LibraryPage from './components/dashboard/LibraryPage'
import TrashPage from './components/dashboard/TrashPage'
import VaultPage from './components/dashboard/VaultPage'
import StudySessionPage from './components/dashboard/StudySessionPage'
import SessionsPage from './components/dashboard/SessionsPage'
import LevelPage from './components/dashboard/LevelPage'
import StorePage from './components/dashboard/StorePage'
import SharedMaterialPreview from './components/shared/SharedMaterialPreview'
import BoardPage from './components/board/BoardPage'
import NotificationsPage from './components/dashboard/NotificationsPage'
import { DASHBOARD_URL, LANDING_URL, ADMIN_URL } from './utils/urlUtils'
import { supabase } from './supabaseClient'

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
const GuestPlayPage = lazy(() => import('./components/dashboard/playground/GuestPlayPage'))

export default function App() {
  const offline = useNavigatorOffline()
  const hostname = window.location.hostname;
  const isAdminHost = import.meta.env.PROD ? hostname === 'admin.luter.app' : false;

  // Subdomain logic removed - everything now on luter.app except Admin
  useEffect(() => {
    // Optional: Add global auth check or tracking here if needed
  }, []);

  return (
    <div className="luter-app">
      {offline && (
        <div
          role="status"
          className="fixed top-0 left-0 right-0 z-[10000] px-4 py-2.5 text-center text-sm text-white shadow-md"
          style={{ background: 'var(--primary-dark, #7a12cc)', fontFamily: 'var(--font-outfit, system-ui, sans-serif)' }}
        >
          You are offline. The app will use cached pages and study data where possible; reconnect to sync.
        </div>
      )}
      <div style={{ paddingTop: offline ? OFFLINE_BAR_PT : undefined }}>
        <Routes>
          {/* ADMIN HOST SPECIFIC ROUTES */}
          {isAdminHost && (
            <>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="notes-manager" element={<AdminNotesManager />} />
                <Route path="requests" element={<NotesRequestsAdmin />} />
                <Route path="upload" element={<LuterAdminUploadPage />} />
                <Route path="users/:userId" element={<AdminUserDetail />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="enrollments" element={<AdminEnrollments />} />
                <Route path="matches" element={<AdminMatches />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="activity" element={<AdminActivity />} />
                <Route path="system" element={<AdminSystem />} />
                <Route path="payment-settings" element={<PaymentSettings />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="syllabus" element={<AdminSyllabusManager />} />
                <Route path="audit" element={<AdminAudit />} />
                <Route path="agents" element={<AdminAgents />} />
                <Route path="agents/new" element={<AdminAgentBuilder />} />
                <Route path="agents/monitor" element={<AdminAgentMonitor />} />
                <Route path="agents/factory" element={<AdminAgentFactory />} />
                <Route path="agents/:id" element={<AdminAgentConsole />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="controls" element={<AdminSystemControls />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>
              <Route path="/" element={<Navigate to="/admin" replace />} />
            </>
          )}

          {/* MAIN APP ROUTES */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<Features />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/pricing" element={<StandalonePricingPage />} />
          <Route path="/checkout" element={<PaystackCheckout />} />
          <Route path="/about" element={<About />} />
          <Route path="/path-calculator" element={<PathCalculator />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* DASHBOARD ROUTES (Available on dashboard host) */}
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<DashboardHome />} />
            <Route path="courses/:courseId/materials/:weekId" element={<StudyMaterialsWeekPage />} />
            <Route path="courses/:courseId/materials" element={<StudyMaterialsPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="courses/:courseId/semester-notes" element={<SemesterNotesPage />} />
            <Route path="files" element={<FilesPage />} />
            <Route path="ai-notes" element={<AINotesPage />} />
            <Route path="assignments" element={<AssignmentsPage />} />
            <Route path="courses/:courseId/learn" element={<CourseWorkstationRoute workstationMode={true} />} />
            <Route path="courses/:courseId" element={<CourseWorkstationRoute workstationMode={false} />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="vault" element={<VaultPage />} />
            <Route path="workstation" element={<WorkstationPage />} />
            <Route path="mock-exam" element={<MockExamPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="upgrade" element={<UpgradePage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="payment/success" element={<PaymentSuccess />} />
            <Route path="streak" element={<StreakPage />} />
            <Route path="profile" element={<LevelPage />} />
            <Route path="store" element={<StorePage />} />
            <Route path="refer" element={<ReferPage />} />
            <Route path="compete" element={<PlaygroundPage />} />
            <Route path="playground/:roomId" element={<PlaygroundPage />} />
            <Route path="upload" element={<UserUpload />} />
            <Route path="requests" element={<StudyRequestsPage />} />
            <Route path="study-groups" element={<StudyGroupsPage />} />
            <Route path="study-groups/:groupId" element={<StudyGroupDetailsPage />} />
            <Route path="trash" element={<TrashPage />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="session/:sessionId" element={<StudySessionPage />} />
            <Route path="exam-session/:sessionId" element={<ExamSessionPage />} />
          </Route>

          {/* ROOT LEVEL ALIASES */}
          <Route element={<Dashboard />}>
            <Route path="/home" element={<DashboardHome />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/groups" element={<StudyGroupsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/backpack" element={<Navigate to="/dashboard/courses" replace />} />
            <Route path="/playground" element={<PlaygroundPage />} />
            <Route path="/mock-exams" element={<MockExamPage />} />
            <Route path="/progress" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/upgrade" element={<UpgradePage />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/profile" element={<LevelPage />} />
            <Route path="/vault" element={<VaultPage />} />
          </Route>

          {/* SHARED ROUTES (Available on both) */}
          <Route path="/exam-session/:sessionId" element={<ExamSessionView />} />
          <Route path="/share/flashcards/:bundleId" element={<SharedFlashcardsView />} />
          <Route path="/shared/:shareToken" element={<SharedMaterialPreview />} />
          <Route path="/play/:roomId" element={<Suspense fallback={<div>Loading Arena...</div>}><GuestPlayPage /></Suspense>} />
          <Route path="/join/:inviteCode" element={<JoinGroupPage />} />
          <Route path="/board/:roomId" element={<BoardPage />} />

          {/* REDIRECT LEGACY ADMIN TO SUBDOMAIN */}
          <Route path="/admin/*" element={<Navigate to={ADMIN_URL} replace />} />

          {/* DEFAULT REDIRECTS */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}
