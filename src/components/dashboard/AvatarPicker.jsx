import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { motion } from 'framer-motion';

const AVATAR_STYLES = ['adventurer', 'bottts', 'pixel-art', 'lorelei', 'micah'];

export default function AvatarPicker({ userId, currentAvatar, onSave, onCancel, isDark }) {
  // Try to parse existing style and seed from currentAvatar, or use defaults
  let initialStyle = 'adventurer';
  let initialSeed = userId || 'default';
  
  if (currentAvatar && currentAvatar.includes('api.dicebear.com')) {
    try {
      const url = new URL(currentAvatar);
      const pathParts = url.pathname.split('/');
      if (pathParts.length >= 3) {
        initialStyle = pathParts[2];
      }
      const seedParam = url.searchParams.get('seed');
      if (seedParam) {
        initialSeed = seedParam;
      }
    } catch(e) {}
  }

  const [selectedStyle, setSelectedStyle] = useState(initialStyle);
  const [seed, setSeed] = useState(initialSeed);
  const [saving, setSaving] = useState(false);

  const previewUrl = `https://api.dicebear.com/9.x/${selectedStyle}/svg?seed=${encodeURIComponent(seed)}`;

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: previewUrl })
        .eq('id', userId);

      if (error) throw error;
      onSave(previewUrl);
    } catch (e) {
      alert(`Failed to save avatar: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const bgCard = isDark ? '#1F2937' : '#FFFFFF';
  const textTitle = isDark ? '#F9FAFB' : '#111827';
  const textBody = isDark ? '#9CA3AF' : '#4B5563';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        position: 'absolute',
        top: '60px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        background: bgCard,
        padding: '24px',
        borderRadius: '24px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        width: '320px',
        border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`
      }}
    >
      <div style={{ fontSize: '18px', fontWeight: 700, color: textTitle, fontFamily: 'Outfit, sans-serif' }}>
        Customize Avatar
      </div>

      {/* Main Preview */}
      <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: isDark ? '#374151' : '#F3F4F6', overflow: 'hidden', border: `4px solid ${isDark ? '#111827' : '#FFFFFF'}` }}>
        <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      
      {/* Style Selector Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
        {AVATAR_STYLES.map((style) => (
          <button
            key={style}
            onClick={() => setSelectedStyle(style)}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              background: selectedStyle === style ? (isDark ? '#FFF' : '#111827') : (isDark ? '#374151' : '#F3F4F6'),
              color: selectedStyle === style ? (isDark ? '#111827' : '#FFF') : textBody,
              transition: 'all 0.2s'
            }}
          >
            {style}
          </button>
        ))}
      </div>

      {/* Randomize Button */}
      <button 
        onClick={() => setSeed(Math.random().toString(36).substring(7))}
        style={{
          background: 'none',
          border: 'none',
          color: '#6D28D9',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          textDecoration: 'underline'
        }}
      >
        Shuffle Look
      </button>

      <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
        <button 
          onClick={onCancel} 
          style={{ flex: 1, padding: '12px', background: isDark ? '#374151' : '#F3F4F6', color: textTitle, border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button 
          onClick={handleSave} 
          disabled={saving}
          style={{ flex: 1, padding: '12px', background: '#6D28D9', color: '#FFF', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </motion.div>
  );
}
