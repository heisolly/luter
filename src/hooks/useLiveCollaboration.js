import { useBroadcastEvent, useEventListener } from '../components/dashboard/CollaborationProvider';

/**
 * useLiveBroadcast — fire-and-forget broadcast event helpers.
 * These events are NOT stored — they fire once to all current participants.
 *
 * Supported event types:
 *  - RAISE_HAND   { userId, userName }
 *  - REACTION     { emoji, userId }
 *  - SYNC_JUMP    { slideNumber }
 */
export function useLiveBroadcast() {
  const broadcast = useBroadcastEvent();

  const raiseHand = (userId, userName) => {
    broadcast({ type: 'RAISE_HAND', userId, userName });
  };

  const sendReaction = (emoji, userId) => {
    broadcast({ type: 'REACTION', emoji, userId });
  };

  const broadcastSyncJump = (slideNumber) => {
    broadcast({ type: 'SYNC_JUMP', slideNumber });
  };

  return { raiseHand, sendReaction, broadcastSyncJump };
}

/**
 * useLiveEventListener — subscribe to broadcast events.
 * Pass handlers for each event type you want to react to.
 *
 * @param {Object} handlers — { onRaiseHand, onReaction, onSyncJump }
 */
export function useLiveEventListener({ onRaiseHand, onReaction, onSyncJump } = {}) {
  useEventListener(({ event }) => {
    switch (event.type) {
      case 'RAISE_HAND':
        onRaiseHand?.(event);
        break;
      case 'REACTION':
        onReaction?.(event);
        break;
      case 'SYNC_JUMP':
        onSyncJump?.(event);
        break;
      default:
        break;
    }
  });
}
