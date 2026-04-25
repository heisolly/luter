import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiArrowDownSLine as ChevronDown, RiSearchLine as Search } from 'react-icons/ri';
import { useLuterStore } from '../store/useLuterStore';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'it', label: 'Italian', native: 'Italiano' },
  { code: 'pt', label: 'Portuguese', native: 'Português' },
  { code: 'ru', label: 'Russian', native: 'Русский' },
  { code: 'zh', label: 'Chinese', native: '中文' },
  { code: 'ja', label: 'Japanese', native: '日本語' },
  { code: 'ko', label: 'Korean', native: '한국어' },
  { code: 'ar', label: 'Arabic', native: 'العربية', rtl: true },
  { code: 'he', label: 'Hebrew', native: 'עברית', rtl: true },
  { code: 'fa', label: 'Persian', native: 'فارسی', rtl: true },
  { code: 'ur', label: 'Urdu', native: 'اردو', rtl: true },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'tr', label: 'Turkish', native: 'Türkçe' },
  { code: 'nl', label: 'Dutch', native: 'Nederlands' },
  { code: 'pl', label: 'Polish', native: 'Polski' },
  { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'th', label: 'Thai', native: 'ไทย' },
  { code: 'id', label: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'ms', label: 'Malay', native: 'Bahasa Melayu' },
  { code: 'el', label: 'Greek', native: 'Ελληνικά' },
  { code: 'sv', label: 'Swedish', native: 'Svenska' },
  { code: 'da', label: 'Danish', native: 'Dansk' },
  { code: 'fi', label: 'Finnish', native: 'Suomi' },
  { code: 'no', label: 'Norwegian', native: 'Norsk' },
  { code: 'ro', label: 'Romanian', native: 'Română' },
  { code: 'hu', label: 'Hungarian', native: 'Magyar' },
  { code: 'cs', label: 'Czech', native: 'Čeština' }
];

export default function LanguageToggle() {
  const { currentLanguage, setCurrentLanguage } = useLuterStore();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [search, setSearch] = useState('');

  const currentLangObj = LANGUAGES.find(l => l.code === currentLanguage) || LANGUAGES[0];

  useEffect(() => {
    // RTL Detection
    if (currentLangObj.rtl) {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [currentLanguage, currentLangObj]);

  const filteredLanguages = useMemo(() => {
    if (!search) return LANGUAGES;
    return LANGUAGES.filter(l => 
      l.label.toLowerCase().includes(search.toLowerCase()) || 
      l.native.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div style={{ position: 'relative' }}>
      <div 
        onClick={() => setShowLangDropdown(!showLangDropdown)} 
        style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
          background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', 
          cursor: 'pointer', fontFamily: 'var(--font-outfit)', fontSize: '14px', 
          fontWeight: 600, color: '#111', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          minWidth: '100px', justifyContent: 'space-between'
        }}
      >
        <span>{currentLangObj.native}</span>
        <ChevronDown size={14} weight="bold" style={{ transform: showLangDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>

      <AnimatePresence>
        {showLangDropdown && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 10 }} 
            style={{ 
              position: 'absolute', top: '100%', right: 0, marginTop: '8px', 
              background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', 
              padding: '8px', boxShadow: '0 10px 24px rgba(0,0,0,0.1)', 
              display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '220px',
              maxHeight: '320px', zIndex: 999
            }}
          >
            {/* Search Box */}
            <div style={{ position: 'relative', marginBottom: '8px', padding: '4px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
              <input 
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search languages..."
                style={{ 
                  width: '100%', padding: '8px 8px 8px 30px', borderRadius: '8px', 
                  border: '1px solid #F3F4F6', background: '#F9FAFB', fontSize: '13px', 
                  outline: 'none', fontFamily: 'var(--font-outfit)'
                }}
              />
            </div>

            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {filteredLanguages.map(l => (
                <div 
                  key={l.code} 
                  onClick={() => { setCurrentLanguage(l.code); setShowLangDropdown(false); setSearch(''); }} 
                  style={{ 
                    padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', 
                    background: currentLanguage === l.code ? '#F3E8FF' : 'transparent', 
                    color: currentLanguage === l.code ? '#4B0082' : '#4B5563', 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{l.native}</span>
                    <span style={{ fontSize: '11px', opacity: 0.6 }}>{l.label}</span>
                  </div>
                  {currentLanguage === l.code && <div style={{ width: '6px', height: '6px', background: '#A855F7', borderRadius: '50%' }} />}
                </div>
              ))}
              {filteredLanguages.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#9CA3AF' }}>No languages found</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
