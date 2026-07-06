import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { SupabaseProvider as YSupabaseProvider } from "@supabase-labs/y-supabase";
import {
  CalendarBlank,
  CaretLeft,
  CaretRight,
  PlusCircle,
  X,
  CheckCircle,
  Circle,
  PencilSimple,
  Trash,
  Spinner,
  ArrowsOut,
} from "@phosphor-icons/react";
import { supabase } from "../../supabaseClient";

// Duplicated parser
const parseTaskText = (todo, tags) => {
  const activeTags = [];
  if (todo.material_id) {
    const t = tags.find((x) => x.rawId === todo.material_id);
    if (t) activeTags.push({ text: `@${t.label}`, ...t, type: "material" });
  }
  if (todo.course_id) {
    const t = tags.find((x) => x.rawId === todo.course_id);
    if (t) activeTags.push({ text: `@${t.label}`, ...t, type: "folder" });
  }
  if (todo.due_date) {
    const formattedDate = new Date(todo.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    activeTags.push({ text: `@${formattedDate}`, type: "date", value: todo.due_date });
  }

  let cleanText = (todo.text || "").replace(/@undefined/g, "").replace(/\s+/g, " ");
  let parts = [{ type: "text", content: cleanText }];
  
  activeTags.sort((a, b) => b.text.length - a.text.length);

  activeTags.forEach((tagInfo) => {
    const newParts = [];
    parts.forEach((part) => {
      if (part.type === "text") {
        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const escapedLabel = escapeRegExp(tagInfo.text.substring(1));
        const splitRegex = new RegExp(`(@\\s*${escapedLabel})`, "g");
        
        const chunks = part.content.split(splitRegex);
        chunks.forEach((chunk) => {
          if (chunk.replace(/\s+/g, "") === tagInfo.text.replace(/\s+/g, "")) {
            newParts.push({ type: "pill", tag: tagInfo });
          } else if (chunk) {
            newParts.push({ type: "text", content: chunk });
          }
        });
      } else {
        newParts.push(part);
      }
    });
    parts = newParts;
  });

  return parts;
};

const tagPillStyle = (color, bg, border, isCompleted = false) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "5px 12px 5px 10px",
  borderRadius: "14px",
  backgroundColor: bg,
  color,
  fontSize: "13px",
  fontWeight: 600,
  border: border,
  textDecoration: isCompleted ? "line-through" : "none",
  opacity: isCompleted ? 0.6 : 1,
  transition: "all 0.2s",
});

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SHORT_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export default function CalendarWidget({ isDark = false }) {
  const bgOuter = isDark ? "#1a2234" : "#F3F4F6";
  const bgInner = isDark ? "#111827" : "#FFFFFF";
  const textTitle = isDark ? "#F9FAFB" : "#111827";
  const textSec = isDark ? "#9CA3AF" : "#6B7280";
  const border = isDark ? "#2d3a50" : "#EFEFEF";
  const hoverBg = isDark ? "#1e2d45" : "#F3F4F6";
  const font = "'Quicksand', system-ui, sans-serif";

  const [todos, setTodos] = useState([]);
  const [tags, setTags] = useState([]);
  const [userId, setUserId] = useState(null);
  const [yTodos, setYTodos] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Add task state
  const [isAdding, setIsAdding] = useState(false);
  const [taskText, setTaskText] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  // ── Initialize Yjs ─────────────────────────────────────────────────────────
  useEffect(() => {
    let doc;
    let provider;
    let idbProvider;
    let cleanup = () => {};

    const initYjs = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        return;
      }
      setUserId(session.user.id);

      const roomId = `user_${session.user.id}_todos`;
      doc = new Y.Doc();
      const todosMap = doc.getMap("todos_map");

      provider = new YSupabaseProvider(roomId, doc, supabase, {
        awareness: false,
        persistence: { table: "yjs_documents" },
      });

      try {
        idbProvider = new IndexeddbPersistence(roomId, doc);
      } catch (e) {
        console.warn("IDB fail", e);
      }

      const updateReactState = () => {
        const list = Array.from(todosMap.values());
        setTodos(list.filter((t) => !t.deleted_at));
      };

      todosMap.observe(updateReactState);

      if (idbProvider) {
        idbProvider.on("synced", () => {
          updateReactState();
        });
      } else {
        updateReactState();
      }

      setYTodos(todosMap);

      const handleLocalSync = (e) => {
        if (e.detail.roomId === roomId) {
          Y.applyUpdate(doc, e.detail.update, "local-sync");
        }
      };
      window.addEventListener("yjs-local-sync", handleLocalSync);

      doc.on("update", (update, origin) => {
        if (origin !== "local-sync") {
          window.dispatchEvent(new CustomEvent("yjs-local-sync", { detail: { roomId, update } }));
        }
      });

      cleanup = () => {
        window.removeEventListener("yjs-local-sync", handleLocalSync);
        todosMap.unobserve(updateReactState);
        provider.destroy();
        if (idbProvider) idbProvider.destroy();
        doc.destroy();
      };
    };

    initYjs();
    return () => cleanup();
  }, []);

  const fetchTags = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const [{ data: mats }, { data: courses }] = await Promise.all([
      supabase
        .from("materials")
        .select("id, title")
        .eq("user_id", session.user.id)
        .limit(20),
      supabase.from("courses").select("id, code, name").limit(20),
    ]);

    const combined = [];
    (mats || []).forEach((m) =>
      combined.push({
        id: `mat_${m.id}`,
        rawId: m.id,
        type: "material",
        label: m.title || "Untitled Material",
      }),
    );
    (courses || []).forEach((c) =>
      combined.push({
        id: `crs_${c.id}`,
        rawId: c.id,
        type: "folder",
        label: c.name || c.code || "Untitled Folder",
      }),
    );
    setTags(combined);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTags();
  }, [fetchTags]);

  const toggleTodo = (todo) => {
    if (yTodos) {
      const existing = yTodos.get(todo.id);
      if (existing) {
        yTodos.set(todo.id, { ...existing, completed: !existing.completed });
      }
    }
  };

  const deleteTodo = (id) => {
    if (yTodos) {
      const existing = yTodos.get(id);
      if (existing) {
        yTodos.set(id, { ...existing, deleted_at: new Date().toISOString() });
      }
    }
  };

  // ── Popovers & Add Task State ──────────────────────────────────────────────
  const [showTagMenu, setShowTagMenu] = useState(false);
  const widgetRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target)) {
        setShowTagMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = (e) => {
    const editor = e.currentTarget;
    const val = editor.innerText || "";
    setTaskText(val);

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const node = selection.focusNode;
      if (node && node.nodeType === Node.TEXT_NODE) {
        const textBeforeCursor = node.textContent.slice(0, selection.focusOffset);
        setShowTagMenu(textBeforeCursor.endsWith("@"));
        return;
      }
    }
    setShowTagMenu(val.endsWith("@"));
  };

  const selectTag = (tag) => {
    setShowTagMenu(false);
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const node = selection.focusNode;

    if (node && node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      const atIndex = text.lastIndexOf("@", selection.focusOffset - 1);
      if (atIndex !== -1) {
        range.setStart(node, atIndex);
        range.deleteContents();
      }
    }

    const pill = document.createElement("span");
    pill.contentEditable = "false";
    const isMaterial = tag.type === "material";
    const isFolder = tag.type === "folder";

    let pillBg = isDark ? "#374151" : "#E5E7EB";
    let pillColor = textTitle;
    let pillBorder = "none";

    if (isMaterial) {
      pillBg = "#FFD2A6";
      pillColor = isDark ? "#F9FAFB" : "#111827";
      pillBorder = "1px solid #FDBA74";
    } else if (isFolder) {
      pillBg = isDark ? "rgba(16, 185, 129, 0.2)" : "#D1FAE5";
      pillColor = isDark ? "#34D399" : "#065F46";
      pillBorder = isDark ? "1px solid #059669" : "1px solid #34D399";
    }

    pill.style.cssText = `
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 8px; border-radius: 8px; margin: 0 4px;
      background-color: ${pillBg}; color: ${pillColor}; font-size: 13px; font-weight: 600;
      border: ${pillBorder}; vertical-align: middle; cursor: default;
    `;
    pill.innerHTML = `<span style="opacity:0.6;font-weight:700;">@</span>${tag.label}`;
    pill.className = "tag-pill";
    pill.dataset.type = tag.type;
    pill.dataset.id = tag.rawId;
    pill.dataset.label = tag.label;

    range.insertNode(pill);
    const space = document.createTextNode("\u00A0");
    pill.parentNode.insertBefore(space, pill.nextSibling);
    range.setStartAfter(space);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    setTaskText(inputRef.current?.innerText || "");
    inputRef.current?.focus();
  };

  const handleSave = () => {
    const editor = inputRef.current;
    if (!editor || saving) return;

    let text = "";
    let matId = null;
    let crsId = null;
    let finalDueDate = selectedDate ? selectedDate.toISOString() : null;

    Array.from(editor.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.classList?.contains("tag-pill")) {
        if (node.dataset.type === "material") matId = node.dataset.id;
        if (node.dataset.type === "folder") crsId = node.dataset.id;
        text += `@${node.dataset.label}`;
      } else if (node.nodeName === "BR") {
        text += " ";
      } else {
        text += node.textContent;
      }
    });

    if (!text.trim()) return;
    setSaving(true);

    if (!userId) {
      setSaving(false);
      return;
    }

    const newTodo = {
      id: crypto.randomUUID(),
      text: text.trim(),
      completed: false,
      material_id: matId,
      course_id: crsId,
      due_date: finalDueDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: userId,
    };

    if (yTodos) yTodos.set(newTodo.id, newTodo);

    if (editor) editor.innerHTML = "";
    setTaskText("");
    setIsAdding(false);
    setSaving(false);
  };

  const openAdd = () => {
    setIsAdding(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const renderTaskForm = () => (
    <motion.div
      key="add-form"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "0 20px 20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          marginBottom: "14px",
          position: "relative",
          cursor: "text",
        }}
        onClick={() => inputRef.current?.focus()}
      >
        <div
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            ref={inputRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => handleInput(e)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSave();
              }
            }}
            style={{
              width: "100%",
              fontSize: "16px",
              fontWeight: 600,
              color: textTitle,
              outline: "none",
              border: "none",
              background: "transparent",
              minHeight: "24px",
              lineHeight: "24px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          />
          {(!taskText || taskText.trim() === "") && (
            <span
              style={{
                position: "absolute",
                left: 0,
                top: "2px",
                color: textSec,
                fontSize: "16px",
                fontWeight: 600,
                pointerEvents: "none",
              }}
            >
              Use @ to tag materials & folders
            </span>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={!taskText?.trim() || saving}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "transparent",
            border: "none",
            color: "#9B8AF0",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            padding: "4px 8px",
            opacity: !taskText?.trim() || saving ? 0.5 : 1,
            transition: "opacity 0.2s"
          }}
        >
          {saving ? <Spinner size={16} style={{ animation: "spin 1s linear infinite" }} /> : <PlusCircle size={16} weight="regular" />}
          {saving ? "Saving…" : "Add task"}
        </button>

        <AnimatePresence>
          {showTagMenu && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                zIndex: 9999,
                marginTop: "8px",
                width: "220px",
                maxHeight: "200px",
                overflowY: "auto",
                background: isDark ? "#1f2937" : "#ffffff",
                border: `1px solid ${border}`,
                borderRadius: "12px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                padding: "6px",
              }}
            >
              {tags.length === 0 ? (
                <div style={{ padding: "8px", fontSize: "13px", color: textSec }}>No materials found.</div>
              ) : (
                tags.map((tag) => (
                  <button
                    key={tag.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectTag(tag);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: textTitle,
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {tag.label}
                    </span>
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  // ── Calendar Helpers ───────────────────────────────────────────────────────
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    // Convert Sunday=0 to Monday=0
    return day === 0 ? 6 : day - 1;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
  };

  // Get tasks for a specific date (local time)
  const getTasksForDate = (date) => {
    return todos.filter(t => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      return d.getFullYear() === date.getFullYear() &&
             d.getMonth() === date.getMonth() &&
             d.getDate() === date.getDate();
    });
  };

  const renderCalendarBody = (isStandalone = false) => (
    <>
      {/* Month Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: isStandalone ? "flex-end" : "space-between", padding: isStandalone ? "0" : "20px", gap: isStandalone ? "8px" : "0" }}>
        {isStandalone && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
            <CalendarBlank size={20} color={textTitle} weight="bold" />
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: textTitle }}>Calendar</h2>
          </div>
        )}
        <button 
          onClick={(e) => { if (isStandalone) return; e.stopPropagation(); handlePrevMonth(); }} 
          style={{ background: "transparent", border: "none", cursor: isStandalone ? "inherit" : "pointer", color: textSec, padding: isStandalone ? "4px" : "0" }}
        >
          <CaretLeft size={isStandalone ? 16 : 20} weight="bold" />
        </button>
        <div style={{ fontSize: "15px", fontWeight: 700, color: textTitle }}>
          {MONTH_NAMES[currentMonth.getMonth()].substring(0, 3)} {currentMonth.getFullYear().toString().slice(-2)}
        </div>
        <button 
          onClick={(e) => { if (isStandalone) return; e.stopPropagation(); handleNextMonth(); }} 
          style={{ background: "transparent", border: "none", cursor: isStandalone ? "inherit" : "pointer", color: textSec, padding: isStandalone ? "4px" : "0" }}
        >
          <CaretRight size={isStandalone ? 16 : 20} weight="bold" />
        </button>
        {isStandalone && (
          <div style={{ marginLeft: "12px", color: textSec }}>
            <ArrowsOut size={16} weight="bold" />
          </div>
        )}
      </div>

      {/* Grid Header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: isStandalone ? "16px 0 8px" : "0 20px", marginBottom: "8px" }}>
        {SHORT_DAYS.map((day, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: "12px", fontWeight: 600, color: textSec }}>
            {day}
          </div>
        ))}
      </div>

      {/* Grid Days */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: isStandalone ? "0" : "0 20px 20px", gap: "4px" }}>
        {Array.from({ length: getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth()) }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()) }).map((_, i) => {
          const day = i + 1;
          const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth.getMonth() && selectedDate.getFullYear() === currentMonth.getFullYear();
          const today = new Date();
          const isToday = today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();
          
          const showFill = isStandalone ? isToday : isSelected;
          const showOutline = isStandalone ? false : (isToday && !isSelected);
          const hasTasks = getTasksForDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)).length > 0;
          
          return (
            <div 
              key={day} 
              onClick={(e) => { 
                e.stopPropagation(); 
                handleDateClick(day); 
                if (isStandalone) {
                  setIsModalOpen(true);
                }
              }}
              style={{ 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "center",
                height: "40px",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: showFill ? (isDark ? "rgba(196, 181, 253, 0.2)" : "#F3E8FF") : "transparent",
                color: showFill || showOutline ? "#A78BFA" : textTitle,
                border: showOutline ? "1px solid #A78BFA" : "1px solid transparent",
                fontWeight: 600,
                fontSize: "14px",
                transition: "all 0.2s"
              }}>
                {day}
              </div>
              {hasTasks && (
                <div style={{
                  width: "4px", height: "4px", borderRadius: "50%",
                  backgroundColor: "#A78BFA",
                  position: "absolute",
                  bottom: "0px"
                }} />
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  const selectedDateTasks = getTasksForDate(selectedDate);
  
  // Sort tasks: completed at bottom, then newest
  selectedDateTasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const createdA = new Date(a.created_at || 0).getTime();
    const createdB = new Date(b.created_at || 0).getTime();
    return createdB - createdA;
  });

  return (
    <>
      {/* ── Standalone Dashboard Card ── */}
      <div
        onClick={() => setIsModalOpen(true)}
        style={{
          display: "flex",
          flexDirection: "column",
          borderRadius: "24px",
          backgroundColor: bgOuter,
          padding: "24px",
          width: "100%",
          fontFamily: font,
          cursor: "pointer",
        }}
      >
        {renderCalendarBody(true)}
      </div>

      {/* ── Calendar Modal Overlay ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px"
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              style={{
                width: "100%",
                maxWidth: "400px",
                backgroundColor: bgInner,
                borderRadius: "24px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                display: "flex",
                flexDirection: "column",
                overflow: "visible",
                fontFamily: font,
              }}
            >
              {/* Modal Header */}
              <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CalendarBlank size={20} color={textTitle} weight="bold" />
                  <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: textTitle }}>Calendar</h2>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: textSec, padding: "4px" }}
                >
                  <X size={20} weight="bold" />
                </button>
              </div>

              {renderCalendarBody(false)}

              <div style={{ height: "1px", backgroundColor: border, margin: "0 20px" }} />

              {/* Tasks for Day */}
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", minHeight: "180px", overflowY: "auto" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: textSec, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                  Tasks for {MONTH_NAMES[selectedDate.getMonth()].substring(0,3)} {selectedDate.getDate()}
                </div>
                
                {selectedDateTasks.length === 0 ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", opacity: 0.6 }}>
                    <CalendarBlank size={32} color={textSec} weight="light" />
                    <span style={{ fontSize: "13px", color: textSec, fontWeight: 500 }}>No tasks for this day</span>
                  </div>
                ) : (
                  selectedDateTasks.map((todo) => (
                    <div 
                      key={todo.id} 
                      style={{ 
                        display: "flex", 
                        alignItems: "flex-start", 
                        gap: "12px", 
                        padding: "8px", 
                        borderRadius: "12px",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDark ? "#374151" : "#F3F4F6";
                        const actions = e.currentTarget.querySelector(".task-actions");
                        if (actions) actions.style.opacity = "1";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        const actions = e.currentTarget.querySelector(".task-actions");
                        if (actions) actions.style.opacity = "0";
                      }}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleTodo(todo); }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: "2px" }}
                      >
                        {todo.completed ? (
                          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "20px", height: "20px", borderRadius: "50%", backgroundColor: isDark ? "rgba(196, 181, 253, 0.1)" : "#F3E8FF", flexShrink: 0 }}>
                            <CheckCircle size={16} weight="bold" color="#A78BFA" />
                          </div>
                        ) : (
                          <Circle size={20} color={isDark ? '#4B5563' : '#D1D5DB'} weight="regular" style={{ flexShrink: 0 }} />
                        )}
                      </button>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: todo.completed ? textSec : textTitle, textDecoration: todo.completed ? "line-through" : "none", lineHeight: "1.5" }}>
                          {parseTaskText(todo, tags).map((part, i) => {
                            if (part.type === "text") return <span key={i}>{part.content}</span>;
                            const tag = part.tag;
                            if (tag.type === "material") return <span key={i} style={tagPillStyle(isDark ? "#F9FAFB" : "#111827", "#FFD2A6", "1px solid #FDBA74", todo.completed)}><span style={{ opacity: 0.6, fontWeight: 700 }}>@</span>{tag.label}</span>;
                            if (tag.type === "folder") return <span key={i} style={tagPillStyle(isDark ? "#34D399" : "#065F46", isDark ? "rgba(16, 185, 129, 0.2)" : "#D1FAE5", isDark ? "1px solid #059669" : "1px solid #34D399", todo.completed)}><span style={{ opacity: 0.6, fontWeight: 700 }}>@</span>{tag.label}</span>;
                            if (tag.type === "date") return <span key={i} style={tagPillStyle("#064E3B", "#98FF98", "none", todo.completed)}><CalendarBlank size={12} weight="bold" />{tag.text.substring(1)}</span>;
                            return null;
                          })}
                        </div>
                      </div>
                      
                      <div 
                        className="task-actions"
                        style={{
                          opacity: 0,
                          transition: "opacity 0.2s",
                          display: "flex",
                          gap: "4px"
                        }}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id); }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#EF4444",
                            borderRadius: "6px"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? "rgba(239, 68, 68, 0.1)" : "#FEE2E2"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          <Trash size={16} weight="regular" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Task Area */}
              {isAdding ? (
                renderTaskForm()
              ) : (
                <div style={{ padding: "0 20px 20px" }}>
                  <button 
                    onClick={openAdd}
                    className="reduce-motion:transition-none box-border inline-flex items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap text-center font-medium ring-offset-background transition-colors duration-200 disabled:pointer-events-none border border-[#A78BFA] bg-[#C4B5FD] text-[#4C1D95] disabled:bg-[#E7E1FE] disabled:opacity-100 dark:disabled:bg-[#3A3548] disabled:border-[#DCD1FD] dark:disabled:border-[#4A4559] disabled:text-[#AB9FC1] dark:disabled:text-[#7D758E] font-sm h-10 gap-1.5 rounded-xl px-3 py-2 text-base w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:border-[#A78BFA] hover:bg-[#DDD6FE] focus:border-[#A78BFA] focus:bg-[#DDD6FE] border-b-2 hover:border-b focus:border-b"
                  >
                    <PlusCircle size={18} weight="regular" /> Add task
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
