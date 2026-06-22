import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Skull,
  Users,
  Trophy,
  MessageSquare,
  ArrowLeft,
  Copy,
  CheckCircle,
  XCircle,
  Brain,
  Crown,
  Swords,
  ChevronRight,
  Send,
  Hash,
  AlertTriangle,
  Medal,
  Target
} from "lucide-react";
import { heistService } from "../../../services/heistService";
import { supabase } from "../../../supabaseClient";
import { checkAndDeductCredits, CREDIT_COSTS } from "../../../services/creditService";
const GAME_FONT = "'Outfit','Outfit',system-ui,sans-serif";
const PURPLE = "#7C3AED";
const MINT = "#98FF98";
const RED = "#EF4444";
const AMBER = "#F59E0B";
const TEXT = "#0F172A";
const MUTED = "#64748b";
function getCurrentTimestamp() {
  return Date.now();
}
function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
function getPlayerName(p) {
  return p?.profiles?.full_name || p?.guest_name || "Scholar";
}
function getInitial(name) {
  return (name || "S").charAt(0).toUpperCase();
}
export default function KnowledgeHeistPage() {
  const navigate = useNavigate();
  const { roomId: urlRoomId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("menu");
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState("");
  const [subject, setSubject] = useState("General");
  const [difficulty, setDifficulty] = useState("medium");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [joinCode, setJoinCode] = useState("");
  const [guestName] = useState(() => localStorage.getItem("luter-heist-guest") || `Scholar ${Math.floor(100 + Math.random() * 900)}`);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
      setLoading(false);
      if (urlRoomId && data?.user) {
        resumeRoom(urlRoomId);
      }
    });
  }, [urlRoomId]);
  const resumeRoom = async (id) => {
    try {
      const roomData = await heistService.getRoom(id);
      if (!roomData) throw new Error("Room not found");
      setRoom(roomData);
      const parts = await heistService.getParticipants(id);
      setParticipants(parts);
      if (roomData.status === "waiting") setView("lobby");
      else setView("game");
    } catch {
      setError("Could not find that room");
      setView("menu");
    }
  };
  const handleCreate = async () => {
    if (!user?.id) {
      setError("Please sign in to create a room");
      return;
    }
    setLoading(true);
    try {
      const { ok } = await checkAndDeductCredits(user.id, CREDIT_COSTS.PLAYGROUND_QUESTIONS, false);
      if (!ok) {
        setError("Not enough AI credits");
        setLoading(false);
        return;
      }
      const newRoom = await heistService.createRoom(user.id, {
        subject,
        difficulty,
        maxPlayers
      });
      setRoom(newRoom);
      const parts = await heistService.getParticipants(newRoom.id);
      setParticipants(parts);
      setView("lobby");
    } catch (e) {
      setError(e.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };
  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setLoading(true);
    try {
      const code = joinCode.trim().toUpperCase();
      const { room: foundRoom } = await heistService.joinByCode(
        code,
        user?.id,
        user?.id ? null : guestName
      );
      setRoom(foundRoom);
      const parts = await heistService.getParticipants(foundRoom.id);
      setParticipants(parts);
      setView("lobby");
    } catch (e) {
      setError(e.message || "Failed to join room");
    } finally {
      setLoading(false);
    }
  };
  const handleLeave = async () => {
    if (!room || !user?.id) return;
    await heistService.leaveRoom(room.id, user.id);
    setRoom(null);
    setParticipants([]);
    setView("menu");
    navigate("/compete");
  };
  const copyCode = () => {
    if (!room?.room_code) return;
    navigator.clipboard.writeText(room.room_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  };
  const [copied, setCopied] = useState(false);
  if (loading && !room) {
    return /* @__PURE__ */ jsxs("div", { style: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: GAME_FONT }, children: [
      /* @__PURE__ */ jsxs("div", { style: { textAlign: "center" }, children: [
        /* @__PURE__ */ jsx("div", { style: { width: 48, height: 48, border: `4px solid ${PURPLE}20`, borderTopColor: PURPLE, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" } }),
        /* @__PURE__ */ jsx("p", { style: { color: MUTED, fontWeight: 700 }, children: "Loading Knowledge Heist..." })
      ] }),
      /* @__PURE__ */ jsx("style", { children: `@keyframes spin { to { transform: rotate(360deg); } }` })
    ] });
  }
  return /* @__PURE__ */ jsx("div", { style: { minHeight: "100vh", background: "#f8fafc", fontFamily: GAME_FONT, display: "flex", flexDirection: "column" }, children: /* @__PURE__ */ jsxs(AnimatePresence, { mode: "wait", children: [
    view === "menu" && /* @__PURE__ */ jsx(
      HeistMenu,
      {
        subject,
        setSubject,
        difficulty,
        setDifficulty,
        maxPlayers,
        setMaxPlayers,
        joinCode,
        setJoinCode,
        onCreate: handleCreate,
        onJoin: handleJoin,
        error,
        loading,
        onBack: () => navigate("/compete")
      },
      "menu"
    ),
    view === "lobby" && room && /* @__PURE__ */ jsx(
      HeistLobby,
      {
        room,
        participants,
        user,
        guestName,
        onLeave: handleLeave,
        onRoomUpdate: (r, p) => {
          setRoom(r);
          setParticipants(p);
        },
        onStart: () => setView("game"),
        copied,
        onCopyCode: copyCode
      },
      "lobby"
    ),
    view === "game" && room && /* @__PURE__ */ jsx(
      HeistGame,
      {
        room,
        participants,
        user,
        guestName,
        onExit: () => {
          setRoom(null);
          setParticipants([]);
          setView("menu");
          navigate("/compete");
        }
      },
      "game"
    )
  ] }) });
}
function HeistMenu({ subject, setSubject, difficulty, setDifficulty, maxPlayers, setMaxPlayers, joinCode, setJoinCode, onCreate, onJoin, error, loading, onBack }) {
  const [mode, setMode] = useState("choose");
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 },
      children: [
        /* @__PURE__ */ jsxs("button", { onClick: onBack, style: { position: "absolute", top: 24, left: 24, background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: MUTED }, children: [
          /* @__PURE__ */ jsx(ArrowLeft, { size: 18 }),
          " Back"
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", marginBottom: 40 }, children: [
          /* @__PURE__ */ jsx("div", { style: { width: 96, height: 96, margin: "0 auto 20px", borderRadius: 28, background: `linear-gradient(135deg, ${PURPLE}, #A78BFA)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 12px 32px ${PURPLE}30` }, children: /* @__PURE__ */ jsx(Swords, { size: 48, color: "white" }) }),
          /* @__PURE__ */ jsx("h1", { style: { margin: 0, fontSize: 36, fontWeight: 900, color: TEXT, letterSpacing: "-0.02em" }, children: "Knowledge Heist" }),
          /* @__PURE__ */ jsx("p", { style: { margin: "10px auto 0", color: MUTED, fontWeight: 600, maxWidth: 420, lineHeight: 1.5 }, children: "A social deduction learning game. Find the Knowledge Thieves before they corrupt the team's knowledge!" })
        ] }),
        error && /* @__PURE__ */ jsx("div", { style: { background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", padding: "12px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14, marginBottom: 20, maxWidth: 480, width: "100%", textAlign: "center" }, children: error }),
        mode === "choose" && /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 16, maxWidth: 400, width: "100%" }, children: [
          /* @__PURE__ */ jsxs(
            motion.button,
            {
              whileHover: { y: -2 },
              whileTap: { scale: 0.98 },
              onClick: () => setMode("create"),
              style: {
                background: `linear-gradient(135deg, ${PURPLE}, #6D28D9)`,
                color: "white",
                border: "none",
                borderRadius: 18,
                padding: "22px 28px",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 16,
                boxShadow: `0 8px 24px ${PURPLE}35`
              },
              children: [
                /* @__PURE__ */ jsx("div", { style: { width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsx(Crown, { size: 24 }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { style: { fontWeight: 900, fontSize: 17 }, children: "Create Room" }),
                  /* @__PURE__ */ jsx("div", { style: { fontWeight: 500, fontSize: 13, opacity: 0.8 }, children: "Host a new Knowledge Heist" })
                ] }),
                /* @__PURE__ */ jsx(ChevronRight, { size: 20, style: { marginLeft: "auto" } })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            motion.button,
            {
              whileHover: { y: -2 },
              whileTap: { scale: 0.98 },
              onClick: () => setMode("join"),
              style: {
                background: "white",
                color: TEXT,
                border: "2px solid #e2e8f0",
                borderRadius: 18,
                padding: "22px 28px",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 16
              },
              children: [
                /* @__PURE__ */ jsx("div", { style: { width: 48, height: 48, borderRadius: 14, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", color: PURPLE }, children: /* @__PURE__ */ jsx(Hash, { size: 24 }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { style: { fontWeight: 900, fontSize: 17 }, children: "Join with Code" }),
                  /* @__PURE__ */ jsx("div", { style: { fontWeight: 500, fontSize: 13, color: MUTED }, children: "Enter a 6-digit room code" })
                ] }),
                /* @__PURE__ */ jsx(ChevronRight, { size: 20, style: { marginLeft: "auto", color: MUTED } })
              ]
            }
          )
        ] }),
        mode === "create" && /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, x: 30 },
            animate: { opacity: 1, x: 0 },
            style: { maxWidth: 480, width: "100%", background: "white", borderRadius: 24, padding: 32, border: "1px solid #e2e8f0", boxShadow: "0 10px 40px rgba(0,0,0,0.06)" },
            children: [
              /* @__PURE__ */ jsx("h2", { style: { margin: "0 0 24px", fontSize: 20, fontWeight: 900 }, children: "Create Room" }),
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 18 }, children: [
                /* @__PURE__ */ jsx(FormField, { label: "Subject", children: /* @__PURE__ */ jsx("input", { value: subject, onChange: (e) => setSubject(e.target.value), placeholder: "e.g. Biology, History", style: inputStyle }) }),
                /* @__PURE__ */ jsx(FormField, { label: "Difficulty", children: /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 8 }, children: ["easy", "medium", "hard"].map((d) => /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setDifficulty(d),
                    style: {
                      flex: 1,
                      padding: "10px",
                      borderRadius: 12,
                      border: `2px solid ${difficulty === d ? PURPLE : "#e2e8f0"}`,
                      background: difficulty === d ? `${PURPLE}10` : "white",
                      color: difficulty === d ? PURPLE : MUTED,
                      fontWeight: 800,
                      cursor: "pointer",
                      textTransform: "capitalize"
                    },
                    children: d
                  },
                  d
                )) }) }),
                /* @__PURE__ */ jsx(FormField, { label: "Max Players (4-10)", children: /* @__PURE__ */ jsx("input", { type: "number", min: 4, max: 10, value: maxPlayers, onChange: (e) => setMaxPlayers(Math.max(4, Math.min(10, Number(e.target.value)))), style: inputStyle }) }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: onCreate,
                    disabled: loading,
                    style: {
                      width: "100%",
                      padding: "16px",
                      background: MINT,
                      color: "#166534",
                      border: "none",
                      borderRadius: 14,
                      fontWeight: 900,
                      fontSize: 16,
                      cursor: loading ? "not-allowed" : "pointer",
                      marginTop: 8
                    },
                    children: loading ? "Creating..." : "Create Room"
                  }
                ),
                /* @__PURE__ */ jsx("button", { onClick: () => setMode("choose"), style: { background: "none", border: "none", color: MUTED, fontWeight: 700, cursor: "pointer", marginTop: 4 }, children: "Cancel" })
              ] })
            ]
          }
        ),
        mode === "join" && /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, x: 30 },
            animate: { opacity: 1, x: 0 },
            style: { maxWidth: 480, width: "100%", background: "white", borderRadius: 24, padding: 32, border: "1px solid #e2e8f0", boxShadow: "0 10px 40px rgba(0,0,0,0.06)" },
            children: [
              /* @__PURE__ */ jsx("h2", { style: { margin: "0 0 24px", fontSize: 20, fontWeight: 900 }, children: "Join Room" }),
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 18 }, children: [
                /* @__PURE__ */ jsx(FormField, { label: "Room Code", children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    value: joinCode,
                    onChange: (e) => setJoinCode(e.target.value.toUpperCase()),
                    placeholder: "ABC123",
                    maxLength: 6,
                    style: { ...inputStyle, textAlign: "center", fontSize: 24, letterSpacing: "0.2em", fontWeight: 900 }
                  }
                ) }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: onJoin,
                    disabled: loading || joinCode.length < 4,
                    style: {
                      width: "100%",
                      padding: "16px",
                      background: MINT,
                      color: "#166534",
                      border: "none",
                      borderRadius: 14,
                      fontWeight: 900,
                      fontSize: 16,
                      cursor: loading || joinCode.length < 4 ? "not-allowed" : "pointer",
                      marginTop: 8
                    },
                    children: loading ? "Joining..." : "Join Room"
                  }
                ),
                /* @__PURE__ */ jsx("button", { onClick: () => setMode("choose"), style: { background: "none", border: "none", color: MUTED, fontWeight: 700, cursor: "pointer", marginTop: 4 }, children: "Cancel" })
              ] })
            ]
          }
        )
      ]
    }
  );
}
function FormField({ label, children }) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("label", { style: { display: "block", fontWeight: 800, fontSize: 13, color: MUTED, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }, children: label }),
    children
  ] });
}
const inputStyle = {
  width: "100%",
  height: 48,
  border: "2px solid #e2e8f0",
  borderRadius: 12,
  padding: "0 14px",
  fontSize: 15,
  fontWeight: 600,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: GAME_FONT,
  color: TEXT,
  background: "white"
};
function HeistLobby({ room, participants, user, guestName, onLeave, onRoomUpdate, onStart, copied, onCopyCode }) {
  const channelRef = useRef(null);
  const [isHost, setIsHost] = useState(false);
  const [myParticipant, setMyParticipant] = useState(null);
  const [toggling, setToggling] = useState(false);
  useEffect(() => {
    if (!room?.id) return;
    const init = async () => {
      const parts = await heistService.getParticipants(room.id);
      onRoomUpdate(room, parts);
      const me = parts.find((p) => {
        if (user?.id && p.user_id) return p.user_id === user.id;
        if (!user?.id && p.guest_name) return p.guest_name === guestName;
        return false;
      });
      setMyParticipant(me);
      setIsHost(room.created_by === user?.id);
      const ch = heistService.subscribeToRoom(room.id, async (type) => {
        if (type === "room") {
          const r = await heistService.getRoom(room.id);
          const p = await heistService.getParticipants(room.id);
          onRoomUpdate(r, p);
          if (r.status === "playing") onStart();
        } else if (type === "participants") {
          const p = await heistService.getParticipants(room.id);
          onRoomUpdate(room, p);
        }
      });
      channelRef.current = ch;
    };
    init();
    const poll = setInterval(async () => {
      try {
        const r = await heistService.getRoom(room.id);
        if (r.status === "playing") {
          clearInterval(poll);
          onStart();
          return;
        }
        const p = await heistService.getParticipants(room.id);
        onRoomUpdate(r, p);
        const me = p.find((pt) => {
          if (user?.id && pt.user_id) return pt.user_id === user.id;
          if (!user?.id && pt.guest_name) return pt.guest_name === guestName;
          return false;
        });
        setMyParticipant(me);
      } catch (e) {
        console.error("Lobby poll error:", e);
      }
    }, 3e3);
    return () => {
      clearInterval(poll);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [room?.id]);
  const handleReady = async () => {
    if (!myParticipant || toggling) return;
    setToggling(true);
    try {
      await heistService.setReady(myParticipant.id, !myParticipant.is_ready);
      const p = await heistService.getParticipants(room.id);
      onRoomUpdate(room, p);
    } finally {
      setToggling(false);
    }
  };
  const handleStart = async () => {
    const others = participants.filter((p) => p.user_id !== room.created_by);
    const everyoneReady = others.length === 0 || others.every((p) => p.is_ready);
    if (!everyoneReady) {
      alert("Wait for all players to be ready!");
      return;
    }
    try {
      await heistService.startGame(room.id);
      onStart();
    } catch (e) {
      alert(e.message || "Failed to start game");
    }
  };
  return /* @__PURE__ */ jsx(
    motion.div,
    {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px" },
      children: /* @__PURE__ */ jsxs("div", { style: { maxWidth: 800, width: "100%" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", marginBottom: 32 }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 16px", background: "#f5f3ff", borderRadius: 100, color: PURPLE, fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }, children: [
            /* @__PURE__ */ jsx(Users, { size: 16 }),
            " Waiting Room"
          ] }),
          /* @__PURE__ */ jsx("h1", { style: { fontSize: 32, fontWeight: 900, color: TEXT, marginBottom: 8 }, children: "Knowledge Heist Lobby" }),
          /* @__PURE__ */ jsxs("p", { style: { color: MUTED, fontWeight: 600 }, children: [
            "Subject: ",
            /* @__PURE__ */ jsx("strong", { style: { color: TEXT }, children: room.subject }),
            " \u2022 Difficulty: ",
            /* @__PURE__ */ jsx("strong", { style: { color: TEXT }, children: room.difficulty })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", justifyContent: "center", marginBottom: 32 }, children: /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: onCopyCode,
            style: {
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "white",
              border: "2px solid #e2e8f0",
              borderRadius: 16,
              padding: "14px 24px",
              cursor: "pointer",
              fontFamily: GAME_FONT
            },
            children: [
              /* @__PURE__ */ jsx(Hash, { size: 20, color: PURPLE }),
              /* @__PURE__ */ jsx("span", { style: { fontSize: 28, fontWeight: 900, letterSpacing: "0.15em", color: TEXT }, children: room.room_code }),
              copied ? /* @__PURE__ */ jsx(CheckCircle, { size: 20, color: "#16A34A" }) : /* @__PURE__ */ jsx(Copy, { size: 20, color: MUTED })
            ]
          }
        ) }),
        /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }, children: participants.map((p) => {
          const isMe = myParticipant?.id === p.id;
          const isHostPlayer = p.user_id === room.created_by;
          return /* @__PURE__ */ jsxs(
            motion.div,
            {
              initial: { scale: 0.9, opacity: 0 },
              animate: { scale: 1, opacity: 1 },
              style: {
                background: "white",
                borderRadius: 20,
                padding: 20,
                border: `2px solid ${p.is_ready ? "#16A34A" : isMe ? PURPLE : "#e2e8f0"}`,
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
              },
              children: [
                /* @__PURE__ */ jsx("div", { style: { width: 56, height: 56, borderRadius: 18, background: isMe ? PURPLE : "#f1f5f9", color: isMe ? "white" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontWeight: 900, fontSize: 22 }, children: p.profiles?.avatar_url ? /* @__PURE__ */ jsx("img", { src: p.profiles.avatar_url, alt: "", style: { width: "100%", height: "100%", objectFit: "cover", borderRadius: 18 } }) : getInitial(getPlayerName(p)) }),
                /* @__PURE__ */ jsx("div", { style: { fontWeight: 800, fontSize: 15, color: TEXT }, children: isMe ? "You" : getPlayerName(p) }),
                /* @__PURE__ */ jsx("div", { style: { fontSize: 12, fontWeight: 700, color: p.is_ready ? "#16A34A" : "#94a3b8", marginTop: 4 }, children: p.is_ready ? "\u2713 Ready" : "Waiting" }),
                isHostPlayer && /* @__PURE__ */ jsx("div", { style: { marginTop: 6, fontSize: 11, fontWeight: 800, color: AMBER }, children: "HOST" })
              ]
            },
            p.id
          );
        }) }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 12, justifyContent: "center" }, children: [
          !isHost && myParticipant && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleReady,
              disabled: toggling,
              style: {
                padding: "14px 32px",
                borderRadius: 14,
                border: "none",
                background: myParticipant.is_ready ? "#FEE2E2" : MINT,
                color: myParticipant.is_ready ? "#DC2626" : "#166534",
                fontWeight: 900,
                fontSize: 16,
                cursor: "pointer"
              },
              children: myParticipant.is_ready ? "Not Ready" : "I'm Ready"
            }
          ),
          isHost && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleStart,
              style: {
                padding: "14px 32px",
                borderRadius: 14,
                border: "none",
                background: MINT,
                color: "#166534",
                fontWeight: 900,
                fontSize: 16,
                cursor: "pointer"
              },
              children: "Start Game"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: onLeave,
              style: {
                padding: "14px 24px",
                borderRadius: 14,
                border: "1.5px solid #e2e8f0",
                background: "white",
                color: MUTED,
                fontWeight: 800,
                cursor: "pointer"
              },
              children: "Leave"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("p", { style: { textAlign: "center", marginTop: 20, color: "#94a3b8", fontSize: 13, fontWeight: 600 }, children: [
          "Need at least 4 players to start. Current: ",
          participants.length
        ] })
      ] })
    }
  );
}
function HeistGame({ room, participants, user, guestName, onExit }) {
  const [gameRoom, setGameRoom] = useState(room);
  const [gameParts, setGameParts] = useState(participants);
  const [currentRound, setCurrentRound] = useState(null);
  const [myParticipant, setMyParticipant] = useState(null);
  const [phase, setPhase] = useState("task");
  const channelRef = useRef(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [chat, setChat] = useState([]);
  const [votes, setVotes] = useState([]);
  const [roundNumber, setRoundNumber] = useState(1);
  const [integrity, setIntegrity] = useState(100);
  const [showRole, setShowRole] = useState(false);
  const [report, setReport] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    const me = gameParts.find((p) => {
      if (user?.id && p.user_id) return p.user_id === user.id;
      if (!user?.id && p.guest_name) return p.guest_name === guestName;
      return false;
    });
    setMyParticipant(me);
  }, [gameParts, user, guestName]);
  useEffect(() => {
    if (!room?.id) return;
    const init = async () => {
      const r = await heistService.getRoom(room.id);
      const p = await heistService.getParticipants(room.id);
      const rnd = await heistService.getCurrentRound(room.id);
      setGameRoom(r);
      setGameParts(p);
      setIntegrity(r.integrity || 100);
      setRoundNumber(r.current_round || 1);
      setPhase(r.current_phase || "task");
      setCurrentRound(rnd);
      const ch = heistService.subscribeToRoom(room.id, async (type) => {
        if (type === "room") {
          const updated = await heistService.getRoom(room.id);
          setGameRoom(updated);
          setIntegrity(updated.integrity || 100);
          setRoundNumber(updated.current_round || 1);
          setPhase(updated.current_phase || "task");
          if (updated.status === "finished") {
            generateReport(updated);
          }
        } else if (type === "participants") {
          const pts = await heistService.getParticipants(room.id);
          setGameParts(pts);
        } else if (type === "rounds") {
          const rndCurrent = await heistService.getCurrentRound(room.id);
          setCurrentRound(rndCurrent);
        } else if (type === "votes") {
          const latestRound = await heistService.getCurrentRound(room.id);
          if (latestRound?.id) {
            const vs = await heistService.getVotes(latestRound.id);
            setVotes(vs);
          }
        } else if (type === "chat") {
          const msgs = await heistService.getChat(room.id, 50);
          setChat(msgs);
        }
      });
      channelRef.current = ch;
    };
    init();
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [room?.id]);
  useEffect(() => {
    if (!gameRoom || gameRoom.status !== "playing" || phase !== "task") return;
    if (questions.length > 0 && answers.length === 0) return;
    const loadQuestions = async () => {
      setLoadingQuestions(true);
      setAnswers([]);
      try {
        const qs = await heistService.generateQuestions(gameRoom.subject, gameRoom.difficulty, 5);
        setQuestions(qs);
      } catch (e) {
        console.error("Failed to load questions:", e);
      } finally {
        setLoadingQuestions(false);
      }
    };
    loadQuestions();
  }, [phase, gameRoom?.status, roundNumber]);
  const generateReport = async (r) => {
    if (!user?.id || !r) return;
    try {
      const rep = await heistService.generateReport(r.id, user.id);
      setReport(rep);
      if (rep) {
        await heistService.saveSession(user.id, r.id, {
          subject: r.subject,
          difficulty: r.difficulty,
          role: rep.role,
          result: rep.result,
          questionsAttempted: rep.questionsAttempted,
          correctAnswers: rep.correctAnswers,
          accuracy: rep.accuracy,
          topicsPracticed: rep.topicsPracticed,
          strengthAreas: rep.strengthAreas,
          weakAreas: rep.weakAreas,
          recommendations: rep.recommendations,
          awards: rep.awards
        });
      }
    } catch (e) {
      console.error("Report generation failed:", e);
    }
  };
  const resolveVoting = async () => {
    if (!currentRound || !gameRoom) return;
    try {
      const roundVotes = await heistService.getVotes(currentRound.id);
      const voteCounts = {};
      roundVotes.forEach((v) => {
        voteCounts[v.target_id] = (voteCounts[v.target_id] || 0) + 1;
      });
      const aliveParts = gameParts.filter((p) => p.is_alive);
      let maxVotes = 0;
      let eliminatedCandidates = [];
      aliveParts.forEach((p) => {
        const count = voteCounts[p.id] || 0;
        if (count > maxVotes) {
          maxVotes = count;
          eliminatedCandidates = [p];
        } else if (count === maxVotes && count > 0) {
          eliminatedCandidates.push(p);
        }
      });
      let eliminatedPlayer = null;
      if (eliminatedCandidates.length > 0) {
        eliminatedPlayer = eliminatedCandidates[Math.floor(Math.random() * eliminatedCandidates.length)];
      }
      if (eliminatedPlayer) {
        await heistService.eliminatePlayer(eliminatedPlayer.id);
        await heistService.sendChat(
          gameRoom.id,
          myParticipant?.id || null,
          `${getPlayerName(eliminatedPlayer)} was eliminated by vote. They were a ${eliminatedPlayer.role === "thief" ? "Knowledge Thief \u{1F575}\uFE0F" : "Knowledge Agent \u{1F6E1}\uFE0F"}!`,
          true
        );
      } else {
        await heistService.sendChat(
          gameRoom.id,
          myParticipant?.id || null,
          "No one was eliminated this round due to lack of votes or a complete draw.",
          true
        );
      }
      const updatedParts = await heistService.getParticipants(gameRoom.id);
      setGameParts(updatedParts);
      const aliveAgents = updatedParts.filter((p) => p.is_alive && p.role === "agent");
      const aliveThieves = updatedParts.filter((p) => p.is_alive && p.role === "thief");
      let gameWinner = null;
      if (integrity <= 0) {
        gameWinner = "thieves";
      } else if (aliveThieves.length === 0 && aliveAgents.length > 0) {
        gameWinner = "agents";
      } else if (aliveThieves.length >= aliveAgents.length && aliveAgents.length > 0) {
        gameWinner = "thieves";
      }
      if (gameWinner) {
        await heistService.endGame(gameRoom.id, gameWinner);
      } else {
        await heistService.createNextRound(gameRoom.id, roundNumber + 1, integrity);
      }
    } catch (e) {
      console.error("Failed to resolve voting:", e);
    }
  };
  const handlePhaseTimeout = useCallback(async () => {
    if (!currentRound || !gameRoom) return;
    try {
      if (phase === "task") {
        await heistService.advancePhase(gameRoom.id, currentRound.id, "discussion", integrity);
      } else if (phase === "discussion") {
        await heistService.advancePhase(gameRoom.id, currentRound.id, "voting", integrity);
      } else if (phase === "voting") {
        await resolveVoting();
      }
    } catch (e) {
      console.error("Error handling phase timeout:", e);
    }
  }, [currentRound, gameRoom, phase, integrity, roundNumber, gameParts, myParticipant]);
  useEffect(() => {
    if (!currentRound?.phase_ends_at || gameRoom?.status !== "playing") {
      setTimeLeft(0);
      return;
    }
    const interval = setInterval(async () => {
      const endsAt = new Date(currentRound.phase_ends_at).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((endsAt - now) / 1e3));
      setTimeLeft(diff);
      const isHost = gameRoom.created_by === user?.id;
      if (isHost && diff === 0) {
        clearInterval(interval);
        await handlePhaseTimeout();
      }
    }, 1e3);
    return () => clearInterval(interval);
  }, [currentRound?.phase_ends_at, currentRound?.phase, gameRoom?.status, gameRoom?.created_by, user?.id, handlePhaseTimeout]);
  useEffect(() => {
    const isHost = gameRoom?.created_by === user?.id;
    if (!isHost || phase !== "task" || !currentRound || gameParts.length === 0) return;
    const aliveParts = gameParts.filter((p) => p.is_alive);
    if (aliveParts.length > 0 && aliveParts.every((p) => p.is_ready)) {
      heistService.advancePhase(gameRoom.id, currentRound.id, "discussion", integrity).catch(console.error);
    }
  }, [gameParts, phase, currentRound, gameRoom, user?.id, integrity]);
  useEffect(() => {
    const isHost = gameRoom?.created_by === user?.id;
    if (!isHost || phase !== "voting" || !currentRound || gameParts.length === 0) return;
    const aliveVoters = gameParts.filter((p) => p.is_alive);
    const allVoted = aliveVoters.length > 0 && aliveVoters.every((voter) => votes.some((v) => v.voter_id === voter.id));
    if (allVoted) {
      resolveVoting().catch(console.error);
    }
  }, [votes, phase, currentRound, gameRoom, user?.id, gameParts]);
  const handleAnswerQuestion = async (questionId, selectedIndex, isCorrect, timeSpentMs) => {
    if (!currentRound || !myParticipant) return;
    const q = questions.find((q2) => q2.id === questionId);
    if (!q) return;
    const playerAnswer = q.options[selectedIndex];
    const correctAnswer = q.options[q.correctIndex];
    await heistService.recordAnswer(
      currentRound.id,
      myParticipant.id,
      q.question,
      correctAnswer,
      playerAnswer,
      isCorrect,
      timeSpentMs
    );
    const scoreDelta = isCorrect ? 10 : 0;
    await heistService.updateParticipantStats(myParticipant.id, {
      scoreDelta,
      questionsDelta: 1,
      correctDelta: isCorrect ? 1 : 0
    });
    const integrityChange = isCorrect ? 2 : -3;
    const newIntegrity = Math.max(0, Math.min(100, integrity + integrityChange));
    await supabase.from("heist_rooms").update({ integrity: newIntegrity }).eq("id", room.id);
    setAnswers((prev) => {
      const next = [...prev, { questionId, isCorrect, selectedIndex }];
      if (next.length === questions.length) {
        heistService.setReady(myParticipant.id, true).catch(console.error);
      }
      return next;
    });
  };
  const handleSendChat = async (message) => {
    if (!message.trim() || !myParticipant) return;
    await heistService.sendChat(room.id, myParticipant.id, message.trim());
  };
  const handleVote = async (targetId) => {
    if (!currentRound || !myParticipant) return;
    await heistService.castVote(currentRound.id, myParticipant.id, targetId);
  };
  const handleSabotage = async (targetId) => {
    if (!myParticipant || myParticipant.role !== "thief" || myParticipant.sabotage_uses <= 0) return;
    try {
      const target = gameParts.find((p) => p.id === targetId);
      if (!target) return;
      await heistService.sabotagePlayer(room.id, targetId, myParticipant.id);
      await heistService.sendChat(room.id, myParticipant.id, `\u26A0\uFE0F [SYSTEM WARNING] A Knowledge Corruptor glitch has been detected!`, true);
      const pts = await heistService.getParticipants(room.id);
      setGameParts(pts);
    } catch (e) {
      console.error("Sabotage failed:", e);
    }
  };
  useEffect(() => {
    if (gameRoom?.status !== "playing") return;
    const aliveAgents = gameParts.filter((p) => p.is_alive && p.role === "agent");
    const aliveThieves = gameParts.filter((p) => p.is_alive && p.role === "thief");
    if (integrity <= 0) {
      heistService.endGame(room.id, "thieves");
      return;
    }
    if (aliveThieves.length === 0 && aliveAgents.length > 0) {
      heistService.endGame(room.id, "agents");
      return;
    }
    if (aliveThieves.length >= aliveAgents.length && aliveAgents.length > 0) {
      heistService.endGame(room.id, "thieves");
    }
  }, [integrity, gameParts, gameRoom?.status]);
  if (gameRoom?.status === "finished" || phase === "ended") {
    return /* @__PURE__ */ jsx(
      HeistReportScreen,
      {
        room: gameRoom,
        participants: gameParts,
        myParticipant,
        report,
        onExit,
        onPlayAgain: () => window.location.reload()
      }
    );
  }
  return /* @__PURE__ */ jsxs("div", { style: { flex: 1, display: "flex", flexDirection: "column", padding: "20px 24px", maxWidth: 1200, margin: "0 auto", width: "100%" }, children: [
    /* @__PURE__ */ jsx(
      HeistGameHeader,
      {
        room: gameRoom,
        phase,
        roundNumber,
        integrity,
        myRole: myParticipant?.role,
        myParticipant,
        onShowRole: () => setShowRole(true),
        onExit,
        timeLeft
      }
    ),
    /* @__PURE__ */ jsxs(AnimatePresence, { mode: "wait", children: [
      phase === "task" && /* @__PURE__ */ jsx(
        TaskPhase,
        {
          questions,
          loading: loadingQuestions,
          myParticipant,
          onAnswer: handleAnswerQuestion,
          answers,
          onSabotage: handleSabotage,
          participants: gameParts,
          room: gameRoom
        },
        `task-${roundNumber}`
      ),
      phase === "discussion" && /* @__PURE__ */ jsx(
        DiscussionPhase,
        {
          room: gameRoom,
          participants: gameParts,
          myParticipant,
          chat,
          onSendChat: handleSendChat,
          roundNumber
        },
        "discussion"
      ),
      phase === "voting" && /* @__PURE__ */ jsx(
        VotingPhase,
        {
          participants: gameParts,
          myParticipant,
          votes,
          onVote: handleVote,
          roundNumber
        },
        "voting"
      )
    ] }),
    /* @__PURE__ */ jsx(AnimatePresence, { children: showRole && /* @__PURE__ */ jsx(
      RoleRevealModal,
      {
        role: myParticipant?.role,
        onClose: () => setShowRole(false)
      }
    ) })
  ] });
}
function HeistGameHeader({ room, phase, roundNumber, integrity, myRole, myParticipant, onShowRole, onExit, timeLeft }) {
  const phaseLabels = { task: "Task Phase", discussion: "Discussion", voting: "Voting", ended: "Game Over" };
  const phaseColors = { task: "#16A34A", discussion: AMBER, voting: PURPLE, ended: RED };
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 16 }, children: [
      /* @__PURE__ */ jsx("button", { onClick: onExit, style: { background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 12px", cursor: "pointer" }, children: /* @__PURE__ */ jsx(ArrowLeft, { size: 18, color: MUTED }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, fontWeight: 800, color: phaseColors[phase] || MUTED, textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }, children: [
          phaseLabels[phase] || phase,
          " ",
          timeLeft > 0 && `\u2022 ${formatTime(timeLeft)}`
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { fontSize: 20, fontWeight: 900, color: TEXT }, children: [
          "Round ",
          roundNumber,
          " \u2022 ",
          room?.subject
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 16 }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
        /* @__PURE__ */ jsx(Shield, { size: 18, color: integrity > 50 ? "#16A34A" : integrity > 25 ? AMBER : RED }),
        /* @__PURE__ */ jsx("div", { style: { width: 120, height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }, children: /* @__PURE__ */ jsx(
          motion.div,
          {
            animate: { width: `${integrity}%` },
            transition: { duration: 0.5 },
            style: { height: "100%", background: integrity > 50 ? "#16A34A" : integrity > 25 ? AMBER : RED, borderRadius: 4 }
          }
        ) }),
        /* @__PURE__ */ jsxs("span", { style: { fontWeight: 800, fontSize: 13, color: TEXT }, children: [
          integrity,
          "%"
        ] })
      ] }),
      myParticipant && /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onShowRole,
          style: {
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 10,
            border: "none",
            background: myRole === "thief" ? `${RED}15` : `${PURPLE}15`,
            color: myRole === "thief" ? RED : PURPLE,
            fontWeight: 800,
            fontSize: 13,
            cursor: "pointer"
          },
          children: [
            myRole === "thief" ? /* @__PURE__ */ jsx(Skull, { size: 14 }) : /* @__PURE__ */ jsx(Shield, { size: 14 }),
            myRole === "thief" ? "Thief" : "Agent"
          ]
        }
      )
    ] })
  ] });
}
function RoleRevealModal({ role, onClose }) {
  const isThief = role === "thief";
  return /* @__PURE__ */ jsx(
    motion.div,
    {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(15,23,42,0.7)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24
      },
      onClick: onClose,
      children: /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.8, opacity: 0 },
          onClick: (e) => e.stopPropagation(),
          style: {
            background: "white",
            borderRadius: 28,
            padding: "40px 32px",
            textAlign: "center",
            maxWidth: 420,
            width: "100%",
            boxShadow: "0 32px 80px rgba(0,0,0,0.2)"
          },
          children: [
            /* @__PURE__ */ jsx("div", { style: {
              width: 80,
              height: 80,
              borderRadius: 24,
              background: isThief ? `${RED}15` : `${PURPLE}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px"
            }, children: isThief ? /* @__PURE__ */ jsx(Skull, { size: 40, color: RED }) : /* @__PURE__ */ jsx(Shield, { size: 40, color: PURPLE }) }),
            /* @__PURE__ */ jsxs("h2", { style: { margin: "0 0 8px", fontSize: 26, fontWeight: 900, color: TEXT }, children: [
              "You are a ",
              isThief ? "Knowledge Thief" : "Knowledge Agent"
            ] }),
            /* @__PURE__ */ jsx("p", { style: { color: MUTED, fontWeight: 600, lineHeight: 1.6, marginBottom: 24 }, children: isThief ? "Your mission: Secretly lower the team's knowledge integrity. Blend in. Don't get caught." : "Your mission: Answer questions correctly, identify the thieves, and protect the knowledge integrity." }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: onClose,
                style: {
                  padding: "12px 32px",
                  background: isThief ? RED : PURPLE,
                  color: "white",
                  border: "none",
                  borderRadius: 14,
                  fontWeight: 900,
                  fontSize: 16,
                  cursor: "pointer"
                },
                children: "Got it"
              }
            )
          ]
        }
      )
    }
  );
}
function TaskPhase({ questions, loading, myParticipant, onAnswer, answers, onSabotage, participants = [], room }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [startTime, setStartTime] = useState(() => getCurrentTimestamp());
  const q = questions[currentQ];
  const isAnswered = q ? answers.some((a) => a.questionId === q.id) : false;
  const isSabotaged = room?.metadata?.sabotaged_players?.[myParticipant?.id] === true;
  const scrambledOptions = useMemo(() => {
    if (!q) return [];
    const indexedOptions = q.options.map((opt, idx) => ({ opt, originalIndex: idx }));
    if (isSabotaged) {
      return shuffleArray(indexedOptions);
    }
    return indexedOptions;
  }, [q, isSabotaged]);
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { textAlign: "center" }, children: [
        /* @__PURE__ */ jsx("div", { style: { width: 40, height: 40, border: `3px solid ${PURPLE}20`, borderTopColor: PURPLE, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" } }),
        /* @__PURE__ */ jsx("p", { style: { color: MUTED, fontWeight: 700 }, children: "Generating questions with AI..." })
      ] }),
      /* @__PURE__ */ jsx("style", { children: `@keyframes spin { to { transform: rotate(360deg); } }` })
    ] });
  }
  if (!questions.length || !q) {
    return /* @__PURE__ */ jsx("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsx("p", { style: { color: MUTED, fontWeight: 700 }, children: "No questions available. Waiting..." }) });
  }
  const handleSelect = async (idx) => {
    if (showResult || isAnswered) return;
    setSelected(idx);
    setShowResult(true);
    const selectedItem = scrambledOptions[idx];
    const isCorrect = selectedItem.originalIndex === q.correctIndex;
    const timeSpent = getCurrentTimestamp() - startTime;
    if (isSabotaged) {
      try {
        await heistService.clearSabotage(room.id, myParticipant.id);
      } catch (e) {
        console.error("Error clearing sabotage:", e);
      }
    }
    await onAnswer(q.id, selectedItem.originalIndex, isCorrect, timeSpent);
  };
  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((prev) => prev + 1);
      setSelected(null);
      setShowResult(false);
      setStartTime(getCurrentTimestamp());
    }
  };
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 },
      style: { flex: 1, display: "flex", flexDirection: "column", maxWidth: 700, margin: "0 auto", width: "100%" },
      children: [
        /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 6, marginBottom: 20 }, children: questions.map((_, i) => /* @__PURE__ */ jsx("div", { style: {
          flex: 1,
          height: 6,
          borderRadius: 3,
          background: i < currentQ ? "#16A34A" : i === currentQ ? PURPLE : "#e2e8f0"
        } }, i)) }),
        /* @__PURE__ */ jsxs("div", { style: { background: "white", borderRadius: 24, padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", flex: 1, display: "flex", flexDirection: "column" }, children: [
          /* @__PURE__ */ jsx("div", { style: { marginBottom: 8 }, children: /* @__PURE__ */ jsxs("span", { style: { fontSize: 12, fontWeight: 800, color: PURPLE, textTransform: "uppercase", letterSpacing: "0.05em" }, children: [
            "Question ",
            currentQ + 1,
            " of ",
            questions.length
          ] }) }),
          isSabotaged && /* @__PURE__ */ jsxs("div", { style: { background: "#FFF5F5", border: "1.5px dashed #EF4444", color: "#B91C1C", padding: "10px 16px", borderRadius: 12, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }, children: [
            /* @__PURE__ */ jsx(Skull, { size: 16, color: RED }),
            "WARNING: THIEF SABOTAGE DETECTED! Options have been corrupted and scrambled!"
          ] }),
          /* @__PURE__ */ jsx("h3", { style: { fontSize: 20, fontWeight: 800, color: TEXT, marginBottom: 28, lineHeight: 1.5 }, children: q.question }),
          /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: scrambledOptions.map((item, idx) => {
            const isSelected = selected === idx;
            const isCorrect = item.originalIndex === q.correctIndex;
            const showCorrect = showResult && isCorrect;
            const showWrong = showResult && isSelected && !isCorrect;
            return /* @__PURE__ */ jsxs(
              motion.button,
              {
                whileTap: !showResult ? { scale: 0.98 } : {},
                onClick: () => handleSelect(idx),
                disabled: showResult,
                style: {
                  width: "100%",
                  padding: "16px 20px",
                  borderRadius: 14,
                  border: `2px solid ${showCorrect ? "#16A34A" : showWrong ? RED : isSelected ? PURPLE : "#e2e8f0"}`,
                  background: showCorrect ? "#F0FDF4" : showWrong ? "#FEF2F2" : isSelected ? `${PURPLE}08` : "white",
                  textAlign: "left",
                  cursor: showResult ? "default" : "pointer",
                  fontFamily: GAME_FONT,
                  fontSize: 15,
                  fontWeight: 700,
                  color: TEXT,
                  display: "flex",
                  alignItems: "center",
                  gap: 12
                },
                children: [
                  /* @__PURE__ */ jsx("span", { style: {
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: showCorrect ? "#16A34A" : showWrong ? RED : isSelected ? PURPLE : "#f1f5f9",
                    color: showCorrect || showWrong || isSelected ? "white" : MUTED,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: 14,
                    flexShrink: 0
                  }, children: String.fromCharCode(65 + idx) }),
                  item.opt,
                  showCorrect && /* @__PURE__ */ jsx(CheckCircle, { size: 20, color: "#16A34A", style: { marginLeft: "auto" } }),
                  showWrong && /* @__PURE__ */ jsx(XCircle, { size: 20, color: RED, style: { marginLeft: "auto" } })
                ]
              },
              idx
            );
          }) }),
          showResult && /* @__PURE__ */ jsxs(
            motion.div,
            {
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              style: { marginTop: 20, padding: "16px 20px", background: "#F8FAFC", borderRadius: 14, border: "1px solid #e2e8f0" },
              children: [
                /* @__PURE__ */ jsx("div", { style: { fontWeight: 800, fontSize: 14, color: scrambledOptions[selected]?.originalIndex === q.correctIndex ? "#16A34A" : RED, marginBottom: 4 }, children: scrambledOptions[selected]?.originalIndex === q.correctIndex ? "\u2713 Correct!" : "\u2717 Incorrect" }),
                /* @__PURE__ */ jsx("div", { style: { fontSize: 13, color: MUTED, fontWeight: 600, lineHeight: 1.5 }, children: q.explanation }),
                currentQ < questions.length - 1 && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: handleNext,
                    style: { marginTop: 12, padding: "10px 20px", background: PURPLE, color: "white", border: "none", borderRadius: 10, fontWeight: 800, cursor: "pointer" },
                    children: "Next Question \u2192"
                  }
                )
              ]
            }
          )
        ] }),
        myParticipant?.role === "thief" && myParticipant?.sabotage_uses > 0 && /* @__PURE__ */ jsxs("div", { style: { marginTop: 24, background: "#FEF2F2", border: "1.5px solid #FCA5A5", borderRadius: 20, padding: 20 }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, color: RED, fontWeight: 900, fontSize: 15, marginBottom: 12 }, children: [
            /* @__PURE__ */ jsx(Skull, { size: 18 }),
            "Thief Control Panel \u2014 Trigger Sabotage (",
            myParticipant.sabotage_uses,
            " remaining)"
          ] }),
          /* @__PURE__ */ jsx("p", { style: { margin: "0 0 16px", fontSize: 13, color: "#991B1B", fontWeight: 600 }, children: "Target an Agent to corrupt their next question options, confusing them and forcing mistakes." }),
          /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: participants.filter((p) => p.id !== myParticipant.id && p.is_alive && p.role === "agent").map((p) => /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => onSabotage(p.id),
              style: {
                padding: "8px 16px",
                background: RED,
                color: "white",
                border: "none",
                borderRadius: 10,
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              },
              children: [
                /* @__PURE__ */ jsx(Skull, { size: 14 }),
                "Sabotage ",
                getPlayerName(p)
              ]
            },
            p.id
          )) })
        ] })
      ]
    }
  );
}
function DiscussionPhase({ participants, myParticipant, chat, onSendChat, roundNumber }) {
  const [message, setMessage] = useState("");
  const chatEndRef = useRef(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);
  const handleSend = () => {
    if (!message.trim()) return;
    onSendChat(message);
    setMessage("");
  };
  const aliveParticipants = participants.filter((p) => p.is_alive);
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 },
      style: { flex: 1, display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, maxWidth: 1100, margin: "0 auto", width: "100%" },
      children: [
        /* @__PURE__ */ jsxs("div", { style: { background: "white", borderRadius: 24, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden" }, children: [
          /* @__PURE__ */ jsxs("div", { style: { padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }, children: [
            /* @__PURE__ */ jsx(MessageSquare, { size: 18, color: PURPLE }),
            /* @__PURE__ */ jsx("span", { style: { fontWeight: 800, fontSize: 15, color: TEXT }, children: "Team Discussion" }),
            /* @__PURE__ */ jsxs("span", { style: { marginLeft: "auto", fontSize: 12, color: MUTED, fontWeight: 600 }, children: [
              "Round ",
              roundNumber
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10, maxHeight: 500 }, children: [
            chat.length === 0 && /* @__PURE__ */ jsx("div", { style: { textAlign: "center", padding: "40px 0", color: "#94a3b8", fontWeight: 600 }, children: "Discussion started! Share your observations..." }),
            chat.map((msg, i) => {
              const isSystem = msg.is_system;
              const isMe = msg.participant_id === myParticipant?.id;
              const sender = participants.find((p) => p.id === msg.participant_id);
              if (isSystem) {
                return /* @__PURE__ */ jsx("div", { style: { textAlign: "center", padding: "6px 0" }, children: /* @__PURE__ */ jsx("span", { style: { fontSize: 12, fontWeight: 700, color: AMBER, background: "#FFFBEB", padding: "4px 12px", borderRadius: 8 }, children: msg.message }) }, i);
              }
              return /* @__PURE__ */ jsxs("div", { style: { alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "80%" }, children: [
                /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 700, color: MUTED, marginBottom: 2, marginLeft: isMe ? 0 : 8 }, children: isMe ? "You" : getPlayerName(sender) }),
                /* @__PURE__ */ jsx("div", { style: {
                  padding: "10px 14px",
                  borderRadius: 14,
                  background: isMe ? PURPLE : "#f1f5f9",
                  color: isMe ? "white" : TEXT,
                  fontSize: 14,
                  fontWeight: 600,
                  lineHeight: 1.4
                }, children: msg.message })
              ] }, i);
            }),
            /* @__PURE__ */ jsx("div", { ref: chatEndRef })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { padding: "12px 16px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 8 }, children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                value: message,
                onChange: (e) => setMessage(e.target.value),
                onKeyDown: (e) => e.key === "Enter" && handleSend(),
                placeholder: "Type a message...",
                style: { flex: 1, height: 44, border: "2px solid #e2e8f0", borderRadius: 12, padding: "0 14px", fontSize: 14, fontWeight: 600, outline: "none", fontFamily: GAME_FONT }
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleSend,
                disabled: !message.trim(),
                style: { width: 44, height: 44, borderRadius: 12, background: PURPLE, color: "white", border: "none", cursor: message.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center" },
                children: /* @__PURE__ */ jsx(Send, { size: 18 })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 16 }, children: [
          /* @__PURE__ */ jsxs("div", { style: { background: "white", borderRadius: 20, padding: 20, border: "1px solid #e2e8f0" }, children: [
            /* @__PURE__ */ jsxs("div", { style: { fontWeight: 900, fontSize: 15, color: TEXT, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }, children: [
              /* @__PURE__ */ jsx(Target, { size: 18, color: AMBER }),
              "Alive Players (",
              aliveParticipants.length,
              ")"
            ] }),
            /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: aliveParticipants.map((p) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 10 }, children: [
              /* @__PURE__ */ jsx("div", { style: { width: 32, height: 32, borderRadius: 10, background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, color: MUTED }, children: getInitial(getPlayerName(p)) }),
              /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
                /* @__PURE__ */ jsx("div", { style: { fontWeight: 800, fontSize: 13, color: TEXT }, children: p.id === myParticipant?.id ? "You" : getPlayerName(p) }),
                /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: MUTED, fontWeight: 600 }, children: [
                  p.correct_count,
                  "/",
                  p.questions_answered,
                  " correct \u2022 ",
                  p.score,
                  " pts"
                ] })
              ] })
            ] }, p.id)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { background: "white", borderRadius: 20, padding: 20, border: "1px solid #e2e8f0" }, children: [
            /* @__PURE__ */ jsxs("div", { style: { fontWeight: 900, fontSize: 15, color: TEXT, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }, children: [
              /* @__PURE__ */ jsx(AlertTriangle, { size: 18, color: RED }),
              "Suspicious Activity"
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, color: MUTED, fontWeight: 600, lineHeight: 1.6 }, children: [
              "Look for players who:",
              /* @__PURE__ */ jsx("br", {}),
              "\u2022 Missed many questions",
              /* @__PURE__ */ jsx("br", {}),
              "\u2022 Have low scores",
              /* @__PURE__ */ jsx("br", {}),
              "\u2022 Acted strangely in chat",
              /* @__PURE__ */ jsx("br", {}),
              "\u2022 Seemed to avoid answering"
            ] })
          ] })
        ] })
      ]
    }
  );
}
function VotingPhase({ participants, myParticipant, votes, onVote }) {
  const [hasVoted, setHasVoted] = useState(false);
  const aliveParticipants = participants.filter((p) => p.is_alive && p.id !== myParticipant?.id);
  const voteCounts = {};
  votes.forEach((v) => {
    voteCounts[v.target_id] = (voteCounts[v.target_id] || 0) + 1;
  });
  const handleVote = async (targetId) => {
    if (hasVoted || !myParticipant?.is_alive) return;
    await onVote(targetId);
    setHasVoted(true);
  };
  if (!myParticipant?.is_alive) {
    return /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center" },
        children: /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", padding: 40, background: "white", borderRadius: 24, border: "1px solid #e2e8f0" }, children: [
          /* @__PURE__ */ jsx(Skull, { size: 48, color: RED, style: { marginBottom: 16 } }),
          /* @__PURE__ */ jsx("h2", { style: { fontSize: 22, fontWeight: 900, color: TEXT, marginBottom: 8 }, children: "You were eliminated" }),
          /* @__PURE__ */ jsx("p", { style: { color: MUTED, fontWeight: 600 }, children: "Watch the voting unfold..." })
        ] })
      }
    );
  }
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 },
      style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 700, margin: "0 auto", width: "100%" },
      children: [
        /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", marginBottom: 32 }, children: [
          /* @__PURE__ */ jsx("h2", { style: { fontSize: 24, fontWeight: 900, color: TEXT, marginBottom: 8 }, children: "Vote to Eliminate" }),
          /* @__PURE__ */ jsx("p", { style: { color: MUTED, fontWeight: 600 }, children: "Who do you suspect is the Knowledge Thief?" })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 12, width: "100%" }, children: aliveParticipants.map((p) => {
          const votesFor = voteCounts[p.id] || 0;
          return /* @__PURE__ */ jsxs(
            motion.button,
            {
              whileHover: !hasVoted ? { y: -2 } : {},
              whileTap: !hasVoted ? { scale: 0.98 } : {},
              onClick: () => handleVote(p.id),
              disabled: hasVoted,
              style: {
                width: "100%",
                padding: "18px 24px",
                borderRadius: 16,
                border: `2px solid ${hasVoted ? "#e2e8f0" : PURPLE}`,
                background: "white",
                textAlign: "left",
                cursor: hasVoted ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 16
              },
              children: [
                /* @__PURE__ */ jsx("div", { style: { width: 44, height: 44, borderRadius: 12, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, color: MUTED }, children: getInitial(getPlayerName(p)) }),
                /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
                  /* @__PURE__ */ jsx("div", { style: { fontWeight: 900, fontSize: 16, color: TEXT }, children: getPlayerName(p) }),
                  /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, color: MUTED, fontWeight: 600 }, children: [
                    p.correct_count,
                    "/",
                    p.questions_answered,
                    " correct \u2022 ",
                    p.score,
                    " pts"
                  ] })
                ] }),
                votesFor > 0 && /* @__PURE__ */ jsxs("div", { style: { padding: "4px 12px", background: `${PURPLE}15`, color: PURPLE, borderRadius: 8, fontWeight: 900, fontSize: 13 }, children: [
                  votesFor,
                  " vote",
                  votesFor !== 1 ? "s" : ""
                ] }),
                hasVoted && votes.some((v) => v.voter_id === myParticipant?.id && v.target_id === p.id) && /* @__PURE__ */ jsx(CheckCircle, { size: 20, color: PURPLE })
              ]
            },
            p.id
          );
        }) }),
        hasVoted && /* @__PURE__ */ jsx(
          motion.div,
          {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            style: { marginTop: 24, textAlign: "center", color: MUTED, fontWeight: 700 },
            children: "Vote cast! Waiting for others..."
          }
        )
      ]
    }
  );
}
function HeistReportScreen({ room, participants, myParticipant, report, onExit, onPlayAgain }) {
  const isWinner = room?.winner === (myParticipant?.role === "agent" ? "agents" : "thieves");
  if (!report) {
    return /* @__PURE__ */ jsxs("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { textAlign: "center" }, children: [
        /* @__PURE__ */ jsx("div", { style: { width: 40, height: 40, border: `3px solid ${PURPLE}20`, borderTopColor: PURPLE, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" } }),
        /* @__PURE__ */ jsx("p", { style: { color: MUTED, fontWeight: 700 }, children: "Generating your learning report..." })
      ] }),
      /* @__PURE__ */ jsx("style", { children: `@keyframes spin { to { transform: rotate(360deg); } }` })
    ] });
  }
  return /* @__PURE__ */ jsx(
    motion.div,
    {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px", overflowY: "auto" },
      children: /* @__PURE__ */ jsxs("div", { style: { maxWidth: 640, width: "100%" }, children: [
        /* @__PURE__ */ jsxs("div", { style: {
          textAlign: "center",
          padding: "32px",
          borderRadius: 24,
          background: isWinner ? `linear-gradient(135deg, ${MINT}, #86EFAC)` : `linear-gradient(135deg, #FEE2E2, #FECACA)`,
          marginBottom: 32
        }, children: [
          /* @__PURE__ */ jsx(Trophy, { size: 48, color: isWinner ? "#166534" : "#DC2626", style: { margin: "0 auto 12px" } }),
          /* @__PURE__ */ jsx("h1", { style: { margin: 0, fontSize: 28, fontWeight: 900, color: isWinner ? "#166534" : "#DC2626" }, children: isWinner ? "Victory!" : "Defeat" }),
          /* @__PURE__ */ jsxs("p", { style: { margin: "8px 0 0", fontWeight: 700, color: isWinner ? "#166534" : "#DC2626", opacity: 0.8 }, children: [
            "The ",
            room?.winner,
            " protected humanity's knowledge!"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }, children: [
          /* @__PURE__ */ jsx(StatBox, { icon: Brain, label: "Questions", value: report.questionsAttempted, color: PURPLE }),
          /* @__PURE__ */ jsx(StatBox, { icon: CheckCircle, label: "Correct", value: report.correctAnswers, color: "#16A34A" }),
          /* @__PURE__ */ jsx(StatBox, { icon: Target, label: "Accuracy", value: `${report.accuracy}%`, color: AMBER })
        ] }),
        report.awards?.length > 0 && /* @__PURE__ */ jsxs("div", { style: { background: "white", borderRadius: 20, padding: 24, border: "1px solid #e2e8f0", marginBottom: 24 }, children: [
          /* @__PURE__ */ jsx("h3", { style: { margin: "0 0 16px", fontSize: 16, fontWeight: 900, color: TEXT }, children: "Awards" }),
          /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: report.awards.map((award, i) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: `${PURPLE}10`, borderRadius: 10, color: PURPLE, fontWeight: 800, fontSize: 13 }, children: [
            /* @__PURE__ */ jsx(Medal, { size: 16 }),
            award.label
          ] }, i)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { background: "white", borderRadius: 20, padding: 24, border: "1px solid #e2e8f0", marginBottom: 24 }, children: [
          /* @__PURE__ */ jsx("h3", { style: { margin: "0 0 16px", fontSize: 16, fontWeight: 900, color: TEXT }, children: "Learning Summary" }),
          /* @__PURE__ */ jsxs("div", { style: { marginBottom: 16 }, children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 12, fontWeight: 800, color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }, children: "Topics Practiced" }),
            /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: report.topicsPracticed.map((t, i) => /* @__PURE__ */ jsx("span", { style: { padding: "6px 12px", background: "#F3F4F6", borderRadius: 8, fontSize: 13, fontWeight: 700, color: TEXT }, children: t }, i)) })
          ] }),
          report.recommendations?.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 12, fontWeight: 800, color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }, children: "Recommended Review" }),
            /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: report.recommendations.map((r, i) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: MUTED }, children: [
              /* @__PURE__ */ jsx(ArrowLeft, { size: 14, style: { transform: "rotate(180deg)", color: PURPLE } }),
              r
            ] }, i)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { background: "white", borderRadius: 20, padding: 24, border: "1px solid #e2e8f0", marginBottom: 24 }, children: [
          /* @__PURE__ */ jsx("h3", { style: { margin: "0 0 16px", fontSize: 16, fontWeight: 900, color: TEXT }, children: "Player Results" }),
          /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: participants.sort((a, b) => b.score - a.score).map((p) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: p.id === myParticipant?.id ? `${PURPLE}08` : "#f8fafc", borderRadius: 12, border: p.id === myParticipant?.id ? `1px solid ${PURPLE}30` : "1px solid transparent" }, children: [
            /* @__PURE__ */ jsx("div", { style: { width: 36, height: 36, borderRadius: 10, background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: MUTED }, children: getInitial(getPlayerName(p)) }),
            /* @__PURE__ */ jsx("div", { style: { flex: 1 }, children: /* @__PURE__ */ jsxs("div", { style: { fontWeight: 800, fontSize: 14, color: TEXT }, children: [
              p.id === myParticipant?.id ? "You" : getPlayerName(p),
              /* @__PURE__ */ jsx("span", { style: { marginLeft: 8, fontSize: 11, padding: "2px 8px", borderRadius: 6, background: p.role === "thief" ? `${RED}15` : `${PURPLE}15`, color: p.role === "thief" ? RED : PURPLE, fontWeight: 800 }, children: p.role === "thief" ? "Thief" : "Agent" })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { style: { fontWeight: 900, fontSize: 14, color: PURPLE }, children: [
              p.score,
              " pts"
            ] })
          ] }, p.id)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 12 }, children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: onPlayAgain,
              style: { flex: 1, padding: "16px", background: MINT, color: "#166534", border: "none", borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: "pointer" },
              children: "Play Again"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: onExit,
              style: { flex: 1, padding: "16px", background: "white", color: TEXT, border: "2px solid #e2e8f0", borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: "pointer" },
              children: "Back to Arcade"
            }
          )
        ] })
      ] })
    }
  );
}
function StatBox({ icon: Icon, label, value, color }) {
  return /* @__PURE__ */ jsxs("div", { style: { background: "white", borderRadius: 16, padding: 20, textAlign: "center", border: "1px solid #e2e8f0" }, children: [
    /* @__PURE__ */ jsx(Icon, { size: 24, color, style: { marginBottom: 8 } }),
    /* @__PURE__ */ jsx("div", { style: { fontSize: 22, fontWeight: 900, color: TEXT }, children: value }),
    /* @__PURE__ */ jsx("div", { style: { fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em" }, children: label })
  ] });
}
