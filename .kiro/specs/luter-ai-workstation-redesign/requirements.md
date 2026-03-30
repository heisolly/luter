# Requirements Document

## Introduction

The Luter AI Workstation redesign transforms the current vertically-stacked `CourseWorkstation` layout into a professional "Tri-Pane Workspace" with a persistent left Library sidebar, a fluid center Content Canvas, and a collapsible right Luter AI Panel. The redesign introduces a "Layered Focus" structural philosophy with softly rounded panels, purposeful motion design (entry animations, scroll sync, AI response animations), and freemium overlay states — all built on the existing React + Tailwind CSS + Supabase stack.

## Glossary

- **Workstation**: The full-screen study environment rendered by `CourseWorkstation.jsx`, replacing the current stacked layout.
- **Library_Sidebar**: The left pane (Pane 1) containing course breadcrumb, scrollable materials list, and user profile/settings. Collapsible to an icon-only rail.
- **Content_Canvas**: The center pane (Pane 2) that renders the active material (PDF text, video player, image). Expands fluidly when sidebars collapse.
- **Luter_Panel**: The right pane (Pane 3) containing the AI Chat, Summary, and Flashcards tabs with a fixed input bar. Slides in from the right.
- **Icon_Rail**: The collapsed state of the Library_Sidebar showing only material-type icons at 52px width.
- **Floating_Toolbar**: A contextual overlay that appears on text selection in the Content_Canvas with "Add Note" and "Ask AI" actions.
- **Session_Entry_Flow**: The animated sequence that plays when the Workstation first mounts.
- **Scroll_Sync_Glow**: A subtle vertical glow/pulse on the border between Content_Canvas and Luter_Panel that reacts to user scrolling.
- **Shimmer_Loader**: A skeleton loading animation used while AI content (summaries, flashcards) is being generated.
- **Freemium_Lock**: A visual overlay (50% grayscale + padlock icon) applied to locked materials.
- **Solution_Modal**: A glassmorphism card overlay presenting the upgrade CTA for freemium-locked features.
- **Spring_Animation**: A bounce-eased transition (~350ms) used for the Luter_Panel slide-in.
- **Segmented_Tabs**: The tab bar inside the Luter_Panel with Chat, Summary, and Flashcards options.

---

## Requirements

### Requirement 1: Tri-Pane Layout Architecture

**User Story:** As a student, I want a three-pane workspace layout, so that I can navigate materials, read content, and interact with AI simultaneously without switching views.

#### Acceptance Criteria

1. THE Workstation SHALL render three horizontally-arranged panes: Library_Sidebar (left), Content_Canvas (center), and Luter_Panel (right).
2. THE Content_Canvas SHALL expand its width fluidly when either the Library_Sidebar or Luter_Panel is collapsed.
3. THE Workstation SHALL use rectilinear panel shapes with softly rounded corners (border-radius ≥ 12px) on all panel containers.
4. THE Workstation SHALL occupy 100% of the viewport height and width with no vertical page scroll at the root level.
5. WHEN the viewport width is below 1024px, THE Workstation SHALL hide the Luter_Panel by default and provide a toggle button to open it as an overlay.
6. WHEN the viewport width is below 640px, THE Workstation SHALL hide the Library_Sidebar by default and provide a toggle button to open it as an overlay.

---

### Requirement 2: Library Sidebar (Pane 1)

**User Story:** As a student, I want a collapsible library sidebar, so that I can browse and switch between course materials without losing my reading position.

#### Acceptance Criteria

1. THE Library_Sidebar SHALL display the course title and breadcrumb at the top of the pane.
2. THE Library_Sidebar SHALL render a scrollable list of all course materials grouped by type (Course Materials, My Uploads).
3. THE Library_Sidebar SHALL display a user profile section and settings link at the bottom of the pane.
4. WHEN the collapse toggle is activated, THE Library_Sidebar SHALL transition to the Icon_Rail state in 250ms using an ease-in-out timing function.
5. WHEN in Icon_Rail state, THE Library_Sidebar SHALL display only material-type icons at a fixed width of 52px.
6. WHEN in Icon_Rail state and a material icon is hovered, THE Library_Sidebar SHALL display the material title as a tooltip.
7. WHEN the expand toggle is activated from Icon_Rail state, THE Library_Sidebar SHALL transition back to full width in 250ms using an ease-in-out timing function.
8. THE Library_Sidebar SHALL persist its collapsed/expanded state across material selections within the same session.

