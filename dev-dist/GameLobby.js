import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiUserFill,
  RiCheckFill,
  RiCloseFill,
  RiPlayFill,
  RiLink,
  RiUserSmileFill,
  RiGroupFill,
  RiShieldCheckFill,
  RiInformationLine
} from "react-icons/ri";
import { playgroundService } from "../../../services/playgroundService";
export default function GameLobby({ room, participants, user, onStart, onRefresh, showToast }) {
  const [toggling, setToggling] = React.useState(false);
  const isHost = room.created_by != null && room.created_by === user.id;
  const currentUserParticipant = participants.find((p) => {
    if (user.id && p.user_id) return p.user_id === user.id;
    if (user.guest_name && p.guest_name) {
      return p.guest_name.trim().toLowerCase() === user.guest_name.trim().toLowerCase();
    }
    return false;
  });
  const isReady = currentUserParticipant?.is_ready === true;
  const handleToggleReady = async () => {
    const participantId = currentUserParticipant?.id;
    if (!participantId) {
      showToast?.("Identifying your session... please wait or refresh.", "error");
      onRefresh?.();
      return;
    }
    setToggling(true);
    try {
      await playgroundService.setParticipantReady(participantId, !isReady);
      await onRefresh?.();
    } catch (e) {
      showToast?.("Failed to update ready status. Please try again.", "error");
    } finally {
      setToggling(false);
    }
  };
  const handleStartGame = async () => {
    const others = participants.filter((p) => p.user_id !== room.created_by);
    const everyoneReady = others.length === 0 || others.every((p) => p.is_ready);
    if (everyoneReady) {
      await playgroundService.startGame(room.id);
      onStart();
    } else {
      showToast?.("Wait for all players to mark themselves as ready!", "error");
    }
  };
  const copyInviteLink = () => {
    const link = `${window.location.origin}/play/${room.id}`;
    const text = `Join my Luter Arena study session! \u{1F3AE} ${link}`;
    if (navigator.share) {
      navigator.share({
        title: "Luter Arena Invite",
        text,
        url: link
      }).catch(() => {
        navigator.clipboard.writeText(link);
        showToast?.("Invite link copied! Send it to your friends \u{1F3AE}", "success");
      });
    } else {
      navigator.clipboard.writeText(link);
      showToast?.("Invite link copied! Send it to your friends \u{1F3AE}", "success");
    }
  };
  return /* @__PURE__ */ jsxs("div", { style: {
    maxWidth: 800,
    width: "100%",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 32,
    fontFamily: "'Outfit', sans-serif"
  }, children: [
    /* @__PURE__ */ jsxs("div", { style: { textAlign: "center" }, children: [
      /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { y: -20, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          style: {
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 16px",
            background: "#f5f3ff",
            borderRadius: 100,
            color: "#7c3aed",
            fontSize: 13,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 20
          },
          children: [
            /* @__PURE__ */ jsx(RiGroupFill, {}),
            " Waiting Room"
          ]
        }
      ),
      /* @__PURE__ */ jsx("h1", { style: { fontSize: 40, fontWeight: 900, color: "#111", marginBottom: 12 }, children: "Prepare for Battle" }),
      /* @__PURE__ */ jsx("p", { style: { color: "#64748b", fontSize: 18, fontWeight: 500, maxWidth: 500, margin: "0 auto" }, children: room.metadata?.course_name ? /* @__PURE__ */ jsxs(Fragment, { children: [
        "Studying ",
        /* @__PURE__ */ jsx("span", { style: { color: "#7c3aed", fontWeight: 700 }, children: room.metadata.course_name })
      ] }) : "Gather your team and get ready to study!" })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 300px", gap: 32 }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 20 }, children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
          /* @__PURE__ */ jsxs("h3", { style: { fontSize: 18, fontWeight: 900, color: "#1e293b", display: "flex", alignItems: "center", gap: 10 }, children: [
            "Participants ",
            /* @__PURE__ */ jsx("span", { style: { background: "#f1f5f9", color: "#64748b", padding: "2px 8px", borderRadius: 6, fontSize: 14 }, children: participants.length })
          ] }),
          isHost && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: copyInviteLink,
              style: {
                background: "white",
                border: "1.5px solid #e2e8f0",
                padding: "8px 16px",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#475569"
              },
              children: [
                /* @__PURE__ */ jsx(RiLink, { size: 16 }),
                " Copy Invite"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { style: {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16
        }, children: /* @__PURE__ */ jsx(AnimatePresence, { children: participants.map((p, idx) => {
          const isSelf = user.id ? p.user_id === user.id : p.guest_name === user.guest_name;
          const isHostOfRoom = p.user_id === room.created_by;
          return /* @__PURE__ */ jsxs(
            motion.div,
            {
              initial: { scale: 0.9, opacity: 0 },
              animate: { scale: 1, opacity: 1 },
              whileHover: { y: -4 },
              style: {
                background: "white",
                padding: 24,
                borderRadius: 28,
                border: `2px solid ${p.is_ready ? "#16a34a" : isSelf ? "#7c3aed" : "#f1f5f9"}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                position: "relative",
                boxShadow: "0 4px 6px rgba(0,0,0,0.02)"
              },
              children: [
                /* @__PURE__ */ jsxs("div", { style: {
                  width: 64,
                  height: 64,
                  borderRadius: 22,
                  background: isSelf ? "#7c3aed" : "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isSelf ? "white" : "#94a3b8",
                  position: "relative",
                  overflow: "hidden"
                }, children: [
                  p.profiles?.avatar_url ? /* @__PURE__ */ jsx("img", { src: p.profiles.avatar_url, alt: "", style: { width: "100%", height: "100%", objectFit: "cover" } }) : !p.user_id ? /* @__PURE__ */ jsx(RiUserSmileFill, { size: 32 }) : /* @__PURE__ */ jsx(RiUserFill, { size: 32 }),
                  p.is_ready && /* @__PURE__ */ jsx("div", { style: {
                    position: "absolute",
                    bottom: -4,
                    right: -4,
                    background: "#16a34a",
                    color: "white",
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "3px solid white"
                  }, children: /* @__PURE__ */ jsx(RiCheckFill, { size: 14 }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { style: { textAlign: "center" }, children: [
                  /* @__PURE__ */ jsx("p", { style: { fontSize: 16, fontWeight: 900, color: "#111" }, children: isSelf ? "You" : p.profiles?.full_name || p.guest_name || "Friend" }),
                  /* @__PURE__ */ jsx("p", { style: { fontSize: 12, fontWeight: 700, color: p.is_ready ? "#16a34a" : "#94a3b8", textTransform: "uppercase" }, children: p.is_ready ? "Ready" : "Waiting" })
                ] }),
                isHostOfRoom && /* @__PURE__ */ jsx("div", { style: {
                  position: "absolute",
                  top: 12,
                  right: 12,
                  color: "#fbbf24"
                }, children: /* @__PURE__ */ jsx(RiShieldCheckFill, { size: 18 }) })
              ]
            },
            p.id || idx
          );
        }) }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 20 }, children: [
        /* @__PURE__ */ jsxs("div", { style: {
          background: "white",
          borderRadius: 32,
          padding: 32,
          border: "1px solid #f1f5f9",
          boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
          display: "flex",
          flexDirection: "column",
          gap: 24
        }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12, color: "#111" }, children: [
            /* @__PURE__ */ jsx(RiInformationLine, { size: 20, color: "#7c3aed" }),
            /* @__PURE__ */ jsx("span", { style: { fontWeight: 800, fontSize: 15 }, children: "Game Details" })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: [
            /* @__PURE__ */ jsx(DetailItem, { label: "Game Type", value: room.game_type?.replace("-", " ").toUpperCase() }),
            /* @__PURE__ */ jsx(DetailItem, { label: "Mode", value: "Multiplayer Battle" })
          ] }),
          /* @__PURE__ */ jsx("div", { style: { height: 1, background: "#f1f5f9" } }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: [
            !isHost && /* @__PURE__ */ jsxs(
              motion.button,
              {
                whileHover: { scale: 1.02 },
                whileTap: { scale: 0.98 },
                onClick: handleToggleReady,
                disabled: toggling,
                style: {
                  padding: "16px",
                  background: toggling ? "#f1f5f9" : isReady ? "#fee2e2" : "#98FF98",
                  color: toggling ? "#94a3b8" : isReady ? "#ef4444" : "#166534",
                  border: "none",
                  borderRadius: 16,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: toggling ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: toggling ? 0.7 : 1
                },
                children: [
                  toggling ? /* @__PURE__ */ jsx("div", { style: { width: 20, height: 20, border: "3px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" } }) : isReady ? /* @__PURE__ */ jsx(RiCloseFill, { size: 20 }) : /* @__PURE__ */ jsx(RiCheckFill, { size: 20 }),
                  toggling ? "Updating..." : isReady ? "Cancel Ready" : "I'm Ready"
                ]
              }
            ),
            isHost ? /* @__PURE__ */ jsxs(
              motion.button,
              {
                whileHover: { scale: 1.02 },
                whileTap: { scale: 0.98 },
                onClick: handleStartGame,
                style: {
                  padding: "16px",
                  background: "#98FF98",
                  color: "#166534",
                  border: "none",
                  borderRadius: 16,
                  fontSize: 16,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  boxShadow: "0 10px 20px rgba(152, 255, 152, 0.3)"
                },
                children: [
                  /* @__PURE__ */ jsx(RiPlayFill, { size: 20 }),
                  " Start Game"
                ]
              }
            ) : /* @__PURE__ */ jsx("div", { style: { textAlign: "center", padding: "8px", color: "#94a3b8", fontSize: 13, fontWeight: 600 }, children: "Waiting for host to start..." })
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { style: { padding: "0 12px", fontSize: 13, color: "#94a3b8", fontWeight: 500, lineHeight: 1.5, textAlign: "center" }, children: "Ensure everyone is ready before the host starts the session." })
      ] })
    ] })
  ] });
}
function DetailItem({ label, value }) {
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
    /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 600, color: "#64748b" }, children: label }),
    /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 800, color: "#1e293b" }, children: value })
  ] });
}
if (typeof document !== "undefined" && !document.getElementById("game-lobby-styles")) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "game-lobby-styles";
  styleSheet.innerText = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}
