import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { SupabaseProvider as YSupabaseProvider } from "@supabase-labs/y-supabase";
import {
  ListChecks,
  Plus,
  PlusCircle,
  CalendarBlank,
  Repeat,
  CheckCircle,
  Circle,
  X,
  Spinner,
  Trash,
  PencilSimple,
  Folder,
  Database,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { supabase } from "../../supabaseClient";

const RECURRING_OPTIONS = [
  "None",
  "Daily",
  "Weekly",
  "Every two weeks",
  "Monthly",
];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const parseTaskText = (todo, tags) => {
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
        // Tag text always starts with '@'. We want to allow optional spaces after '@'.
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

export default function TodoListWidget({ isDark = false }) {
  // ── Theme ──────────────────────────────────────────────────────────────────
  const bgOuter = isDark ? "#1a2234" : "#F3F4F6";
  const bgInner = isDark ? "#111827" : "#FFFFFF";
  const textTitle = isDark ? "#F9FAFB" : "#111827";
  const textSec = isDark ? "#9CA3AF" : "#6B7280";
  const border = isDark ? "#2d3a50" : "#EFEFEF";
  const hoverBg = isDark ? "#1e2d45" : "#F3F4F6";
  const accent = isDark ? "#9CA3AF" : "#6B7280";
  const accentLight = isDark ? "#374151" : "#E5E7EB";
  const primaryBtnBg = isDark ? "#374151" : "#111827";
  const primaryBtnText = isDark ? "#F9FAFB" : "#FFFFFF";
  const font = "'Quicksand', system-ui, sans-serif";

  // ── Data ───────────────────────────────────────────────────────────────────
  const [todos, setTodos] = useState([]);
  const [tags, setTags] = useState([]);
  const [loadingTodos, setLoadingTodos] = useState(true);
  const [loadingTags, setLoadingTags] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Add-task form ──────────────────────────────────────────────────────────
  const [isAdding, setIsAdding] = useState(false);
  const [taskText, setTaskText] = useState("");
  const [dueDate, setDueDate] = useState(null);
  const [recurring, setRecurring] = useState("None");

  // ── Edit-task form ─────────────────────────────────────────────────────────
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [userId, setUserId] = useState(null);

  // ── Popovers ───────────────────────────────────────────────────────────────
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const widgetRef = useRef(null);
  const inputRef = useRef(null);
  const editInputRef = useRef(null);

  const [yDoc, setYDoc] = useState(null);
  const [yTodos, setYTodos] = useState(null);

  // ── Initialize Yjs ─────────────────────────────────────────────────────────
  useEffect(() => {
    let doc;
    let provider;
    let idbProvider;
    let cleanup = () => {};

    const initYjs = async () => {
      setLoadingTodos(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setLoadingTodos(false);
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
        list.sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          
          if (a.due_date && b.due_date) {
            const dateA = new Date(a.due_date).getTime();
            const dateB = new Date(b.due_date).getTime();
            if (dateA !== dateB) return dateA - dateB;
          } else if (a.due_date) return -1;
          else if (b.due_date) return 1;

          const createdA = new Date(a.created_at || 0).getTime();
          const createdB = new Date(b.created_at || 0).getTime();
          return createdB - createdA;
        });
        setTodos(list.filter((t) => !t.deleted_at));
      };

      todosMap.observe(updateReactState);

      if (idbProvider) {
        idbProvider.on("synced", () => {
          updateReactState();
          setLoadingTodos(false);
        });
      } else {
        updateReactState();
        setLoadingTodos(false);
      }

      setYDoc(doc);
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
    setLoadingTags(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setLoadingTags(false);
      return;
    }

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
    setLoadingTags(false);
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    const handler = (e) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target)) {
        setShowTagMenu(false);
        setShowDateMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Toggle / Delete / Edit ─────────────────────────────────────────────────
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

  const startEdit = (todo) => {
    setEditingTodoId(todo.id);
    setIsAdding(false);
    
    if (todo.due_date) setDueDate(new Date(todo.due_date));
    else setDueDate(null);

    setRecurring(todo.recurring || "None");
    setTaskText(todo.text);

    setTimeout(() => {
      const editor = inputRef.current;
      if (editor) {
        editor.innerHTML = "";
        
        const parts = parseTaskText(todo, tags);
        parts.forEach((part) => {
          if (part.type === "text") {
            editor.appendChild(document.createTextNode(part.content));
          } else {
            const tag = part.tag;
            const pill = document.createElement("span");
            pill.contentEditable = "false";
            
            const isMaterial = tag.type === "material";
            const isFolder = tag.type === "folder";
            const isDate = tag.type === "date";

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
            } else if (isDate) {
              pillBg = "#98FF98";
              pillColor = "#064E3B";
            }

            pill.style.cssText = `
              display: inline-flex; align-items: center; gap: 4px;
              padding: 3px 8px; border-radius: 8px; margin: 0 4px;
              background-color: ${pillBg}; color: ${pillColor}; font-size: 13px; font-weight: 600;
              border: ${pillBorder}; vertical-align: middle; cursor: default;
            `;
            
            if (isDate) {
               pill.innerHTML = `<span style="opacity:0.6;font-weight:700;">@</span>${tag.text.substring(1)}`;
               pill.dataset.value = tag.value;
            } else {
               pill.innerHTML = `<span style="opacity:0.6;font-weight:700;">@</span>${tag.label}`;
               pill.dataset.id = tag.rawId;
            }
            pill.className = "tag-pill";
            pill.dataset.type = tag.type;
            
            editor.appendChild(pill);
          }
        });
        editor.appendChild(document.createTextNode(" "));

        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        editor.focus();
        setTaskText(editor.innerText);
      }
    }, 0);
  };

  // ── Input change – detect @ ────────────────────────────────────────────────
  const handleInput = (e, isEdit = false) => {
    const editor = e.currentTarget;
    const val = editor.innerText || "";
    if (!isEdit) {
      setTaskText(val);
      let hasDatePill = false;
      Array.from(editor.childNodes).forEach((node) => {
        if (node.nodeType === 1 && node.dataset.type === "date") hasDatePill = true;
      });
      if (!hasDatePill && dueDate) setDueDate(null);
    }

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const node = selection.focusNode;
      if (node && node.nodeType === Node.TEXT_NODE) {
        const textBeforeCursor = node.textContent.slice(
          0,
          selection.focusOffset,
        );
        setShowTagMenu(textBeforeCursor.endsWith("@"));
        return;
      }
    }
    setShowTagMenu(val.endsWith("@"));
  };

  // ── Select a tag from popover ──────────────────────────────────────────────
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

  const insertDatePill = (dateObj) => {
    const editor = inputRef.current;
    if (!editor) return;

    Array.from(editor.childNodes).forEach((node) => {
      if (node.nodeType === 1 && node.dataset.type === "date") {
        editor.removeChild(node);
      }
    });

    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    const selection = window.getSelection();

    const pill = document.createElement("span");
    pill.contentEditable = "false";
    
    pill.style.cssText = `
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 8px; border-radius: 8px; margin: 0 4px;
      background-color: #98FF98; color: #064E3B; font-size: 13px; font-weight: 600;
      border: none; vertical-align: middle; cursor: default;
    `;
    const formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    pill.innerHTML = `<span style="opacity:0.6;font-weight:700;">@</span>${formattedDate}`;
    pill.className = "tag-pill";
    pill.dataset.type = "date";
    pill.dataset.value = dateObj.toISOString();

    range.insertNode(pill);
    const space = document.createTextNode("\u00A0");
    pill.parentNode.insertBefore(space, pill.nextSibling);
    
    range.setStartAfter(space);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    setTaskText(editor.innerText || "");
    editor.focus();
  };

  // ── Add/Edit Task ───────────────────────────────────────────────────────────────
  const handleSave = () => {
    const editor = inputRef.current;
    if (!editor || saving) return;

    let text = "";
    let matId = null;
    let crsId = null;
    let finalDueDate = null;

    Array.from(editor.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.classList?.contains("tag-pill")) {
        if (node.dataset.type === "date") {
          finalDueDate = node.dataset.value;
          const dateObj = new Date(finalDueDate);
          text += `@${dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
        } else {
          if (node.dataset.type === "material") matId = node.dataset.id;
          if (node.dataset.type === "folder") crsId = node.dataset.id;
          text += `@${node.dataset.label}`;
        }
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
      id: editingTodoId || crypto.randomUUID(),
      text: text.trim(),
      completed: editingTodoId ? todos.find(t => t.id === editingTodoId)?.completed : false,
      material_id: matId,
      course_id: crsId,
      due_date: finalDueDate ? new Date(finalDueDate).toISOString() : (dueDate ? dueDate.toISOString() : null),
      recurring: recurring !== "None" ? recurring : null,
      created_at: editingTodoId ? todos.find(t => t.id === editingTodoId)?.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: userId,
    };

    if (yTodos) {
      yTodos.set(newTodo.id, newTodo);
    }

    if (editor) editor.innerHTML = "";
    setTaskText("");
    setDueDate(null);
    setRecurring("None");
    setEditingTodoId(null);
    setIsAdding(false);
    setSaving(false);
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
                padding: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
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
                    onInput={(e) => handleInput(e, false)}
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
                        zIndex: 50,
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
                      {loadingTags ? (
                        <div style={{ padding: "12px", textAlign: "center" }}>
                          <Spinner size={16} />
                        </div>
                      ) : tags.length === 0 ? (
                        <div
                          style={{
                            padding: "8px",
                            fontSize: "13px",
                            color: textSec,
                          }}
                        >
                          No materials found.
                        </div>
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
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor = hoverBg)
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "transparent")
                            }
                          >
                            {tag.type === "material" ? (
                              <ListChecks size={16} color="#FDBA74" />
                            ) : (
                              <Folder size={16} color="#34D399" />
                            )}
                            <span
                              style={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {tag.label}
                            </span>
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div style={{ display: 'flex', gap: '8px', margin: '16px 0', flexWrap: 'wrap' }}>
                <div style={{ position: "relative" }}>
                  <button 
                    onClick={() => setShowDateMenu(!showDateMenu)}
                    style={actionBtnStyle(isDark, border, textTitle)}
                  >
                    <CalendarBlank size={16} weight="regular" /> Date
                  </button>
                  
                  {/* Date Popover */}
                  <AnimatePresence>
                    {showDateMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 8px)',
                          left: '0',
                          width: '260px',
                          backgroundColor: isDark ? "#111827" : "#FFFFFF",
                          border: `1px solid ${border}`,
                          borderRadius: '16px',
                          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                          zIndex: 60,
                          padding: '16px',
                          cursor: 'default'
                        }}
                      >
                        {/* Calendar Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <button 
                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                            style={calNavBtnStyle(isDark, hoverBg)}
                          ><CaretLeft size={16} /></button>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: textTitle }}>
                            {currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                          <button 
                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                            style={calNavBtnStyle(isDark, hoverBg)}
                          ><CaretRight size={16} /></button>
                        </div>

                        {/* Days Grid */}
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(7, 1fr)', 
                          gap: '4px',
                          textAlign: 'center',
                          marginBottom: '16px'
                        }}>
                          {['M','T','W','T','F','S','S'].map((d, i) => (
                            <span key={i} style={{ fontSize: '12px', fontWeight: 600, color: textSec, marginBottom: '8px' }}>{d}</span>
                          ))}
                          
                          {/* Empty slots */}
                          {Array.from({length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() === 0 ? 6 : new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() - 1}).map((_, i) => (
                            <div key={`empty-${i}`} />
                          ))}
                          
                          {/* Days */}
                          {Array.from({length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()}, (_, i) => i + 1).map(day => {
                            const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                            const isSelected = dueDate && dateObj.toDateString() === dueDate.toDateString();
                            return (
                              <button 
                                key={day} 
                                onClick={() => {
                                  setDueDate(dateObj);
                                  insertDatePill(dateObj);
                                  setShowDateMenu(false);
                                }}
                                style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto',
                                background: isSelected ? "#EDE9FE" : 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '13px',
                                color: isSelected ? "#8B5CF6" : textTitle,
                                fontWeight: isSelected ? 700 : 500,
                              }}>
                                {day}
                              </button>
                            );
                          })}
                        </div>
                        
                        <div style={{ height: '1px', backgroundColor: border, margin: '0 -16px 12px' }} />

                        {/* Bottom Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button 
                            onClick={() => { 
                              setDueDate(null); 
                              setShowDateMenu(false); 
                              const editor = inputRef.current;
                              if (editor) {
                                Array.from(editor.childNodes).forEach((node) => {
                                  if (node.nodeType === 1 && node.dataset.type === "date") editor.removeChild(node);
                                });
                                setTaskText(editor.innerText || "");
                              }
                            }}
                            style={calActionBtnStyle(textSec, hoverBg)}
                          >
                            <CalendarBlank size={16} weight="regular" style={{ opacity: 0.7 }} /> 
                            No date
                          </button>
                          
                          <div style={{ position: 'relative' }}>
                            <button 
                              onClick={() => setShowRecurring(!showRecurring)}
                              style={{...calActionBtnStyle(textSec, hoverBg), justifyContent: 'space-between', width: '100%', backgroundColor: showRecurring ? hoverBg : 'transparent'}}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Repeat size={16} weight="regular" /> 
                                Recurring task
                              </div>
                              <CaretRight size={14} style={{ transform: showRecurring ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.2s' }} />
                            </button>
                            
                            {/* Recurring Dropdown */}
                            <AnimatePresence>
                              {showRecurring && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  style={{ overflow: 'hidden', padding: '4px 0 0' }}
                                >
                                  {['None', 'Daily', 'Weekly', 'Every two weeks', 'Monthly'].map((opt, i) => (
                                    <button 
                                      key={i}
                                      onClick={() => {
                                        setRecurring(opt);
                                        setShowRecurring(false);
                                        setShowDateMenu(false);
                                      }}
                                      style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '8px 12px 8px 32px',
                                        background: recurring === opt ? (isDark ? '#374151' : '#F3F4F6') : 'transparent',
                                        border: 'none',
                                        color: textTitle,
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        borderRadius: '8px'
                                      }}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginTop: "auto",
                  borderTop: `1px solid ${border}`,
                  paddingTop: "16px",
                }}
              >
                <button
                  onClick={cancelAdd}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  style={{
                    padding: "12px 0",
                    borderRadius: "14px",
                    border: "none",
                    background: "transparent",
                    color: textSec,
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!taskText?.trim() || saving}
                  className="reduce-motion:transition-none box-border inline-flex items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap text-center font-medium ring-offset-background transition-colors duration-200 disabled:pointer-events-none border border-[#A78BFA] bg-[#C4B5FD] text-[#4C1D95] disabled:bg-[#E7E1FE] disabled:opacity-100 dark:disabled:bg-[#3A3548] disabled:border-[#DCD1FD] dark:disabled:border-[#4A4559] disabled:text-[#AB9FC1] dark:disabled:text-[#7D758E] font-sm h-10 gap-1.5 rounded-xl px-3 py-2 text-base sm:h-9 sm:gap-2 sm:rounded-[0.875rem] sm:px-4 sm:py-2 sm:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:border-[#A78BFA] hover:bg-[#DDD6FE] focus:border-[#A78BFA] focus:bg-[#DDD6FE] border-b-2 hover:border-b focus:border-b flex-1"
                >
                  {saving ? (
                    <Spinner
                      size={18}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : (
                    <PlusCircle size={18} weight="regular" />
                  )}
                  {saving ? "Saving…" : (editingTodoId ? "Save changes" : "Add task")}
                </button>
              </div>
            </motion.div>
  );

  const openAdd = () => {
    setIsAdding(true);
    setEditingTodoId(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };
  const cancelAdd = () => {
    setIsAdding(false);
    setEditingTodoId(null);
  };
  const hasTodos = todos.length > 0;

  return (
    <div
      ref={widgetRef}
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: "24px",
        backgroundColor: bgOuter,
        padding: "0",
        width: "100%",
        fontFamily: font,
        overflow: "visible",
        minHeight: "260px",
      }}
    >
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <ListChecks size={20} color="#9B8AF0" />
          <span style={{ fontSize: "16px", fontWeight: 800, color: textTitle }}>
            Tasks
          </span>
        </div>
        {!isAdding && (
          <button
            onClick={openAdd}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              background: primaryBtnBg,
              color: primaryBtnText,
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            New
          </button>
        )}
      </div>

      <div
        className="hide-scrollbar"
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          overflowY: "auto",
          overflowX: "hidden",
          maxHeight: "260px",
          borderRadius: "20px",
          backgroundColor: bgInner,
          margin: "0 4px 4px",
          padding: "12px",
          position: "relative",
        }}
      >
        <AnimatePresence mode="wait">
          {!isAdding && (
            <motion.div
              key="todo-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ display: "flex", flexDirection: "column" }}
            >
              {loadingTodos ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "28px",
                  }}
                >
                  <Spinner
                    size={22}
                    style={{ animation: "spin 1s linear infinite" }}
                    color={textSec}
                  />
                </div>
              ) : todos.length === 0 ? (
                <motion.div 
                  key="empty-state"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={openAdd}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "16px",
                    padding: "32px 16px",
                    cursor: "pointer",
                    borderRadius: "16px",
                    transition: "background-color 0.2s"
                  }}
                >
                  <div style={{ position: "relative", width: "120px", height: "100px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div style={{ position: "absolute", bottom: 10, width: "100px", height: "20px", backgroundColor: isDark ? "#1F2937" : "#E5E7EB", borderRadius: "50%" }} />
                    
                    <div style={{ 
                      position: "absolute", 
                      bottom: 25, 
                      width: "90px", 
                      height: "60px", 
                      backgroundColor: isDark ? "#374151" : "#F3F4F6", 
                      borderRadius: "8px",
                      display: "flex",
                      flexDirection: "column",
                      padding: "10px 8px",
                      gap: "8px",
                      border: `1px solid ${isDark ? "#4B5563" : "#E5E7EB"}`
                    }}>
                      {[1, 2, 3].map(i => (
                        <div key={i} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", border: `1px solid ${isDark ? "#9CA3AF" : "#D1D5DB"}` }} />
                          <div style={{ height: "4px", width: i === 2 ? "30px" : "45px", backgroundColor: isDark ? "#6B7280" : "#D1D5DB", borderRadius: "2px" }} />
                        </div>
                      ))}
                    </div>

                    <div style={{
                      position: "absolute",
                      top: 5,
                      right: 5,
                      width: "28px",
                      height: "28px",
                      backgroundColor: isDark ? "#4B5563" : "#D1D5DB",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isDark ? "#F9FAFB" : "#4B5563",
                      fontWeight: "bold",
                      fontSize: "14px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                    }}>
                      ?
                    </div>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: textTitle }}>No Tasks yet</h3>
                    <p style={{ margin: "4px 0 0", fontSize: "14px", color: textSec }}>Add a Task using the plus button</p>
                  </div>
                </motion.div>
              ) : (
                todos.map((todo, idx) => {
                  const isEditing = editingTodoId === todo.id;

                  return (
                    <motion.div
                      key={todo.id}
                      layout
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.18, delay: idx * 0.03 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 6px",
                        borderRadius: "16px",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = hoverBg;
                        const actions =
                          e.currentTarget.querySelector(".task-actions");
                        if (actions) actions.style.opacity = "1";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        const actions =
                          e.currentTarget.querySelector(".task-actions");
                        if (actions) actions.style.opacity = "0";
                      }}
                    >
                      <button
                        onClick={() => toggleTodo(todo)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {todo.completed ? (
                          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "50%", backgroundColor: isDark ? "rgba(196, 181, 253, 0.1)" : "#F3E8FF", flexShrink: 0 }}>
                            <CheckCircle size={20} weight="bold" color="#A78BFA" />
                          </div>
                        ) : (
                          <Circle size={24} color={isDark ? '#4B5563' : '#D1D5DB'} weight="regular" style={{ flexShrink: 0 }} />
                        )}
                      </button>

                      {isEditing ? renderTaskForm() : (
                        <div
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                        <div
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "15px",
                              fontWeight: 600,
                              fontFamily: font,
                              color: todo.completed ? textSec : textTitle,
                              textDecoration: todo.completed ? "line-through" : "none",
                              transition: "all 0.2s",
                              lineHeight: "1.5",
                            }}
                          >
                            {parseTaskText(todo, tags).map((part, i) => {
                              if (part.type === "text") return <span key={i}>{part.content}</span>;
                              
                              const tag = part.tag;
                              if (tag.type === "material") {
                                return (
                                  <span key={i} style={tagPillStyle(isDark ? "#F9FAFB" : "#111827", "#FFD2A6", "1px solid #FDBA74", todo.completed)}>
                                    <span style={{ opacity: 0.6, fontWeight: 700 }}>@</span>{tag.label}
                                  </span>
                                );
                              }
                              if (tag.type === "folder") {
                                return (
                                  <span key={i} style={tagPillStyle(isDark ? "#34D399" : "#065F46", isDark ? "rgba(16, 185, 129, 0.2)" : "#D1FAE5", isDark ? "1px solid #059669" : "1px solid #34D399", todo.completed)}>
                                    <span style={{ opacity: 0.6, fontWeight: 700 }}>@</span>{tag.label}
                                  </span>
                                );
                              }
                              if (tag.type === "date") {
                                return (
                                  <span key={i} style={tagPillStyle("#064E3B", "#98FF98", "none", todo.completed)}>
                                    <CalendarBlank size={12} weight="bold" />
                                    {tag.text.substring(1)}
                                  </span>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                        </div>
                      )}

                      {!isEditing && (
                        <div
                          className="task-actions"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            opacity: 0,
                            transition: "opacity 0.2s",
                          }}
                        >
                          <button
                            onClick={() => startEdit(todo)}
                            style={iconBtnStyle}
                          >
                            <PencilSimple size={16} color={textSec} />
                          </button>
                          <button
                            onClick={() => deleteTodo(todo.id)}
                            style={iconBtnStyle}
                          >
                            <Trash size={16} color="#EF4444" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {isAdding && renderTaskForm()}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Shared style helpers ─────────────────────────────────────────────────────
const iconBtnStyle = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "4px",
  borderRadius: "50%",
  transition: "opacity 0.2s",
};

const cancelBtnStyle = (border, color) => ({
  padding: "12px 0",
  borderRadius: "16px",
  border: `1px solid ${border}`,
  background: "transparent",
  color,
  fontSize: "15px",
  fontWeight: 600,
  cursor: "pointer",
});

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

const actionBtnStyle = (isDark, border, text) => ({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 12px",
  borderRadius: "8px",
  border: `1px solid ${border}`,
  background: "transparent",
  color: text,
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
});

const calNavBtnStyle = (isDark, hoverBg) => ({
  width: "28px",
  height: "28px",
  borderRadius: "8px",
  border: `1px solid ${isDark ? "#4B5563" : "#E5E7EB"}`,
  background: "transparent",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: isDark ? "#F9FAFB" : "#111827",
});

const calActionBtnStyle = (color, hoverBg) => ({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px",
  borderRadius: "8px",
  border: "none",
  background: "transparent",
  color: color,
  fontSize: "14px",
  fontWeight: 500,
  cursor: "pointer",
});
