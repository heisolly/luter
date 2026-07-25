import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, CaretDown,
  FileText, ChartBar, Hash, 
  Folder, Cards, MagnifyingGlass,
  Question, CheckCircle, Shuffle,
  ListBullets, Keyboard, TextT, CheckSquareOffset, Check
} from '@phosphor-icons/react';

// Common Colors Matching Explore Luter
const font = "'Quicksand', system-ui, sans-serif";

const Header = ({ title, onClose, isDark, textBody, textTitle }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 18px 14px'
  }}>
    <span style={{ fontSize: '18px', fontWeight: 800, color: textBody, letterSpacing: '-0.2px' }}>
      {title}
    </span>
    <button 
      onClick={onClose}
      style={{
        width: '28px', height: '28px', borderRadius: '50%',
        background: isDark ? '#111827' : '#E5E7EB', border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: textTitle
      }}
    >
      <X size={14} weight="bold" />
    </button>
  </div>
);

const ListItem = ({ icon: Icon, title, isToggle, toggleValue, onClick, hoverBg, textBody, textTitle, mintColor, isDark }) => (
  <div 
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 14px', borderRadius: '16px', cursor: 'pointer',
      transition: 'background-color 0.2s', marginBottom: '2px'
    }}
    onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg}
    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {Icon && <Icon size={20} color={textTitle} weight="regular" />}
      <span style={{ fontSize: '15px', fontWeight: 600, color: textBody }}>{title}</span>
    </div>
    {isToggle && (
      <div style={{
        width: '40px', height: '22px', borderRadius: '12px',
        background: toggleValue ? mintColor : (isDark ? '#374151' : '#CBD5E1'),
        position: 'relative', transition: 'background 0.2s'
      }}>
        <div style={{
          width: '18px', height: '18px', borderRadius: '50%',
          background: '#FFF', position: 'absolute', top: '2px',
          left: toggleValue ? '20px' : '2px',
          transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }} />
      </div>
    )}
  </div>
);

const DropdownRow = ({ icon: Icon, title, value, options, selectedValues, onSelect, isMulti, hoverBg, textTitle, textBody, bgInner, borderColor, mintColor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [direction, setDirection] = useState('down');
  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDirection(spaceBelow < 260 ? 'up' : 'down');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: 'relative', marginBottom: '2px' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', borderRadius: '16px', cursor: 'pointer',
          transition: 'background-color 0.2s',
          backgroundColor: isOpen ? hoverBg : 'transparent'
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg}
        onMouseLeave={e => !isOpen && (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {Icon && <Icon size={20} color={textTitle} weight="regular" />}
          <span style={{ fontSize: '15px', fontWeight: 600, color: textBody }}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {value && <span style={{ fontSize: '14px', color: textTitle, fontWeight: 500 }}>{value}</span>}
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <CaretDown size={16} color={textTitle} weight="bold" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'absolute', zIndex: 50,
              top: direction === 'down' ? '100%' : 'auto',
              bottom: direction === 'up' ? '100%' : 'auto',
              marginTop: direction === 'down' ? '4px' : '0',
              marginBottom: direction === 'up' ? '4px' : '0',
              right: 0,
              minWidth: '240px', maxWidth: '320px',
              padding: '6px',
              background: bgInner, borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              border: `1px solid ${borderColor}`,
              transformOrigin: direction === 'down' ? 'top right' : 'bottom right'
            }}
          >
            {options.map((opt) => {
              const isSelected = isMulti ? selectedValues.includes(opt.id) : selectedValues === opt.id;
              return (
                <div 
                  key={opt.id}
                  onClick={() => {
                    onSelect(opt.id);
                    if (!isMulti) setIsOpen(false);
                  }}
                  style={{
                    display: 'flex', alignItems: 'flex-start',
                    padding: '12px 14px', borderRadius: '12px', cursor: 'pointer',
                    transition: 'background-color 0.15s',
                    backgroundColor: isSelected ? hoverBg : 'transparent'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg}
                  onMouseLeave={e => !isSelected && (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {isMulti && (
                    <div style={{ 
                      width: '18px', height: '18px', borderRadius: '4px', 
                      border: `2px solid ${isSelected ? (mintColor || '#98FF98') : borderColor}`, 
                      background: isSelected ? `${mintColor || '#98FF98'}15` : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginRight: '12px', flexShrink: 0, marginTop: '2px',
                      transition: 'all 0.2s'
                    }}>
                      {isSelected && <Check size={12} weight="bold" color={mintColor || '#98FF98'} />}
                    </div>
                  )}

                  {opt.icon && <div style={{ paddingTop: '1px', marginRight: '10px' }}><opt.icon size={18} color={textBody} weight={isSelected ? 'fill' : 'regular'} /></div>}
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: textBody, letterSpacing: '-0.3px' }}>
                      {opt.label || opt.title || opt.id}
                    </span>
                    {opt.desc && (
                      <span style={{ fontSize: '13px', color: textTitle, marginTop: '4px', lineHeight: 1.4, fontWeight: 500 }}>
                        {opt.desc}
                      </span>
                    )}
                  </div>
                  {!isMulti && isSelected && <div style={{ paddingTop: '2px' }}><CheckCircle size={18} color={mintColor || '#98FF98'} weight="fill" /></div>}
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SliderRow = ({ icon: Icon, title, value, onChange, min, max, userTier, isDark, textTitle, textBody, mintColor }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div style={{
      padding: '16px 14px', borderRadius: '16px', marginBottom: '2px', cursor: 'default'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {Icon && <Icon size={20} color={textTitle} weight="regular" />}
          <span style={{ fontSize: '15px', fontWeight: 600, color: textBody }}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '16px', fontWeight: 800, color: textBody }}>{value}</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: textTitle, marginTop: '2px' }}>/ {max}</span>
        </div>
      </div>
      
      <div style={{ position: 'relative', height: '24px', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', width: '100%', height: '6px', background: isDark ? '#374151' : '#E2E8F0', borderRadius: '3px' }} />
        <div style={{ position: 'absolute', width: `${percentage}%`, height: '6px', background: mintColor || '#98FF98', borderRadius: '3px', transition: 'width 0.1s' }} />
        
        <input 
          type="range"
          min={min}
          max={max}
          step={5}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: 'absolute', width: '100%', height: '100%', margin: 0, opacity: 0, cursor: 'pointer'
          }}
        />
        
        <div style={{
          position: 'absolute', left: `calc(${percentage}% - 10px)`,
          width: '20px', height: '20px', borderRadius: '50%', background: '#FFF',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: `2px solid ${mintColor || '#98FF98'}`,
          pointerEvents: 'none', transition: 'left 0.1s'
        }} />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: textTitle }}>{min}</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: textTitle }}>
          {max} {userTier === 'free' ? '(Free Max)' : userTier === 'pro' ? '(Pro Max)' : '(Premium Max)'}
        </span>
      </div>
    </div>
  );
};

