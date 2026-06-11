import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle, X, MessageCircle, Users } from 'lucide-react';
import { useOthers, useStorage, useThreads } from '../liveblocks.config';

const MAX_TOASTS = 4;
const AUTO_DISMISS_MS = 4000;

function buildToast({ id, kind, title, body }) {
  return { id, kind, title, body, createdAt: Date.now() };
}

const iconFor = {
  comment: MessageCircle,
  quiz: CheckCircle,
  mention: Users,
  warning: AlertTriangle,
};

export default function WorkstationNotifications() {
  const others = useOthers();
  const raisedHands = useStorage((root) => root.raisedHands) || {};
  const syncState = useStorage((root) => root.syncState);
  const quiz = useStorage((root) => root.quiz);
  const { threads = [] } = useThreads();

  const [toasts, setToasts] = useState([]);
  const seenRef = useRef(new Set());
  const prevSnapshotRef = useRef({
    others: new Set(),
    threads: new Set(),
    hands: new Set(),
    sync: false,
    quizStatus: 'idle',
  });

  const derivedToasts = useMemo(() => {
    const next = [];
    const prev = prevSnapshotRef.current;

    const currentOthers = new Set(others.map((other) => other.connectionId));
    others.forEach((other) => {
      const id = `join-${other.connectionId}`;
      if (!prev.others.has(other.connectionId) && !seenRef.current.has(id)) {
        seenRef.current.add(id);
        next.push(buildToast({
          id,
          kind: 'mention',
          title: 'Someone joined',
          body: `${other.presence?.user?.name || 'A classmate'} entered this session.`,
        }));
      }
    });

    const currentThreads = new Set(threads.map((thread) => thread.id));
    threads.forEach((thread) => {
      const id = `thread-${thread.id}`;
      if (!prev.threads.has(thread.id) && !seenRef.current.has(id)) {
        seenRef.current.add(id);
        next.push(buildToast({
          id,
          kind: 'comment',
          title: 'New comment',
          body: 'Someone added a comment thread on this document.',
        }));
      }
    });

    const handEntries = Object.values(raisedHands);
    const currentHands = new Set(handEntries.map((hand) => hand.userId));
    handEntries.forEach((hand) => {
      const id = `hand-${hand.userId}-${hand.raisedAt}`;
      if (!prev.hands.has(hand.userId) && !seenRef.current.has(id)) {
        seenRef.current.add(id);
        next.push(buildToast({
          id,
          kind: 'warning',
          title: 'Hand raised',
          body: `${hand.userName} raised a hand.`,
        }));
      }
    });

    if (syncState?.isSynced && !prev.sync) {
      const id = `sync-${syncState?.leaderId || 'leader'}-${syncState?.currentSlide || 0}`;
      if (!seenRef.current.has(id)) {
        seenRef.current.add(id);
        next.push(buildToast({
          id,
          kind: 'mention',
          title: 'Slide sync enabled',
          body: `Everyone is now synced to slide ${(syncState?.currentSlide || 0) + 1}.`,
        }));
      }
    }

    if (quiz?.status === 'active' && prev.quizStatus !== 'active') {
      const id = `quiz-${quiz?.startedAt || Date.now()}`;
      if (!seenRef.current.has(id)) {
        seenRef.current.add(id);
        next.push(buildToast({
          id,
          kind: 'quiz',
          title: 'Quiz started',
          body: 'A live quiz has been pushed to the session.',
        }));
      }
    }

    prevSnapshotRef.current = {
      others: currentOthers,
      threads: currentThreads,
      hands: currentHands,
      sync: !!syncState?.isSynced,
      quizStatus: quiz?.status || 'idle',
    };

    return next;
  }, [others, threads, raisedHands, syncState?.isSynced, syncState?.leaderId, syncState?.currentSlide, quiz?.status, quiz?.startedAt]);

  useEffect(() => {
    if (!derivedToasts.length) return;
    setToasts((prev) => [...derivedToasts, ...prev].slice(0, MAX_TOASTS));
  }, [derivedToasts]);

  useEffect(() => {
    if (!toasts.length) return undefined;
    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, AUTO_DISMISS_MS)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [toasts]);

  if (!toasts.length) return null;

  return (
    <div className="ws-notification-toasts">
      {toasts.map((item) => {
        const Icon = iconFor[item.kind] || RiMessage3Line;
        return (
          <div key={item.id} className="ws-notification-toast">
            <div className="ws-notification-icon"><Icon size={16} /></div>
            <div>
              <div className="ws-notification-title">{item.title}</div>
              <div className="ws-notification-body">{item.body}</div>
            </div>
            <button type="button" onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== item.id))}>
              <RiCloseLine size={10} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
