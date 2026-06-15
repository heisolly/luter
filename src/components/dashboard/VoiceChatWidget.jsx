import React, { useEffect } from 'react';
import { useAudioSession } from '../../hooks/useAudioSession';
import { Mic, MicOff, Volume2, VolumeX, Loader2, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';

export default function VoiceChatWidget({ roomId, user, isDark }) {
  const {
    isJoined,
    isMicEnabled,
    isSpeakerEnabled,
    connectionStatus,
    activeSpeakers,
    error,
    joinSession,
    toggleMicrophone,
    toggleSpeaker
  } = useAudioSession(roomId, { userId: user?.id, userName: user?.raw_user_meta_data?.name || user?.email || 'Anonymous' });

  useEffect(() => {
    if (roomId && user?.id && !isJoined && connectionStatus === 'idle') {
      joinSession();
    }
  }, [roomId, user?.id, isJoined, connectionStatus, joinSession]);

  const textColor = isDark ? '#F3F4F6' : '#111827';
  const hoverBg = isDark ? '#374151' : '#F3F4F6';
  const dangerColor = '#EF4444';

  const buttonStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '38px', height: '38px', borderRadius: '8px',
    border: 'none', backgroundColor: 'transparent', color: textColor,
    cursor: 'pointer', transition: 'background-color 0.2s', position: 'relative'
  };

  const isSpeaking = activeSpeakers && activeSpeakers.length > 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      
      {/* Audio Wave Indicator */}
      <div style={{ display: 'flex', gap: '2px', alignItems: 'center', marginRight: '4px', height: '16px', opacity: isSpeaking ? 1 : 0, transition: 'opacity 0.2s', width: '17px' }} title="Someone is speaking">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={isSpeaking ? { scaleY: [0.3, 1, 0.3] } : { scaleY: 0.3 }}
            transition={isSpeaking ? { repeat: Infinity, duration: 0.8, delay: i * 0.2, ease: "easeInOut" } : {}}
            style={{ width: '3px', height: '14px', backgroundColor: '#10B981', borderRadius: '2px', transformOrigin: 'center' }}
          />
        ))}
      </div>

      {connectionStatus === 'connecting' && (
        <Loader2 className="w-4 h-4 animate-spin opacity-50 mr-2" style={{ color: textColor }} title="Connecting..." />
      )}

      {error && (
        <div style={{ color: dangerColor, fontSize: '12px', marginRight: '8px', display: 'flex', alignItems: 'center', gap: '4px' }} title={error}>
          <AlertTriangle size={14} />
          <span>Error</span>
        </div>
      )}

      {/* Mic Button */}
      <button
        onClick={toggleMicrophone}
        style={{ ...buttonStyle, color: isMicEnabled ? textColor : dangerColor, opacity: !isJoined ? 0.5 : 1 }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = isMicEnabled ? hoverBg : 'rgba(239, 68, 68, 0.1)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        title={isMicEnabled ? "Mute Microphone" : "Unmute Microphone"}
        disabled={connectionStatus === 'connecting'}
      >
        {isMicEnabled ? <Mic size={20} weight="bold" /> : <MicOff size={20} weight="bold" />}
      </button>

      {/* Speaker Button */}
      <button
        onClick={toggleSpeaker}
        style={{ ...buttonStyle, color: isSpeakerEnabled ? textColor : dangerColor, opacity: !isJoined ? 0.5 : 1 }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = isSpeakerEnabled ? hoverBg : 'rgba(239, 68, 68, 0.1)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        title={isSpeakerEnabled ? "Mute Audio" : "Unmute Audio"}
        disabled={connectionStatus === 'connecting'}
      >
        {isSpeakerEnabled ? <Volume2 size={20} weight="bold" /> : <VolumeX size={20} weight="bold" />}
      </button>
    </div>
  );
}
