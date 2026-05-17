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
  useThreads,
  useCreateThread,
  useInboxNotifications,
  useMarkAllInboxNotificationsAsRead,
} = createRoomContext(client);

/**
 * Liveblocks schema used by the Workstation.
 *
 * Presence = {
 *   currentSlide: number;
 *   status: "active" | "idle" | "away";
 *   isTyping: boolean;
 *   cursor: { x: number; y: number } | null;
 *   selectedText: string | null;
 *   currentTool: "none" | "annotate" | "comment" | "focus";
 *   user: {
 *     id: string;
 *     name: string;
 *     avatar: string | null;
 *     color: string;
 *     role: "teacher" | "student" | "peer";
 *   };
 * };
 *
 * Storage = {
 *   whiteboardElements: any[];
 *   messages: { id: string; userId: string; userName: string; userColor: string; text: string; timestamp: number; }[];
 *   syncState: { isSynced: boolean; leaderId: string | null; currentSlide: number; };
 *   quiz: {
 *     status: "idle" | "active" | "finished";
 *     question: string | null;
 *     options: string[];
 *     correctAnswer: string | null;
 *     answers: Record<string, string>;
 *     scores: Record<string, number>;
 *     startedAt: number | null;
 *     timeLimit: number;
 *   };
 *   sessionFiles: { id: string; name: string; type: string; url: string; }[];
 *   activeFileId: string | null;
 *   coverAreas: Record<number, { id: string; x: number; y: number; width: number; height: number; revealed: boolean; }[]>;
 *   raisedHands: Record<string, { userId: string; userName: string; raisedAt: number; }>;
 * };
 *
 * RoomEvent =
 *   | { type: "QUIZ_PUSHED"; question: string; options: string[] }
 *   | { type: "SYNC_TRIGGERED"; slideNumber: number }
 *   | { type: "RAISE_HAND"; userId: string; userName: string }
 *   | { type: "LOWER_HAND"; userId: string }
 *   | { type: "REACTION"; emoji: string; userId: string; userName: string }
 *   | { type: "ANNOTATION_STROKE"; page: number; color: string; size: number; points: {x: number; y: number}[]; mode: "draw" | "erase" }
 *   | { type: "COVER_ADDED"; page: number; area: object }
 *   | { type: "COVER_REVEALED"; page: number; areaId: string }
 *   | { type: "FILE_CHANGED"; fileId: string }
 *   | { type: "SESSION_ENDED" };
 */
