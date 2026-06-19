import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { CaretLeft, CaretRight, ArrowsClockwise, GraduationCap, Users, Sparkle, CircleNotch, PaintBrush, PencilSimple, Trash, Star, FloppyDisk, X, BookOpen, TextAlignLeft, Brain, ArrowUp, MagnifyingGlass, Image as ImageIcon, Paperclip, Link, TextAa, Copy } from '@phosphor-icons/react';
import { useBroadcastEvent, useEventListener, useOthers, useStorage } from './CollaborationProvider';
import { MaterialAnalysisService } from '../../services/materialAnalysisService';

export default function WorkstationFlashcards({ items = [], isDark = false, material, user, onViewContext, readOnly = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0); // 1 for right, -1 for left
  const [generatedItems, setGeneratedItems] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Progress & Mastery Tracking
  const [sessionStats, setSessionStats] = useState({ good: 0, hard: 0 });
  const [showSummary, setShowSummary] = useState(false);
  const [cardTheme, setCardTheme] = useState('typographic'); // 'minimal' | 'brutal' | 'scrapbook' | 'typographic'
  const [selectedFont, setSelectedFont] = useState('system'); // 'system' | 'dyslexic' | 'serif' | 'mono'
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  // Edit & Progress State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ front: '', back: '' });
  const [cardProgress, setCardProgress] = useState({}); // Stores { is_starred: boolean }
  
  // AI Help State
  const [showAiHelp, setShowAiHelp] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Collaborative hooks
  const broadcast = useBroadcastEvent();
  const others = useOthers() || [];

  useEventListener(({ event }) => {
    if (event.type === 'SYNC_FLASHCARD_INDEX') {
      setCurrentIndex(event.index);
      setIsFlipped(false);
    } else if (event.type === 'SYNC_FLASHCARD_FLIP') {
      setIsFlipped(event.isFlipped);
    }
  });

  const yFlashcards = useStorage(doc => doc.getArray('flashcards'));

  useEffect(() => {
    if (!yFlashcards) return;

    const syncCards = () => {
      const arr = yFlashcards.toArray();
      if (arr.length > 0) {
        setGeneratedItems(arr);
      }
    };

    syncCards();
    yFlashcards.observe(syncCards);
    return () => yFlashcards.unobserve(syncCards);
  }, [yFlashcards]);

  // Initial seeding to Yjs if it's empty
  useEffect(() => {
    if (yFlashcards && yFlashcards.length === 0 && Array.isArray(items) && items.length > 0 && !isGenerating) {
      // Small timeout to ensure Yjs didn't just need a ms to load from IndexedDB
      const timer = setTimeout(() => {
        if (yFlashcards.length === 0) {
          yFlashcards.push(items);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [yFlashcards, items, isGenerating]);

  const getSafeItems = () => {
    if (generatedItems) return generatedItems;
    if (Array.isArray(items) && items.length > 0) return items;
    if (items?.flashcards && Array.isArray(items.flashcards)) return items.flashcards;
    if (items?.items && Array.isArray(items.items)) return items.items;
    
    // Also check if material.analysis.flashcards has it nested
    const analysisFlashcards = material?.analysis?.flashcards;
    if (Array.isArray(analysisFlashcards) && analysisFlashcards.length > 0) return analysisFlashcards;
    if (analysisFlashcards?.flashcards && Array.isArray(analysisFlashcards.flashcards)) return analysisFlashcards.flashcards;
    if (analysisFlashcards?.items && Array.isArray(analysisFlashcards.items)) return analysisFlashcards.items;
    
    // Final check for root level content
    if (material?.flashcards && Array.isArray(material.flashcards)) return material.flashcards;
    if (material?.content?.flashcards && Array.isArray(material.content.flashcards)) return material.content.flashcards;

    return [];
  };

  const safeItems = getSafeItems();

  const cards = safeItems.map((card, index) => ({
    id: card?.id || `card_${index}`,
    front: card?.front || card?.question || card?.term || card?.q || 'No question',
    back: card?.back || card?.answer || card?.definition || card?.a || 'No answer',
  }));

  const totalCards = cards.length;

  // Auto-generate flashcards if none exist
  useEffect(() => {
    if (totalCards === 0 && material && user && !isGenerating && generatedItems === null) {
      handleGenerate();
    }
  }, [totalCards, material, user, isGenerating, generatedItems]);

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  const syncState = (newIndex, newFlipped) => {
    if (newIndex !== undefined) {
      setCurrentIndex(newIndex);
      broadcast({ type: 'SYNC_FLASHCARD_INDEX', index: newIndex });
    }
    if (newFlipped !== undefined) {
      setIsFlipped(newFlipped);
      broadcast({ type: 'SYNC_FLASHCARD_FLIP', isFlipped: newFlipped });
    }
  };

  const handleNext = (dir = 1) => {
    if (currentIndex < totalCards - 1) {
      setDirection(dir);
      syncState(currentIndex + 1, false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      syncState(currentIndex - 1, false);
    }
  };

  const handleFlip = () => {
    syncState(undefined, !isFlipped);
  };

  // Tinder-style Swiping Physics
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const scale = useTransform(x, [-200, 0, 200], [0.9, 1, 0.9]);
  
  // Swipe indicator opacities
  const hardOpacity = useTransform(x, [-100, -50], [1, 0]);
  const goodOpacity = useTransform(x, [50, 100], [0, 1]);

  const handleMastery = async (score) => {
    const cardId = cards[currentIndex]?.id;
    if (!cardId) return;
    
    // Save locally
    setCardProgress(prev => ({
      ...prev,
      [cardId]: { ...prev[cardId], mastery_score: score }
    }));
    
    // Update stats
    if (score === 2) {
      setSessionStats(prev => ({ ...prev, good: prev.good + 1 }));
    } else {
      setSessionStats(prev => ({ ...prev, hard: prev.hard + 1 }));
      
      // Spaced Repetition: Re-insert this card at the end of the deck
      const currentCard = cards[currentIndex];
      const newCard = { ...currentCard, id: currentCard.id + '_review_' + Date.now() };
      
      if (yFlashcards) {
        yFlashcards.push([newCard]);
      } else {
        const updatedCards = [...cards];
        updatedCards.push(newCard);
        setGeneratedItems(updatedCards);
      }
    }
    
    // Save to Supabase (fire and forget)
    if (material && user) {
      import('../../supabaseClient').then(({ supabase }) => {
        supabase.from('flashcard_progress').upsert({
          user_id: user.id,
          material_id: material.id,
          card_id: cardId,
          mastery_score: score,
          last_reviewed_at: new Date().toISOString()
        }, { onConflict: 'user_id,material_id,card_id' }).then(({ error }) => {
          if (error) console.warn("Error saving progress (Table might not exist yet):", error.message);
        });
      });
    }
    
    // Move to next
    if (currentIndex === cards.length - 1) {
      setShowSummary(true);
    } else {
      handleNext(score === 2 ? 1 : -1);
    }
  };

  const handleDragEnd = (event, info) => {
    if (info.offset.x > 100) {
      handleMastery(2); // Swiped Right (Got It)
    } else if (info.offset.x < -100) {
      handleMastery(1); // Swiped Left (Needs Work)
    }
  };

  const handleGenerate = async (isNextBatch = false) => {
    if (!material || !user) return;
    try {
      setIsGenerating(true);
      
      // If it's the next batch, we pass the existing flashcards so the AI avoids repeating them
      const options = isNextBatch ? { previous: cards.map(c => c.front) } : {};
      
      const res = await MaterialAnalysisService.generateFlashcards(material.analysis || {}, 20, material, options);
      if (res.success && res.flashcards && res.flashcards.length > 0) {
        let finalFlashcards;
        if (isNextBatch) {
           finalFlashcards = [...cards, ...res.flashcards];
           if (yFlashcards) {
             yFlashcards.push(res.flashcards);
           } else {
             setGeneratedItems(finalFlashcards);
           }
        } else {
           finalFlashcards = res.flashcards;
           if (yFlashcards) {
             yFlashcards.delete(0, yFlashcards.length);
             yFlashcards.push(finalFlashcards);
           } else {
             setGeneratedItems(finalFlashcards);
           }
        }
        
        // Save back to DB as fallback
        const newAnalysis = { ...(material.analysis || {}), flashcards: finalFlashcards };
        await MaterialAnalysisService.saveAnalysisToSupabase(material.id, newAnalysis, user.id);
        
        if (isNextBatch) {
           setShowSummary(false);
           setCurrentIndex(totalCards); // Move to the first new card
           setSessionStats({ good: 0, hard: 0 }); // Reset stats for the new batch
        }
      } else {
        if (!isNextBatch) alert("We couldn't generate flashcards from this material. Please try again.");
      }
    } catch (err) {
      console.error(err);
      if (!isNextBatch) alert("Failed to generate flashcards.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdit = async () => {
    const updatedCard = { ...cards[currentIndex], front: editForm.front, back: editForm.back };
    
    if (yFlashcards) {
      yFlashcards.delete(currentIndex, 1);
      yFlashcards.insert(currentIndex, [updatedCard]);
    } else {
      const updatedCards = [...cards];
      updatedCards[currentIndex] = updatedCard;
      setGeneratedItems(updatedCards);
    }
    
    setIsEditing(false);
    
    // Save to DB fallback
    if (material && user) {
      const updatedCards = yFlashcards ? yFlashcards.toArray() : [...cards];
      const newAnalysis = { ...(material?.analysis || {}), flashcards: updatedCards };
      await MaterialAnalysisService.saveAnalysisToSupabase(material.id, newAnalysis, user.id);
    }
  };

  const handleDeleteCard = async () => {
    if (!window.confirm("Are you sure you want to delete this flashcard?")) return;
    
    if (yFlashcards) {
      yFlashcards.delete(currentIndex, 1);
    } else {
      const updatedCards = cards.filter((_, idx) => idx !== currentIndex);
      setGeneratedItems(updatedCards);
    }
    
    if (currentIndex >= cards.length - 1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
    
    // Save to DB fallback
    if (material && user) {
      const updatedCards = yFlashcards ? yFlashcards.toArray() : cards.filter((_, idx) => idx !== currentIndex);
      const newAnalysis = { ...(material?.analysis || {}), flashcards: updatedCards };
      await MaterialAnalysisService.saveAnalysisToSupabase(material.id, newAnalysis, user.id);
    }
  };

  const toggleStar = async () => {
    const cardId = cards[currentIndex]?.id;
    if (!cardId) return;
    const currentStarred = cardProgress[cardId]?.is_starred || false;
    
    setCardProgress(prev => ({
      ...prev,
      [cardId]: { ...prev[cardId], is_starred: !currentStarred }
    }));
    // Note: We will sync this to Supabase flashcard_progress later.
  };

  const handleAiAction = async (actionType) => {
    setIsAiLoading(true);
    setAiResponse('');
    
    const card = cards[currentIndex];
    let prompt = '';
    
    if (actionType === 'explain') {
      prompt = `Explain the concept "${card.front}" simply, as if I am 5 years old. The answer on the card is: "${card.back}". Keep it under 100 words.`;
    } else if (actionType === 'example') {
      prompt = `Give me a real-world example of "${card.front}". The definition is "${card.back}". Keep it under 100 words.`;
    } else if (actionType === 'memo') {
      prompt = `Give me a memorable mnemonic or analogy to remember "${card.front}" meaning "${card.back}". Keep it under 100 words.`;
    } else if (actionType === 'visualize') {
      prompt = `Describe a vivid visual scene that helps me remember "${card.front}" which means "${card.back}". Keep it under 100 words.`;
    } else {
      prompt = `Regarding the flashcard "${card.front}" (Definition: "${card.back}"), the user asks: "${actionType}". Please respond accurately and keep it concise.`;
    }
    
    try {
      const { callGroqAPI, GROQ_MODELS } = await import('../../groqClient');
      const response = await callGroqAPI([{ role: 'user', content: prompt }], GROQ_MODELS.SPEEDSTER, { temperature: 0.5 });
      setAiResponse(response.choices[0].message.content);
    } catch (err) {
      setAiResponse("Oops! The AI is taking a break. Try again in a moment.");
    } finally {
      setIsAiLoading(false);
    }
  };

  if (totalCards === 0) {
    if (isGenerating) {
      return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#111827' : '#FAFAFA', flexDirection: 'column', gap: '24px', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative glowing orbs */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(196, 181, 253, 0.2) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }} />
          
          <div style={{ 
            padding: '48px', borderRadius: '32px', 
            backgroundColor: isDark ? 'rgba(31, 41, 55, 0.4)' : 'rgba(255, 255, 255, 0.6)', 
            backdropFilter: 'blur(20px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', 
            border: isDark ? '1px solid rgba(196, 181, 253, 0.1)' : '1px solid rgba(196, 181, 253, 0.3)', 
            boxShadow: '0 24px 48px rgba(196, 181, 253, 0.15)',
            zIndex: 1
          }}>
            <div style={{ position: 'relative', marginBottom: '24px' }}>
               <CircleNotch size={64} weight="bold" color="#C4B5FD" className="spin-animation" />
               <Sparkle size={24} weight="fill" color="#98FF98" style={{ position: 'absolute', top: '-10px', right: '-10px', animation: 'pulse 2s infinite' }} />
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '28px', color: isDark ? '#F9FAFB' : '#111827', fontFamily: 'DM Sans, sans-serif', fontWeight: 800 }}>Magic is happening...</h3>
            <p style={{ margin: 0, fontSize: '16px', maxWidth: '320px', textAlign: 'center', lineHeight: 1.6, color: isDark ? '#D1D5DB' : '#4B5563' }}>
              We are analyzing your material and generating the perfect flashcards to supercharge your learning.
            </p>
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
            @keyframes spin { 100% { transform: rotate(360deg); } }
            .spin-animation { animation: spin 1.5s linear infinite; }
            @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
          `}} />
        </div>
      );
    }
    
    // Empty state - No flashcards exist yet
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#0F172A' : '#FAFAFA', flexDirection: 'column', gap: '24px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)', filter: 'blur(30px)', zIndex: 0 }} />
        
        <img src="/mascot.png" alt="Lumii Mascot" style={{ width: '120px', height: '120px', objectFit: 'contain', zIndex: 1, filter: isDark ? 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.4))' : 'drop-shadow(0 8px 16px rgba(99, 102, 241, 0.2))', animation: 'float 6s ease-in-out infinite' }} />
        
        <div style={{ zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3 style={{ fontSize: '28px', color: isDark ? '#F8FAFC' : '#0F172A', margin: 0, fontWeight: 800, fontFamily: 'DM Sans, sans-serif' }}>No flashcards yet!</h3>
          <p style={{ color: isDark ? '#94A3B8' : '#64748B', margin: 0, maxWidth: '400px', lineHeight: 1.5, fontSize: '16px' }}>
            {readOnly ? "The creator hasn't generated any flashcards for this material yet." : "Let Lumii analyze this material and craft the perfect flashcards for your study session."}
          </p>
        </div>
        
        {!readOnly && (
          <button 
            onClick={() => handleGenerate(false)} 
            style={{ 
              marginTop: '16px', background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)', color: '#FFF', 
              padding: '16px 32px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '18px',
              boxShadow: '0 12px 24px rgba(99, 102, 241, 0.3)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', fontFamily: '"Nunito", sans-serif', zIndex: 1,
              display: 'flex', alignItems: 'center', gap: '12px'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 32px rgba(99, 102, 241, 0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(99, 102, 241, 0.3)'; }}
          >
            <Sparkle size={24} weight="fill" />
            Generate Flashcards
          </button>
        )}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        `}} />
      </div>
    );
  }

  // --- Themes ---
  const isBrutal = cardTheme === 'brutal';
  const isScrapbook = cardTheme === 'scrapbook';
  const isTypo = cardTheme === 'typographic';
  
  let bgColor = isDark ? '#0F172A' : '#F0F9FF';
  if (isBrutal) bgColor = isDark ? '#111827' : '#FAFAFA';
  if (isScrapbook) bgColor = isDark ? '#1F2937' : '#E5E5E5'; 
  if (isTypo) bgColor = isDark ? '#18181B' : '#F4F4F5'; 
  
  // Minimal Theme
  const minimalCardBg = isDark ? '#1E293B' : '#FFFFFF'; 
  const minimalCardBorder = isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)';
  const minimalCardShadow = isDark ? '0 8px 24px rgba(0, 0, 0, 0.4)' : '0 8px 24px rgba(0, 0, 0, 0.04)';
  
  // Brutal Theme
  const brutalColors = ['#C4B5FD', '#98FF98', '#FFD2A6'];
  const brutalCardBg = brutalColors[currentIndex % 3];
  const brutalCardBorder = isDark ? '3px solid rgba(255,255,255,0.9)' : '3px solid #111827';
  const brutalCardShadow = isDark ? '8px 8px 0px rgba(255,255,255,0.9)' : '8px 8px 0px #111827';

  // Scrapbook Theme
  const scrapbookCardBg = isDark ? '#374151' : '#FDFBF7';
  const scrapbookCardBorder = 'none';
  const scrapbookCardShadow = isDark ? '0 12px 32px rgba(0,0,0,0.5)' : '0 12px 32px rgba(0,0,0,0.1)';

  // Typographic Theme
  const typoCardBg = isDark ? '#27272A' : '#FFFFFF';
  const typoCardBorder = isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)';
  const typoCardShadow = isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 20px 40px rgba(0,0,0,0.05)';

  // Computed Theme Values
  let cardBg = minimalCardBg;
  let cardBorder = minimalCardBorder;
  let cardShadow = minimalCardShadow;
  let textColor = isDark ? '#F8FAFC' : '#0F172A';
  let subTextColor = isDark ? '#94A3B8' : '#64748B';

  if (isBrutal) {
    cardBg = brutalCardBg; cardBorder = brutalCardBorder; cardShadow = brutalCardShadow;
    textColor = '#111827'; subTextColor = '#111827';
  } else if (isScrapbook) {
    cardBg = scrapbookCardBg; cardBorder = scrapbookCardBorder; cardShadow = scrapbookCardShadow;
    textColor = isDark ? '#F9FAFB' : '#111827'; subTextColor = isDark ? '#D1D5DB' : '#6B7280';
  } else if (isTypo) {
    cardBg = typoCardBg; cardBorder = typoCardBorder; cardShadow = typoCardShadow;
    textColor = isDark ? '#F4F4F5' : '#18181B'; subTextColor = isDark ? '#A1A1AA' : '#71717A';
  }
  
  const brutalDotGrid = isBrutal ? `radial-gradient(circle, ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(17,24,39,0.1)'} 2px, transparent 2px)` : 'none';
  
  const toolbarBg = isBrutal ? (isDark ? '#111827' : '#FFFFFF') : (isDark ? '#1E293B' : '#FFFFFF');
  const toolbarBorder = isBrutal ? brutalCardBorder : minimalCardBorder;
  const toolbarShadow = isBrutal ? brutalCardShadow : minimalCardShadow;

  if (showSummary) {
    const totalSwipes = sessionStats.good + sessionStats.hard;
    const masteryPercentage = totalSwipes > 0 ? Math.round((sessionStats.good / totalSwipes) * 100) : 0;
    const readyForNext = masteryPercentage >= 70; // 70% threshold to unlock next batch

    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: bgColor, flexDirection: 'column', gap: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '400px', height: '400px', background: readyForNext ? 'radial-gradient(circle, rgba(152, 255, 152, 0.2) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(255, 210, 166, 0.2) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }} />
        
        <div style={{ 
          padding: '48px', borderRadius: '32px', 
          backgroundColor: isDark ? 'rgba(31, 41, 55, 0.4)' : 'rgba(255, 255, 255, 0.6)', 
          backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', alignItems: 'center', 
          border: isDark ? '1px solid rgba(196, 181, 253, 0.1)' : '1px solid rgba(196, 181, 253, 0.3)', 
          boxShadow: '0 24px 48px rgba(196, 181, 253, 0.15)', zIndex: 1
        }}>
          <GraduationCap size={64} weight="duotone" color={readyForNext ? "#98FF98" : "#FFD2A6"} style={{ marginBottom: '24px' }} />
          <h3 style={{ margin: '0 0 12px 0', fontSize: '32px', color: textColor, fontFamily: 'DM Sans, sans-serif', fontWeight: 800 }}>Deck Complete!</h3>
          <p style={{ margin: '0 0 32px 0', fontSize: '18px', textAlign: 'center', lineHeight: 1.6, color: subTextColor, fontWeight: 500 }}>
            You mastered <span style={{ color: '#98FF98', fontWeight: 800 }}>{sessionStats.good}</span> cards and found <span style={{ color: '#FFD2A6', fontWeight: 800 }}>{sessionStats.hard}</span> hard. <br/>
            Mastery: {masteryPercentage}%
          </p>

          {readyForNext ? (
            <button 
              onClick={() => handleGenerate(true)} disabled={isGenerating}
              style={{
                padding: '0 40px', height: '56px', borderRadius: '9999px', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                background: isGenerating ? (isDark ? '#374151' : '#E5E7EB') : (isBrutal ? 'linear-gradient(135deg, #C4B5FD 0%, #8B5CF6 100%)' : (isDark ? '#3B82F6' : '#2563EB')),
                color: '#FFFFFF', fontWeight: 800, fontSize: '16px', cursor: isGenerating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', boxShadow: isGenerating ? 'none' : (isBrutal ? '0 12px 24px rgba(139, 92, 246, 0.3)' : '0 8px 16px rgba(37, 99, 235, 0.2)'),
                fontFamily: 'DM Sans, sans-serif'
              }}
              onMouseEnter={e => { if(!isGenerating) e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { if(!isGenerating) e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {isGenerating ? <><CircleNotch size={24} weight="bold" className="spin-animation" /> Unlocking...</> : <><Sparkle size={24} weight="fill" /> Unlock Next 20 Cards</>}
            </button>
          ) : (
            <button 
              onClick={() => { setShowSummary(false); setCurrentIndex(0); setSessionStats({good: 0, hard: 0}); }}
              style={{
                padding: '0 40px', height: '56px', borderRadius: '9999px', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                background: isBrutal ? 'linear-gradient(135deg, #FFD2A6 0%, #F59E0B 100%)' : (isDark ? '#3B82F6' : '#2563EB'),
                color: isBrutal ? '#111827' : '#FFFFFF', fontWeight: 800, fontSize: '16px', cursor: 'pointer',
                transition: 'all 0.2s', boxShadow: isBrutal ? '0 12px 24px rgba(245, 158, 11, 0.3)' : '0 8px 16px rgba(37, 99, 235, 0.2)',
                fontFamily: 'DM Sans, sans-serif'
              }}
            >
              <ArrowsClockwise size={24} weight="bold" /> Review Missed Concepts
            </button>
          )}
        </div>
      </div>
    );
  }

  const formatText = (text) => {
    if (!text) return '';
    if (isTypo) {
      return text.replace(/\*\*(.*?)\*\*/g, `<span style="background-color: ${isDark ? '#3F3F46' : '#E4E4E7'}; padding: 4px 8px; border-radius: 4px; display: inline-block; font-family: 'DM Sans', sans-serif; font-weight: 700;">$1</span>`).replace(/\*(.*?)\*/g, '<em>$1</em>');
    }
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
  };

  const getFontFamily = (isScrapbook, isTypo, selectedFont) => {
    if (selectedFont === 'dyslexic') return '"Comic Sans MS", "OpenDyslexic", cursive';
    if (selectedFont === 'serif') return '"Lora", "Merriweather", serif';
    if (selectedFont === 'mono') return '"JetBrains Mono", monospace';
    if (selectedFont === 'system') {
      if (isScrapbook) return '"Caveat", "Comic Sans MS", cursive';
      if (isTypo) return '"Lora", "Merriweather", serif'; 
      return '"Nunito", "Quicksand", sans-serif';
    }
    return '"Nunito", "Quicksand", sans-serif';
  };
  
  const currentFontFamily = getFontFamily(isScrapbook, isTypo, selectedFont);

  const renderActionBar = () => {
    if (readOnly) return null;
    const cardId = cards[currentIndex]?.id;
    const isStarred = cardProgress[cardId]?.is_starred || false;

    if (isEditing) {
      return (
        <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '8px', zIndex: 10 }} onPointerDown={e => e.stopPropagation()}>
          <button onClick={() => { setIsEditing(false); }} style={{ background: isDark ? '#374151' : '#F3F4F6', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: textColor, display: 'flex', alignItems: 'center' }}><X size={20} weight="bold" /></button>
          <button onClick={handleSaveEdit} style={{ background: '#10B981', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: '#FFF', display: 'flex', alignItems: 'center' }}><FloppyDisk size={20} weight="fill" /></button>
        </div>
      );
    }

    const fuldismBtnStyle = {
      background: isDark ? '#1F2937' : '#FFFFFF',
      border: isDark ? '1px solid #374151' : '1px solid #E5E7EB',
      padding: '12px',
      borderRadius: '16px',
      cursor: 'pointer',
      color: isDark ? '#F9FAFB' : '#111827',
      display: 'flex', 
      alignItems: 'center',
      boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
      transition: 'transform 0.1s'
    };

    return (
      <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '12px', zIndex: 10 }} onPointerDown={e => e.stopPropagation()}>
        <button onClick={() => setShowAiHelp(true)} style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #C084FC 100%)', border: 'none', padding: '12px', borderRadius: '16px', cursor: 'pointer', color: '#FFF', display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(167, 139, 250, 0.4)' }}>
          <Sparkle size={20} weight="fill" />
        </button>
        {onViewContext && (
          <button onClick={() => onViewContext(cards[currentIndex]?.front)} style={fuldismBtnStyle} title="Find in Document">
            <MagnifyingGlass size={20} weight="bold" />
          </button>
        )}
        <button onClick={() => { setEditForm({ front: cards[currentIndex].front, back: cards[currentIndex].back }); setIsEditing(true); }} style={fuldismBtnStyle}>
          <PencilSimple size={20} weight="bold" />
        </button>
        <button onClick={handleDeleteCard} style={{...fuldismBtnStyle}}>
          <Trash size={20} weight="bold" />
        </button>
        <button onClick={toggleStar} style={{...fuldismBtnStyle, color: isStarred ? '#F59E0B' : (isDark ? '#F9FAFB' : '#111827') }}>
          <Star size={20} weight={isStarred ? "fill" : "bold"} />
        </button>
      </div>
    );
  };

  const renderCardContent = (isFront) => {
    if (!cards || !cards[currentIndex]) return null;
    const text = isFront ? cards[currentIndex].front : cards[currentIndex].back;
    const editText = isFront ? editForm.front : editForm.back;
    
    if (isEditing) {
      return (
        <textarea 
          value={editText}
          onChange={(e) => setEditForm(prev => ({ ...prev, [isFront ? 'front' : 'back']: e.target.value }))}
          style={{
            width: '100%', height: '70%', fontSize: isFront ? '28px' : '22px', 
            backgroundColor: 'transparent', border: `2px dashed ${subTextColor}`, color: textColor,
            fontFamily: '"Nunito", "Quicksand", "Comic Sans MS", sans-serif', padding: '16px', borderRadius: '16px',
            outline: 'none', resize: 'none', textAlign: 'center', lineHeight: 1.4, marginTop: '24px'
          }}
          onPointerDown={e => e.stopPropagation()} // Prevent drag while typing
        />
      );
    }
    
    return (
      <div 
        style={{ 
          fontSize: isFront ? '32px' : '24px', fontWeight: isFront ? 600 : 500, color: textColor, textAlign: 'center', lineHeight: 1.4, margin: 0,
          fontFamily: currentFontFamily, width: '100%',
          letterSpacing: isScrapbook || isTypo ? '1px' : 'normal'
        }}
        dangerouslySetInnerHTML={{ __html: formatText(text) }}
      />
    );
  };

  return (
    <div style={{ 
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      backgroundColor: bgColor, position: 'relative', overflow: 'hidden', padding: '24px',
      backgroundImage: isTypo ? `linear-gradient(to right, ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px), linear-gradient(to bottom, ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px)` : brutalDotGrid, 
      backgroundSize: isTypo ? '40px 40px' : '24px 24px'
    }}>
      {isBrutal && (
         <>
           <Sparkle size={48} weight="fill" color={isDark ? 'rgba(255,255,255,0.8)' : '#111827'} style={{ position: 'absolute', top: '15%', left: '15%', opacity: 0.8 }} />
           <Sparkle size={32} weight="fill" color={isDark ? 'rgba(255,255,255,0.8)' : '#111827'} style={{ position: 'absolute', bottom: '20%', right: '15%', opacity: 0.6 }} />
         </>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Caveat:wght@500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
      `}} />
      
      {/* Top Header / Collaboration Sync Status */}
      <div style={{
        position: 'absolute', top: '32px', width: '100%', maxWidth: '800px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 10
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: subTextColor, textTransform: 'uppercase', letterSpacing: '1.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }}></span>
            Live Study Room
          </span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: textColor, fontFamily: 'DM Sans, sans-serif' }}>
            {material?.title || 'Untitled Material'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {!readOnly && material?.id && (
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/view/${material.id}`);
                setCopyFeedback(true);
                setTimeout(() => setCopyFeedback(false), 2000);
              }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: textColor, fontWeight: 700, fontFamily: 'DM Sans, sans-serif', opacity: 0.8 }}
            >
               {copyFeedback ? <span style={{color: '#10B981'}}>Copied!</span> : <><Link size={20} weight="bold" /> Share</>}
            </button>
          )}

          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowFontMenu(!showFontMenu)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: textColor, fontWeight: 700, fontFamily: 'DM Sans, sans-serif', opacity: 0.8 }}>
              <TextAa size={20} weight="bold" /> Font
            </button>
            {showFontMenu && (
              <div style={{ position: 'absolute', top: '120%', right: '0', backgroundColor: isDark ? '#1F2937' : '#FFFFFF', padding: '8px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50, display: 'flex', flexDirection: 'column', gap: '4px', border: isDark ? '1px solid #374151' : '1px solid #E5E7EB', minWidth: '160px' }}>
                 {[{id: 'system', label: 'Default Theme Font'}, {id: 'dyslexic', label: 'Dyslexia Friendly'}, {id: 'serif', label: 'Reading Serif'}, {id: 'mono', label: 'Monospace'}].map(font => (
                   <div key={font.id} onClick={() => { setSelectedFont(font.id); setShowFontMenu(false); }} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '8px', backgroundColor: selectedFont === font.id ? (isDark ? '#374151' : '#F3F4F6') : 'transparent', color: textColor, fontSize: '14px', fontWeight: 600 }}>{font.label}</div>
                 ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => {
              if (cardTheme === 'minimal') setCardTheme('brutal');
              else if (cardTheme === 'brutal') setCardTheme('scrapbook');
              else if (cardTheme === 'scrapbook') setCardTheme('typographic');
              else setCardTheme('minimal');
            }}
            style={{ 
              background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              color: textColor, fontWeight: 700, fontFamily: 'DM Sans, sans-serif', opacity: 0.8
            }}
          >
             <PaintBrush size={20} weight="fill" /> 
             {cardTheme === 'minimal' ? 'Minimal Theme' : cardTheme === 'brutal' ? 'Brutal Theme' : cardTheme === 'scrapbook' ? 'Scrapbook Theme' : 'Typographic'}
          </button>

          <div style={{ 
            padding: '6px 12px', borderRadius: '12px', 
            backgroundColor: isBrutal ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
            border: isBrutal ? brutalCardBorder : 'none',
            boxShadow: isBrutal ? (isDark ? '4px 4px 0px rgba(255,255,255,0.9)' : '4px 4px 0px #111827') : 'none',
            fontSize: '14px', fontWeight: 700, color: textColor, fontFamily: 'monospace'
          }}>
            {currentIndex + 1} / {totalCards}
          </div>
        </div>
      </div>

      {/* Visual Stack Background Cards */}
      <div style={{ position: 'absolute', width: '100%', maxWidth: '640px', height: '420px', marginTop: '-40px' }}>
        {currentIndex < totalCards - 1 && (
           <div style={{
             position: 'absolute', width: '100%', height: '100%', 
             backgroundColor: isBrutal ? brutalColors[(currentIndex + 1) % 3] : cardBg, 
             backdropFilter: 'none',
             borderRadius: isScrapbook ? '4px' : (isTypo ? '0px' : '32px'), border: cardBorder, boxShadow: cardShadow,
             transform: isBrutal ? 'scale(0.95) translateY(24px) rotate(-3deg)' : (isScrapbook ? 'scale(0.98) translateY(12px) rotate(2deg)' : (isTypo ? 'scale(0.98) translateY(16px)' : 'scale(0.95) translateY(24px)')), 
             zIndex: 1, opacity: isBrutal ? 1 : 0.8
           }}/>
        )}
        {currentIndex < totalCards - 2 && (
           <div style={{
             position: 'absolute', width: '100%', height: '100%', 
             backgroundColor: isBrutal ? brutalColors[(currentIndex + 2) % 3] : cardBg, 
             backdropFilter: 'none',
             borderRadius: isScrapbook ? '4px' : (isTypo ? '0px' : '32px'), border: cardBorder, boxShadow: cardShadow,
             transform: isBrutal ? 'scale(0.9) translateY(48px) rotate(4deg)' : (isScrapbook ? 'scale(0.96) translateY(24px) rotate(-1deg)' : (isTypo ? 'scale(0.96) translateY(32px)' : 'scale(0.9) translateY(48px)')), 
             zIndex: 0, opacity: isBrutal ? 1 : 0.5
           }}/>
        )}
      </div>

      {/* Main Draggable Card */}
      <div style={{
        perspective: '1200px', width: '100%', maxWidth: '640px', height: '420px',
        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: '-40px', zIndex: 10
      }}>
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 100 : -100, scale: 0.9, rotateY: isFlipped ? 180 : 0 }}
            animate={{ opacity: 1, x: 0, scale: 1, rotateY: isFlipped ? 180 : 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -100 : 100, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 0.8 }}
            style={{ 
              width: '100%', height: '100%', position: 'absolute', transformStyle: 'preserve-3d', 
              x, rotate, cursor: 'grab' 
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={handleDragEnd}
            onClick={(e) => {
              if (e.target.closest('button') || e.target.closest('textarea')) return;
              handleFlip();
            }}
            whileTap={{ cursor: 'grabbing' }}
          >
            {/* Front Side */}
            <div style={{
              position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
              backgroundColor: cardBg, borderRadius: isScrapbook ? '4px' : (isTypo ? '0px' : '32px'), padding: '48px', backdropFilter: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: cardShadow, border: cardBorder,
              backgroundImage: isScrapbook ? `repeating-linear-gradient(transparent, transparent 31px, ${isDark ? '#4B5563' : '#E5E7EB'} 31px, ${isDark ? '#4B5563' : '#E5E7EB'} 32px)` : 'none'
            }}>
              {isScrapbook && (
                <Paperclip size={48} color={isDark ? '#9CA3AF' : '#6B7280'} style={{ position: 'absolute', top: '-16px', right: '40px', transform: 'rotate(15deg)', zIndex: 1, filter: 'drop-shadow(2px 4px 2px rgba(0,0,0,0.2))' }} />
              )}
              <div style={{ position: 'absolute', top: '32px', left: '32px', display: 'flex', alignItems: 'center', gap: '8px', color: subTextColor, fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isBrutal ? '#111827' : '#C4B5FD', boxShadow: isBrutal ? 'none' : '0 0 12px #C4B5FD' }}></span>
                Concept
              </div>
              {renderActionBar()}
              {renderCardContent(true)}
            </div>

            {/* Back Side */}
            <div style={{
              position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
              backgroundColor: cardBg, borderRadius: isScrapbook ? '4px' : (isTypo ? '0px' : '32px'), padding: '48px', backdropFilter: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: cardShadow, border: cardBorder,
              backgroundImage: isScrapbook ? `repeating-linear-gradient(transparent, transparent 31px, ${isDark ? '#4B5563' : '#E5E7EB'} 31px, ${isDark ? '#4B5563' : '#E5E7EB'} 32px)` : 'none',
              transform: 'rotateY(180deg)'
            }}>
              {isScrapbook && (
                <Paperclip size={48} color={isDark ? '#9CA3AF' : '#6B7280'} style={{ position: 'absolute', top: '-16px', left: '40px', transform: 'rotate(-15deg)', zIndex: 1, filter: 'drop-shadow(-2px 4px 2px rgba(0,0,0,0.2))' }} />
              )}
              <div style={{ position: 'absolute', top: '32px', left: '32px', display: 'flex', alignItems: 'center', gap: '8px', color: subTextColor, fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isBrutal ? '#111827' : '#FFD2A6', boxShadow: isBrutal ? 'none' : '0 0 12px #FFD2A6' }}></span>
                Definition
              </div>
              {renderActionBar()}
              {renderCardContent(false)}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* AI Help Overlay Panel */}
        <AnimatePresence>
          {showAiHelp && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              style={{
                position: 'absolute', bottom: '100px', left: '50%', marginLeft: '-220px',
                width: '100%', maxWidth: '440px', backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                borderRadius: '24px', padding: '24px', boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
                zIndex: 50, border: isDark ? '1px solid #374151' : '1px solid #E5E7EB',
                fontFamily: '"Nunito", "Quicksand", "Comic Sans MS", sans-serif'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <img src="/mascot.png" alt="Mascot" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', background: isDark ? '#374151' : '#FDF2F8' }} />
                  <div style={{ fontSize: '15px', color: textColor, lineHeight: 1.4 }}>
                    <strong style={{ fontWeight: 800 }}>Hi! I'm Ka, I'm here to help you!</strong><br />
                    <span style={{ color: subTextColor, fontSize: '14px' }}>Ask me anything or use our features below!</span>
                  </div>
                </div>
                <button onClick={() => setShowAiHelp(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: subTextColor, alignSelf: 'flex-start', marginTop: '-4px', marginRight: '-4px' }}><X size={20} weight="bold" /></button>
              </div>

              <div style={{ minHeight: '120px', fontSize: '15px', color: textColor, lineHeight: 1.6, marginBottom: '20px', overflowY: 'auto', maxHeight: '200px', padding: '0 4px' }}>
                {isAiLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <CircleNotch size={24} color="#A78BFA" weight="bold" style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : aiResponse ? (
                  <div dangerouslySetInnerHTML={{ __html: formatText(aiResponse) }} />
                ) : null}
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <button onClick={() => handleAiAction('explain')} style={{ flex: 1, background: isDark ? '#374151' : '#FFFFFF', color: textColor, border: isDark ? '1px solid #4B5563' : '1px solid #E5E7EB', borderRadius: '999px', padding: '10px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><TextAlignLeft size={16} /> Explain</button>
                <button onClick={() => handleAiAction('example')} style={{ flex: 1, background: isDark ? '#374151' : '#FFFFFF', color: textColor, border: isDark ? '1px solid #4B5563' : '1px solid #E5E7EB', borderRadius: '999px', padding: '10px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><BookOpen size={16} /> Example</button>
                <button onClick={() => handleAiAction('memo')} style={{ flex: 1, background: isDark ? '#374151' : '#FFFFFF', color: textColor, border: isDark ? '1px solid #4B5563' : '1px solid #E5E7EB', borderRadius: '999px', padding: '10px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Brain size={16} /> Memo</button>
                <button onClick={() => handleAiAction('visualize')} style={{ flex: 1, background: isDark ? '#374151' : '#FFFFFF', color: textColor, border: isDark ? '1px solid #4B5563' : '1px solid #E5E7EB', borderRadius: '999px', padding: '10px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><ImageIcon size={16} /> Visualize</button>
              </div>

              {/* Chat Input Field */}
              <div style={{ display: 'flex', alignItems: 'center', background: isDark ? '#111827' : '#FFFFFF', borderRadius: '999px', border: isDark ? '1px solid #374151' : '1px solid #E5E7EB', padding: '8px 16px', boxShadow: isDark ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                <input 
                  type="text" 
                  placeholder="Ask me anything..." 
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: textColor, fontSize: '14px', fontFamily: '"Nunito", sans-serif' }}
                  onKeyDown={e => {
                    if(e.key === 'Enter' && e.target.value.trim() !== '') {
                       handleAiAction(e.target.value);
                       e.target.value = '';
                    }
                  }}
                />
                <button onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling;
                  if(input.value.trim() !== '') {
                    handleAiAction(input.value);
                    input.value = '';
                  }
                }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                  <ArrowUp size={20} weight="bold" />
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Swipe Indicators (Tinder-style overlay feedback) */}
      <div style={{ position: 'absolute', top: '50%', left: '10%', transform: 'translateY(-50%)', opacity: 0, zIndex: 5 }}>
         <motion.div style={{ opacity: hardOpacity, color: '#FFD2A6', fontSize: '36px', fontWeight: 900, textTransform: 'uppercase', border: '4px solid #FFD2A6', padding: '12px 32px', borderRadius: '24px', transform: 'rotate(-15deg)', backdropFilter: 'blur(8px)', boxShadow: '0 0 32px rgba(255, 210, 166, 0.2)' }}>Hard</motion.div>
      </div>
      <div style={{ position: 'absolute', top: '50%', right: '10%', transform: 'translateY(-50%)', opacity: 0, zIndex: 5 }}>
         <motion.div style={{ opacity: goodOpacity, color: '#98FF98', fontSize: '36px', fontWeight: 900, textTransform: 'uppercase', border: '4px solid #98FF98', padding: '12px 32px', borderRadius: '24px', transform: 'rotate(15deg)', backdropFilter: 'blur(8px)', boxShadow: '0 0 32px rgba(152, 255, 152, 0.2)' }}>Good</motion.div>
      </div>

      {/* Floating Control Toolbar */}
      <div style={{
        position: 'absolute', bottom: '48px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: '16px', zIndex: 40,
      }}>
        
        <button 
          onClick={() => handleMastery(1)} 
          style={{ background: isBrutal ? '#FFD2A6' : '#FEE2E2', color: isBrutal ? '#111827' : '#EF4444', border: isBrutal ? '2px solid #111827' : 'none', borderRadius: '16px', padding: '12px 24px', fontWeight: 800, cursor: 'pointer', fontFamily: '"Nunito", "Quicksand", "Comic Sans MS", sans-serif', boxShadow: isBrutal ? '4px 4px 0px #111827' : '0 4px 12px rgba(239, 68, 68, 0.2)' }}
        >
          Needs Work
        </button>

        {/* Navigation & Flip Dock */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: toolbarBg, backdropFilter: 'none', padding: '8px', borderRadius: '9999px',
          border: isBrutal ? brutalCardBorder : `1px solid ${toolbarBorder}`, boxShadow: toolbarShadow
        }}>
          <button 
            onClick={handlePrev} disabled={currentIndex === 0}
            style={{
              width: '56px', height: '56px', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: currentIndex === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
              color: currentIndex === 0 ? (isDark ? '#334155' : '#CBD5E1') : textColor, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
            }}
          >
            <CaretLeft size={24} weight="bold" />
          </button>
          
          <button 
            onClick={handleFlip}
            style={{
              padding: '0 32px', height: '56px', borderRadius: '9999px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              backgroundColor: isDark ? '#334155' : '#F1F5F9', color: textColor, fontWeight: 800, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: 'DM Sans, sans-serif'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? '#475569' : '#E2E8F0'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#F1F5F9'}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <ArrowsClockwise size={20} weight="bold" />
            {isFlipped ? 'Show Question' : 'Reveal Answer'}
          </button>

          <button 
            onClick={() => handleNext(1)} disabled={currentIndex === totalCards - 1}
            style={{
              width: '56px', height: '56px', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: currentIndex === totalCards - 1 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
              color: currentIndex === totalCards - 1 ? (isDark ? '#334155' : '#CBD5E1') : textColor, cursor: currentIndex === totalCards - 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
            }}
          >
            <CaretRight size={24} weight="bold" />
          </button>
        </div>

        <button 
          onClick={() => handleMastery(2)} 
          style={{ background: isBrutal ? '#98FF98' : '#D1FAE5', color: isBrutal ? '#111827' : '#10B981', border: isBrutal ? '2px solid #111827' : 'none', borderRadius: '16px', padding: '12px 24px', fontWeight: 800, cursor: 'pointer', fontFamily: '"Nunito", "Quicksand", "Comic Sans MS", sans-serif', boxShadow: isBrutal ? '4px 4px 0px #111827' : '0 4px 12px rgba(16, 185, 129, 0.2)' }}
        >
          Got It!
        </button>
      </div>
    </div>
  );
}
