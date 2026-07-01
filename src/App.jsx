import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import LandingPage from './components/LandingPage'
const SignIn = lazy(() => import('./components/SignIn'));
const SignUp = lazy(() => import('./components/SignUp'));
const Onboarding = lazy(() => import('./components/Onboarding'));
const WallOfLove = lazy(() => import('./pages/WallOfLove'));
const ComponentPage = lazy(() => import('./pages/ComponentPage'));
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
const PaymentSuccess = lazy(() => import('./components/dashboard/PaymentSuccess'));
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
const AdminNotifications = lazy(() => import('./admin/pages/AdminNotifications'));
const AdminActivity = lazy(() => import('./admin/pages/AdminActivity'));
const AdminSyllabusManager = lazy(() => import('./admin/pages/AdminSyllabusManager'));
const AdminAudit = lazy(() => import('./admin/pages/AdminAudit'));
const AdminConfig = lazy(() => import('./admin/pages/AdminConfig'));
const AdminTasks = lazy(() => import('./admin/pages/AdminTasks'));
const FilesPage = lazy(() => import('./components/dashboard/FilesPage'));
const AssignmentsPage = lazy(() => import('./components/dashboard/AssignmentsPage'));
const NotesStudioPage = lazy(() => import('./components/dashboard/NotesStudioPage'));
const NotesDashboardPage = lazy(() => import('./components/dashboard/NotesDashboardPage'));
const UserUpload = lazy(() => import('./components/dashboard/UserUpload'));
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
const LevelPage = lazy(() => import('./components/dashboard/LevelPage'));
const StorePage = lazy(() => import('./components/dashboard/StorePage'));
const SharedMaterialPreview = lazy(() => import('./components/shared/SharedMaterialPreview'));
const BoardPage = lazy(() => import('./components/board/BoardPage'));
const NotificationsPage = lazy(() => import('./components/dashboard/NotificationsPage'));
const QuizSessionPage = lazy(() => import('./components/dashboard/QuizSessionPage'));
import { FeaturebaseProvider } from 'featurebase-js/react'
import { DASHBOARD_URL, LANDING_URL, ADMIN_URL } from './utils/urlUtils'
import { loadPricingConfig } from './services/creditService'

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
  const [offline, setOffline] = useState(!navigator.onLine)
  useEffect(() => {
    const handleOnline = () => setOffline(false)
    const handleOffline = () => setOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  return offline
}

function NavigateToWithSearch({ to }) {
  const location = useLocation()
  return <Navigate to={{ pathname: to, search: location.search }} replace />
}
const GuestPlayPage = lazy(() => import('./components/dashboard/playground/GuestPlayPage'))
const PublicFlashcardView = lazy(() => import('./components/dashboard/PublicFlashcardView'))

function NavigateToWorkstation() {
  const { materialId } = useParams()
  const target = materialId
    ? `/workstation?materialId=${encodeURIComponent(materialId)}`
    : '/workstation'

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
    // Load dynamic credit costs & daily limits from database
    loadPricingConfig().catch(() => {})
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
        <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-transparent"></div>}>
          <Routes>
          {/* ADMIN HOST SPECIFIC ROUTES */}
          {isAdminHost ? (
            <>
              <Route path="/" element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="users/:userId" element={<AdminUserDetail />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="activity" element={<AdminActivity />} />
                <Route path="syllabus" element={<AdminSyllabusManager />} />
                <Route path="audit" element={<AdminAudit />} />
                <Route path="config" element={<AdminConfig />} />
                <Route path="tasks" element={<AdminTasks />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </>
          ) : (
            <>
              {/* Path-based admin access on main domain and localhost */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="users/:userId" element={<AdminUserDetail />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="activity" element={<AdminActivity />} />
                <Route path="syllabus" element={<AdminSyllabusManager />} />
                <Route path="audit" element={<AdminAudit />} />
                <Route path="config" element={<AdminConfig />} />
                <Route path="tasks" element={<AdminTasks />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>
            </>
          )}

          {/* MAIN APP ROUTES */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/component" element={<ComponentPage />} />
          <Route path="/wall-of-love" element={<WallOfLove />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/view/:materialId" element={<PublicFlashcardView />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/dashboard/payment/success" element={<PaymentSuccess />} />
          {/* DASHBOARD ROUTES */}
          <Route element={<Dashboard />}>
            <Route path="/home" element={<DashboardHome />} />
            <Route path="backpack" element={<BackpackPage />} />
            <Route path="backpack/:folderId" element={<BackpackFolderView />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="files" element={<FilesPage />} />
            <Route path="notes" element={<NotesDashboardPage />} />
            <Route path="notes/editor" element={<NotesStudioPage />} />
            <Route path="ai-notes" element={<Navigate to="/notes" replace />} />
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
            <Route path="sessions" element={<Navigate to="/backpack" replace />} />
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
            <Route path="/sessions" element={<Navigate to="/backpack" replace />} />
            <Route path="/notes" element={<NotesDashboardPage />} />
            <Route path="/notes/editor" element={<NotesStudioPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/groups" element={<StudyGroupsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
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
          <Route path="/quiz/:materialId" element={<QuizSessionPage />} />
          <Route path="/share/flashcards/:bundleId" element={<SharedFlashcardsView />} />
          <Route path="/shared/:shareToken" element={<SharedMaterialPreview />} />
          <Route path="/workspace/:materialId" element={<NavigateToWorkstation />} />
          <Route path="/play/:roomId" element={<Suspense fallback={<div>Loading Arena...</div>}><GuestPlayPage /></Suspense>} />
          <Route path="/clut/live/:roomCode" element={<ClutLivePage />} />
          <Route path="/join/:inviteCode" element={<JoinGroupPage />} />
          <Route path="/board/:roomId" element={<BoardPage />} />



          {/* BACKWARD COMPATIBILITY REDIRECTS */}
          <Route path="/dashboard/home" element={<NavigateToWithSearch to="/home" />} />
          <Route path="/dashboard/*" element={<NavigateToWithSearch to="/home" />} />

          {/* DEFAULT REDIRECTS */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
          </Suspense>
        </OptionalFeaturebaseProvider>
      </div>
    </div>
  )
}
