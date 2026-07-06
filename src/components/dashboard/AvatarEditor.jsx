import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { motion } from 'framer-motion';
import Avatar, { genConfig } from 'react-nice-avatar';
import { RiCheckLine, RiCloseLine, RiShuffleLine } from 'react-icons/ri';

const options = {
  faceColor: ['#F9C9B6', '#AC6651', '#77311D', '#ffdbb4', '#8A6348', '#FFCDA3'],
  hairColor: ['#000000', '#FFFFFF', '#77311D', '#FC909F', '#9287FF', '#506AF4', '#F4D150', '#1A202C'],
  shirtColor: ['#9287FF', '#6BD9E9', '#FC909F', '#F4D150', '#77311D', '#000000', '#10B981', '#F43F5E'],
  bgColor: ['#E0DDFF', '#C4F1F9', '#FFDCE1', '#FDF2C8', '#D1D5DB', '#F3F4F6', '#FFE4E6', '#DCFCE7'],
  hairStyle: ['normal', 'thick', 'mohawk', 'womanLong', 'womanShort'],
  hairStyleMan: ['normal', 'thick', 'mohawk'],
  hairStyleWoman: ['womanLong', 'womanShort', 'normal', 'thick'],
  hatStyle: ['none', 'beanie', 'turban'],
  eyeStyle: ['circle', 'oval', 'smile'],
  glassesStyle: ['none', 'round', 'square'],
  noseStyle: ['short', 'long', 'round'],
  mouthStyle: ['laugh', 'smile', 'peace'],
  earSize: ['small', 'big'],
  eyeBrowStyle: ['up', 'upWoman'],
  shirtStyle: ['hoody', 'short', 'polo']
};

