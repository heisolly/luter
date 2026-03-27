import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────
   PerimeterInput
   An input where — on focus — an emerald SVG line travels around its border.
───────────────────────────────────────────────────────────────────────── */
export const PerimeterInput = React.forwardRef(
  ({ value, onChange, placeholder, type = 'text', onEnter }, ref) => {
    const [focused, setFocused] = useState(false);

    const handleKey = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); onEnter?.(); }
    };

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'off'}
          style={{
            width: '100%',
            background: '#fafafa',
            border: `1.5px solid ${focused ? 'var(--primary)' : value ? '#d1d5db' : '#e8e8ec'}`,
            borderRadius: 12,
            padding: '16px 18px',
            fontSize: 15,
            fontFamily: 'var(--font-inter)',
            color: '#111',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: focused ? '0 0 0 3px var(--primary-glow)' : 'none',
          }}
        />

        {/* Travelling perimeter line */}
        <AnimatePresence>
          {focused && (
            <motion.div
              key="perimeter"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 12, overflow: 'hidden' }}
            >
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', fill: 'none' }}>
                <motion.rect
                  x="1.5" y="1.5"
                  width="calc(100% - 3px)"
                  height="calc(100% - 3px)"
                  rx="10"
                  stroke="var(--primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, pathOffset: 0, opacity: 0.6 }}
                  animate={{ pathLength: 1, pathOffset: 1, opacity: 0 }}
                  transition={{ duration: 1.0, ease: [0.4, 0, 0.2, 1] }}
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
PerimeterInput.displayName = 'PerimeterInput';

/* ─────────────────────────────────────────────────────────────────────────
   UnlockButton
   Flat/muted → elevates with purple shadow when valid.
   Haptic shake on invalid submission.
───────────────────────────────────────────────────────────────────────── */
export const UnlockButton = ({ label, onClick, loading, valid, shake }) => (
  <motion.button
    onClick={onClick}
    disabled={loading}
    animate={
      shake
        ? {
            x: [-7, 7, -5, 5, -3, 3, 0],
            backgroundColor: 'var(--primary)',
            boxShadow: '0 0 0 3px var(--primary-glow)',
          }
        : {
            backgroundColor: valid ? 'var(--primary)' : '#f3f4f6',
            color: valid ? '#ffffff' : '#aaa',
            boxShadow: valid
              ? '0 4px 0 0 var(--primary-dark), 0 8px 20px -4px var(--primary-glow)'
              : '0 0 0 0 transparent',
            y: valid ? -2 : 0,
          }
    }
    whileTap={valid ? { y: 2, boxShadow: '0 0px 0 0 transparent', transition: { duration: 0.08 } } : {}}
    transition={{ type: 'spring', stiffness: 420, damping: 22 }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '13px 24px',
      borderRadius: 10,
      fontWeight: 700,
      fontSize: 14,
      fontFamily: 'var(--font-inter)',
      border: 'none',
      cursor: valid ? 'pointer' : 'default',
      letterSpacing: '-0.01em',
    }}
  >
    {loading ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : label}
    {!loading && <ChevronRight style={{ width: 15, height: 15 }} />}
  </motion.button>
);

/* ─────────────────────────────────────────────────────────────────────────
   TimelinePanel
   Left-side vertical journey tracker that matches Luter's light design.
───────────────────────────────────────────────────────────────────────── */
export const TimelinePanel = ({ steps, currentStep, complete }) => (
  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 32 }}>
    {/* Vertical line */}
    <div style={{
      position: 'absolute', left: 9, top: 20, bottom: 16,
      width: 1, background: 'var(--border-light)'
    }} />

    {steps.map((step, idx) => {
      const done = complete || currentStep > idx;
      const active = !complete && currentStep === idx;

      return (
        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 20, position: 'relative' }}>
          {/* Node */}
          <motion.div
            initial={false}
            animate={{
              backgroundColor: done ? 'var(--primary)' : active ? '#fff' : '#f5f5f5',
              borderColor: done ? 'var(--primary)' : active ? 'var(--primary)' : '#e8e8ec',
              scale: active ? 1.15 : 1,
            }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            style={{
              width: 20, height: 20, borderRadius: '50%', border: '2px solid',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1, flexShrink: 0, marginTop: 2,
            }}
          >
            {done
              ? <CheckCircle2 style={{ width: 11, height: 11, color: '#fff' }} />
              : active
                ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />
                : <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ccc' }} />
            }
          </motion.div>

          {/* Label */}
          <motion.div
            animate={{ opacity: done || active ? 1 : 0.35 }}
            transition={{ duration: 0.25 }}
          >
            <p style={{
              fontSize: 14, fontWeight: 700, color: done ? 'var(--primary)' : active ? '#111' : '#666',
              fontFamily: 'var(--font-inter)', lineHeight: 1.3, marginBottom: 3
            }}>
              {step.title}
            </p>
            <p style={{ fontSize: 12, color: '#999', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
              {done ? step.doneLabel : active ? step.activeLabel : step.pendingLabel}
            </p>
          </motion.div>
        </div>
      );
    })}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   Stepper
   Headless logic controller — manages steps, validation, keyboard shortcuts.
   Exposes a render-prop children API.
───────────────────────────────────────────────────────────────────────── */
export function Stepper({ steps, onComplete, children }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [shake, setShake] = useState(false);
  const [values, setValues] = useState(
    Object.fromEntries(steps.map((s) => [s.id, '']))
  );

  // Cmd/Ctrl + Backspace → go back
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') {
        e.preventDefault();
        if (currentStep > 0) setCurrentStep((p) => p - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentStep]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const validate = (step, val) => {
    if (!val || val.trim() === '') return false;
    if (step.validate) return step.validate(val);
    return true;
  };

  const goNext = () => {
    const step = steps[currentStep];
    const val = values[step.id];
    if (!validate(step, val)) { triggerShake(); return; }
    if (currentStep < steps.length - 1) {
      setCurrentStep((p) => p + 1);
    } else {
      onComplete(values);
    }
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep((p) => p - 1);
  };

  const setValue = (id, val) => setValues((prev) => ({ ...prev, [id]: val }));

  return children({
    currentStep,
    values,
    setValue,
    goNext,
    goBack,
    shake,
    canGoBack: currentStep > 0,
    isLast: currentStep === steps.length - 1,
    totalSteps: steps.length,
    isValid: validate(steps[currentStep], values[steps[currentStep].id]),
  });
}
