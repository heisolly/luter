import { jsx, jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { RiUserSmileFill, RiGamepadFill, RiArrowRightLine, RiLoader4Line, RiErrorWarningFill, RiCheckFill } from "react-icons/ri";
import { playgroundService } from "../../../services/playgroundService";
import MatchingGame from "./MatchingGame";
import StackerGame from "./StackerGame";
import TermBuilderGame from "./TermBuilderGame";
import BrainBlitzGame from "./BrainBlitzGame";
import GameLobby from "./GameLobby";
export default function GuestPlayPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3e3);
  };
  useEffect(() => {
    let channel;
    const initRoom = async () => {
      setLoading(true);
      const { data, error } = await playgroundService.supabase.from("playground_rooms").select("*").eq("id", roomId).single();
      if (data) {
        setRoom(data);
        channel = playgroundService.subscribeToRoom(roomId, (type, payload) => {
          if (type === "room") {
            console.log("Room updated:", payload);
            setRoom((prev) => ({ ...prev, ...payload }));
          } else {
            fetchParticipants();
          }
        });
        fetchParticipants();
      }
      setLoading(false);
    };
    initRoom();
    return () => {
      if (channel) {
        console.log("Cleaning up room subscription");
        playgroundService.supabase.removeChannel(channel);
      }
    };
  }, [roomId]);
  const fetchParticipants = async () => {
    try {
      const data = await playgroundService.getParticipants(roomId);
      setParticipants(data);
    } catch (e) {
      console.error("Failed to fetch participants", e);
    }
  };
  const refreshRoom = async () => {
    const { data } = await playgroundService.supabase.from("playground_rooms").select("*").eq("id", roomId).single();
    if (data) setRoom(data);
  };
  const handleJoin = async () => {
    if (!nickname.trim()) {
      showToast("Please enter a nickname first", "error");
      return;
    }
    setJoining(true);
    try {
      await playgroundService.supabase.from("playground_participants").insert({
        room_id: roomId,
        guest_name: nickname.trim(),
        is_ready: false
      });
      setHasJoined(true);
      await fetchParticipants();
      showToast("You joined the lobby!", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to join room. The room may be full or already started.", "error");
    } finally {
      setJoining(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { style: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }, children: /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        style: { textAlign: "center" },
        children: [
          /* @__PURE__ */ jsx("div", { style: { width: 64, height: 64, background: "#f5f3ff", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed", margin: "0 auto 16px" }, children: /* @__PURE__ */ jsx(RiLoader4Line, { size: 32, style: { animation: "spin 1s linear infinite" } }) }),
          /* @__PURE__ */ jsx("p", { style: { fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: "#64748b", fontSize: 16 }, children: "Loading game room..." }),
          /* @__PURE__ */ jsx("style", { children: `@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }` })
        ]
      }
    ) });
  }
  if (!room) {
    return /* @__PURE__ */ jsx("div", { style: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: 20 }, children: /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        style: { maxWidth: 400, width: "100%", background: "white", padding: 40, borderRadius: 32, textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.05)", fontFamily: "'Outfit', sans-serif" },
        children: [
          /* @__PURE__ */ jsx("div", { style: { width: 64, height: 64, background: "#fef2f2", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", margin: "0 auto 24px" }, children: /* @__PURE__ */ jsx(RiErrorWarningFill, { size: 32 }) }),
          /* @__PURE__ */ jsx("h2", { style: { fontSize: 22, fontWeight: 900, color: "#1e293b", marginBottom: 8 }, children: "Room Not Found" }),
          /* @__PURE__ */ jsx("p", { style: { color: "#64748b", fontSize: 15, marginBottom: 24, lineHeight: 1.6 }, children: "This game room doesn't exist or has already ended. Ask your friend to send you a new invite link." }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => navigate("/"),
              style: { background: "#98FF98", color: "#166534", border: "none", padding: "14px 28px", borderRadius: 16, fontSize: 15, fontWeight: 800, cursor: "pointer" },
              children: "Go to Luter"
            }
          )
        ]
      }
    ) });
  }
  if (!hasJoined) {
    return /* @__PURE__ */ jsxs("div", { style: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: 20, fontFamily: "'Outfit', sans-serif" }, children: [
      /* @__PURE__ */ jsx(AnimatePresence, { children: toast && /* @__PURE__ */ jsx(
        motion.div,
        {
          initial: { opacity: 0, y: -20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
          style: {
            position: "fixed",
            top: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: toast.type === "error" ? "#ef4444" : "#16a34a",
            color: "white",
            padding: "12px 24px",
            borderRadius: 20,
            fontWeight: 800,
            fontSize: 14,
            zIndex: 9999,
            whiteSpace: "nowrap",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)"
          },
          children: toast.message
        }
      ) }),
      /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { scale: 0.9, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          style: { maxWidth: 420, width: "100%", background: "white", padding: 40, borderRadius: 32, boxShadow: "0 20px 50px rgba(0,0,0,0.06)", textAlign: "center" },
          children: [
            /* @__PURE__ */ jsx("div", { style: { width: 72, height: 72, background: "linear-gradient(135deg, #f5f3ff, #ede9fe)", borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed", margin: "0 auto 24px", boxShadow: "0 8px 20px rgba(124,58,237,0.15)" }, children: /* @__PURE__ */ jsx(RiGamepadFill, { size: 36 }) }),
            /* @__PURE__ */ jsx("h1", { style: { fontSize: 28, fontWeight: 900, marginBottom: 8, color: "#111" }, children: "Join the Game!" }),
            /* @__PURE__ */ jsx("p", { style: { color: "#64748b", marginBottom: 8, lineHeight: 1.6, fontSize: 15 }, children: "Your friend invited you to a Luter study battle." }),
            room.metadata?.course_name && /* @__PURE__ */ jsxs("div", { style: { display: "inline-block", background: "#f5f3ff", color: "#7c3aed", padding: "4px 14px", borderRadius: 99, fontSize: 13, fontWeight: 700, marginBottom: 28, border: "1px solid #ede9fe" }, children: [
              "\u{1F4DA} ",
              room.metadata.course_name
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Enter your nickname...",
                value: nickname,
                onChange: (e) => setNickname(e.target.value),
                onKeyDown: (e) => e.key === "Enter" && handleJoin(),
                maxLength: 20,
                style: {
                  width: "100%",
                  padding: "16px 20px",
                  borderRadius: 16,
                  border: "2px solid #e2e8f0",
                  marginBottom: 16,
                  fontSize: 16,
                  fontWeight: 600,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "'Outfit', sans-serif",
                  transition: "border-color 0.2s"
                },
                onFocus: (e) => e.target.style.borderColor = "#7c3aed",
                onBlur: (e) => e.target.style.borderColor = "#e2e8f0"
              }
            ),
            /* @__PURE__ */ jsxs(
              motion.button,
              {
                whileHover: { scale: 1.02 },
                whileTap: { scale: 0.98 },
                onClick: handleJoin,
                disabled: joining || !nickname.trim(),
                style: {
                  width: "100%",
                  padding: "16px",
                  background: joining ? "#86EFAC" : "#98FF98",
                  color: "#166534",
                  border: "none",
                  borderRadius: 16,
                  fontSize: 16,
                  fontWeight: 800,
                  cursor: joining ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 8px 20px rgba(152,255,152,0.25)"
                },
                children: [
                  joining ? /* @__PURE__ */ jsx(RiLoader4Line, { size: 20, style: { animation: "spin 1s linear infinite" } }) : /* @__PURE__ */ jsx(RiArrowRightLine, { size: 20 }),
                  joining ? "Joining..." : "Join Lobby"
                ]
              }
            )
          ]
        }
      )
    ] });
  }
  const user = { id: null, guest_name: nickname.trim() };
  const commonProps = { room, participants, user, deck: room.metadata?.deck || [] };
  return /* @__PURE__ */ jsxs("div", { style: { minHeight: "100vh", background: "#f8fafc", padding: 20, fontFamily: "'Outfit', sans-serif" }, children: [
    /* @__PURE__ */ jsx(AnimatePresence, { children: toast && /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        style: {
          position: "fixed",
          top: 24,
          left: "50%",
          transform: "translateX(-50%)",
          background: toast.type === "error" ? "#ef4444" : "#16a34a",
          color: "white",
          padding: "12px 24px",
          borderRadius: 20,
          fontWeight: 800,
          fontSize: 14,
          zIndex: 9999,
          whiteSpace: "nowrap",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)"
        },
        children: toast.message
      }
    ) }),
    room.status === "waiting" ? /* @__PURE__ */ jsx(
      GameLobby,
      {
        room,
        participants,
        user,
        onStart: fetchParticipants,
        onRefresh: fetchParticipants,
        showToast
      }
    ) : renderGame(room.game_type, commonProps)
  ] });
}
function renderGame(type, props) {
  switch (type) {
    case "matching":
      return /* @__PURE__ */ jsx(MatchingGame, { ...props });
    case "stacker":
      return /* @__PURE__ */ jsx(StackerGame, { ...props });
    case "term-builder":
      return /* @__PURE__ */ jsx(TermBuilderGame, { ...props });
    case "brain-blitz":
      return /* @__PURE__ */ jsx(BrainBlitzGame, { ...props });
    default:
      return /* @__PURE__ */ jsx("div", { style: { textAlign: "center", padding: 40, fontFamily: "'Outfit', sans-serif", color: "#64748b" }, children: "Game type not recognized." });
  }
}
