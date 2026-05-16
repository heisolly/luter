# Luter Collaboration & Study Groups Documentation

This document provides an overview of the collaborative features and study group systems within the Luter platform.

## 1. Study Groups System
The **Study Group** feature allows users to create private learning communities for focused collaboration.

### Core Components
- **Creation**: Users can create a group with a custom name, emoji, and theme color (`src/components/dashboard/StudyGroupsPage.jsx`).
- **Discovery & Joining**:
    - Each group generates a unique 8-character **Invite Code**.
    - Peers join via a direct URL (`/join/:inviteCode`) or by entering the code manually (`JoinGroupModal`).
    - The logic is handled in `src/components/dashboard/JoinGroupPage.jsx`.
- **Database Schema**:
    - `study_groups`: Stores group metadata (name, emoji, color, invite code).
    - `study_group_members`: Maps users to groups with roles (`admin`, `member`).

### Shared Resources
Members of a group can view each other's study sets and decks. The UI provides shared visibility, ensuring that when one member updates a set, others see the changes.

---

## 2. Real-time Collaboration (Liveblocks)
Luter integrates **Liveblocks** to provide real-time, multi-user experiences within the **Course Workstation**.

### Presence Features
- **Presence Bar**: Displays avatars of all active users in the current room (`PresenceBar` in `CollaborationTools.jsx`).
- **Awareness**: Shows which page or slide each user is currently viewing.

### Interaction Tools
- **Live Reactions**: Users can send ephemeral emoji reactions (👏, ❓, 💡, 🔥) that float across everyone's screen.
- **Hand Raising**: A "Raise Hand" feature to signal questions or comments.
- **Sync Mode**: A "Presenter" can enable **Sync Session**, which synchronizes the current slide/page across all participants' viewports.
- **Whiteboard**: A collaborative **Excalidraw** instance that syncs drawings and annotations in real-time across the group (`src/components/dashboard/Whiteboard.jsx`).

### Real-time Logic
- **CollaborationProvider**: Wraps components in a Liveblocks room, managing shared storage for the whiteboard, chat, and quiz state.
- **Broadcast Events**: Uses `useBroadcastEvent` for non-persistent actions like reactions and hand-raising.

---

## 3. Real-time Learning: Group Quiz
The **Group Quiz** feature (`src/components/dashboard/GroupQuiz.jsx`) transforms study materials into a shared competitive game.
- **AI Generation**: Uses Groq (LLM) to generate questions from the current study material.
- **Shared State**: The quiz state (questions, current index, scores) is kept in Liveblocks storage (`LiveList`, `LiveObject`), ensuring all participants stay in sync.

---

## 4. Material Sharing & Privacy Scopes
Collaboration is also supported through flexible sharing levels within the `materials` table:
- **Sharing Scopes**:
    - `course`: Visible to peers in the same course.
    - `program`: Visible to everyone in the degree program.
    - `year`: Visible to peers in the same academic year.
    - `global`: Publicly available.
- **Public Share Tokens**: Managed via `services/sharingService.js`, allowing users to share materials with anyone outside their immediate course or group via a public link.

---

## 5. Battle System (Socket.io)
While Liveblocks handles study collaboration, the **Battle Server** (`server/battle-server.js`) manages competitive academic "duels" using Socket.io. This includes matchmaking, real-time question delivery, and global leaderboards.
