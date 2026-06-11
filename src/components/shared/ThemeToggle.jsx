import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ThemeToggle({ className = '' }) {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  const CurrentIcon = options.find(opt => opt.id === theme)?.icon || Monitor;

  return (
    <div className={`relative ${className}`} ref={dropdownRef} style={{ display: 'flex' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          height: 38,
          width: 38,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 100,
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
          background: isOpen ? 'var(--border-light)' : 'var(--background)',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-light)' }}
        onMouseLeave={e => { e.currentTarget.style.background = isOpen ? 'var(--border-light)' : 'var(--background)' }}
        aria-label="Toggle theme"
      >
        <CurrentIcon size={18} weight={theme === 'light' ? 'fill' : 'regular'} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 12,
              width: 160,
              background: 'var(--background)',
              borderRadius: 16,
              boxShadow: 'var(--card-shadow)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              padding: 8,
              zIndex: 100
            }}
          >
            {options.map((option) => {
              const isActive = theme === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => {
                    setTheme(option.id);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: isActive ? 'var(--border-light)' : 'transparent',
                    color: 'var(--foreground)',
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    border: 'none',
                    textAlign: 'left',
                    transition: 'background 0.2s',
                    fontFamily: 'var(--font-outfit)'
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--border-light)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <option.icon 
                    size={16} 
                    weight={isActive ? 'fill' : 'regular'} 
                    color={isActive ? 'var(--tt-brand-color-500)' : 'currentColor'}
                  />
                  {option.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