export default function QuizSetupOverlay({ 
  isOpen, 
  onClose, 
  isDark,
  config,
  onUpdateConfig,
  onStartQuiz,
  isRuntime = false,
  isGenerating = false,
  userTier = 'free'
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isOpen) return null;

  const bgOuter = isDark ? '#1a2234' : '#F3F4F6'; 
  const bgInner = isDark ? '#111827' : '#FFFFFF'; 
  const textTitle = isDark ? '#9CA3AF' : '#6B7280'; 
  const textBody = isDark ? '#F9FAFB' : '#111827'; 
  const hoverBg = isDark ? '#1e2d45' : '#F7F5FF'; 
  const borderColor = isDark ? '#2d3a50' : '#EFEFEF';
  const mintColor = '#98FF98';

  const updateConfig = (key, val) => {
    if (onUpdateConfig) {
      onUpdateConfig({ ...config, [key]: val });
    }
  };

  const toggleQuestionType = (type) => {
    const types = config.questionTypes;
    if (types.includes(type)) {
      if (types.length > 1) updateConfig('questionTypes', types.filter(t => t !== type));
    } else {
      updateConfig('questionTypes', [...types, type]);
    }
  };

  const questionOptions = [
    { id: 'Multiple Choice', title: 'Multiple Choice', desc: 'ABCD questions to test recognition and recall', icon: ListBullets },
    { id: 'Open Ended', title: 'Open Ended', desc: 'Write a short paragraph for better reasoning', icon: Keyboard },
    { id: 'Fill in the Blanks', title: 'Fill in the blank', desc: 'Complete missing words to reinforce memory', icon: TextT },
    { id: 'True/False', title: 'True or False', desc: 'Choose between true or false for a fast review', icon: CheckSquareOffset }
  ];

  const popVariants = {
    enter: { scale: 0.95, opacity: 0, filter: 'blur(4px)' },
    center: { scale: 1, opacity: 1, filter: 'blur(0px)' },
    exit: { scale: 0.95, opacity: 0, filter: 'blur(4px)' }
  };

  const questionMax = userTier === 'premium' ? 200 : userTier === 'pro' ? 100 : 20;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 40, display: 'flex', 
          alignItems: isMobile ? 'flex-end' : 'center', 
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', 
          padding: isMobile ? '0' : '20px'
        }}
        onClick={onClose}
      >
        <motion.div
          variants={popVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: isMobile ? '100vw' : '90vw', 
            maxWidth: isMobile ? 'none' : '560px', 
            maxHeight: isMobile ? '90vh' : '85vh',
            background: bgOuter, 
            borderRadius: isMobile ? '24px 24px 0 0' : '24px', 
            overflow: 'visible',
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)', fontFamily: font,
            display: 'flex', flexDirection: 'column'
          }}
        >
          <Header title={isRuntime ? "Quiz Settings" : "Quiz Setup"} onClose={onClose} isDark={isDark} textBody={textBody} textTitle={textTitle} />
          
          <div style={{
            display: 'flex', flex: 1, flexDirection: 'column',
            borderRadius: '20px', backgroundColor: bgInner, 
            padding: '12px 8px', 
            margin: isMobile ? '0 8px 8px' : '0 4px 4px',
            overflow: 'visible'
          }}>
            {!isRuntime ? (
              <>
                <div style={{ padding: '0 14px', fontSize: '11px', fontWeight: 800, color: textTitle, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Configuration
                </div>
                
                <DropdownRow 
                  icon={ChartBar} title="Difficulty" value={config.difficulty} 
                  hoverBg={hoverBg} textTitle={textTitle} textBody={textBody} bgInner={bgInner} borderColor={borderColor} mintColor={mintColor}
                  options={[{id: 'Easy'}, {id: 'Medium'}, {id: 'Hard'}]}
                  selectedValues={config.difficulty}
                  onSelect={(id) => updateConfig('difficulty', id)}
                />

                <SliderRow
                  icon={Hash} title="Questions" value={Math.min(config.questionCount || 10, questionMax)} 
                  min={5} max={questionMax}
                  onChange={(val) => updateConfig('questionCount', val)}
                  userTier={userTier} isDark={isDark} textTitle={textTitle} textBody={textBody} mintColor={mintColor}
                />

                <DropdownRow  
                  icon={Question} title="Types" value={`${config.questionTypes.length} Selected`} 
                  hoverBg={hoverBg} textTitle={textTitle} textBody={textBody} bgInner={bgInner} borderColor={borderColor} mintColor={mintColor}
                  options={questionOptions}
                  selectedValues={config.questionTypes}
                  onSelect={toggleQuestionType}
                  isMulti={true}
                />
                
                <div style={{ marginTop: '16px', padding: '0 14px', fontSize: '11px', fontWeight: 800, color: textTitle, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Content
                </div>
                
                <DropdownRow 
                  icon={FileText} title="Source" value={config.source || 'Document'} 
                  hoverBg={hoverBg} textTitle={textTitle} textBody={textBody} bgInner={bgInner} borderColor={borderColor} mintColor={mintColor}
                  options={[
                    {id: 'Document', icon: FileText}, 
                    {id: 'Folder', icon: Folder}, 
                    {id: 'Flashcards', icon: Cards}
                  ]}
                  selectedValues={config.source || 'Document'}
                  onSelect={(id) => updateConfig('source', id)}
                />
              </>
            ) : (
              <>
                <div style={{ padding: '0 14px', fontSize: '11px', fontWeight: 800, color: textTitle, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Preferences
                </div>
                <ListItem icon={MagnifyingGlass} title="Show Explanations" isToggle toggleValue={config.showExplanations} onClick={() => updateConfig('showExplanations', !config.showExplanations)} hoverBg={hoverBg} textBody={textBody} textTitle={textTitle} mintColor={mintColor} isDark={isDark} />
                <ListItem icon={CheckCircle} title="Reveal Answers" isToggle toggleValue={config.showCorrectAnswer} onClick={() => updateConfig('showCorrectAnswer', !config.showCorrectAnswer)} hoverBg={hoverBg} textBody={textBody} textTitle={textTitle} mintColor={mintColor} isDark={isDark} />
                <ListItem icon={Shuffle} title="Shuffle Questions" isToggle toggleValue={config.shuffleQuestions} onClick={() => updateConfig('shuffleQuestions', !config.shuffleQuestions)} hoverBg={hoverBg} textBody={textBody} textTitle={textTitle} mintColor={mintColor} isDark={isDark} />
                <ListItem icon={Shuffle} title="Shuffle Answers" isToggle toggleValue={config.shuffleAnswers} onClick={() => updateConfig('shuffleAnswers', !config.shuffleAnswers)} hoverBg={hoverBg} textBody={textBody} textTitle={textTitle} mintColor={mintColor} isDark={isDark} />
              </>
            )}
          </div>

          {!isRuntime && (
            <div style={{ padding: '12px', background: bgOuter, borderRadius: '0 0 24px 24px' }}>
              <button 
                onClick={onStartQuiz}
                disabled={isGenerating}
                style={{
                  width: '100%', padding: '14px', borderRadius: '16px',
                  background: mintColor, color: '#0F172A', 
                  border: 'none', fontSize: '15px', fontWeight: 800, 
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  fontFamily: font, opacity: isGenerating ? 0.7 : 1,
                  transition: 'transform 0.2s, filter 0.2s'
                }}
                onMouseEnter={e => !isGenerating && (e.currentTarget.style.filter = 'brightness(1.05)')}
                onMouseLeave={e => !isGenerating && (e.currentTarget.style.filter = 'none')}
              >
                {isGenerating ? 'Generating...' : 'Start Quiz'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
