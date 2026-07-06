import React, { useEffect, useState } from "react";
import { ChartPieSlice, Info, GraduationCap, GridFour } from "@phosphor-icons/react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { SupabaseProvider as YSupabaseProvider } from "@supabase-labs/y-supabase";

export default function StudyProgressWidget({ isDark = false }) {
  const bgOuter = isDark ? "#1a2234" : "#F3F4F6";
  const bgInner = isDark ? "#111827" : "#FFFFFF";
  const textSec = isDark ? "#9CA3AF" : "#6B7280";
  const ringBg = isDark ? "#374151" : "#F3F4F6";
  
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let doc;
    let provider;
    let idbProvider;
    let cleanup = () => {};

    const initYjs = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      const userId = session.user.id;
      const roomId = `user_${userId}_study_progress`;
      doc = new Y.Doc();
      const progressMap = doc.getMap("progress_map");

      provider = new YSupabaseProvider(roomId, doc, supabase, {
        awareness: false,
        persistence: { table: "yjs_documents" },
      });

      try {
        idbProvider = new IndexeddbPersistence(roomId, doc);
      } catch {
        console.warn("IndexedDB persistence disabled for StudyProgressWidget");
      }

      const updateReactState = () => {
        const list = Array.from(progressMap.values());
        list.sort((a, b) => {
          const timeA = new Date(a.last_accessed || 0).getTime();
          const timeB = new Date(b.last_accessed || 0).getTime();
          return timeB - timeA;
        });
        setProgressData(list.slice(0, 2).map(item => ({
          ...item,
          icon: <GridFour size={14} weight="fill" />
        })));
      };

      progressMap.observe(updateReactState);

      if (idbProvider) {
        idbProvider.on("synced", () => {
          updateReactState();
          setLoading(false);
        });
      } else {
        updateReactState();
        setLoading(false);
      }

      const handleLocalSync = (e) => {
        if (e.detail.roomId === roomId) {
          if (e.detail.update) {
            Y.applyUpdate(doc, e.detail.update, "local-sync");
          } else {
            // Null update means trigger a manual refetch from Postgres
            fetchProgressFromPostgres();
          }
        }
      };
      window.addEventListener("yjs-local-sync-progress", handleLocalSync);

      doc.on("update", (update, origin) => {
        if (origin !== "local-sync") {
          window.dispatchEvent(new CustomEvent("yjs-local-sync-progress", { detail: { roomId, update } }));
        }
      });

      // Fetch from postgres to populate/sync the Y.Map
      const fetchProgressFromPostgres = async () => {
        try {
          const { data, error } = await supabase
            .from("materials")
            .select("id, title, progress, last_accessed")
            .eq("user_id", userId)
            .order("last_accessed", { ascending: false, nullsFirst: false })
            .limit(2);
            
          if (!error && data) {
            doc.transact(() => {
              data.forEach(item => {
                const existing = progressMap.get(item.id);
                const titleToSave = item.title && item.title.length > 10 ? item.title.substring(0, 10) + "..." : (item.title || "Untitled");
                
                if (!existing) {
                  progressMap.set(item.id, {
                    id: item.id,
                    title: titleToSave,
                    progress: item.progress || 0,
                    last_accessed: item.last_accessed || new Date().toISOString()
                  });
                } else {
                  // If the Postgres data is newer or has changed
                  const existingTime = new Date(existing.last_accessed || 0).getTime();
                  const newTime = new Date(item.last_accessed || 0).getTime();
                  if (newTime > existingTime || existing.progress !== item.progress) {
                    progressMap.set(item.id, {
                      ...existing,
                      title: titleToSave,
                      progress: item.progress || 0,
                      last_accessed: item.last_accessed || new Date().toISOString()
                    });
                  }
                }
              });
            });
          }
        } catch {
          console.error("Failed to fetch progress from postgres");
        }
      };

      // Initial fetch
      fetchProgressFromPostgres();

      cleanup = () => {
        window.removeEventListener("yjs-local-sync-progress", handleLocalSync);
        progressMap.unobserve(updateReactState);
        provider.destroy();
        if (idbProvider) idbProvider.destroy();
        doc.destroy();
      };
    };

    initYjs();
    return () => cleanup();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: "24px",
        backgroundColor: bgOuter,
        fontFamily: "Outfit, sans-serif",
        overflow: "hidden",
        width: "100%",
        padding: "16px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px 16px" }}>
        <ChartPieSlice size={22} color={textSec} weight="regular" />
        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: textSec }}>Study Progress</h2>
        <Info size={16} color={textSec} weight="regular" style={{ opacity: 0.5, marginLeft: "4px" }} />
      </div>

      {/* Inner Card */}
      <div
        style={{
          backgroundColor: bgInner,
          borderRadius: "24px",
          padding: "32px 24px",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          gap: "16px",
          minHeight: "180px"
        }}
      >
        {loading ? (
          <div style={{ color: textSec, fontSize: "14px", fontWeight: 500 }}>Loading progress...</div>
        ) : progressData.length === 0 ? (
          <div style={{ color: textSec, fontSize: "14px", fontWeight: 500 }}>No materials found. Start studying!</div>
        ) : (
          progressData.map((item, index) => {
            const radius = 46;
            const strokeWidth = 10;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (item.progress / 100) * circumference;

            return (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}
              >
                {/* Progress Ring */}
                <div style={{ position: "relative", width: "120px", height: "120px" }}>
                  <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                    {/* Background Ring */}
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="none"
                      stroke={ringBg}
                      strokeWidth={strokeWidth}
                    />
                    {/* Foreground Ring */}
                    <motion.circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="none"
                      stroke="#FFD2A6"
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                  {/* Center Content */}
                  <div 
                    style={{ 
                      position: "absolute", 
                      inset: 0, 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      gap: "4px",
                      color: "#9A3412"
                    }}
                  >
                    <GraduationCap size={20} weight="bold" />
                    <span style={{ fontSize: "18px", fontWeight: 700 }}>
                      {item.progress}%
                    </span>
                  </div>
                </div>

                {/* Pill Tag */}
                <motion.div
                  onClick={() => navigate(`/workstation/${item.id}`)}
                  whileHover={{ backgroundColor: "#FDBA74" }}
                  transition={{ duration: 0.15 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 14px",
                    backgroundColor: "#FFD2A6",
                    borderRadius: "12px",
                    cursor: "pointer",
                    color: "#9A3412"
                  }}
                >
                  {item.icon}
                  <span style={{ fontSize: "14px", fontWeight: 700 }}>
                    {item.title}
                  </span>
                </motion.div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
