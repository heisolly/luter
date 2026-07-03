import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  PiDotsSixVertical, 
  PiFlame, 
  PiCompass, 
  PiLightning, 
  PiChartPieSlice, 
  PiChecks, 
  PiCalendarBlank, 
  PiClock, 
  PiFolder, 
  PiUsers,
  PiSquaresFour
} from 'react-icons/pi';

export default function WidgetCustomizer({ 
  isDark = false,
  widgets,
  setWidgets,
  content,
  setContent
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeWidgetsCount = widgets.filter(w => w.active).length;

  const toggleWidget = (id) => {
    setWidgets(widgets.map(w => {
      if (w.id === id) {
        if (!w.active && activeWidgetsCount >= 3) return w; // Max 3
        return { ...w, active: !w.active };
      }
      return w;
    }));
  };

  const toggleContent = (id) => {
    setContent(content.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  const DraggableRow = ({ item, onToggle, isWidget }) => {
    // Map string IDs to Phosphor icons
    const getIcon = (id) => {
      switch(id) {
        case 'heatmap': return PiFlame;
        case 'explore': return PiCompass;
        case 'streak': return PiLightning;
        case 'studyProgress': return PiChartPieSlice;
        case 'todo': return PiChecks;
        case 'calendar': return PiCalendarBlank;
        case 'recent': return PiClock;
        case 'library': return PiFolder;
        case 'groups': return PiUsers;
        default: return PiFlame;
      }
    };
    
    const Icon = getIcon(item.id);
    const isActive = item.active;
    const isDisabled = !isActive && isWidget && activeWidgetsCount >= 3;

    return (
      <Reorder.Item 
        value={item} 
        id={item.id}
        className="flex w-full items-center gap-2"
      >
        <div className="shrink-0 cursor-grab p-1 text-secondary-400 hover:text-secondary-600 active:cursor-grabbing">
          <PiDotsSixVertical className="h-5 w-5" />
        </div>
        <div className={`flex flex-1 items-center justify-between rounded-xl border px-3 py-2 transition-colors ${isActive ? 'border-primary-200 bg-primary-50' : 'border-transparent bg-transparent hover:bg-secondary-50 opacity-60 hover:opacity-100'}`}>
          <div className="flex items-center gap-2.5">
            <span className={isActive ? 'text-primary-600' : 'text-body-600'}>
              <Icon className="h-5 w-5" />
            </span>
            <span className={`text-sm font-semibold ${isActive ? 'text-primary-950' : 'text-body-600'}`}>
              {item.title}
            </span>
          </div>
          <button 
            type="button" 
            role="switch" 
            aria-checked={isActive} 
            data-state={isActive ? 'checked' : 'unchecked'}
            onClick={() => onToggle(item.id)}
            disabled={isDisabled}
            className={`group peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${isActive ? 'bg-primary-500' : 'bg-secondary-200 border border-secondary-300'}`}
          >
            <motion.span 
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              data-state={isActive ? 'checked' : 'unchecked'} 
              className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform"
              animate={{ x: isActive ? 22 : 2 }} 
            />
          </button>
        </div>
      </Reorder.Item>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Customise Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-secondary-50 dark:bg-gray-800 border border-secondary-200 dark:border-gray-700 rounded-full text-sm font-semibold text-subtitle-800 dark:text-gray-200 shadow-sm hover:bg-secondary-100 dark:hover:bg-gray-700 transition-colors"
      >
        <LayoutGrid className="w-5 h-5" />
        Customise
      </button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
            className="absolute right-0 top-[calc(100%+8px)] z-[202] text-popover-foreground outline-none dark:border-secondary-300 dark:shadow-lg dark:shadow-black/20 max-w-[calc(100vw-32px)] text-pretty break-words leading-none flex w-[280px] flex-col gap-6 rounded-3xl border border-secondary-200 bg-secondary-50 p-4 shadow-lg origin-top-right"
          >
            <h2 className="sr-only">Customise</h2>
            
            {/* Widgets Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-body-600">Widgets</span>
                <span className="rounded-lg bg-secondary-200 px-1.5 py-0.5 text-xs font-bold text-subtitle-800 opacity-70">
                  {activeWidgetsCount}/3
                </span>
              </div>
              <Reorder.Group axis="y" values={widgets} onReorder={setWidgets} className="flex flex-col gap-1">
                {widgets.map(item => (
                  <DraggableRow key={item.id} item={item} onToggle={toggleWidget} isWidget={true} />
                ))}
              </Reorder.Group>
            </div>

            {/* Content Section */}
            <div className="flex flex-col gap-4">
              <span className="text-sm font-bold text-body-600">Content</span>
              <Reorder.Group axis="y" values={content} onReorder={setContent} className="flex flex-col gap-1">
                {content.map(item => (
                  <DraggableRow key={item.id} item={item} onToggle={toggleContent} isWidget={false} />
                ))}
              </Reorder.Group>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
