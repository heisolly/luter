import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useOutletContext, Link, useLocation, useSearchParams, useParams } from 'react-router-dom';
import { WorkspaceRightPanel } from '../shared/WorkspaceRightPanel';
import { 
  FileText, Star, Lightning, Cards, CheckSquareOffset, CornersOut, CornersIn,
  CaretDown, Bell, Link as LinkIcon, ShareNetwork, Moon, Sun, User as UserIcon, X as CloseIcon,
  Highlighter, PencilLine, PencilSimple, Chalkboard, Square, PushPin,
  WhatsappLogo, ChatsCircle, DiscordLogo, RedditLogo, LinkedinLogo, Sparkle, SidebarSimple, ChatTeardropText, House
} from '@phosphor-icons/react';
import { fetchUserStandaloneMaterials, joinMaterial, fetchMaterialCollaborators, fetchCourseMaterials } from '../../services/materialsService';
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext';
import AnnotationToolbar from './AnnotationToolbar';
import { supabase } from '../../supabaseClient';
import { useSessionStore } from '../../store/useSessionStore';
import LuterLogo from '../shared/LuterLogo';
import { CollaborationProvider } from './CollaborationProvider';
import { ReadingSpaceProvider } from './ReadingSpaceContext';
import { Whiteboard } from './Whiteboard';
import MaterialRenderer from './MaterialRenderer';
import { ClientSideSuspense } from './CollaborationProvider';
import { RoomProvider } from './CollaborationProvider';
import { LiveNoteEditor } from './NotesStudioPage';
import { CommentsProvider } from './CommentsProvider';
import WorkstationEmptyState from './WorkstationEmptyState';
import VoiceChatWidget from './VoiceChatWidget';
import WorkstationFlashcards from './WorkstationFlashcards';
import WorkstationQuizzes from './WorkstationQuizzes';
import MaterialAnalysisService from '../../services/materialAnalysisService';
import { checkAndDeductCredits, CREDIT_COSTS } from '../../services/creditService';
import WorkstationMobileLayout from './WorkstationMobileLayout';
import './NotesStudioPage.css';
import './workstation.css';

function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('luter-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDark)
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    
    const handleStorage = (e) => {
      if (e.key === 'luter-theme') setIsDark(e.newValue === 'dark')
    }
    const handleCustom = (e) => setIsDark(e.detail === 'dark')
    
    window.addEventListener('storage', handleStorage)
    window.addEventListener('theme-change', handleCustom)
    
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('theme-change', handleCustom)
    }
  }, [isDark])

  const setGlobalDark = (newDark) => {
    setIsDark(newDark)
    localStorage.setItem('luter-theme', newDark ? 'dark' : 'light')
    window.dispatchEvent(new CustomEvent('theme-change', { detail: newDark ? 'dark' : 'light' }))
  }

  return [isDark, setGlobalDark]
}

const BOTTOM_WORKSPACE_TOOLS = [
  {
    id: 'highlight', label: 'Highlight', icon: Highlighter,
    baseBg: '#FEF3C7', baseBorder: '#FDE68A', baseColor: '#D97706',
    activeBg: '#FDE68A', activeBorder: '#F59E0B', activeColor: '#92400E',
  },
  {
    id: 'annotate', label: 'Annotate', icon: PencilSimple,
    baseBg: '#F5F3FF', baseBorder: '#DDD6FE', baseColor: '#7C3AED',
    activeBg: '#EDE9FE', activeBorder: '#A78BFA', activeColor: '#6D28D9',
  },
  {
    id: 'pin', label: 'Sticky Note', icon: PushPin,
    baseBg: '#F3F4F6', baseBorder: '#E5E7EB', baseColor: '#374151',
    activeBg: '#111827', activeBorder: '#000000', activeColor: '#FFFFFF',
  },
];

const ANNOTATION_COLORS = ['#111827', '#7C3AED', '#EF4444', '#10B981', '#F59E0B'];
const STROKE_SIZES = [4, 7, 10];

const MAIN_TABS = [
  { id: 'Source', label: 'Source', icon: FileText },
  { id: 'Flashcards', label: 'Flashcards', icon: Cards, count: 0 },
  { id: 'Quizzes', label: 'Quizzes', icon: CheckSquareOffset },
];

const SUB_TABS = [
  { id: 'Document', label: 'Document', icon: FileText },
  { id: 'Notes', label: 'Notes', icon: PencilSimple },
  { id: 'Boards', label: 'Boards', icon: Chalkboard },
];

