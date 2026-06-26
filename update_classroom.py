import re

with open('c:/Softwares/Luter/src/classroom/ClassroomDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start of the return block
start_idx = content.find('  if (rooms.length === 0) {')

# The new return block
new_return = """  return (
    <div className="cls-layout-root">
      {/* Top Navbar */}
      <header className="cls-header">
        <div className="cls-header-left">
          <button className="cls-icon-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <List size={24} weight="regular" />
          </button>
          <div className="cls-logo-area">
            <img src="/Header logo.png" alt="Logo" className="cls-logo-img" />
            <span className="cls-logo-text">Classroom</span>
          </div>
        </div>
        <div className="cls-header-right">
          <button className="cls-icon-btn" onClick={handleStartOnboard} title="Create or join a class">
            <Plus size={24} weight="regular" />
          </button>
          <button className="cls-icon-btn">
            <DotsNine size={24} weight="regular" />
          </button>
          <div className="cls-avatar">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Profile" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} />
            ) : userInitials}
          </div>
        </div>
      </header>

      <div className="cls-body">
        <ClassroomSidebar collapsed={sidebarCollapsed} activeNav="home" />

        <main style={{ flex: 1, padding: '32px', overflowY: 'auto', background: '#ffffff' }}>
          {rooms.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div className="cls-card">
                <h2 className="cls-title">Enter your join code</h2>
                <div className="cls-inputs-container">
                  {code.map((char, idx) => (
                    <input
                      key={idx}
                      ref={el => inputRefs.current[idx] = el}
                      type="text"
                      maxLength={1}
                      value={char}
                      onChange={(e) => handleChange(e, idx)}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                      onPaste={handlePaste}
                      className="cls-input"
                      placeholder="-"
                    />
                  ))}
                </div>
                <button 
                  className="cls-btn-next"
                  onClick={handleNext}
                  disabled={code.join('').length !== 6}
                >
                  Next
                </button>
                <button className="cls-create-btn" onClick={handleStartOnboard}>
                  Create a new classroom instead
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {rooms.map((room, idx) => {
                const bg = GC_COLORS[idx % GC_COLORS.length];
                const seed = SEEDS[idx % SEEDS.length];
                return (
                  <div 
                    key={room.id} 
                    onClick={() => navigate(`/workstation?sessionId=${room.id}&type=classroom`)}
                    className="cls-gc-card"
                  >
                    <div className="cls-gc-banner" style={{ backgroundColor: bg }}>
                      <img src={`https://api.dicebear.com/7.x/micah/svg?seed=${seed}&backgroundColor=transparent`} alt="Room Bemoji" className="cls-gc-bg-img" />
                      <h3 className="cls-gc-title">{room.session_name}</h3>
                      <p className="cls-gc-subtitle">Luter Classroom</p>
                    </div>
                    <div className="cls-gc-content">
                       {/* Space for assignments or updates */}
                    </div>
                    <div className="cls-gc-footer">
                      <TrendUp size={24} className="cls-footer-icon" />
                      <Folder size={24} className="cls-footer-icon" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Modals for Create and Join */}
      {isJoinOpen && (
        <div className="cls-onboard-overlay">
          <div className="cls-card" style={{ position: 'relative' }}>
            <button 
              onClick={() => setIsJoinOpen(false)} 
              style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sb-text)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <h2 className="cls-title">Enter your join code</h2>
            
            <div className="cls-inputs-container">
              {code.map((char, idx) => (
                <input
                  key={idx}
                  ref={el => inputRefs.current[idx] = el}
                  type="text"
                  maxLength={1}
                  value={char}
                  onChange={(e) => handleChange(e, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  onPaste={handlePaste}
                  className="cls-input"
                  placeholder="-"
                />
              ))}
            </div>

            <button 
              className="cls-btn-next"
              onClick={handleNext}
              disabled={code.join('').length !== 6}
            >
              Join Room
            </button>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div className="cls-onboard-overlay">
          <div className="cls-onboard-card">
            
            {/* Top Bar with Back Button & Progress Bar */}
            <div className="cls-card-top-bar">
              <button 
                type="button" 
                className="cls-btn-back" 
                onClick={() => {
                  if (step > 1) {
                    setStep(step - 1);
                  } else {
                    setIsCreateOpen(false);
                  }
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>

              <div className="cls-progress-bar-container">
                <div className="cls-progress-bar-fill" style={{ width: `${(step / 4) * 100}%` }} />
              </div>
            </div>

            <form className="cls-onboard-form-inner" onSubmit={handleCreateRoomSubmit}>
              
              {/* Minimal Mascot Logo Inline (Gizmo style) */}
              <div className="cls-mascot-header-inline">
                <img src="/mascot.png" alt="Luter Mascot Logo" className="cls-mascot-logo-small" />
                <span className="cls-mascot-label">Gizmo</span>
              </div>

              {/* STEP 1: Room Name (Jane-PHY102, Forced Caps) */}
              {step === 1 && (
                <>
                  <h3 className="cls-question-title">Name Your Classroom</h3>
                  <p className="cls-question-desc">Give your study room a clear title (e.g. Jane-PHY102).</p>
                  <input 
                    type="text" 
                    className="cls-huge-input cls-uppercase"
                    placeholder="E.G. JANE-PHY102"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value.toUpperCase())}
                    autoFocus
                    required
                  />
                </>
              )}

              {/* STEP 2: Level (100, 200, 300, 400, 500) */}
              {step === 2 && (
                <>
                  <h3 className="cls-question-title">Choose The Level Of This Class</h3>
                  <p className="cls-question-desc">Select the academic degree or course level.</p>
                  
                  <div className="cls-level-cards">
                    {LEVELS.map((lvl) => (
                      <div 
                        key={lvl.val}
                        className={`cls-level-card ${educationLevel === lvl.val ? 'active' : ''}`}
                        onClick={() => setEducationLevel(lvl.val)}
                      >
                        <div className="cls-level-card-header">
                          <span className="cls-level-num">{lvl.label}</span>
                          <div className="cls-level-card-radio">
                            <div className="cls-level-card-radio-inner" />
                          </div>
                        </div>
                        <span className="cls-level-label">{lvl.desc}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* STEP 3: Department */}
              {step === 3 && (
                <>
                  <h3 className="cls-question-title">Which Department Is This Class In?</h3>
                  <p className="cls-question-desc">Choose from your university's academic programmes.</p>
                  
                  <input 
                    type="text"
                    className="cls-huge-input"
                    placeholder="Search department (e.g. Computer Science, Physics...)"
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                    autoFocus
                  />

                  <div className="cls-level-list">
                    {filteredDepts.map((deptName) => (
                      <div 
                        key={deptName}
                        className={`cls-level-item ${department === deptName ? 'active' : ''}`}
                        onClick={() => handleSelectDept(deptName)}
                      >
                        {deptName}
                      </div>
                    ))}
                    {filteredDepts.length === 0 && (
                      <div style={{ padding: '16px', fontSize: '13px', color: 'var(--sb-text-secondary)', textAlign: 'center' }}>
                        No matching departments found.
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* STEP 4: Scheduler Widget */}
              {step === 4 && (
                <>
                  <h3 className="cls-question-title">Schedule Your Sessions</h3>
                  <p className="cls-question-desc">Select an upcoming day and time slot for your sessions.</p>
                  
                  <span className="cls-sched-section-title">Select Day</span>
                  <div className="cls-sched-days-row">
                    {scheduleDays.map((day) => (
                      <div
                        key={day.dateStr}
                        className={`cls-sched-day-card ${selectedDateStr === day.dateStr ? 'active' : ''}`}
                        onClick={() => setSelectedDateStr(day.dateStr)}
                      >
                        <span className="cls-sched-day-wk">{day.weekday}</span>
                        <span className="cls-sched-day-num">{day.dayNum}</span>
                        <span className="cls-sched-day-mo">{day.month}</span>
                      </div>
                    ))}
                  </div>

                  <span className="cls-sched-section-title">Select Time</span>
                  <div className="cls-sched-time-grid">
                    {SCHED_TIME_SLOTS.map((slot) => (
                      <div
                        key={slot}
                        className={`cls-sched-time-card ${selectedTimeSlot === slot ? 'active' : ''}`}
                        onClick={() => setSelectedTimeSlot(slot)}
                      >
                        {slot}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Centering Area for Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                {/* Centered Continue Button */}
                <button 
                  type="submit" 
                  className="cls-continue-btn-centered" 
                  disabled={(step === 1 && !roomName.trim()) || isCreating}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {isCreating && step === 4 && <SpinnerGap weight="bold" className="animate-spin" size={20} />}
                  {step === 4 ? (isCreating ? 'Creating...' : 'Create Classroom') : 'Continue'}
                </button>

                {/* Skip Step Button */}
                {step === 2 && (
                  <button 
                    type="button" 
                    className="cls-skip-btn"
                    onClick={handleSkipLevel}
                  >
                    Skip this step
                  </button>
                )}

                {step === 4 && (
                  <button 
                    type="button" 
                    className="cls-skip-btn"
                    disabled={isCreating}
                    onClick={handleSkipSchedule}
                  >
                    {isCreating ? 'Creating...' : 'Skip schedule & create'}
                  </button>
                )}
              </div>

            </form>
          </div>

          <div className="cls-bottom-mascots">
            <img src="https://api.dicebear.com/7.x/micah/svg?seed=Felix&backgroundColor=transparent" alt="Bemoji" className="cls-bemoji" />
            <img src="https://api.dicebear.com/7.x/micah/svg?seed=Jasper&backgroundColor=transparent" alt="Bemoji" className="cls-bemoji" />
            <img src="/mascot.png" alt="Luter Mascot" className="cls-mascot-img" />
            <img src="https://api.dicebear.com/7.x/micah/svg?seed=Luna&backgroundColor=transparent" alt="Bemoji" className="cls-bemoji" />
            <img src="https://api.dicebear.com/7.x/micah/svg?seed=Milo&backgroundColor=transparent" alt="Bemoji" className="cls-bemoji" />
          </div>
        </div>
      )}
    </div>
  );
}
"""

new_content = content[:start_idx] + new_return

with open('c:/Softwares/Luter/src/classroom/ClassroomDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
