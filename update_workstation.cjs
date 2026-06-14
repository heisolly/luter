const fs = require('fs');

const filepath = 'src/components/dashboard/WorkstationPage.jsx';
let content = fs.readFileSync(filepath, 'utf-8');

// 1. Add new state variables
const state_injection = `  const [activeTab, setActiveTab] = useState('content')
  const [activeSubTab, setActiveSubTab] = useState('document')
  const [isBoardFullscreen, setIsBoardFullscreen] = useState(false)`;
content = content.replace("  const [activeTab, setActiveTab] = useState('content')", state_injection);

// 2. Modify topNavigationTabs
const old_tabs = `  const topNavigationTabs = [
    { id: 'content', label: 'Source', icon: FileText, onClick: () => { setActiveTab('content'); setActiveSideTab('chat') } },
    { id: 'summary', label: 'Summary', icon: Sparkle, onClick: () => setActiveTab('summary') },
    { id: 'flashcards', label: 'Cards', icon: Stack, onClick: () => { setActiveTab('flashcards'); setActiveSideTab('flashcards') } },
    { id: 'quiz', label: 'Quiz', icon: Checks, onClick: () => { setActiveTab('quiz'); setActiveSideTab('quiz') } },
  ]`;
const new_tabs = `  const topNavigationTabs = [
    { id: 'content', label: 'Source', icon: FileText, onClick: () => { setActiveTab('content'); setActiveSideTab('chat') } },
    { id: 'flashcards', label: 'Flashcards', icon: Stack, onClick: () => { setActiveTab('flashcards'); setActiveSideTab('flashcards') } },
    { id: 'quiz', label: 'Quizzes', icon: Checks, onClick: () => { setActiveTab('quiz'); setActiveSideTab('quiz') } },
  ]`;
content = content.replace(old_tabs, new_tabs);

// 3. Update the Whiteboard View section
const old_whiteboard = `          {/* 4. Whiteboard View */}
          <div style={{
            flex: 1,
            display: activeTab === 'board' ? 'flex' : 'none',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
            background: 'white',
            position: 'relative',
          }}>
            <Whiteboard roomId={roomId} />
          </div>`;
const new_whiteboard = `          {/* 4. Whiteboard View */}
          <div style={{
            flex: 1,
            display: (activeTab === 'content' && activeSubTab === 'board') ? 'flex' : 'none',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
            background: 'white',
            position: isBoardFullscreen ? 'fixed' : 'absolute',
            top: isBoardFullscreen ? 0 : 0,
            left: isBoardFullscreen ? 0 : 0,
            width: isBoardFullscreen ? '100vw' : '100%',
            height: isBoardFullscreen ? '100vh' : '100%',
            zIndex: isBoardFullscreen ? 99999 : 20,
          }}>
            <Whiteboard roomId={roomId} isCollaborative={true} />
            {isBoardFullscreen && (
              <button onClick={() => setIsBoardFullscreen(false)} style={{ position: 'absolute', top: 24, right: 24, zIndex: 100000, padding: '10px 16px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>
                Exit Full Screen
              </button>
            )}
            {!isBoardFullscreen && activeSubTab === 'board' && (
              <button onClick={() => setIsBoardFullscreen(true)} style={{ position: 'absolute', top: 24, right: 24, zIndex: 100000, padding: '10px 16px', background: '#6D28D9', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>
                Full Screen
              </button>
            )}
          </div>`;
content = content.replace(old_whiteboard, new_whiteboard);

// 4. Modify Main Workspace Empty State Condition
const old_empty = `          {/* 5. Main Workspace (Document & Notes) */}
          {!selectedMaterial ? (
            <div style={{ height: '100%', display: (activeTab !== 'summary' && activeTab !== 'flashcards' && activeTab !== 'quiz' && activeTab !== 'board') ? 'flex' : 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', flex: 1 }}>`;
const new_empty = `          {/* 5. Main Workspace (Document & Notes) */}
          {!selectedMaterial ? (
            <div style={{ height: '100%', display: (activeTab === 'content' && activeSubTab !== 'board') ? 'flex' : 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', flex: 1 }}>`;
