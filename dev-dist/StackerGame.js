import { jsx, jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiTimeLine, RiTrophyLine, RiCheckFill, RiCloseFill } from "react-icons/ri";
import { Stack } from "@phosphor-icons/react";
import { GameStartScreen, GameOverScreen, createSeededRandom, shuffleWithSeed, MultiplayerHUD } from "./GameShared";
import { playgroundService } from "../../../services/playgroundService";
import confetti from "canvas-confetti";
export default function StackerGame({ room, participants, user, deck, onExit }) {
  const [gameState, setGameState] = useState("start");
  const [targetTerm, setTargetTerm] = useState(null);
  const [options, setOptions] = useState([]);
  const [stack, setStack] = useState([]);
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [streak, setStreak] = useState(0);
  const [unplayedDeck, setUnplayedDeck] = useState([]);
  useEffect(() => {
    if (gameState === "start" && deck.length > 0) {
      setUnplayedDeck(shuffleWithSeed(deck, room.id));
    }
  }, [gameState, deck, room.id]);
  useEffect(() => {
    let interval;
    if (gameState === "playing") {
      const isMultiplayer = !!room.created_by;
      const startOffset = isMultiplayer ? 3e3 : 0;
      const startTime = isMultiplayer && room.updated_at ? new Date(room.updated_at).getTime() + startOffset : Date.now();
      interval = setInterval(() => {
        const now = Date.now();
        const diff = (now - startTime) / 1e3;
        setTimeElapsed(Math.max(0, diff));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [gameState, room.updated_at, room.created_by]);
  useEffect(() => {
    if (gameState === "start" && room.created_by) {
      const timer = setTimeout(() => {
        const shuffled = shuffleWithSeed(deck, room.id);
        setUnplayedDeck(shuffled);
        setGameState("playing");
        setTimeout(() => nextRound(shuffled), 0);
      }, 3e3);
      return () => clearTimeout(timer);
    }
  }, [gameState, room.created_by, deck, room.id]);
  const nextRound = (currentUnplayed) => {
    const list = currentUnplayed || unplayedDeck;
    if (!list || list.length === 0) {
      setGameState("finished");
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      if (room.id && room.status !== "finished") {
        playgroundService.supabase.from("playground_rooms").update({ status: "finished" }).eq("id", room.id).then(() => {
        });
      }
      return;
    }
    const randomTerm = list[0];
    setUnplayedDeck(list.slice(1));
    setTargetTerm(randomTerm);
    const roundSeed = room.id + "_round_" + (deck.length - list.length);
    const otherDefs = shuffleWithSeed(
      deck.filter((item) => item.term !== randomTerm.term),
      roundSeed + "_others"
    ).map((item) => item.definition).slice(0, 3);
    const allOptions = shuffleWithSeed([randomTerm.definition, ...otherDefs], roundSeed + "_all");
    setOptions(allOptions);
  };
  useEffect(() => {
    if (room.status === "finished" && gameState === "playing") {
      setGameState("finished");
    }
  }, [room.status, gameState]);
  const handleOptionClick = (option) => {
    if (gameState !== "playing" || feedback) return;
    if (option === targetTerm.definition) {
      setFeedback("correct");
      const bonus = streak > 2 ? 10 : 0;
      const newScore = score + 15 + bonus;
      setScore(newScore);
      setStreak((s) => s + 1);
      setStack((prev) => [{ id: Date.now(), text: targetTerm.term }, ...prev].slice(0, 8));
      const pId = participants.find((p) => user.id ? p.user_id === user.id : p.guest_name === user.guest_name)?.id;
      if (pId) playgroundService.updateParticipantScore(pId, newScore);
      setTimeout(() => {
        setFeedback(null);
        nextRound();
      }, 800);
    } else {
      setFeedback("wrong");
      setStreak(0);
      setTimeout(() => {
        setFeedback(null);
        setOptions((prev) => [...prev].sort(() => Math.random() - 0.5));
      }, 800);
    }
  };
  if (gameState === "start") {
    return /* @__PURE__ */ jsx(
      GameStartScreen,
      {
        title: "Stacker Arena",
        icon: Stack,
        description: "Build your knowledge tower by correctly identifying definitions.",
        instructions: [
          "Read the term shown in the main card.",
          "Select the correct definition from the 4 options.",
          "Each correct answer adds a block to your stack.",
          "Keep a streak going to earn bonus points!",
          "Clear all items as fast as you can!"
        ],
        onStart: () => {
          const shuffled = shuffleWithSeed(deck, room.id);
          setUnplayedDeck(shuffled);
          setGameState("playing");
          setTimeout(() => nextRound(shuffled), 0);
        },
        color: "#0ea5e9",
        isMultiplayer: !!room.created_by
      }
    );
  }
  if (gameState === "finished") {
    return /* @__PURE__ */ jsx(
      GameOverScreen,
      {
        score,
        total: stack.length,
        xp: score * 3,
        accuracy: 100,
        onRetry: async () => {
          if (room.created_by && room.created_by === user.id) {
            try {
              await playgroundService.supabase.from("playground_rooms").update({ status: "waiting", updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", room.id);
            } catch (e) {
              console.error("Failed to reset room:", e);
            }
          }
          setGameState("start");
          setStack([]);
          setTimeElapsed(0);
          setScore(0);
          setStreak(0);
        },
        onExit: (nextGame) => onExit(nextGame),
        isGuest: !user.id,
        color: "#7c3aed",
        room
      }
    );
  }
  return /* @__PURE__ */ jsxs("div", { style: { width: "100%", maxWidth: 800, margin: "0 auto", padding: "12px" }, children: [
    room.created_by && /* @__PURE__ */ jsx(
      MultiplayerHUD,
      {
        participants,
        user,
        color: "#7c3aed"
      }
    ),
    /* @__PURE__ */ jsxs("div", { style: {
      alignItems: "center",
      marginBottom: 32,
      background: "white",
      padding: "16px 24px",
      borderRadius: "24px",
      border: "3px solid #e2e8f0"
    }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
        /* @__PURE__ */ jsx("div", { style: { background: "white", padding: 10, borderRadius: 14, color: "#0ea5e9", border: "2px solid #bae6fd" }, children: /* @__PURE__ */ jsx(RiTimeLine, { size: 24 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 12, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }, children: "Time" }),
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 22, fontWeight: 900, color: "#0f172a", fontVariantNumeric: "tabular-nums", fontFamily: "'Outfit', sans-serif" }, children: [
            timeElapsed.toFixed(1),
            "s"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
        /* @__PURE__ */ jsxs("div", { style: { textAlign: "right" }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 12, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }, children: "Score" }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 22, fontWeight: 900, color: "#0ea5e9" }, children: score })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { background: "white", padding: 10, borderRadius: 14, color: "#fbbf24", border: "2px solid #fde68a" }, children: /* @__PURE__ */ jsx(RiTrophyLine, { size: 24 }) }),
        /* @__PURE__ */ jsx("button", { onClick: onExit, style: { background: "white", border: "2px solid #e2e8f0", padding: 10, borderRadius: 14, cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center" }, title: "Close", children: /* @__PURE__ */ jsx(RiCloseFill, { size: 24 }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 32 }, children: [
      /* @__PURE__ */ jsxs("div", { style: {
        background: "white",
        borderRadius: 32,
        padding: 32,
        height: 500,
        display: "flex",
        flexDirection: "column-reverse",
        gap: 12,
        border: "3px dashed #cbd5e1",
        overflow: "hidden"
      }, children: [
        /* @__PURE__ */ jsx(AnimatePresence, { children: stack.map((item, i) => /* @__PURE__ */ jsx(
          motion.div,
          {
            initial: { y: -200, opacity: 0, scale: 0.8 },
            animate: { y: 0, opacity: 1, scale: 1 },
            style: {
              padding: "16px",
              background: "white",
              borderRadius: 16,
              color: "#0ea5e9",
              fontSize: 16,
              fontWeight: 900,
              textAlign: "center",
              border: "3px solid #0ea5e9",
              boxShadow: "4px 4px 0px #bae6fd"
            },
            children: item.text
          },
          item.id
        )) }),
        stack.length === 0 && /* @__PURE__ */ jsx("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 16, fontWeight: 800 }, children: "Correct answers stack here" })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 24 }, children: [
        /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { x: 20, opacity: 0 },
            animate: { x: 0, opacity: 1 },
            style: {
              background: "white",
              padding: 40,
              borderRadius: 32,
              textAlign: "center",
              border: `4px solid ${feedback === "correct" ? "#10b981" : feedback === "wrong" ? "#ef4444" : "#e2e8f0"}`,
              transition: "border-color 0.2s"
            },
            children: [
              /* @__PURE__ */ jsx("div", { style: { fontSize: 14, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: 12, letterSpacing: "1px" }, children: "Term" }),
              /* @__PURE__ */ jsx("h2", { style: { fontSize: 36, fontWeight: 900, color: "#0f172a" }, children: targetTerm?.term }),
              /* @__PURE__ */ jsx(AnimatePresence, { children: feedback && /* @__PURE__ */ jsxs(
                motion.div,
                {
                  initial: { scale: 0.5, opacity: 0 },
                  animate: { scale: 1, opacity: 1 },
                  exit: { scale: 0.5, opacity: 0 },
                  style: {
                    marginTop: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    color: feedback === "correct" ? "#10b981" : "#ef4444",
                    fontWeight: 900,
                    fontSize: 20
                  },
                  children: [
                    feedback === "correct" ? /* @__PURE__ */ jsx(RiCheckFill, { size: 28 }) : /* @__PURE__ */ jsx(RiCloseFill, { size: 28 }),
                    feedback === "correct" ? "EXCELLENT!" : "TRY AGAIN"
                  ]
                }
              ) })
            ]
          },
          targetTerm?.term
        ),
        /* @__PURE__ */ jsx("div", { style: { display: "grid", gap: 16 }, children: options.map((opt, i) => /* @__PURE__ */ jsx(
          motion.button,
          {
            whileHover: { x: 8, boxShadow: "4px 6px 0px #e2e8f0" },
            whileTap: { scale: 0.98, x: 0, boxShadow: "0px 0px 0px transparent" },
            onClick: () => handleOptionClick(opt),
            style: {
              padding: "24px",
              background: "white",
              border: "3px solid #e2e8f0",
              borderRadius: 20,
              textAlign: "left",
              fontSize: 18,
              fontWeight: 700,
              color: "#334155",
              cursor: "pointer",
              lineHeight: "1.4",
              transition: "background-color 0.2s"
            },
            onMouseEnter: (e) => {
              e.currentTarget.style.background = "#f8fafc";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.background = "white";
            },
            children: opt
          },
          i
        )) })
      ] })
    ] })
  ] });
}
