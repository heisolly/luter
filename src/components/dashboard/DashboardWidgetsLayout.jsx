import React, { useState } from 'react';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal } from 'lucide-react';
import { Flame, Compass, Zap, ChartPie, ListChecks, CalendarDays, Clock, FolderOpen, UsersRound } from 'lucide-react';

import WidgetCustomizer from './WidgetCustomizer';
import ExploreTasksWidget from './ExploreTasksWidget';
import CalendarHeatmap from './CalendarHeatmap';
import StackedStartCard from './StackedStartCard';

// Temporary placeholders for missing widgets
const StudyProgressWidget = ({ isDark }) => <div className={`p-8 rounded-3xl border ${isDark ? 'border-secondary-700 bg-secondary-800 text-white' : 'border-secondary-200 bg-white text-secondary-900'} min-h-[200px] flex items-center justify-center font-bold`}>Study Progress (Coming Soon)</div>;
const TodoListWidget = ({ isDark }) => <div className={`p-8 rounded-3xl border ${isDark ? 'border-secondary-700 bg-secondary-800 text-white' : 'border-secondary-200 bg-white text-secondary-900'} min-h-[200px] flex items-center justify-center font-bold`}>Todo List (Coming Soon)</div>;
const CalendarWidget = ({ isDark }) => <div className={`p-8 rounded-3xl border ${isDark ? 'border-secondary-700 bg-secondary-800 text-white' : 'border-secondary-200 bg-white text-secondary-900'} min-h-[200px] flex items-center justify-center font-bold`}>Calendar (Coming Soon)</div>;

const WidgetMap = {
  explore: ExploreTasksWidget,
  heatmap: CalendarHeatmap,
  streak: StackedStartCard,
  studyProgress: StudyProgressWidget,
  todo: TodoListWidget,
  calendar: CalendarWidget
};

function SortableWidget({ id, isDark, widgetId }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  };

  const WidgetComponent = WidgetMap[widgetId];

  return (
    <div ref={setNodeRef} style={style} className="mb-8 relative pt-4 group/widget">
      {/* Drag Handle Pill */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-[100] transition-opacity">
        <div 
          {...attributes} 
          {...listeners}
          style={{ touchAction: 'none' }}
          className="flex justify-center items-center px-4 py-1.5 bg-secondary-900 text-white dark:bg-white dark:text-secondary-900 rounded-full cursor-grab active:cursor-grabbing shadow-lg hover:scale-105 transition-transform"
        >
          <GripHorizontal className="w-4 h-4 mr-1.5" />
          <span className="text-xs font-bold uppercase tracking-wider">Drag to Move</span>
        </div>
      </div>
      <div className="flex-1">
        {WidgetComponent && <WidgetComponent isDark={isDark} />}
      </div>
    </div>
  );
}

function Column({ id, items, isDark }) {
  return (
    <SortableContext id={id} items={items} strategy={verticalListSortingStrategy}>
      <div className="flex flex-col flex-1 min-h-[200px]">
        {items.map((widgetId) => (
          <SortableWidget key={widgetId} id={widgetId} widgetId={widgetId} isDark={isDark} />
        ))}
      </div>
    </SortableContext>
  );
}

export default function DashboardWidgetsLayout({ isDark }) {
  const [widgets, setWidgets] = useState([
    { id: 'heatmap', title: 'Heatmap', icon: Flame, active: true },
    { id: 'explore', title: 'Explore Luter', icon: Compass, active: true },
    { id: 'streak', title: 'Streak', icon: Zap, active: true },
    { id: 'studyProgress', title: 'Study Progress', icon: ChartPie, active: false },
    { id: 'todo', title: 'Todo List', icon: ListChecks, active: false },
    { id: 'calendar', title: 'Calendar', icon: CalendarDays, active: false },
  ]);

  const [content, setContent] = useState([
    { id: 'recent', title: 'Recently Studied', icon: Clock, active: false },
    { id: 'library', title: 'Personal Library', icon: FolderOpen, active: false },
    { id: 'groups', title: 'Study Groups', icon: UsersRound, active: false },
  ]);

  // Layout state
  const [columns, setColumns] = useState({
    left: ['explore', 'heatmap'],
    right: ['streak']
  });

  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 2 } }), // Lowered to 2px for immediate feel
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;

    const activeContainer = Object.keys(columns).find(key => columns[key].includes(activeId));
    const overContainer = Object.keys(columns).find(key => columns[key].includes(overId)) || over.id;

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setColumns((prev) => {
      const activeItems = [...prev[activeContainer]];
      const overItems = [...prev[overContainer]];
      const activeIndex = activeItems.indexOf(activeId);
      const overIndex = overItems.indexOf(overId);
      
      let newIndex;
      if (overId in prev) {
        // dropped on empty column
        newIndex = overItems.length + 1;
      } else {
        const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      return {
        ...prev,
        [activeContainer]: activeItems.filter(item => item !== activeId),
        [overContainer]: [
          ...overItems.slice(0, newIndex),
          activeItems[activeIndex],
          ...overItems.slice(newIndex, overItems.length)
        ]
      };
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    const activeContainer = Object.keys(columns).find(key => columns[key].includes(activeId));
    const overContainer = Object.keys(columns).find(key => columns[key].includes(overId)) || over.id;

    if (!activeContainer || !overContainer || activeContainer !== overContainer) return;
    
    const activeIndex = columns[activeContainer].indexOf(activeId);
    const overIndex = columns[overContainer].indexOf(overId);

    if (activeIndex !== overIndex) {
      setColumns((prev) => ({
        ...prev,
        [activeContainer]: arrayMove(prev[activeContainer], activeIndex, overIndex)
      }));
    }
  };

  // Sync toggles with columns
  // If a widget is turned on in WidgetCustomizer, add it to left column
  // If turned off, remove it from both columns
  React.useEffect(() => {
    const activeIds = widgets.filter(w => w.active).map(w => w.id);
    
    setColumns(prev => {
      let newLeft = [...prev.left];
      let newRight = [...prev.right];
      
      // Remove deactivated
      newLeft = newLeft.filter(id => activeIds.includes(id));
      newRight = newRight.filter(id => activeIds.includes(id));
      
      // Add newly activated (append to left column by default)
      const currentIds = [...newLeft, ...newRight];
      const newlyActivated = activeIds.filter(id => !currentIds.includes(id));
      if (newlyActivated.length > 0) {
        newLeft = [...newLeft, ...newlyActivated];
      }
      
      return { left: newLeft, right: newRight };
    });
  }, [widgets]);

  return (
    <>
      <div className="flex justify-end mb-4 relative z-[500]">
        <WidgetCustomizer 
          isDark={isDark} 
          widgets={widgets} 
          setWidgets={setWidgets} 
          content={content} 
          setContent={setContent} 
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 min-h-[60vh] items-start">
          <Column id="left" items={columns.left} isDark={isDark} />
          <Column id="right" items={columns.right} isDark={isDark} />
        </section>
        
        <DragOverlay>
          {activeId ? (
            <div className="opacity-80 scale-[1.02] shadow-2xl rounded-3xl overflow-hidden cursor-grabbing border-2 border-primary-400">
              {WidgetMap[activeId] && React.createElement(WidgetMap[activeId], { isDark })}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
