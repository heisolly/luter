import { useOthersMapped } from '../liveblocks.config';

export function useAvatarStack() {
  const others = useOthersMapped((other) => {
    const presenceUser = other.presence?.user || {};
    return {
      id: presenceUser.id || String(other.connectionId),
      name: presenceUser.name || 'Peer',
      color: presenceUser.color || '#7C3AED',
      avatar: presenceUser.avatar || null,
      role: presenceUser.role || 'peer',
      currentSlide: other.presence?.currentSlide ?? other.presence?.currentPage ?? 0,
      status: other.presence?.status || 'active',
      currentTool: other.presence?.currentTool || 'none',
    };
  });

  return others.map(([connectionId, data]) => ({ connectionId, ...data }));
}
