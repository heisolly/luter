import React, { useState } from 'react';
import { useOthers, useUpdateMyPresence, useSelf } from './CollaborationProvider';
import { useLiveBroadcast, useLiveEventListener } from '../../hooks/useLiveCollaboration';
import { RadioButton, Hand, Smiley } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// PresenceBar — stacked avatars with page-number badges
// ─────────────────────────────────────────────────────────────
export const PresenceBar = () => {
  const others = useOthers();
  const self   = useSelf();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: 'rgba(0,0,0,0.03)', borderRadius: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginLeft: '4px' }}>
        {/* Self */}
        <Avatar user={self?.info} isSelf page={null} />
        {/* Others */}
        {others.map(({ connectionId, info, presence }) => (
          <Avatar
            key={connectionId}
            user={info}
            page={presence?.currentPage ?? null}
          />
        ))}
      </div>
      <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap' }}>
        {others.length + 1} online
      </span>
    </div>
  );
};

const Avatar = ({ user, isSelf, page }) => {
  const name  = user?.name  || (isSelf ? 'You' : 'Peer');
  const color = user?.color || '#6D28D9';

  return (
    <div
      title={isSelf ? `You — Page ${page ?? '?'}` : `${name} — Page ${page ?? '?'}`}
      style={{ position: 'relative', marginLeft: '-8px' }}
    >
      <div style={{
        width: '26px', height: '26px', borderRadius: '50%',
        background: color, border: '2px solid white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '10px', color: 'white', fontWeight: 700,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'help'
      }}>
        {name.charAt(0).toUpperCase()}
      </div>
      {page != null && (
        <div style={{
          position: 'absolute', bottom: '-3px', right: '-3px',
          background: '#6D28D9', color: 'white',
          fontSize: '8px', fontWeight: 800, lineHeight: 1,
          padding: '1px 3px', borderRadius: '4px',
          border: '1.5px solid white', minWidth: '12px', textAlign: 'center'
        }}>
          {page}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SyncControl — toggle slide sync mode
// ─────────────────────────────────────────────────────────────
export const SyncControl = ({ isPresenter, onToggleSync, syncEnabled }) => (
  <button
    onClick={onToggleSync}
    title={syncEnabled ? 'Stop syncing slides' : 'Sync everyone to your slide'}
    style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '6px 12px', borderRadius: '12px', border: 'none',
      background: syncEnabled ? '#EF4444' : '#F1F5F9',
      color:      syncEnabled ? 'white'    : '#64748B',
      cursor: 'pointer', fontSize: '12px', fontWeight: 700, transition: '0.2s'
    }}
  >
    <RadioButton size={14} weight={syncEnabled ? 'fill' : 'bold'} />
    {syncEnabled ? 'Stop Sync' : 'Sync Session'}
  </button>
);

// ─────────────────────────────────────────────────────────────
// LiveReactionBar — raise hand + emoji reactions
// ─────────────────────────────────────────────────────────────
const EMOJIS = ['👏', '❓', '💡', '🔥', '😊'];

export const LiveReactionBar = ({ userId, userName }) => {
  const { raiseHand, sendReaction } = useLiveBroadcast();
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [handRaised, setHandRaised] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // Listen for incoming reactions and raise-hand events
  useLiveEventListener({
    onReaction: ({ emoji }) => {
      const id = Date.now();
      setFloatingEmojis(prev => [...prev, { id, emoji }]);
      setTimeout(() => setFloatingEmojis(prev => prev.filter(e => e.id !== id)), 2500);
    },
    onRaiseHand: ({ userName: who }) => {
      // Could show a toast — caller handles this in WorkstationPage
    }
  });

  const handleRaiseHand = () => {
    setHandRaised(v => !v);
    raiseHand(userId, userName);
  };

  const handleReaction = (emoji) => {
    sendReaction(emoji, userId);
    setShowPicker(false);
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4px' }}>

      {/* Floating emojis */}
      <AnimatePresence>
        {floatingEmojis.map(({ id, emoji }) => (
          <motion.div
            key={id}
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -60, scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.2 }}
            style={{
              position: 'fixed', bottom: '100px', right: '80px',
              fontSize: '28px', pointerEvents: 'none', zIndex: 9999
            }}
          >
            {emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Raise Hand */}
      <button
        onClick={handleRaiseHand}
        title={handRaised ? 'Lower hand' : 'Raise hand'}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '6px 10px', borderRadius: '10px', border: 'none',
          background: handRaised ? '#FEF3C7' : '#F1F5F9',
          color:      handRaised ? '#D97706' : '#64748B',
          cursor: 'pointer', fontSize: '12px', fontWeight: 700, transition: '0.2s'
        }}
      >
        <Hand size={15} weight={handRaised ? 'fill' : 'bold'} />
        {handRaised ? 'Lower' : 'Hand'}
      </button>

      {/* Reaction picker */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowPicker(v => !v)}
          title="Send a reaction"
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 10px', borderRadius: '10px', border: 'none',
            background: '#F1F5F9', color: '#64748B',
            cursor: 'pointer', fontSize: '12px', fontWeight: 700, transition: '0.2s'
          }}
        >
          <Smiley size={15} weight="bold" /> React
        </button>

        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 8 }}
              style={{
                position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
                background: 'white', border: '1px solid #E2E8F0',
                borderRadius: '14px', padding: '8px',
                display: 'flex', gap: '6px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 200
              }}
            >
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  style={{
                    background: 'none', border: 'none', fontSize: '20px',
                    cursor: 'pointer', padding: '4px', borderRadius: '8px',
                    transition: 'transform 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