---

### Requirement 3: Content Canvas (Pane 2)

**User Story:** As a student, I want a clean content reading area, so that I can focus on studying the selected material without distractions.

#### Acceptance Criteria

1. WHEN a PDF or document material is active, THE Content_Canvas SHALL render the extracted text in a centered vertical scroll layout with a maximum content width of 720px.
2. WHEN a YouTube material is active, THE Content_Canvas SHALL render a fixed-aspect-ratio (16:9) video player at the top followed by a scrollable transcript section below.
3. WHEN no material is selected, THE Content_Canvas SHALL display an empty state with a prompt to select a material from the Library_Sidebar.
4. WHEN the user selects text within the Content_Canvas, THE Floating_Toolbar SHALL appear near the selection with "Add Note" and "Ask AI" action buttons.
5. WHEN the Floating_Toolbar appears, THE Floating_Toolbar SHALL animate from scale(0) to scale(1) over 150ms.
6. WHEN the user clicks outside the text selection, THE Floating_Toolbar SHALL dismiss with a scale(1) to scale(0) animation over 100ms.
7. WHEN "Ask AI" is clicked in the Floating_Toolbar, THE Workstation SHALL pre-fill the Luter_Panel chat input with the selected text and open the Luter_Panel if collapsed.

---

### Requirement 4: Luter Panel (Pane 3)

**User Story:** As a student, I want a persistent AI assistant panel, so that I can ask questions, generate summaries, and review flashcards without leaving the reading view.

#### Acceptance Criteria

1. THE Luter_Panel SHALL display a header with the "Luter AI" label and a collapse/expand toggle button.
2. THE Luter_Panel SHALL render Segmented_Tabs for Chat, Summary, and Flashcards.
3. THE Luter_Panel SHALL display a scrollable content feed area above a fixed input bar at the bottom.
4. WHEN the Luter_Panel collapse toggle is activated, THE Luter_Panel SHALL slide out to the right edge and the Content_Canvas SHALL expand to fill the space.
5. WHEN the Luter_Panel expand toggle is activated, THE Luter_Panel SHALL slide in from the right with a spring/bounce animation completing in approximately 350ms.
6. WHEN the active tab is Chat, THE Luter_Panel SHALL display the chat message history and a text input with a send button.
7. WHEN the active tab is Summary, THE Luter_Panel SHALL display a "Generate AI Notes" button and the generated summary output below it.
8. WHEN the active tab is Flashcards, THE Luter_Panel SHALL display a "Generate Flashcards" button and the interactive flashcard viewer below it.
9. WHEN a user message is sent, THE Luter_Panel SHALL animate the outgoing message sliding upward from the input bar position.
10. WHEN an AI response is received, THE Luter_Panel SHALL render the response with an incremental fade-in or typewriter effect.

---

### Requirement 5: Session Entry Animation

**User Story:** As a student, I want a smooth entry animation when opening the workstation, so that the transition from the course page feels intentional and polished.

#### Acceptance Criteria

1. WHEN the Workstation mounts, THE Workstation SHALL fade the previous course page view to 80% opacity as the entry sequence begins.
2. WHEN the Workstation mounts, THE Library_Sidebar SHALL slide in from the left edge starting at the same time as the Content_Canvas begins appearing.
3. WHEN the Workstation mounts, THE Content_Canvas and Luter_Panel SHALL slide in from the right simultaneously.
4. THE Session_Entry_Flow SHALL complete within 400ms total from mount to fully visible state.
5. WHEN the entry animation is complete, THE Workstation SHALL be fully interactive with no animation-related pointer-event blocking.

---

### Requirement 6: Scroll Sync Glow (Luter Presence)

