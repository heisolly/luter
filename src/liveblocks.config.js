import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  publicApiKey: import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY,
});

export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useOthers,
  useOthersMapped,
  useOthersConnectionIds,
  useOther,
  useBroadcastEvent,
  useEventListener,
  useSelf,
  useHistory,
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
  useStorage,
  useMutation,
  useStatus,
  useLostConnectionListener,
} = createRoomContext(client);