content = content.replace(old_empty, new_empty);

// 5. Modify Main Workspace Container Condition
const old_main = `          ) : (
            <div style={{
              flex: 1,
              display: (activeTab !== 'summary' && activeTab !== 'flashcards' && activeTab !== 'quiz' && activeTab !== 'board') ? 'flex' : 'none',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
              height: '100%'
            }}>`;
const new_main = `          ) : (
            <div style={{
              flex: 1,
              display: (activeTab === 'content' && activeSubTab !== 'board') ? 'flex' : 'none',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
              height: '100%'
            }}>
              
              {/* Floating Sub Header (Document | Notes | Boards) */}
              <div style={{
                position: 'absolute', top: 16, left: 24, zIndex: 30,
                display: 'flex', alignItems: 'center',
              }}>
                <div style={{
                    display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '4px', borderRadius: '9999px', border: '1px solid rgba(0,0,0,0.08)', backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                  {[
                    { id: 'document', label: 'Document', icon: FileText },
                    { id: 'notes', label: 'Notes', icon: PencilLine },
                    { id: 'board', label: 'Boards', icon: Chalkboard }
                  ].map((tab, idx) => {
                    const TabIcon = tab.icon;
                    const isActive = activeSubTab === tab.id;
                    return (
                      <React.Fragment key={tab.id}>
                        <button
                          onClick={() => setActiveSubTab(tab.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px', borderRadius: '9999px',
                            border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                            backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                            color: isActive ? '#111827' : '#6B7280',
                            boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.2s'
                          }}
                        >
                          <TabIcon size={16} weight={isActive ? "bold" : "regular"} />
                          <span>{tab.label}</span>
                        </button>
                        {idx < 2 && (<div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(0,0,0,0.08)', margin: '0 4px' }} />)}
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>`;
content = content.replace(old_main, new_main);

// 6. Notes View condition
const old_notes = `              {/* Notes View */}
              <div className="ws-scroll-container" style={{
                flex: 1,
                display: activeTab === 'notes' ? 'block' : 'none',`;
const new_notes = `              {/* Notes View */}
              <div className="ws-scroll-container" style={{
                flex: 1,
                display: activeSubTab === 'notes' ? 'block' : 'none',`;
content = content.replace(old_notes, new_notes);

// 7. Document Viewer condition
const old_doc = `              {/* Document Viewer View */}
              <div className="ws-visual-viewport" style={{
                flex: 1,
                display: activeTab !== 'notes' ? 'flex' : 'none',`;
const new_doc = `              {/* Document Viewer View */}
              <div className="ws-visual-viewport" style={{
                flex: 1,
                display: activeSubTab === 'document' ? 'flex' : 'none',`;
content = content.replace(old_doc, new_doc);

// 8. Bottom Workspace Tools array modification
const old_tools = `const BOTTOM_WORKSPACE_TOOLS = [
  {
    id: 'highlight', label: 'Highlight', icon: Highlighter,
    baseBg: '#FEF3C7', baseBorder: '#FDE68A', baseColor: '#D97706',
    activeBg: '#FDE68A', activeBorder: '#F59E0B', activeColor: '#92400E',
  },
  {
    id: 'board', label: 'Board', icon: PencilLine,
    baseBg: '#DBEAFE', baseBorder: '#BFDBFE', baseColor: '#2563EB',
    activeBg: '#BFDBFE', activeBorder: '#60A5FA', activeColor: '#1D4ED8',
  },
  {
    id: 'annotate', label: 'Annotate', icon: PencilSimple,
    baseBg: '#F5F3FF', baseBorder: '#DDD6FE', baseColor: '#7C3AED',
    activeBg: '#EDE9FE', activeBorder: '#A78BFA', activeColor: '#6D28D9',
  },
];`;
const new_tools = `const BOTTOM_WORKSPACE_TOOLS = [
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
];`;
content = content.replace(old_tools, new_tools);

fs.writeFileSync(filepath, content, 'utf-8');
console.log('Done!');
