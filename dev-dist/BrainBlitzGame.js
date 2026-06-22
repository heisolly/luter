import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiTimeLine, RiTrophyLine, RiCheckFill, RiCloseFill, RiFireFill } from "react-icons/ri";
import { Lightning } from "@phosphor-icons/react";
import { GameStartScreen, GameOverScreen, shuffleWithSeed, createSeededRandom, MultiplayerHUD } from "./GameShared";
import { playgroundService } from "../../../services/playgroundService";
import confetti from "canvas-confetti";
export default function BrainBlitzGame({ room, participants, user, deck, onExit }) {
  const [gameState, setGameState] = useState("start");
  const [currentPair, setCurrentPair] = useState(null);
  const [isCorrect, setIsCorrect] = useState(true);
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [round, setRound] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [streak, setStreak] = useState(0);
  const [unplayedDeck, setUnplayedDeck] = useState([]);
  const [totalTerms, setTotalTerms] = useState(0);
  const [completedTerms, setCompletedTerms] = useState(0);
  const [buttonsSwapped, setButtonsSwapped] = useState(false);
  useEffect(() => {
    if (gameState === "start" && deck.length > 0) {
      setTotalTerms(deck.length);
      setUnplayedDeck(shuffleWithSeed(deck, room.id));
    }
  }, [gameState, deck, room.id]);
  useEffect(() => {
    if (gameState === "start" && room.created_by) {
      const timer = setTimeout(() => {
        const shuffled = shuffleWithSeed(deck, room.id);
        setUnplayedDeck(shuffled);
        setGameState("playing");
        nextRound(shuffled);
      }, 3e3);
      return () => clearTimeout(timer);
    }
  }, [gameState, room.created_by, deck, room.id]);
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
  const nextRound = (currentUnplayed) => {
    const list = currentUnplayed || unplayedDeck;
    if (!list || list.length === 0) {
      setGameState("finished");
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
      if (room.id && room.status !== "finished") {
        playgroundService.supabase.from("playground_rooms").update({ status: "finished" }).eq("id", room.id).then(() => {
        });
      }
      return;
    }
    const item = list[0];
    setUnplayedDeck(list.slice(1));
    setCompletedTerms((c) => c + 1);
    const roundSeed = room.id + "_round_" + (deck.length - list.length);
    const rng = createSeededRandom(roundSeed);
    const showCorrect = rng() > 0.5;
    setIsCorrect(showCorrect);
    setButtonsSwapped(rng() > 0.5);
    if (showCorrect) {
      setCurrentPair({ term: item.term, definition: item.definition });
    } else {
      const others = deck.filter((i) => i.term !== item.term);
      const wrongItem = others.length > 0 ? shuffleWithSeed(others, roundSeed + "_wrong")[0] : item;
      setCurrentPair({ term: item.term, definition: wrongItem.definition });
    }
    setRound((r) => r + 1);
  };
  useEffect(() => {
    if (room.status === "finished" && gameState === "playing") {
      setGameState("finished");
    }
  }, [room.status, gameState]);
  const handleAnswer = (answer) => {
    if (gameState !== "playing" || feedback) return;
    if (answer === isCorrect) {
      setFeedback("correct");
      setStreak((s) => s + 1);
      const bonus = streak >= 2 ? 10 : 0;
      const newScore = score + 20 + bonus;
      setScore(newScore);
      setCorrectAnswers((c) => c + 1);
      const pId = participants.find((p) => user.id ? p.user_id === user.id : p.guest_name === user.guest_name)?.id;
      if (pId) playgroundService.updateParticipantScore(pId, newScore);
    } else {
      setFeedback("wrong");
      setStreak(0);
      setButtonsSwapped(!buttonsSwapped);
    }
    setTimeout(() => {
      setFeedback(null);
      nextRound();
    }, 500);
  };
  if (gameState === "start") {
    return /* @__PURE__ */ jsx(
      GameStartScreen,
      {
        title: "Brain Blitz",
        icon: Lightning,
        description: "A lightning-fast true or false memory challenge.",
        instructions: [
          "A term and a definition will appear on screen.",
          "Quickly decide if they actually match.",
          "Click TRUE if they match, FALSE if they don't.",
          "Build a streak for bonus points \u{1F525}",
          "Clear all cards as fast as you can!"
        ],
        onStart: () => {
          const shuffled = shuffleWithSeed(deck, room.id);
          setUnplayedDeck(shuffled);
          setGameState("playing");
          nextRound(shuffled);
        },
        color: "#f59e0b",
        isMultiplayer: !!room.created_by
      }
    );
  }
  if (gameState === "finished") {
    return /* @__PURE__ */ jsx(
      GameOverScreen,
      {
        score,
        total: totalTerms,
        xp: score * 3,
        accuracy: Math.round(correctAnswers / Math.max(1, totalTerms) * 100),
        onRetry: async () => {
          if (room.created_by && room.created_by === user.id) {
            try {
              await playgroundService.supabase.from("playground_rooms").update({ status: "waiting", updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", room.id);
            } catch (e) {
              console.error("Failed to reset room:", e);
            }
          }
          setGameState("start");
          setScore(0);
          setTimeElapsed(0);
          setRound(0);
          setCorrectAnswers(0);
          setStreak(0);
          setCompletedTerms(0);
        },
        onExit: (nextGame) => onExit(nextGame),
        isGuest: !user.id,
        color: "#f59e0b",
        room
      }
    );
  }
  const progress = completedTerms / (totalTerms || 1);
  return /* @__PURE__ */ jsxs("div", { style: {
    width: "100%",
    maxWidth: 800,
    margin: "0 auto",
    padding: "12px",
    fontFamily: "'Outfit', sans-serif",
    boxSizing: "border-box"
  }, children: [
    room.created_by && /* @__PURE__ */ jsx(
      MultiplayerHUD,
      {
        participants,
        user,
        color: "#f59e0b"
      }
    ),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
        /* @__PURE__ */ jsx("div", { style: { background: "white", padding: 8, borderRadius: 12, color: "#f59e0b", border: "2px solid #fde68a" }, children: /* @__PURE__ */ jsx(RiTimeLine, { size: 24 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }, children: "Timer" }),
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 20, fontWeight: 900, color: "#0f172a", fontVariantNumeric: "tabular-nums" }, children: [
            timeElapsed.toFixed(1),
            "s"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(AnimatePresence, { children: streak >= 2 && /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { scale: 0.5, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.5, opacity: 0 },
          style: {
            background: "linear-gradient(135deg, #f59e0b, #ef4444)",
            color: "white",
            padding: "8px 16px",
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 900,
            fontSize: 14,
            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)"
          },
          children: [
            /* @__PURE__ */ jsx(RiFireFill, { size: 16 }),
            streak,
            "x Streak!"
          ]
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
        /* @__PURE__ */ jsxs("div", { style: { textAlign: "right" }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }, children: "Score" }),
          /* @__PURE__ */ jsx(
            motion.div,
            {
              initial: { scale: 1.3 },
              animate: { scale: 1 },
              style: { fontSize: 20, fontWeight: 900, color: "#f59e0b" },
              children: score
            },
            score
          )
        ] }),
        /* @__PURE__ */ jsx("div", { style: { background: "white", padding: 8, borderRadius: 12, color: "#f59e0b", border: "2px solid #fde68a" }, children: /* @__PURE__ */ jsx(RiTrophyLine, { size: 20 }) }),
        /* @__PURE__ */ jsx("button", { onClick: onExit, style: { background: "white", border: "2px solid #e2e8f0", padding: 8, borderRadius: 12, cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center" }, title: "Close", children: /* @__PURE__ */ jsx(RiCloseFill, { size: 20 }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { marginBottom: 12, background: "#f1f5f9", borderRadius: 99, height: 8, overflow: "hidden" }, children: /* @__PURE__ */ jsx(
      motion.div,
      {
        animate: { width: `${progress * 100}%` },
        transition: { type: "spring", stiffness: 80 },
        style: { height: "100%", background: "linear-gradient(90deg, #f59e0b, #fbbf24)", borderRadius: 99 }
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { style: { textAlign: "right", fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 16 }, children: [
      completedTerms,
      " / ",
      totalTerms,
      " cards"
    ] }),
    /* @__PURE__ */ jsx("div", { style: { position: "relative" }, children: /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", children: /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, scale: 0.92, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: -20 },
        transition: { type: "spring", stiffness: 300, damping: 25 },
        style: {
          background: "white",
          padding: "clamp(24px, 5vw, 48px) clamp(20px, 4vw, 40px)",
          borderRadius: 32,
          textAlign: "center",
          border: `4px solid ${feedback === "correct" ? "#10b981" : feedback === "wrong" ? "#ef4444" : "#e2e8f0"}`,
          transition: "border-color 0.25s",
          boxShadow: "0 12px 48px rgba(0,0,0,0.08)"
        },
        children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: 20, letterSpacing: "2px" }, children: "Does this match?" }),
          /* @__PURE__ */ jsx("h2", { style: { fontSize: "clamp(28px, 6vw, 40px)", fontWeight: 900, color: "#0f172a", marginBottom: 24, lineHeight: 1.2 }, children: currentPair?.term }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 16, margin: "0 auto 28px" }, children: [
            /* @__PURE__ */ jsx("div", { style: { height: 2, background: "#e2e8f0", width: 40, borderRadius: 1 } }),
            /* @__PURE__ */ jsx("div", { style: { background: "#f8fafc", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800, color: "#64748b", border: "1px solid #e2e8f0" }, children: "MEANS" }),
            /* @__PURE__ */ jsx("div", { style: { height: 2, background: "#e2e8f0", width: 40, borderRadius: 1 } })
          ] }),
          /* @__PURE__ */ jsx("p", { style: { fontSize: "clamp(16px, 4vw, 20px)", color: "#334155", fontWeight: 600, lineHeight: 1.6, maxWidth: 580, margin: "0 auto 40px" }, children: currentPair?.definition }),
          /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(10px, 2vw, 20px)", padding: "0 8px" }, children: buttonsSwapped ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs(
              motion.button,
              {
                whileHover: { scale: 1.02, y: -6, boxShadow: "4px 6px 0px #ef4444" },
                whileTap: { scale: 0.98, y: 0, boxShadow: "0px 0px 0px transparent" },
                onClick: () => handleAnswer(false),
                style: {
                  padding: "clamp(14px, 3vw, 22px)",
                  background: "white",
                  color: "#ef4444",
                  border: "3px solid #ef4444",
                  borderRadius: 24,
                  fontSize: "clamp(16px, 4vw, 20px)",
                  fontWeight: 900,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  transition: "background-color 0.2s ease"
                },
                onMouseEnter: (e) => {
                  e.currentTarget.style.background = "#fef2f2";
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.background = "white";
                },
                children: [
                  /* @__PURE__ */ jsx(RiCloseFill, { size: 26 }),
                  " FALSE"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              motion.button,
              {
                whileHover: { scale: 1.02, y: -6, boxShadow: "4px 6px 0px #10b981" },
                whileTap: { scale: 0.98, y: 0, boxShadow: "0px 0px 0px transparent" },
                onClick: () => handleAnswer(true),
                style: {
                  padding: "clamp(14px, 3vw, 22px)",
                  background: "white",
                  color: "#10b981",
                  border: "3px solid #10b981",
                  borderRadius: 24,
                  fontSize: "clamp(16px, 4vw, 20px)",
                  fontWeight: 900,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  transition: "background-color 0.2s ease"
                },
                onMouseEnter: (e) => {
                  e.currentTarget.style.background = "#f0fdf4";
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.background = "white";
                },
                children: [
                  /* @__PURE__ */ jsx(RiCheckFill, { size: 26 }),
                  " TRUE"
                ]
              }
            )
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs(
              motion.button,
              {
                whileHover: { scale: 1.02, y: -6, boxShadow: "4px 6px 0px #10b981" },
                whileTap: { scale: 0.98, y: 0, boxShadow: "0px 0px 0px transparent" },
                onClick: () => handleAnswer(true),
                style: {
                  padding: "clamp(14px, 3vw, 22px)",
                  background: "white",
                  color: "#10b981",
                  border: "3px solid #10b981",
                  borderRadius: 24,
                  fontSize: "clamp(16px, 4vw, 20px)",
                  fontWeight: 900,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  transition: "background-color 0.2s ease"
                },
                onMouseEnter: (e) => {
                  e.currentTarget.style.background = "#f0fdf4";
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.background = "white";
                },
                children: [
                  /* @__PURE__ */ jsx(RiCheckFill, { size: 26 }),
                  " TRUE"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              motion.button,
              {
                whileHover: { scale: 1.02, y: -6, boxShadow: "4px 6px 0px #ef4444" },
                whileTap: { scale: 0.98, y: 0, boxShadow: "0px 0px 0px transparent" },
                onClick: () => handleAnswer(false),
                style: {
                  padding: "clamp(14px, 3vw, 22px)",
                  background: "white",
                  color: "#ef4444",
                  border: "3px solid #ef4444",
                  borderRadius: 24,
                  fontSize: "clamp(16px, 4vw, 20px)",
                  fontWeight: 900,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  transition: "background-color 0.2s ease"
                },
                onMouseEnter: (e) => {
                  e.currentTarget.style.background = "#fef2f2";
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.background = "white";
                },
                children: [
                  /* @__PURE__ */ jsx(RiCloseFill, { size: 26 }),
                  " FALSE"
                ]
              }
            )
          ] }) })
        ]
      },
      currentPair?.term + round
    ) }) })
  ] });
}
