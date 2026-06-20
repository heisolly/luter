import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import LandingPage from './components/LandingPage'
const SignIn = lazy(() => import('./components/SignIn'));
const SignUp = lazy(() => import('./components/SignUp'));
const Onboarding = lazy(() => import('./components/Onboarding'));
const WallOfLove = lazy(() => import('./pages/WallOfLove'));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const DashboardHome = lazy(() => import('./components/dashboard/DashboardHome'));
const BackpackPage = lazy(() => import('./components/dashboard/BackpackPage'));
const BackpackFolderView = lazy(() => import('./components/dashboard/BackpackFolderView'));
const DecksPage = lazy(() => import('./components/dashboard/DecksPage'));
const WorkstationPage = lazy(() => import('./components/dashboard/WorkstationPage'));
const MockExamPage = lazy(() => import('./components/dashboard/MockExamPage'));
const AnalyticsPage = lazy(() => import('./components/dashboard/AnalyticsPage'));
const SettingsPage = lazy(() => import('./components/dashboard/SettingsPage'));
const FeedbackPage = lazy(() => import('./components/dashboard/FeedbackPage'));
const ChangelogPage = lazy(() => import('./components/dashboard/ChangelogPage'));
const HelpPage = lazy(() => import('./components/dashboard/HelpPage'));
const UpgradePage = lazy(() => import('./components/dashboard/UpgradePage'));
const StreakPage = lazy(() => import('./components/dashboard/StreakPage'));
const ReferPage = lazy(() => import('./components/dashboard/ReferPage'));
const PlaygroundPage = lazy(() => import('./components/dashboard/PlaygroundPage'));
const KnowledgeHeistPage = lazy(() => import('./components/dashboard/playground/KnowledgeHeistPage'));
const ClutLivePage = lazy(() => import('./components/dashboard/ClutLivePage'));
const PricingPage = lazy(() => import('./components/dashboard/PricingPage'));
const ExamSessionView = lazy(() => import('./components/ExamSessionView'));
const SharedFlashcardsView = lazy(() => import('./components/SharedFlashcardsView'));
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const AdminOverview = lazy(() => import('./admin/pages/AdminOverview'));
const AdminUsers = lazy(() => import('./admin/pages/AdminUsers'));
const AdminUserDetail = lazy(() => import('./admin/pages/AdminUserDetail'));
const AdminCourses = lazy(() => import('./admin/pages/AdminCourses'));
const AdminEnrollments = lazy(() => import('./admin/pages/AdminEnrollments'));
const AdminMatches = lazy(() => import('./admin/pages/AdminMatches'));
const AdminNotifications = lazy(() => import('./admin/pages/AdminNotifications'));
const AdminActivity = lazy(() => import('./admin/pages/AdminActivity'));
const AdminSystem = lazy(() => import('./admin/pages/AdminSystem'));
const AdminSettings = lazy(() => import('./admin/pages/AdminSettings'));
const AdminSyllabusManager = lazy(() => import('./admin/pages/AdminSyllabusManager'));
const AdminNotesManager = lazy(() => import('./admin/pages/AdminNotesManager'));
const AdminAudit = lazy(() => import('./admin/pages/AdminAudit'));
const AdminAgents = lazy(() => import('./admin/pages/AdminAgents'));
const AdminAgentBuilder = lazy(() => import('./admin/pages/AdminAgentBuilder'));
const AdminAgentConsole = lazy(() => import('./admin/pages/AdminAgentConsole'));
const AdminAgentMonitor = lazy(() => import('./admin/pages/AdminAgentMonitor'));
const AdminAgentFactory = lazy(() => import('./admin/pages/AdminAgentFactory'));
const AdminAnalytics = lazy(() => import('./admin/pages/AdminAnalytics'));
const AdminSystemControls = lazy(() => import('./admin/pages/AdminSystemControls'));
const AdminPricing = lazy(() => import('./admin/pages/AdminPricing'));
const PaymentSettings = lazy(() => import('./components/admin/PaymentSettings'));
const LuterAdminUploadPage = lazy(() => import('./admin/pages/LuterAdminUploadPage'));
const FilesPage = lazy(() => import('./components/dashboard/FilesPage'));
const AssignmentsPage = lazy(() => import('./components/dashboard/AssignmentsPage'));
const NotesStudioPage = lazy(() => import('./components/dashboard/NotesStudioPage'));
const NotesDashboardPage = lazy(() => import('./components/dashboard/NotesDashboardPage'));
const UserUpload = lazy(() => import('./components/dashboard/UserUpload'));
const NotesRequestsAdmin = lazy(() => import('./components/dashboard/NotesRequestsAdmin'));
const StudyRequestsPage = lazy(() => import('./components/dashboard/StudyRequestsPage'));
const ExamSessionPage = lazy(() => import('./components/dashboard/ExamSessionPage'));
const StudyGroupsPage = lazy(() => import('./components/dashboard/StudyGroupsPage'));
const StudyGroupDetailsPage = lazy(() => import('./components/dashboard/StudyGroupDetailsPage'));
const JoinGroupPage = lazy(() => import('./components/dashboard/JoinGroupPage'));
const LibraryPage = lazy(() => import('./components/dashboard/LibraryPage'));
const TrashPage = lazy(() => import('./components/dashboard/TrashPage'));
const ClassroomDashboard = lazy(() => import('./classroom/ClassroomDashboard'))
const ClassView = lazy(() => import('./classroom/ClassView'))
const ClassroomCalendar = lazy(() => import('./classroom/ClassroomCalendar'))
const VaultPage = lazy(() => import('./components/dashboard/VaultPage'));
const StudySessionPage = lazy(() => import('./components/dashboard/StudySessionPage'));
const SessionsPage = lazy(() => import('./components/dashboard/SessionsPage'));
const LevelPage = lazy(() => import('./components/dashboard/LevelPage'));
const StorePage = lazy(() => import('./components/dashboard/StorePage'));
const SharedMaterialPreview = lazy(() => import('./components/shared/SharedMaterialPreview'));
const BoardPage = lazy(() => import('./components/board/BoardPage'));
const NotificationsPage = lazy(() => import('./components/dashboard/NotificationsPage'));
import { FeaturebaseProvider } from 'featurebase-js/react'
import { DASHBOARD_URL, LANDING_URL, ADMIN_URL } from './utils/urlUtils'
import { supabase } from './supabaseClient'

