import { useStorage, useMutation, useUpdateMyPresence } from '../components/dashboard/CollaborationProvider';

/**
 * useGroupChat — Liveblocks-backed group chat for collaborative sessions.
 *
 * Messages are stored in a LiveList in room storage so they persist
 * for all participants and survive page refreshes within the session.
 * Typing indicators use ephemeral presence (no storage cost).
 */
export function useGroupChat(user) {
  // useStorage serializes the LiveList to a plain array
  const messages = useStorage((root) => root.messages) ?? [];
  const updatePresence = useUpdateMyPresence();

  const sendMessage = useMutation(({ storage }, text) => {
    if (!text?.trim() || !user?.id) return;
    const list = storage.get('messages');
    if (!list || typeof list.push !== 'function') return;

    list.push({
      id:        `${Date.now()}-${user.id}`,
      userId:    user.id,
      userName:  user.user_metadata?.full_name || user.email?.split('@')[0] || 'Peer',
      avatarUrl: user.user_metadata?.avatar_url || null,
      text:      text.trim(),
      timestamp: Date.now(),
    });
  }, [user]);

  const setTyping = (isTyping) => {
    updatePresence({ isTyping });
  };

  return { messages, sendMessage, setTyping };
}