export default function WorkstationPage() {
  const { user, setMobileSidebarOpen } = useOutletContext() || {};
  const { bundle } = useDashboardPrefetch();
  const [isDark, setIsDark] = useDarkMode();

  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { materialId: routeMaterialId } = useParams();
  const urlMaterialId = routeMaterialId || searchParams.get('materialId');
  
  const stateMaterial = location.state?.material;
  
  const sessionIdParam = searchParams.get('sessionId')
  const shareCodeParam = searchParams.get('share')
  const groupIdParam = searchParams.get('groupId')
  const courseIdParam = searchParams.get('courseId')

  const roomId = useMemo(() => {
    if (sessionIdParam) return `luter-session-${sessionIdParam}`
    if (courseIdParam) return `luter-course-${courseIdParam}`
    if (shareCodeParam) return `luter-share-${shareCodeParam}`
    if (groupIdParam) return `luter-group-${groupIdParam}`
    if (urlMaterialId) return `luter-material-v2-${urlMaterialId}`
    if (stateMaterial?.id) return `luter-material-v2-${stateMaterial.id}`
    return `luter-empty-${user?.id || 'guest'}`
  }, [sessionIdParam, shareCodeParam, groupIdParam, urlMaterialId, stateMaterial?.id, user?.id, courseIdParam])

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatWidth, setChatWidth] = useState(400); 

  const getInitialTab = () => {
    const view = searchParams.get('view');
    if (view === 'quizzes') return 'Quizzes';
    if (view === 'flashcards') return 'Flashcards';
    return 'Source';
  };

  const [activeMainTab, setActiveMainTab] = useState(getInitialTab);

  // Sync URL view parameter to activeMainTab
  const viewParam = searchParams.get('view');
  useEffect(() => {
    if (viewParam === 'quizzes') {
      setActiveMainTab('Quizzes');
    } else if (viewParam === 'flashcards') {
      setActiveMainTab('Flashcards');
    } else {
      setActiveMainTab('Source');
    }
  }, [viewParam]);

  const handleTabChange = (tabId) => {
    setActiveMainTab(tabId);
    const newParams = new URLSearchParams(searchParams);
    if (tabId === 'Quizzes') {
      newParams.set('view', 'quizzes');
    } else if (tabId === 'Flashcards') {
      newParams.set('view', 'flashcards');
    } else {
      newParams.delete('view');
    }
    setSearchParams(newParams);
  };

  const [activeSubTab, setActiveSubTab] = useState('Document');
  const [isBoardFullScreen, setIsBoardFullScreen] = useState(false);
  const [isSubNavHovered, setIsSubNavHovered] = useState(false);

  const [noteName, setNoteName] = useState('Untitled Workspace');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [materials, setMaterials] = useState([]);

  const [materialAnalysis, setMaterialAnalysis] = useState(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

  useEffect(() => {
    setMaterialAnalysis(null); // Clear previous analysis immediately to prevent bleed-over
    if (!selectedMaterial?.id) {
      return;
    }
    const loadAnalysis = async () => {
      try {
        const { data, error } = await supabase
          .from('material_analysis')
          .select('*')
          .eq('material_id', selectedMaterial.id)
          .maybeSingle();
        if (error) console.error("Error fetching material analysis:", error);
        if (data) {
          setMaterialAnalysis(data);
        } else {
          setMaterialAnalysis(null);
        }
      } catch (err) {
        console.error("Error loading analysis:", err);
      }
    };
    loadAnalysis();
  }, [selectedMaterial?.id]);

  const selectedMaterialWithAnalysis = useMemo(() => {
    if (!selectedMaterial) return null;
    const analysis = materialAnalysis ? {
      summary: materialAnalysis.summary || materialAnalysis.analysis?.summary || null,
      flashcards: materialAnalysis.flashcards || materialAnalysis.analysis?.flashcards || [],
      quiz: materialAnalysis.quiz || materialAnalysis.analysis?.quiz || [],
      notes: materialAnalysis.smart_notes || materialAnalysis.analysis?.smart_notes || materialAnalysis.analysis?.notes || null,
      page_summaries: materialAnalysis.page_summaries || materialAnalysis.analysis?.page_summaries || {}
    } : null;
    return { ...selectedMaterial, analysis };
  }, [selectedMaterial, materialAnalysis]);

  useEffect(() => {
    if (selectedMaterial) {
      const text = selectedMaterial.extracted_text || materialAnalysis?.extracted_text || '';
      try {
        sessionStorage.setItem('luter-ws-ai-context', JSON.stringify({ 
          title: selectedMaterial.title || selectedMaterial.name || 'Document', 
          text: text 
        }));
      } catch (err) {
        console.warn('Could not store full material text in sessionStorage (likely too large):', err);
        // Fallback: store truncated version
        try {
          sessionStorage.setItem('luter-ws-ai-context', JSON.stringify({ 
            title: selectedMaterial.title || selectedMaterial.name || 'Document', 
            text: text.slice(0, 10000) 
          }));
        } catch (e) {}
      }
    } else {
      sessionStorage.removeItem('luter-ws-ai-context');
    }
  }, [selectedMaterial, materialAnalysis]);

  const runAnalysis = async (type) => {
    if (type !== 'quiz' || isAnalysisLoading || !selectedMaterial) return;
    setIsAnalysisLoading(true);
    try {
      let materialText = selectedMaterial.extracted_text;
      if (!materialText) {
        const { data: latestMaterial } = await supabase
          .from('materials')
          .select('extracted_text')
          .eq('id', selectedMaterial.id)
          .single();
        if (latestMaterial?.extracted_text) {
          materialText = latestMaterial.extracted_text;
          selectedMaterial.extracted_text = latestMaterial.extracted_text;
        }
      }

      if (!materialText) {
        console.log('[runAnalysis] Text still missing, triggering emergency extraction...');
        const extractionRes = await MaterialAnalysisService.reprocessMaterial(selectedMaterial);
        if (extractionRes.success && extractionRes.fullText) {
          materialText = extractionRes.fullText;
          selectedMaterial.extracted_text = materialText;
        }
      }

      if (!materialText) {
        throw new Error('Unable to extract text from this material. Please try re-uploading.');
      }

      let currentAnalysisRow = materialAnalysis;
      if (!materialAnalysis) {
        const { ok } = await checkAndDeductCredits(user?.id, CREDIT_COSTS.OPEN_MATERIAL, false);
        if (!ok) { setIsAnalysisLoading(false); return; }
        
        const analysisResult = await MaterialAnalysisService.getOrCreateAnalysis(selectedMaterial.id, selectedMaterial, user?.id);
        if (analysisResult.success) {
          setMaterialAnalysis(analysisResult.analysis);
          currentAnalysisRow = analysisResult.analysis;
        } else {
          throw new Error(analysisResult.error);
        }
      }

      const { ok } = await checkAndDeductCredits(user?.id, CREDIT_COSTS.GENERATE_QUIZ, false);
      if (!ok) { setIsAnalysisLoading(false); return; }

      const qRes = await MaterialAnalysisService.generateQuiz(currentAnalysisRow, 5, 'medium', selectedMaterial);
      const finalResult = qRes.success ? qRes.quiz : null;

      const questionsList = Array.isArray(finalResult)
        ? finalResult
        : (finalResult?.questions || []);

      if (finalResult && questionsList.length > 0) {
        // Check if record exists
        const { data: existing, error: selectError } = await supabase
          .from('material_analysis')
          .select('id')
          .eq('material_id', selectedMaterial.id)
          .eq('user_id', user?.id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('material_analysis')
            .update({
              quiz: finalResult,
              ...(currentAnalysisRow ? { analysis: currentAnalysisRow } : {}),
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('material_analysis')
            .insert({
              material_id: selectedMaterial.id,
              user_id: user?.id,
              quiz: finalResult,
              analysis: currentAnalysisRow || {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }
        
        setMaterialAnalysis(prev => {
          if (!prev) return { material_id: selectedMaterial.id, quiz: finalResult, analysis: currentAnalysisRow };
          return {
            ...prev,
            quiz: finalResult,
            analysis: prev.analysis ? { ...prev.analysis, quiz: finalResult } : currentAnalysisRow
          };
        });
      }
    } catch (error) {
      console.error('Quiz generation error:', error);
    } finally {
      setIsAnalysisLoading(false);
    }
  };
  const menuRef = useRef(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [collaborators, setCollaborators] = useState([]);

  useEffect(() => {
    if (isShareOpen && selectedMaterial) {
      fetchMaterialCollaborators(selectedMaterial.id)
        .then(data => setCollaborators(data))
        .catch(console.error);
    }
  }, [isShareOpen, selectedMaterial]);

  const [activeWorkspaceTool, setActiveWorkspaceTool] = useState(null);
  const [drawMode, setDrawMode] = useState('pen');
  const [strokeColor, setStrokeColor] = useState('#EF4444');
  const [strokeSize, setStrokeSize] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [localAvatar, setLocalAvatar] = useState(null);

  // Mobile responsiveness
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const profile = bundle?.profile?.data || bundle?.profile;
  const username = profile?.username;
  const email = profile?.email || user?.email;
  const displayName = username || profile?.full_name?.split(' ')[0] || 'Scholar';
  
  const stats = bundle?.stats?.data || {};
  const xp = stats?.total_xp ?? 0;
  const level = Math.floor(xp / 500) + 1;

  // Study Time / Goal / Streak Tracker
  useEffect(() => {
    if (!user?.id) return;
    
    // We increment study time every minute
    const interval = setInterval(async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        
        console.log('[WorkstationPage] Incrementing study time by 1 minute...');
        
        // Update user_gamification study time
        await supabase.rpc('update_user_gamification', {
          p_user_id: user.id,
          p_xp_gain: 5,         // 5 XP per minute studied
          p_coins_gain: 2,      // 2 coins per minute studied
          p_study_time_minutes: 1,
          p_source: 'workstation_timer'
        });

        // Update or insert the daily study goals entry for the heatmap
        await supabase.rpc('update_study_time', {
          p_user_id: user.id,
          p_minutes: 1,
          p_date: todayStr
        });
        
      } catch (err) {
        console.warn('Failed tracking study time:', err);
      }
    }, 60000); // every 60 seconds

    return () => clearInterval(interval);
  }, [user?.id]);

  const displayAvatar = localAvatar || profile?.avatar_url;

  useEffect(() => {
    if (user?.id) {
      const init = async () => {
        try {
          if (urlMaterialId) {
            await joinMaterial(urlMaterialId, user.id);
          }
          
          let data = [];
          if (courseIdParam) {
            data = await fetchCourseMaterials(courseIdParam, user.id);
          } else {
            data = await fetchUserStandaloneMaterials(user.id);
          }

          if (data && data.length > 0) {
            if (urlMaterialId && !data.find(m => String(m.id) === String(urlMaterialId))) {
              try {
                const { data: explicitMaterial } = await supabase.from('materials').select('*').eq('id', urlMaterialId).maybeSingle();
                if (explicitMaterial) data.unshift(explicitMaterial);
              } catch (e) {
                console.warn('Failed to fetch explicit material', e);
              }
            }

            setMaterials(data);
            let targetMaterial = null;
            if (stateMaterial) targetMaterial = stateMaterial;
            else if (urlMaterialId) targetMaterial = data.find(m => String(m.id) === String(urlMaterialId));
            
            if (targetMaterial) {
              setNoteName(targetMaterial.title || 'Course Material');
              setSelectedMaterial(targetMaterial);
            } else if (noteName === 'Untitled Workspace') {
               setNoteName(courseIdParam ? 'Course Workspace' : data[0].title);
               setSelectedMaterial(data[0]);
            }
          } else {
            setMaterials([]);
            if (stateMaterial) {
              setNoteName(stateMaterial.title);
              setSelectedMaterial(stateMaterial);
            } else {
              setNoteName(courseIdParam ? 'Empty Course' : 'Untitled Workspace');
              setSelectedMaterial(null);
            }
          }
        } catch (error) {
          console.error("Error initializing materials:", error);
        }
      };
      
      init();
    }
  }, [user?.id, stateMaterial, urlMaterialId, courseIdParam]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setIsMenuOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyLink = () => {
    const materialParam = urlMaterialId || stateMaterial?.id;
    const link = `${window.location.origin}/workstation${materialParam ? '?materialId=' + materialParam : ''}`;
    navigator.clipboard.writeText(link);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const handleAvatarUpload = async (event) => {
    try {
      setUploadingAvatar(true);
      const file = event.target.files[0];
      if (!file) return;

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        alert('Image size must be less than 20MB');
        return;
      }

      const fileExt = file.name.split('.').pop().toLowerCase();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setLocalAvatar(`${publicUrl}?v=${Date.now()}`);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert(`Failed to upload image: ${error.message}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const headerBg = isDark ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)';
  const textColor = isDark ? '#F3F4F6' : '#111827';
  const subTextColor = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const hoverBg = isDark ? '#374151' : '#F3F4F6';
  const dropdownBg = isDark ? '#1F2937' : '#FFFFFF';

  return (
    <CollaborationProvider roomId={roomId} userInfo={{
      id: user?.id || 'guest',
      name: displayName,
      avatar: displayAvatar,
      color: '#C4B5FD',
      role: 'editor'
    }}>
      <ReadingSpaceProvider>
        {isMobile ? (
          <WorkstationMobileLayout 
            state={{ 
              isDark, user, activeMainTab, activeSubTab, activeWorkspaceTool, 
              isChatOpen, selectedMaterial, urlMaterialId, isCollaborative: true, 
              displayName, displayAvatar, roomId, isBoardFullScreen, copiedToast,
              selectedMaterialWithAnalysis, isAnalysisLoading
            }} 
            actions={{ 
              setActiveMainTab, setActiveSubTab, setActiveWorkspaceTool, 
              setIsChatOpen, handleCopyLink, setIsBoardFullScreen, setMobileSidebarOpen,
              runAnalysis 
            }} 
          />
        ) : (
        <div className="ns-page" style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: isDark ? '#111827' : '#FFFFFF',
        color: textColor,
        display: 'flex',
        flexDirection: isMobile ? 'column-reverse' : 'row',
        overflow: 'hidden',
        transition: 'background-color 0.3s'
      }}>
        
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          backgroundImage: isDark 
            ? 'radial-gradient(circle, #374151 1px, transparent 1px)'
            : 'radial-gradient(circle, #E5E7EB 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}>
          
          {/* Top Header */}
          <header style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '0 12px' : '0 24px',
            zIndex: 40,
            borderBottom: `1px solid ${borderColor}`,
            backgroundColor: headerBg,
            backdropFilter: 'blur(10px)',
            flexShrink: 0,
            gap: isMobile ? '8px' : '0'
          }}>
            
            {/* Left: Materials Switcher */}
            <div style={{ position: 'relative', flex: 1 }} ref={menuRef}>
              <div 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <input 
                  type="text"
                  value={noteName}
                  onChange={(e) => setNoteName(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    fontWeight: 700, 
                    color: textColor,
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: isMobile ? '14px' : '16px',
                    width: `${Math.max(noteName.length + 1, 8)}ch`,
                    maxWidth: isMobile ? '120px' : '300px',
                    textOverflow: 'ellipsis',
                    fontFamily: 'inherit'
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', color: textColor }}>
                  <CaretDown size={18} weight="bold" />
                </div>
              </div>

              {isMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  marginTop: '8px',
                  backgroundColor: dropdownBg,
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  border: `1px solid ${borderColor}`,
                  width: '260px',
                  padding: '12px',
                  zIndex: 50
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: subTextColor, padding: '4px 8px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Backpack Materials</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '300px', overflowY: 'auto' }}>
                    <Link
                      to="/home"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#EA580C',
                        textDecoration: 'none',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#FFF4EA'; 
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <House size={18} weight="fill" />
                      <span>Dashboard Home</span>
                    </Link>
                    <div style={{ height: '1px', backgroundColor: borderColor, margin: '4px 0' }} />
                    {materials.length === 0 && (
                       <div style={{ padding: '8px', fontSize: '13px', color: subTextColor }}>No materials found.</div>
                    )}
                    {materials.map(mat => (
                      <div 
                        key={mat.id}
                        onClick={() => {
                          setNoteName(mat.title);
                          setSelectedMaterial(mat);
                          const newParams = new URLSearchParams(searchParams);
                          newParams.set('materialId', mat.id);
                          setSearchParams(newParams);
                          setIsMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: textColor,
                          transition: 'background-color 0.15s, color 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#FFF4EA'; 
                          e.currentTarget.style.color = isDark ? '#F9FAFB' : '#EA580C';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = textColor;
                        }}
                      >
                        <FileText size={18} weight="fill" color={subTextColor} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {mat.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Center: MAIN TABS (Source | Flashcards | Quizzes) */}
            {!isMobile && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: isDark ? '#1F2937' : '#F8F9FA',
                padding: '4px',
                borderRadius: '9999px',
                border: `1px solid ${borderColor}`,
                flexShrink: 0,
                maxWidth: '100%',
                overflowX: 'auto',
                scrollbarWidth: 'none'
              }}>
                {MAIN_TABS.map((tab, idx) => {
                  const TabIcon = tab.icon;
                  const isActive = activeMainTab === tab.id;
                  let displayCount = tab.count;
                  if (tab.id === 'Flashcards') {
                    const flashcards = selectedMaterial?.analysis?.flashcards || [];
                    displayCount = flashcards.length;
                  }
                  
                  return (
                    <React.Fragment key={tab.id}>
                      <button
                        onClick={() => handleTabChange(tab.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '6px 16px',
                          borderRadius: '9999px',
                          border: 'none',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          backgroundColor: isActive ? (isDark ? '#374151' : '#FFFFFF') : 'transparent',
                          color: isActive ? textColor : subTextColor,
                          boxShadow: isActive && !isDark ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        <TabIcon size={18} weight={isActive ? "bold" : "regular"} />
                        <span>{tab.label}</span>
                        {displayCount !== undefined && displayCount > 0 && (
                          <span style={{ marginLeft: '4px', opacity: 0.6 }}>{displayCount}</span>
                        )}
                      </button>
                      {idx < MAIN_TABS.length - 1 && (
                        <div style={{ width: '1px', height: '16px', backgroundColor: borderColor, margin: '0 4px' }} />
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            )}

            {/* Right: Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '12px', flex: 1, justifyContent: 'flex-end' }}>
              <VoiceChatWidget roomId={roomId} user={user} isDark={isDark} />
              <button 
                onClick={() => setIsShareOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#98FF98', // Luter Green
                  color: '#000000', // Solid black text
                  border: 'none',
                  padding: isMobile ? '6px 10px' : '6px 16px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <ShareNetwork size={18} weight="bold" />
                {!isMobile && <span>Share</span>}
              </button>
              

              {/* Notification Dropdown */}
              <div style={{ position: 'relative' }} ref={notifRef}>
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  title="Notifications"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '38px', height: '38px', borderRadius: '8px',
                    border: 'none', backgroundColor: 'transparent', color: textColor,
                    cursor: 'pointer', transition: 'background-color 0.2s', position: 'relative'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Bell size={20} weight="bold" />
                  <div style={{
                    position: 'absolute', top: '8px', right: '8px',
                    width: '8px', height: '8px', backgroundColor: '#EF4444', borderRadius: '50%'
                  }} />
                </button>

                {isNotifOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', right: '0', marginTop: '8px',
                    backgroundColor: dropdownBg, borderRadius: '12px',
                    boxShadow: '0 12px 48px rgba(0,0,0,0.15)', border: `1px solid ${borderColor}`,
                    width: '320px', zIndex: 50, overflow: 'hidden'
                  }}>
                    <div style={{ padding: '16px', borderBottom: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '15px' }}>Notifications</div>
                      <button style={{ background: 'none', border: 'none', color: '#0066FF', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Mark all read</button>
                    </div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <div style={{ padding: '16px', borderBottom: `1px solid ${borderColor}`, display: 'flex', gap: '12px', cursor: 'pointer' }}
                           onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg}
                           onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0066FF', marginTop: '6px', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '14px', color: textColor, lineHeight: 1.4 }}>
                            <span style={{ fontWeight: 600 }}>Luter Team</span> welcomed you to the beautifully designed Workstation space!
                          </div>
                          <div style={{ fontSize: '12px', color: subTextColor, marginTop: '4px' }}>Just now</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '12px', textAlign: 'center', backgroundColor: isDark ? '#374151' : '#F9FAFB', fontSize: '13px', fontWeight: 600, color: subTextColor, cursor: 'pointer' }}>
                      View all notifications
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setIsDark(!isDark)}
                title="Toggle Dark Mode"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '38px', height: '38px', borderRadius: '8px',
                  border: 'none', backgroundColor: 'transparent', color: textColor,
                  cursor: 'pointer', transition: 'background-color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {isDark ? <Sun size={20} weight="bold" /> : <Moon size={20} weight="bold" />}
              </button>

              {/* Profile Dropdown */}
              <div style={{ position: 'relative' }} ref={profileRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '38px', height: '38px', borderRadius: '50%',
                    border: `2px solid ${borderColor}`, backgroundColor: isDark ? '#374151' : '#F3F4F6',
                    cursor: 'pointer', padding: 0, overflow: 'hidden'
                  }}
                >
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <UserIcon size={20} weight="bold" color={textColor} />
                  )}
                </button>

                {isProfileOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', right: '0', marginTop: '8px',
                    backgroundColor: dropdownBg, borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)', border: `1px solid ${borderColor}`,
                    width: '280px', padding: '16px', zIndex: 50
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      
                      {/* Editable Profile Picture */}
                      <div style={{
                        width: '56px', height: '56px', borderRadius: '50%',
                        backgroundColor: isDark ? '#374151' : '#F3F4F6', position: 'relative',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                      }}>
                        {displayAvatar ? (
                          <img src={displayAvatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <UserIcon size={28} color={subTextColor} />
                        )}
                        
                        <label style={{
                          position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0,
                          transition: 'opacity 0.2s', cursor: 'pointer', color: 'white', fontSize: '11px', fontWeight: 700
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0}
                        >
                          {uploadingAvatar ? '...' : 'EDIT'}
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                        </label>
                      </div>

                      <div>
                        <div style={{ fontWeight: 700, color: textColor, fontSize: '15px' }}>{displayName}</div>
                        <div style={{ color: subTextColor, fontSize: '13px', fontWeight: 500 }}>{email}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      <div style={{
                        flex: 1, backgroundColor: isDark ? '#374151' : '#F9FAFB',
                        padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px'
                      }}>
                        <Star size={22} weight="fill" color="#FCD34D" />
                        <div>
                          <div style={{ fontSize: '12px', color: subTextColor, fontWeight: 600 }}>Level</div>
                          <div style={{ fontWeight: 700, color: textColor }}>{level}</div>
                        </div>
                      </div>
                      <div style={{
                        flex: 1, backgroundColor: isDark ? '#374151' : '#F9FAFB',
                        padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px'
                      }}>
                        <Lightning size={22} weight="fill" color="#60A5FA" />
                        <div>
                          <div style={{ fontSize: '12px', color: subTextColor, fontWeight: 600 }}>XP</div>
                          <div style={{ fontWeight: 700, color: textColor }}>{xp}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: `1px solid ${borderColor}`, margin: '0 -16px', padding: '12px 16px 0' }}>
                      <Link to="/settings" style={{
                        display: 'block', padding: '8px', color: textColor, textDecoration: 'none',
                        fontSize: '14px', borderRadius: '6px', transition: 'background-color 0.2s', fontWeight: 600
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        Account Settings
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ width: '1px', height: '24px', backgroundColor: borderColor, margin: '0 4px' }} />

              <button 
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isChatOpen ? (isDark ? '#374151' : '#E5E7EB') : 'transparent',
                    color: isChatOpen ? (isDark ? '#FFFFFF' : '#111827') : subTextColor,
                    border: 'none',
                    padding: '8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '38px',
                    height: '38px'
                  }}
                  title={isChatOpen ? "Close AI Chat" : "Open AI Chat"}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#E5E7EB'; e.currentTarget.style.color = textColor; }}
                  onMouseLeave={e => { 
                    e.currentTarget.style.backgroundColor = isChatOpen ? (isDark ? '#374151' : '#E5E7EB') : 'transparent';
                    e.currentTarget.style.color = isChatOpen ? (isDark ? '#FFFFFF' : '#111827') : subTextColor;
                  }}
                >
                  <ChatTeardropText size={22} weight={isChatOpen ? "fill" : "regular"} />
                </button>
            </div>
          </header>

          {/* Main Work Area */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            {/* FLOATING SUB-HEADER (Document | Notes | Boards) */}
            {activeMainTab === 'Source' && (
              <div 
                onMouseEnter={() => setIsSubNavHovered(true)}
              onMouseLeave={() => setIsSubNavHovered(false)}
              style={{
                position: 'absolute',
                bottom: '80px',
                left: '24px',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                padding: '8px',
                borderRadius: '16px',
                boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.08)',
                border: `1px solid ${borderColor}`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {SUB_TABS.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      width: isSubNavHovered ? '140px' : '40px',
                      height: '40px',
                      padding: isSubNavHovered ? '0 16px' : '0',
                      justifyContent: isSubNavHovered ? 'flex-start' : 'center',
                      borderRadius: '10px', border: 'none',
                      fontSize: '14px', fontWeight: isActive ? 700 : 500, cursor: 'pointer',
                      backgroundColor: isActive ? (isDark ? '#374151' : '#F1F5F9') : 'transparent',
                      color: isActive ? textColor : subTextColor,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={e => { if(!isActive) e.currentTarget.style.backgroundColor = hoverBg }}
                    onMouseLeave={e => { if(!isActive) e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <TabIcon size={20} weight={isActive ? "fill" : "regular"} style={{ flexShrink: 0 }} />
                    <span style={{ 
                      opacity: isSubNavHovered ? 1 : 0, 
                      whiteSpace: 'nowrap',
                      transition: 'opacity 0.2s',
                      display: isSubNavHovered ? 'block' : 'none'
                    }}>
                      {tab.label}
                    </span>
                  </button>
                )
              })}
            </div>
            )}

            {/* VIEWER AREA */}
            <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
              
              {/* Flashcards View */}
              {activeMainTab === 'Flashcards' && (
                <WorkstationFlashcards 
                  key={selectedMaterial?.id}
                  material={selectedMaterialWithAnalysis} 
                  items={selectedMaterialWithAnalysis?.analysis?.flashcards || []} 
                  isDark={isDark}
                  user={user}
                />
              )}

              {/* Document/Notes Placeholder */}
              {activeMainTab === 'Source' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', height: '100%', minHeight: 0 }}>
                  {selectedMaterial && (
                    <div style={{ flex: 1, display: activeSubTab === 'Document' ? 'flex' : 'none', flexDirection: 'column', position: 'relative', height: '100%', minHeight: 0 }}>
                      <MaterialRenderer
                        key={selectedMaterial.id}
                        material={selectedMaterial}
                        activeTab="source"
                        annotateMode={activeWorkspaceTool === 'annotate'}
                        highlightMode={activeWorkspaceTool === 'highlight'}
                        pinMode={activeWorkspaceTool === 'pin'}
                        annotationColor={strokeColor}
                        annotationStrokeSize={strokeSize}
                        isEraserMode={drawMode === 'eraser'}
                        annotationToolType={drawMode}
                        scrollContainerRef={{ current: null }}
                        isDark={isDark}
                      />
                    </div>
                  )}

                  {selectedMaterial && (
                    <div style={{ flex: 1, display: activeSubTab === 'Notes' ? 'flex' : 'none', flexDirection: 'column', backgroundColor: 'transparent', height: '100%', position: 'relative', minHeight: 0 }}>
                      <RoomProvider
                        id={`luter:notes:${selectedMaterial.id}`}
                        userInfo={{
                          id: user?.id || 'guest',
                          name: displayName,
                          avatar: displayAvatar,
                          color: '#C4B5FD',
                          role: 'editor'
                        }}
                        initialPresence={{
                          cursor: null,
                          cursorChat: null,
                          status: 'active',
                          currentTool: 'notes',
                          user: {
                            id: user?.id || 'guest',
                            name: displayName,
                            avatar: profile?.avatar_url || user?.user_metadata?.avatar_url || null,
                            color: '#C4B5FD',
                            role: 'editor',
                          },
                        }}
                        initialStorage={{
                          noteTitle: selectedMaterial.title || 'Untitled Note',
                          noteIcon: '📄',
                          noteCover: null
                        }}
                      >
                        <ClientSideSuspense fallback={<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', color: '#6B7280', fontFamily: 'Outfit' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite', marginBottom: '12px', color: '#8B5CF6' }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg><div>Connecting Notes...</div></div>}>
                          <CommentsProvider roomId={`luter:notes:${selectedMaterial.id}`}>
                            <LiveNoteEditor 
                              title={selectedMaterial.title} 
                              roomId={`luter:notes:${selectedMaterial.id}`} 
                              displayName={displayName} 
                              user={user} 
                              profile={profile} 
                              hideHeader={true}
                              workstationMode={true}
                              onOpenAiChat={() => setIsChatOpen(true)}
                              emptyState={(editor) => (
                                <WorkstationEmptyState 
                                  editor={editor} 
                                  material={selectedMaterial} 
                                  isGenerating={isGenerating} 
                                  setIsGenerating={setIsGenerating} 
                                />
                              )}
                            />
                          </CommentsProvider>
                        </ClientSideSuspense>
                      </RoomProvider>
                    </div>
                  )}
                </div>
              )}

              {/* Excalidraw Board */}
              {activeMainTab === 'Source' && (
                <div id="luter-board-container" style={isBoardFullScreen ? {
                  position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: isDark ? '#111827' : '#F9FAFB',
                  display: activeSubTab === 'Boards' ? 'flex' : 'none', flexDirection: 'column'
                } : {
                  flex: 1, position: 'relative', display: activeSubTab === 'Boards' ? 'flex' : 'none', flexDirection: 'column', width: '100%', height: '100%'
                }}>
                  <div style={{ position: 'absolute', top: '10px', right: '16px', zIndex: 50 }}>
                    <button 
                      onClick={() => {
                        if (!document.fullscreenElement) {
                          document.documentElement.requestFullscreen().catch(err => {
                            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
                          });
                        } else {
                          document.exitFullscreen();
                        }
                        setIsBoardFullScreen(!isBoardFullScreen);
                      }}
                      style={{
                        backgroundColor: isDark ? '#374151' : '#FFFFFF', color: textColor,
                        border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '8px 12px',
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', fontWeight: 600, fontSize: '13px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#FFFFFF'}
                    >
                      {isBoardFullScreen || !!document.fullscreenElement ? <CornersIn size={16} weight="bold"/> : <CornersOut size={16} weight="bold"/>}
                      {isBoardFullScreen || !!document.fullscreenElement ? 'Exit Full Screen' : 'Full Screen'}
                    </button>
                  </div>
                  
                  <Whiteboard isCollaborative={true} roomId={roomId} />
                </div>
              )}

              {/* Collaborative Quizzes View */}
              {activeMainTab === 'Quizzes' && (
                <WorkstationQuizzes 
                  key={selectedMaterial?.id}
                  material={selectedMaterialWithAnalysis} 
                  isDark={isDark}
                  user={user}
                  onRegenerateQuiz={() => runAnalysis('quiz')}
                  isAnalysisLoading={isAnalysisLoading}
                />
              )}

            </div>

            {/* Centered Study Tools Toolbar Dock (Hidden in Boards and Notes tab) */}
            {activeMainTab === 'Source' && activeSubTab === 'Document' && (
              <div style={{
                position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 40,
              }}>
                <AnnotationToolbar 
                  activeWorkspaceTool={activeWorkspaceTool}
                  isEraserMode={drawMode === 'eraser'}
                  setIsEraserMode={(val) => setDrawMode(val ? 'eraser' : 'pen')}
                  strokeColor={strokeColor} setStrokeColor={setStrokeColor}
                  strokeSize={strokeSize} setStrokeSize={setStrokeSize}
                  ANNOTATION_COLORS={ANNOTATION_COLORS} STROKE_SIZES={STROKE_SIZES}
                  isDark={isDark}
                  visible={['annotate', 'highlight', 'pin'].includes(activeWorkspaceTool)}
                />
                
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: isDark ? 'rgba(31, 41, 55, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(20px)', padding: '8px 12px', borderRadius: '9999px',
                  border: `1px solid ${borderColor}`, boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
                  maxWidth: '100%', overflowX: 'auto', scrollbarWidth: 'none'
                }}>
                  {BOTTOM_WORKSPACE_TOOLS.map(tool => {
                    const ToolIcon = tool.icon;
                    const isActive = activeWorkspaceTool === tool.id;
                    return (
                      <button key={tool.id} onClick={() => setActiveWorkspaceTool(isActive ? null : tool.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '10px 20px', borderRadius: '9999px',
                          fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                          border: `2px solid ${isActive ? tool.activeBorder : tool.baseBorder}`,
                          backgroundColor: isActive ? tool.activeBg : tool.baseBg,
                          color: isActive ? tool.activeColor : tool.baseColor,
                          transition: 'all 0.2s', boxShadow: isActive ? 'inset 0 2px 6px rgba(0,0,0,0.08)' : 'none'
                        }}
                        onMouseEnter={e => { if(!isActive) e.currentTarget.style.transform = 'scale(1.05)' }}
                        onMouseLeave={e => { if(!isActive) e.currentTarget.style.transform = 'scale(1)' }}
                      >
                        <ToolIcon size={22} weight={isActive ? "fill" : "bold"} />
                        {!isMobile && <span>{tool.label}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {isMobile ? (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            zIndex: 1000000, display: isChatOpen ? 'block' : 'none',
            backgroundColor: isDark ? '#111827' : '#FFFFFF'
          }}>
            <WorkspaceRightPanel 
              isOpen={isChatOpen} 
              onClose={() => setIsChatOpen(false)} 
              mode="sidebar"
              setMode={() => {}}
              panelWidth="100%"
              setPanelWidth={setChatWidth}
              isDark={isDark}
              user={user}
              profile={profile}
              currentNoteId={selectedMaterial?.id}
            />
          </div>
        ) : (
          <div style={isBoardFullScreen ? {
            position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 1000000,
            display: isChatOpen ? 'block' : 'none',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.1)'
          } : {
            display: isChatOpen ? 'block' : 'none'
          }}>
            <WorkspaceRightPanel 
              isOpen={isChatOpen} 
              onClose={() => setIsChatOpen(false)} 
              mode="sidebar"
              setMode={() => {}}
              panelWidth={chatWidth}
              setPanelWidth={setChatWidth}
              isDark={isDark}
              user={user}
              profile={profile}
              currentNoteId={selectedMaterial?.id}
            />
          </div>
        )}

        {/* Share Overlay */}
        {isShareOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{
              width: '90%', maxWidth: '500px', backgroundColor: dropdownBg, borderRadius: '24px', padding: '32px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.4)', border: `1px solid ${isDark ? 'rgba(152, 255, 152, 0.15)' : 'rgba(0,0,0,0.08)'}`,
              color: textColor, display: 'flex', flexDirection: 'column', gap: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: 800, color: isDark ? '#98FF98' : '#111827' }}>Share Workspace</h3>
                  <p style={{ margin: 0, fontSize: '15px', color: subTextColor, fontWeight: 500, lineHeight: 1.5 }}>
                    Collaborate with others in real-time on <span style={{ color: textColor, fontWeight: 700 }}>{noteName}</span>. Your personal chat history is kept private.
                  </p>
                </div>
                <button onClick={() => setIsShareOpen(false)} style={{
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer', color: textColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '50%',
                  transition: 'background 0.2s'
                }}>
                  <CloseIcon size={20} weight="bold"/>
                </button>
              </div>
              
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="Invite by email address..." 
                  style={{
                    width: '100%', padding: '16px 20px', borderRadius: '12px', 
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F9FAFB',
                    color: textColor, outline: 'none', fontSize: '15px', fontWeight: 500, boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#98FF98'}
                  onBlur={e => e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                />
                <button style={{
                  position: 'absolute', right: '8px', top: '8px', bottom: '8px',
                  backgroundColor: '#98FF98', color: '#000000', border: 'none', borderRadius: '8px',
                  padding: '0 16px', fontWeight: 700, cursor: 'pointer', fontSize: '14px'
                }}>
                  Invite
                </button>
              </div>
              
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: subTextColor, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Who has access</span>
                  <span>{collaborators.length + 1} People</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '180px', overflowY: 'auto', paddingRight: '8px' }}>
                  {/* Owner */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', backgroundColor: isDark ? '#374151' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {displayAvatar ? <img src={displayAvatar} style={{width:'100%', height:'100%', objectFit: 'cover'}} alt="You"/> : <UserIcon size={24} color={subTextColor} weight="fill"/>}
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 600 }}>{displayName} <span style={{ color: subTextColor, fontSize: '14px', fontWeight: 500 }}>(you)</span></div>
                        <div style={{ fontSize: '13px', color: subTextColor, fontWeight: 500 }}>{email || 'Owner'}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: subTextColor, fontWeight: 600, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', padding: '4px 10px', borderRadius: '12px' }}>Owner</div>
                  </div>
                  
                  {/* Collaborators */}
                  {collaborators.map((collab, index) => {
                    const collabProfile = collab.profiles || {};
                    const collabName = collabProfile.full_name || 'Anonymous User';
                    const collabAvatar = collabProfile.avatar_url;
                    const collabEmail = collabProfile.email || 'Joined via link';
                    
                    return (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', backgroundColor: isDark ? '#374151' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {collabAvatar ? <img src={collabAvatar} style={{width:'100%', height:'100%', objectFit: 'cover'}} alt={collabName}/> : <UserIcon size={24} color={subTextColor} weight="fill"/>}
                          </div>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: 600 }}>{collabName}</div>
                            <div style={{ fontSize: '13px', color: subTextColor, fontWeight: 500 }}>{collabEmail}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: '13px', color: '#98FF98', fontWeight: 600 }}>Editor</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <button 
                onClick={handleCopyLink}
                style={{
                  width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                  backgroundColor: copiedToast ? '#10B981' : isDark ? '#374151' : '#F3F4F6', 
                  color: copiedToast ? 'white' : textColor, fontWeight: 700, cursor: 'pointer',
                  fontSize: '16px', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                }}
                onMouseEnter={e => { if(!copiedToast) e.currentTarget.style.backgroundColor = isDark ? '#4B5563' : '#E5E7EB' }}
                onMouseLeave={e => { if(!copiedToast) e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#F3F4F6' }}
              >
                {copiedToast ? 'Copied to clipboard!' : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    Copy Link
                  </>
                )}
              </button>

              {/* Social Sharing Icons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
                {[
                  { icon: WhatsappLogo, name: 'WhatsApp', color: '#25D366' },
                  { icon: ChatsCircle, name: 'GroupMe', color: '#00AFF0' },
                  { icon: DiscordLogo, name: 'Discord', color: '#5865F2' },
                  { icon: RedditLogo, name: 'Reddit', color: '#FF4500' },
                  { icon: LinkedinLogo, name: 'LinkedIn', color: '#0A66C2' }
                ].map(social => (
                  <div key={social.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'transform 0.2s' }}
                       onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                       onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <div style={{ 
                      width: '42px', height: '42px', borderRadius: '50%', backgroundColor: social.color, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                      <social.icon size={24} color="white" weight="fill" />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: subTextColor }}>{social.name}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}
        </div>
      )}
      </ReadingSpaceProvider>
    </CollaborationProvider>
  );
}