const OFFLINE_BAR_PT = '2.75rem'
const FEATUREBASE_ENABLED =
  import.meta.env.VITE_ENABLE_FEATUREBASE === 'true' &&
  Boolean(import.meta.env.VITE_FEATUREBASE_APP_ID)

function OptionalFeaturebaseProvider({ children }) {
  if (!FEATUREBASE_ENABLED) return children

  return (
    <FeaturebaseProvider
      appId={import.meta.env.VITE_FEATUREBASE_APP_ID}
      featurebaseJwt={import.meta.env.VITE_FEATUREBASE_JWT || undefined}
      messenger={false}
    >
      {children}
    </FeaturebaseProvider>
  )
}

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
const PublicFlashcardView = lazy(() => import('./components/dashboard/PublicFlashcardView'))

function NavigateToWorkstation() {
  const { materialId } = useParams()
  const target = materialId
    ? `/dashboard/workstation?materialId=${encodeURIComponent(materialId)}`
    : '/dashboard/workstation'

  return <Navigate to={target} replace />
}

export default function App() {
  const offline = useNavigatorOffline()
  const hostname = window.location.hostname;
  const isAdminHost = import.meta.env.PROD 
    ? hostname === 'admin.luter.app' 
    : (hostname === 'admin.luter.app' || hostname.startsWith('admin.') || window.location.search.includes('admin=true') || localStorage.getItem('isAdmin') === 'true');

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
          style={{ background: 'var(--primary-dark, #7a12cc)', fontFamily: 'var(--font-display, system-ui, sans-serif)' }}
        >
          You are offline. The app will use cached pages and study data where possible; reconnect to sync.
        </div>
      )}
      <div style={{ paddingTop: offline ? OFFLINE_BAR_PT : undefined }}>
        <OptionalFeaturebaseProvider>
        <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-[#111116]"><div className="w-8 h-8 border-4 border-[#9718fb] border-t-transparent rounded-full animate-spin"></div></div>}>
          <Routes>
          {/* ADMIN HOST SPECIFIC ROUTES */}
          {isAdminHost ? (
            <>
              <Route path="/" element={<AdminLayout />}>
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
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </>
          ) : (
            <>
              {/* Path-based admin access on main domain and localhost */}
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
                <Route path="pricing" element={<AdminPricing />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>
            </>
          )}

          {/* MAIN APP ROUTES */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/wall-of-love" element={<WallOfLove />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/view/:materialId" element={<PublicFlashcardView />} />
          {/* DASHBOARD ROUTES (Available on dashboard host) */}
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<DashboardHome />} />
            <Route path="backpack" element={<BackpackPage />} />
            <Route path="backpack/:folderId" element={<BackpackFolderView />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="files" element={<FilesPage />} />
            <Route path="notes" element={<NotesDashboardPage />} />
            <Route path="notes/editor" element={<NotesStudioPage />} />
            <Route path="ai-notes" element={<Navigate to="/dashboard/notes" replace />} />
            <Route path="ai-chat" element={<NotesStudioPage />} />
            <Route path="assignments" element={<AssignmentsPage />} />
            <Route path="decks" element={<DecksPage />} />
            <Route path="vault" element={<VaultPage />} />
            <Route path="workstation" element={<WorkstationPage />} />
            <Route path="workstation/:materialId" element={<WorkstationPage />} />
            <Route path="mock-exam" element={<MockExamPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="changelog" element={<ChangelogPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="upgrade" element={<UpgradePage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="streak" element={<StreakPage />} />
            <Route path="profile" element={<LevelPage />} />
            <Route path="store" element={<StorePage />} />
            <Route path="refer" element={<ReferPage />} />
            <Route path="compete" element={<PlaygroundPage />} />
            <Route path="playground/:roomId" element={<PlaygroundPage />} />
            <Route path="heist" element={<KnowledgeHeistPage />} />
            <Route path="heist/:roomId" element={<KnowledgeHeistPage />} />
            <Route path="upload" element={<UserUpload />} />
            <Route path="requests" element={<StudyRequestsPage />} />
            <Route path="study-groups" element={<StudyGroupsPage />} />
            <Route path="study-groups/:groupId" element={<StudyGroupDetailsPage />} />
            <Route path="trash" element={<TrashPage />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="session/:sessionId" element={<StudySessionPage />} />
            <Route path="exam-session/:sessionId" element={<ExamSessionPage />} />
          </Route>

          {/* CLASSROOM ROUTES (Standalone Layouts) */}
          <Route path="/classrooms" element={<ClassroomDashboard />} />
          <Route path="/classrooms/calendar" element={<ClassroomCalendar />} />
          <Route path="/classrooms/c/:classId" element={<ClassView />} />
          <Route path="/classroom" element={<Navigate to="/classrooms" replace />} />

          {/* ROOT LEVEL ALIASES */}
          <Route element={<Dashboard />}>
            <Route path="/home" element={<DashboardHome />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/notes" element={<NotesDashboardPage />} />
            <Route path="/notes/editor" element={<NotesStudioPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/groups" element={<StudyGroupsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/backpack" element={<Navigate to="/dashboard/backpack" replace />} />
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
          <Route path="/workspace/:materialId" element={<NavigateToWorkstation />} />
          <Route path="/play/:roomId" element={<Suspense fallback={<div>Loading Arena...</div>}><GuestPlayPage /></Suspense>} />
          <Route path="/clut/live/:roomCode" element={<ClutLivePage />} />
          <Route path="/join/:inviteCode" element={<JoinGroupPage />} />
          <Route path="/board/:roomId" element={<BoardPage />} />



          {/* DEFAULT REDIRECTS */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
          </Suspense>
        </OptionalFeaturebaseProvider>
      </div>
    </div>
  )
}
