import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { supabase } from "./supabaseClient";
import { useLiveblocksFallback } from "./context/LiveblocksFallbackContext";

const client = createClient({
  authEndpoint: async (room) => {
    const { data } = await supabase.auth.getSession();
    const headers = {
      "Content-Type": "application/json",
    };
    if (data.session?.access_token) {
      headers["Authorization"] = `Bearer ${data.session.access_token}`;
    }
    const response = await fetch("/api/liveblocks-auth", {
      method: "POST",
      headers,
      body: JSON.stringify({ room }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "Unknown error");
      throw new Error(`Liveblocks auth failed: ${response.status} ${text}`);
    }
    return await response.json();
  },
  preventUnsavedChanges: true,
});

const ctx = createRoomContext(client);

function withFallback(hook, fallback) {
  return (...args) => {
    const { isFallback } = useLiveblocksFallback();
    if (isFallback) return fallback;
    return hook(...args);
  };
}

export const RoomProvider = ctx.RoomProvider;
export const useRoom = withFallback(ctx.useRoom, null);
export const useMyPresence = withFallback(ctx.useMyPresence, [null, () => {}]);
export const useUpdateMyPresence = withFallback(ctx.useUpdateMyPresence, () => {});
export const useOthers = withFallback(ctx.useOthers, []);
export const useOthersMapped = withFallback(ctx.useOthersMapped, []);
export const useOthersConnectionIds = withFallback(ctx.useOthersConnectionIds, []);
export const useOther = withFallback(ctx.useOther, null);
export const useBroadcastEvent = withFallback(ctx.useBroadcastEvent, () => {});
export const useEventListener = withFallback(ctx.useEventListener, () => {});
export const useSelf = withFallback(ctx.useSelf, null);
export const useHistory = withFallback(ctx.useHistory, { undo: () => {}, redo: () => {}, clear: () => {} });
export const useUndo = withFallback(ctx.useUndo, () => {});
export const useRedo = withFallback(ctx.useRedo, () => {});
export const useCanUndo = withFallback(ctx.useCanUndo, false);
export const useCanRedo = withFallback(ctx.useCanRedo, false);
export const useStorage = withFallback(ctx.useStorage, null);
export const useMutation = withFallback(ctx.useMutation, () => () => {});
export const useStatus = withFallback(ctx.useStatus, "disconnected");
export const useSyncStatus = withFallback(ctx.useSyncStatus, null);
export const useLostConnectionListener = withFallback(ctx.useLostConnectionListener, () => {});
export const useThreads = withFallback(ctx.useThreads, { threads: [] });
export const useCreateThread = withFallback(ctx.useCreateThread, () => {});
export const useInboxNotifications = withFallback(ctx.useInboxNotifications, { inboxNotifications: [] });
export const useMarkAllInboxNotificationsAsRead = withFallback(ctx.useMarkAllInboxNotificationsAsRead, () => {});

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
