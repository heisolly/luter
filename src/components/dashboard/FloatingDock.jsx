import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileUp, 
  FolderPlus, 
  Sparkles, 
  X, 
  Trash2, 
  BookOpen,
  Zap,
  LayoutGrid,
  MousePointer2,
  Plus
} from 'lucide-react'
import { useDeckStore } from '../../store/useDeckStore'
import { useNavigate, useLocation } from 'react-router-dom'

const FloatingDock = () => {
  const { 
    activeDeckItems, 
    removeFromDeck, 
    clearDeck, 
    isDockExpanded, 
    setDockExpanded 
  } = useDeckStore()
  
  const navigate = useNavigate()
  const location = useLocation()

  const isEmpty = activeDeckItems.length === 0
  
  const navTo = (path) => {
    navigate(path)
    setDockExpanded(false)
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="fixed bottom-8 right-8 z-[1000] flex flex-col items-end gap-3">
      
      {/* ── SESSION DECK OVERLAY (REFINED) ── */}
      <AnimatePresence>
        {isDockExpanded && (
          <motion.div 
            initial={{ opacity: 0, y: 15, x: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, x: 10, scale: 0.98 }}
            className="w-[360px] bg-white rounded-[28px] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.12)] border border-[#F0F0F5] overflow-hidden mb-2"
          >
            <div className="px-6 py-5 border-b border-[#F0F0F5] flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#4B00D1] animate-pulse" />
                <h3 className="font-black text-[11px] tracking-[0.2em] text-slate-500 uppercase">
                  Session Curation
                </h3>
              </div>
              <button 
                onClick={() => setDockExpanded(false)} 
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition-all"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="max-h-[320px] overflow-y-auto px-2 py-3">
              {isEmpty ? (
                <div className="py-12 text-center px-6">
                  <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-5">
                    <LayoutGrid size={24} strokeWidth={1} />
                  </div>
                  <p className="text-[13px] font-bold text-slate-400 leading-relaxed">
                    Stack your study deck<br/>to begin.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {activeDeckItems.map((item) => (
                    <div key={item.content_id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl group transition-all">
                      <div className="w-10 h-10 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center text-purple-600 flex-shrink-0">
                        <BookOpen size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-bold text-slate-900 truncate">
                          {item.metadata?.title || 'Untitled'}
                        </div>
                        <div className="text-[10px] font-black text-purple-500 uppercase tracking-widest mt-0.5">
                          {item.metadata?.course_code || 'Doc'}
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFromDeck(item.content_id)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isEmpty && (
              <div className="p-4 border-t border-[#F0F0F5] bg-white">
                 <button 
                  onClick={() => navTo('/dashboard/workstation')}
                  className="w-full h-14 bg-[#4B00D1] text-white rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-lg shadow-purple-200 hover:bg-[#3A00A6] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Zap size={16} fill="white" />
                  Launch Session
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── THE PREMIUM DOCK (BOTTOM-RIGHT) ── */}
      <div className="flex items-center gap-2.5 p-2 rounded-full bg-white/90 backdrop-blur-2xl border border-[#F0F0F5] shadow-[0_20px_48px_-12px_rgba(0,0,0,0.12)]">
        
        {/* 1. UPLOAD DOCUMENT - PREMIUM LAVENDER */}
        <button 
          onClick={() => navTo('/dashboard/upload')}
          className={`h-12 px-5 rounded-full flex items-center gap-3 transition-all duration-300 border
            ${isActive('/dashboard/upload') 
              ? 'bg-[#E2D6FF] border-[#D1BBFF] text-[#4B00D1] scale-95' 
              : 'bg-[#E2D6FF] border-[#E2D6FF] hover:border-[#D1BBFF] text-[#4B00D1]'}`}
        >
          <FileUp size={18} strokeWidth={2.5} />
          <span className="text-[14px] font-extrabold tracking-tight hidden sm:block">Upload Document</span>
        </button>

        {/* 2. DECKS - CLEAN WHITE */}
        <button 
          onClick={() => setDockExpanded(!isDockExpanded)}
          className={`h-12 px-5 rounded-full border flex items-center gap-3 transition-all duration-300 relative
            ${isDockExpanded 
              ? 'bg-slate-50 border-[#E5E7EB] text-[#111]' 
              : 'bg-white border-[#F2F2F2] hover:border-[#E5E7EB] text-[#111]'}`}
        >
          <FolderPlus size={18} strokeWidth={2.2} />
          <span className="text-[14px] font-extrabold tracking-tight hidden sm:block">Decks</span>
          
          {!isEmpty && (
            <span className="absolute -top-1 -right-1 w-5.5 h-5.5 bg-[#4B00D1] text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center">
              {activeDeckItems.length}
            </span>
          )}
        </button>

        {/* 3. AI CHAT - CLEAN WHITE */}
        <button 
          onClick={() => navTo('/dashboard/compete')}
          className={`h-12 px-5 rounded-full border flex items-center gap-3 transition-all duration-300
            ${isActive('/dashboard/compete') 
              ? 'bg-slate-50 border-[#E5E7EB] text-[#111]' 
              : 'bg-white border-[#F2F2F2] hover:border-[#E5E7EB] text-[#111]'}`}
        >
          <div className="border-[1.8px] border-current rounded-[4px] w-4.5 h-4.5 flex items-center justify-center p-[2px]">
            <MousePointer2 size={10} fill="currentColor" strokeWidth={0} className="translate-x-[1px] translate-y-[1px]" />
          </div>
          <span className="text-[14px] font-extrabold tracking-tight hidden sm:block">Ai Chat</span>
        </button>

      </div>

    </div>
  )
}

export default FloatingDock