export default function AvatarEditor({ userId, currentAvatar, onSave, onCancel, isDark }) {
  // Determine initial config
  let initialConfig;
  try {
    const parsed = JSON.parse(currentAvatar);
    if (parsed && parsed.faceColor) {
      initialConfig = parsed;
    } else {
      initialConfig = genConfig();
    }
  } catch (e) {
    // If it's a URL or invalid, generate random
    initialConfig = genConfig();
  }

  const [config, setConfig] = useState(initialConfig);
  const [activeTab, setActiveTab] = useState('Face');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const configString = JSON.stringify(config);
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: configString }) // Store JSON as string in avatar_url
        .eq('id', userId);

      if (error) throw error;
      onSave(configString);
    } catch (e) {
      alert(`Failed to save avatar: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const randomize = () => {
    setConfig(genConfig());
  };

  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const tabs = ['Face', 'Hair', 'Clothes', 'Colors'];

  const bgCard = isDark ? '#1F2937' : '#FFFFFF';
  const textTitle = isDark ? '#F9FAFB' : '#111827';
  const textBody = isDark ? '#9CA3AF' : '#4B5563';
  const borderCard = isDark ? '#374151' : '#E5E7EB';

  const renderSelector = (title, key, opts, isColor = false) => (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: textBody, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </div>
      <div 
        className="hide-scrollbar"
        style={{ 
          display: 'flex', 
          overflowX: 'auto', 
          gap: '12px',
          paddingBottom: '8px', // space for scroll if visible on some devices
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {opts.map((opt) => {
          const isSelected = config[key] === opt;
          if (isColor) {
            return (
              <div
                key={opt}
                onClick={() => updateConfig(key, opt)}
                style={{
                  minWidth: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: opt,
                  cursor: 'pointer',
                  border: isSelected ? `3px solid ${isDark ? '#FFF' : '#111827'}` : `1px solid ${borderCard}`,
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                }}
              />
            );
          }
          return (
            <button
              key={opt}
              onClick={() => updateConfig(key, opt)}
              style={{
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: '12px',
                border: `1px solid ${isSelected ? '#C4B5FD' : borderCard}`,
                background: isSelected ? (isDark ? 'rgba(196, 181, 253, 0.15)' : '#F3F0FF') : 'transparent',
                color: isSelected ? (isDark ? '#C4B5FD' : '#5B21B6') : textTitle,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isSelected ? '0 2px 8px rgba(196, 181, 253, 0.25)' : 'none'
              }}
            >
              {opt.replace(/([A-Z])/g, ' $1').trim()}
            </button>
          );
        })}
      </div>
    </div>
  );

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
        background: isDark ? 'rgba(31, 41, 55, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '24px',
        borderRadius: '32px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        width: '380px',
        maxWidth: '90vw',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)'}`
      }}
    >
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: textTitle, fontFamily: 'Outfit, sans-serif' }}>
          Avatar Editor
        </div>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: textBody, cursor: 'pointer', padding: '4px' }}>
          <RiCloseLine size={24} />
        </button>
      </div>

      {/* Gender Switcher */}
      <div style={{ display: 'flex', background: isDark ? '#374151' : '#F3F4F6', borderRadius: '12px', padding: '4px', width: '100%' }}>
        <button
          onClick={() => updateConfig('sex', 'man')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            background: config.sex !== 'woman' ? (isDark ? 'rgba(196, 181, 253, 0.2)' : '#FFF') : 'transparent',
            color: config.sex !== 'woman' ? (isDark ? '#C4B5FD' : '#5B21B6') : textBody,
            boxShadow: config.sex !== 'woman' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          Male
        </button>
        <button
          onClick={() => updateConfig('sex', 'woman')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            background: config.sex === 'woman' ? (isDark ? 'rgba(196, 181, 253, 0.2)' : '#FFF') : 'transparent',
            color: config.sex === 'woman' ? (isDark ? '#C4B5FD' : '#5B21B6') : textBody,
            boxShadow: config.sex === 'woman' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          Female
        </button>
      </div>

      {/* Main Preview */}
        <div style={{ position: 'relative', width: '140px', height: '140px' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#C4B5FD', opacity: 0.15 }} />
          <Avatar style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }} {...config} />
          
          <button 
            onClick={randomize}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: '#C4B5FD',
              color: '#3730A3',
              border: 'none',
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(196, 181, 253, 0.4)',
              zIndex: 2,
              transition: 'transform 0.2s',
            }}
            title="Randomize"
          >
            <RiShuffleLine size={18} />
          </button>
        </div>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', width: '100%', borderBottom: `1px solid ${borderCard}`, paddingBottom: '8px' }}>
        {tabs.map(tab => (
          <div
            onClick={() => setActiveTab(tab)}
            key={tab}
            style={{
              padding: '8px 12px',
              fontWeight: 700,
              fontSize: '14px',
              color: activeTab === tab ? (isDark ? '#FFF' : '#111827') : textBody,
              borderBottom: activeTab === tab ? `3px solid #C4B5FD` : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Settings Panel */}
      <div style={{ width: '100%', maxHeight: '240px', overflowY: 'auto', paddingRight: '8px' }}>
        {activeTab === 'Face' && (
          <div>
            {renderSelector('Eyes', 'eyeStyle', options.eyeStyle)}
            {renderSelector('Mouth', 'mouthStyle', options.mouthStyle)}
            {renderSelector('Nose', 'noseStyle', options.noseStyle)}
            {renderSelector('Eyebrows', 'eyeBrowStyle', options.eyeBrowStyle)}
            {renderSelector('Ears', 'earSize', options.earSize)}
          </div>
        )}
        {activeTab === 'Hair' && (
          <div>
            {renderSelector('Style', 'hairStyle', config.sex === 'woman' ? options.hairStyleWoman : options.hairStyleMan)}
            {renderSelector('Hat / Accessory', 'hatStyle', options.hatStyle)}
          </div>
        )}
        {activeTab === 'Clothes' && (
          <>
            {renderSelector('Shirt', 'shirtStyle', options.shirtStyle)}
            {renderSelector('Glasses', 'glassesStyle', options.glassesStyle)}
          </>
        )}
        {activeTab === 'Colors' && (
          <>
            {renderSelector('Skin', 'faceColor', options.faceColor, true)}
            {renderSelector('Hair', 'hairColor', options.hairColor, true)}
            {renderSelector('Shirt', 'shirtColor', options.shirtColor, true)}
            {renderSelector('Background', 'bgColor', options.bgColor, true)}
          </>
        )}
      </div>

      <div style={{ width: '100%', borderTop: `1px solid ${borderCard}`, paddingTop: '16px' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            background: '#98FF98', // Mint color
            color: '#064E3B', // Dark green for high contrast text
            border: 'none',
            padding: '14px',
            borderRadius: '16px',
            fontSize: '15px',
            fontWeight: 800,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(152, 255, 152, 0.3)',
            transition: 'transform 0.2s'
          }}
        >
          <RiCheckLine size={20} />
          {saving ? 'Saving...' : 'Save Avatar'}
        </button>
      </div>
    </motion.div>
  );
}
