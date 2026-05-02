import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../supabaseClient'

export const useUniversalWorkspaceStore = create(
  persist(
    (set, get) => ({
      // User Profile & Invisible Routing
      userRole: null, // 'student', 'teacher', 'solo_learner'
      educationLevel: null, // 'Primary', 'Secondary', 'Tertiary', 'Professional'
      firstAction: null, // 'join_class', 'create_class', 'upload_private', 'browse'
      institution: null,
      programName: null,
      levelGrade: null,
      
      // Workspace State
      activeWorkspace: null,
      workspaces: [],
      activeBackpackTab: 'workspaces', // 'workspaces' | 'decks'
      
      // Deck State (enhanced from existing)
      decks: [],
      smartStartDecks: [],
      
      // Classroom State (Teacher-Student Bridge)
      classrooms: [],
      activeClassroom: null,
      
      // UI State
      loading: false,
      error: null,
      
      // ── INVISIBLE USER ROUTING ──
      // Detect user role based on first action
      detectUserRole: async (action, context = {}) => {
        const state = get()
        let role = 'solo_learner'
        let educationLevel = 'Tertiary' // default
        
        switch (action) {
          case 'join_class':
            role = 'student'
            educationLevel = context.educationLevel || 'Tertiary'
            break
          case 'create_class':
            role = 'teacher'
            educationLevel = context.educationLevel || 'Tertiary'
            break
          case 'upload_private':
            role = 'solo_learner'
            educationLevel = context.educationLevel || 'Professional'
            break
          case 'browse':
            role = 'solo_learner'
            educationLevel = context.educationLevel || 'Tertiary'
            break
        }
        
        set({
          userRole: role,
          educationLevel,
          firstAction: action,
          institution: context.institution || null,
          programName: context.programName || null,
          levelGrade: context.levelGrade || null
        })
        
        // Save to database
        await state.saveUserProfile()
        
        // Initialize appropriate workspaces
        await state.initializeWorkspaces()
        
        return { role, educationLevel }
      },
      
      // Save user education profile
      saveUserProfile: async () => {
        const state = get()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return
        
        const profile = {
          id: user.id,
          education_level: state.educationLevel,
          university: state.institution,
          faculty: state.programName,
          level: state.levelGrade,
          role_preference: state.userRole,
          onboarding_completed: true,
          first_action: state.firstAction,
          updated_at: new Date().toISOString()
        }
        
        // Try to update existing profile or insert new one
        const { error } = await supabase
          .from('profiles')
          .upsert(profile, { onConflict: 'id' })
          
        if (error) console.error('Error saving user profile:', error)
      },
      
      // Load user profile
      loadUserProfile: async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
          
        if (error) {
          console.error('Error loading user profile:', error)
          return
        }
        
        if (data) {
          set({
            educationLevel: data.education_level,
            userRole: data.role_preference,
            institution: data.university,
            programName: data.faculty,
            levelGrade: data.level,
            firstAction: data.first_action
          })
        }
      },
      
      // ── UNIVERSAL WORKSPACE HIERARCHY ──
      // Initialize workspaces based on user role and education level
      initializeWorkspaces: async () => {
        const state = get()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        set({ loading: true })
        
        try {
          // Load existing courses as workspaces
          const { data: courses, error } = await supabase
            .from('user_courses')
            .select(`
              *,
              courses(*)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            
          if (error) throw error
          
          // Transform courses into workspace structure
          const workspaceStructure = state.getWorkspaceStructure()
          const workspaces = courses ? courses.map(course => ({
            id: course.id,
            title: course.courses?.name || 'Untitled Course',
            type: state.getWorkspaceType(),
            educationLevel: state.educationLevel,
            structure: workspaceStructure,
            courseData: course.courses,
            isActive: true
          })) : []
          
          // Add personal workspace for solo learners
          if (state.userRole === 'solo_learner') {
            workspaces.unshift({
              id: 'personal',
              title: 'Personal Vault',
              type: 'personal',
              educationLevel: state.educationLevel,
              structure: state.getPersonalStructure(),
              isActive: true
            })
          }
          
          set({ 
            workspaces,
            activeWorkspace: workspaces.length > 0 ? workspaces[0] : null
          })
          
          // Load decks
          await state.loadDecks()
          
        } catch (error) {
          console.error('Error initializing workspaces:', error)
          set({ error: error.message })
        } finally {
          set({ loading: false })
        }
      },
      
      // Get workspace structure based on education level
      getWorkspaceStructure: () => {
        const state = get()
        switch (state.educationLevel) {
          case 'Primary':
            return [
              { name: 'Mathematics', type: 'subject', icon: '🔢' },
              { name: 'English', type: 'subject', icon: '📖' },
              { name: 'Science', type: 'subject', icon: '🔬' },
              { name: 'Art', type: 'subject', icon: '🎨' }
            ]
          case 'Secondary':
            return [
              { name: 'Mathematics', type: 'class', icon: '📐' },
              { name: 'English Language', type: 'class', icon: '📝' },
              { name: 'Sciences', type: 'class', icon: '🧪' },
              { name: 'Social Studies', type: 'class', icon: '🌍' }
            ]
          case 'Tertiary':
            return Array.from({ length: 16 }, (_, i) => ({
              name: `Week ${i + 1}`,
              type: 'week',
              icon: '📅'
            }))
          case 'Professional':
            return [
              { name: 'Research', type: 'project', icon: '🔍' },
              { name: 'Documentation', type: 'project', icon: '📋' },
              { name: 'Resources', type: 'project', icon: '📚' }
            ]
          default:
            return []
        }
      },
      
      // Get workspace type based on education level
      getWorkspaceType: () => {
        const state = get()
        switch (state.educationLevel) {
          case 'Primary': return 'grade_content'
          case 'Secondary': return 'grade_content'
          case 'Tertiary': return 'semester_content'
          case 'Professional': return 'project'
          default: return 'personal'
        }
      },
      
      // Get personal workspace structure
      getPersonalStructure: () => {
        return [
          { name: 'Documents', type: 'folder', icon: '📄' },
          { name: 'Research', type: 'folder', icon: '🔍' },
          { name: 'Notes', type: 'folder', icon: '📝' }
        ]
      },
      
      // Load user decks
      loadDecks: async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        const { data, error } = await supabase
          .from('decks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          
        if (error) {
          console.error('Error loading decks:', error)
          return
        }
        
        set({ decks: data || [] })
        
        // Create smart start deck if no decks exist
        if (!data || data.length === 0) {
          const currentState = get()
          await currentState.createSmartStartDeck()
        }
      },
      
      // Create Smart Start deck based on education level
      createSmartStartDeck: async () => {
        const state = get()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        set({ loading: true })
        
        try {
          const smartStartContent = state.getSmartStartContent()
          
          const { data: deck, error: deckError } = await supabase
            .from('decks')
            .insert([{
              user_id: user.id,
              title: smartStartContent.title,
              description: smartStartContent.description,
              deck_type: 'smart_start',
              education_level: state.educationLevel
            }])
            .select()
            .single()
            
          if (deckError) throw deckError
          
          // Add smart start items to deck
          const deckItems = smartStartContent.items.map((item, index) => {
            return {
              deck_id: deck.id,
              content_id: crypto.randomUUID(),
              content_type: 'note',
              order_index: index,
              metadata: {
                type: item.type,
                title: item.title,
                description: item.description,
                is_smart_start: true
              }
            };
          });
          
          const { error: itemsError } = await supabase
            .from('deck_items')
            .insert(deckItems)
            
          if (itemsError) throw itemsError
          
          // Reload decks
          await state.loadDecks()
          
        } catch (error) {
          console.error('Error creating smart start deck:', error)
        } finally {
          set({ loading: false })
        }
      },
      
      // Get Smart Start content based on education level
      getSmartStartContent: () => {
        const state = get()
        switch (state.educationLevel) {
          case 'Primary':
            return {
              title: 'Math Foundations Starter',
              description: 'Essential math topics for primary students',
              items: [
                { title: 'Numbers & Counting', type: 'topic', description: 'Learn to count and recognize numbers' },
                { title: 'Basic Addition', type: 'topic', description: 'Simple addition problems' },
                { title: 'Shapes & Patterns', type: 'topic', description: 'Identify shapes and patterns' }
              ]
            }
          case 'Secondary':
            return {
              title: 'Science Explorer Starter',
              description: 'Core science concepts for secondary students',
              items: [
                { title: 'Scientific Method', type: 'chapter', description: 'How to conduct experiments' },
                { title: 'Matter & Atoms', type: 'chapter', description: 'Understanding basic chemistry' },
                { title: 'Energy & Forces', type: 'chapter', description: 'Physics fundamentals' }
              ]
            }
          case 'Tertiary':
            return {
              title: 'University Success Starter',
              description: 'Essential skills for university students',
              items: [
                { title: 'Effective Note-Taking', type: 'week', description: 'How to take better notes' },
                { title: 'Study Techniques', type: 'week', description: 'Proven study methods' },
                { title: 'Time Management', type: 'week', description: 'Balance study and life' }
              ]
            }
          case 'Professional':
            return {
              title: 'Professional Skills Starter',
              description: 'Essential skills for professional development',
              items: [
                { title: 'Project Management', type: 'module', description: 'Manage projects effectively' },
                { title: 'Communication Skills', type: 'module', description: 'Professional communication' },
                { title: 'Leadership Fundamentals', type: 'module', description: 'Basic leadership principles' }
              ]
            }
          default:
            return {
              title: 'Learning Starter',
              description: 'Get started with your learning journey',
              items: [
                { title: 'Getting Started', type: 'topic', description: 'Introduction to learning' }
              ]
            }
        }
      },
      
      // ── WORKSPACE ACTIONS ──
      setActiveWorkspace: (workspace) => {
        set({ activeWorkspace: workspace })
      },
      
      setActiveBackpackTab: (tab) => {
        set({ activeBackpackTab: tab })
      },
      
      // Add content to workspace
      addContentToWorkspace: async (workspaceId, content) => {
        try {
          // This would integrate with existing materials service
          // For now, just update local state
          const state = get()
          const workspaces = state.workspaces.map(w => 
            w.id === workspaceId 
              ? { ...w, content: [...(w.content || []), content] }
              : w
          )
          set({ workspaces })
          return true
        } catch (error) {
          console.error('Error adding content to workspace:', error)
          return false
        }
      },
      
      // ── CLASSROOM ACTIONS (TEACHER-STUDENT BRIDGE) ──
      // Join classroom (for students)
      joinClassroom: async (classCode) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'User not authenticated' }
        
        try {
          // This would integrate with classroom system
          // For now, simulate successful join
          await state.detectUserRole('join_class', {
            educationLevel: 'Tertiary',
            institution: 'Joined Classroom'
          })
          
          return { success: true }
        } catch (error) {
          return { success: false, error: error.message }
        }
      },
      
      // Create classroom (for teachers)
      createClassroom: async (classroomData) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'User not authenticated' }
        
        try {
          await state.detectUserRole('create_class', {
            educationLevel: classroomData.educationLevel || 'Tertiary',
            institution: classroomData.institution
          })
          
          return { success: true }
        } catch (error) {
          return { success: false, error: error.message }
        }
      },
      
      // Clear error
      clearError: () => set({ error: null })
    }),
    {
      name: 'luter-universal-workspace',
      partialize: (state) => ({
        userRole: state.userRole,
        educationLevel: state.educationLevel,
        firstAction: state.firstAction,
        institution: state.institution,
        programName: state.programName,
        levelGrade: state.levelGrade,
        activeBackpackTab: state.activeBackpackTab,
        workspaces: state.workspaces,
        activeWorkspace: state.activeWorkspace,
        decks: state.decks,
        smartStartDecks: state.smartStartDecks,
        classrooms: state.classrooms,
        activeClassroom: state.activeClassroom
      })
    }
  )
)