**User Story:** As a student, I want a subtle visual cue that Luter AI is aware of my reading position, so that the AI panel feels contextually connected to the content I'm reading.

#### Acceptance Criteria

1. WHILE the user is scrolling within the Content_Canvas, THE Workstation SHALL display a vertical glow line or pulse effect on the border between the Content_Canvas and the Luter_Panel.
2. THE Scroll_Sync_Glow SHALL use the primary brand color (#7a12cc) at reduced opacity (≤ 40%) to remain subtle.
3. WHEN the user stops scrolling for more than 800ms, THE Scroll_Sync_Glow SHALL fade out smoothly over 400ms.
4. THE Scroll_Sync_Glow SHALL NOT appear when the Luter_Panel is collapsed.

---

### Requirement 7: AI Content Generation Animations

**User Story:** As a student, I want animated loading states and reveal effects for AI-generated content, so that the generation process feels responsive and the results feel satisfying to receive.

#### Acceptance Criteria

1. WHEN AI summary or flashcard generation is in progress, THE Luter_Panel SHALL display a Shimmer_Loader skeleton in place of the content area.
2. WHEN AI summary generation completes, THE Luter_Panel SHALL reveal the summary content with cards or sections sliding in one by one with a staggered delay of 60ms per item.
3. WHEN AI flashcard generation completes, THE Luter_Panel SHALL reveal each flashcard sliding in with a staggered delay of 80ms per card.
4. THE Shimmer_Loader SHALL use a left-to-right gradient sweep animation cycling every 1.5 seconds.
5. WHEN an AI chat response begins streaming or arrives, THE Luter_Panel SHALL animate the response bubble fading in from opacity 0 to opacity 1 over 200ms.

---

### Requirement 8: Freemium Lock Overlay

**User Story:** As a student on the free tier, I want to clearly see which content is locked, so that I understand what I'm missing and can make an informed upgrade decision.

#### Acceptance Criteria

1. WHEN a material is marked as locked for the current user's tier, THE Content_Canvas SHALL apply a 50% grayscale CSS filter to the material content area.
2. WHEN a material is locked, THE Content_Canvas SHALL display a centered padlock icon overlay above the grayscale content.
3. WHEN the padlock icon or locked content area is clicked, THE Workstation SHALL display the Solution_Modal.
4. THE Solution_Modal SHALL use a glassmorphism card style (background blur, semi-transparent background, large rounded corners ≥ 20px).
5. THE Solution_Modal SHALL display a feature list and a primary CTA button linking to the upgrade flow.
6. WHEN the Solution_Modal is dismissed, THE Workstation SHALL return to the normal Workstation view without navigation.

---

### Requirement 9: Workstation Top Bar

**User Story:** As a student, I want a persistent top bar with course context and navigation, so that I always know which course I'm in and can return to the dashboard easily.

#### Acceptance Criteria

1. THE Workstation SHALL render a fixed top bar displaying the course name, course code, and a back-navigation button.
2. THE Workstation SHALL display a study progress indicator (progress bar or percentage) in the top bar reflecting the proportion of materials opened in the current session.
3. WHEN the back-navigation button is clicked, THE Workstation SHALL navigate the user back to the course listing page.
4. THE top bar SHALL remain visible and fixed at the top of the viewport at all times while the Workstation is active.

---

### Requirement 10: Responsive Behavior

**User Story:** As a student using a tablet or mobile device, I want the workstation to adapt its layout, so that I can still study effectively on smaller screens.

#### Acceptance Criteria

1. WHEN the viewport width is between 640px and 1024px (tablet), THE Workstation SHALL display the Library_Sidebar and Content_Canvas only, with the Luter_Panel accessible via a floating action button (FAB).
2. WHEN the viewport width is below 640px (mobile), THE Workstation SHALL display only the Content_Canvas full-width, with both Library_Sidebar and Luter_Panel accessible via FABs.
3. WHEN a FAB is tapped on mobile or tablet, THE corresponding panel SHALL slide in as an overlay over the Content_Canvas rather than pushing it.
4. THE FABs SHALL be positioned in the bottom-right corner of the viewport and SHALL NOT obscure the Floating_Toolbar.
