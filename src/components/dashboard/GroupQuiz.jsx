import React, { useState } from 'react';
import { useStorage, useMutation, useOthers, useSelf } from '../../liveblocks.config';
import { LiveList, LiveObject } from '@liveblocks/client';
import { Trophy, Lightning, Play, Users } from '@phosphor-icons/react';
import { ThinkingIndicator } from '../ui/thinking-indicator';
import { callGroqAPI, GROQ_MODELS, GROQ_PROMPTS } from '../../groqClient';
import { checkAndDeductCredits, CREDIT_COSTS } from '../../services/creditService';

export const GroupQuiz = ({ materialText, isPresenter, user, profile }) => {
  const quizState   = useStorage((root) => root.quizState)   ?? 'idle';
  // useStorage returns the serialized value of LiveList — a plain array
  const questions   = useStorage((root) => root.quizQuestions) ?? [];
  const currentIdx  = useStorage((root) => root.quizCurrentIdx) ?? 0;
  // quizScores is a LiveObject — useStorage serializes it to a plain JS object
  const quizScores  = useStorage((root) => root.quizScores)  ?? {};
  const others      = useOthers();
  const self        = useSelf();

  const [localAnswer, setLocalAnswer] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const startQuiz = useMutation(async ({ storage }) => {
    if (!materialText) return;

    const { ok } = await checkAndDeductCredits(user?.id, CREDIT_COSTS.GROUP_QUIZ, profile?.is_premium)
    if (!ok) return

    setIsGenerating(true);
    storage.set('quizState', 'generating');

    try {
      const response = await callGroqAPI(
        [{ role: 'user', content: materialText.slice(0, 6000) }],
        GROQ_MODELS.PROFESSOR,
        { systemPromptOverride: GROQ_PROMPTS.MOCK_EXAM }
      );

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);

      // Replace LiveList contents
      const qs = storage.get('quizQuestions');
      qs.clear();
      parsed.slice(0, 5).forEach((q) => qs.push(q));

      storage.set('quizCurrentIdx', 0);
      // Reset scores LiveObject
      const scores = storage.get('quizScores');
      // Clear all existing keys by setting a fresh LiveObject
      storage.set('quizScores', new LiveObject({}));
      storage.set('quizState', 'active');
    } catch (err) {
      console.error('[GroupQuiz] startQuiz error:', err);
      storage.set('quizState', 'idle');
    } finally {
      setIsGenerating(false);
    }
  }, [materialText]);

  const submitAnswer = useMutation(({ storage }, isCorrect) => {
    if (!self?.connectionId) return;
    const key = String(self.connectionId);
    const scores = storage.get('quizScores');
    // scores is a LiveObject — use .get() and .set()
    const current = scores.get(key) ?? 0;
    if (isCorrect) scores.set(key, current + 1);
  }, [self?.connectionId]);

  const nextQuestion = useMutation(({ storage }) => {
    const idx = storage.get('quizCurrentIdx');
    const qs  = storage.get('quizQuestions');
    if (idx < qs.length - 1) {
      storage.set('quizCurrentIdx', idx + 1);
    } else {
      storage.set('quizState', 'results');
    }
  }, []);

  const resetQuiz = useMutation(({ storage }) => {
    const qs = storage.get('quizQuestions');
    qs.clear();
    storage.set('quizState', 'idle');
    storage.set('quizCurrentIdx', 0);
    storage.set('quizScores', new LiveObject({}));
  }, []);

  // ── Idle state ────────────────────────────────────────────────────────────
  if (quizState === 'idle') {
    return (
      <div style={{ padding: '24px', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px solid #EBEBEB' }}>
        <Lightning size={40} color="#6D28D9" weight="fill" style={{ marginBottom: '12px' }} />
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', margin: '0 0 6px' }}>Live Group Quiz</h3>
        <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 20px' }}>Test everyone's knowledge in real-time!</p>

        {isPresenter ? (
          <button
            onClick={startQuiz}
            disabled={isGenerating || !materialText}
            style={{
              width: '100%', padding: '11px', background: isGenerating ? '#A78BFA' : '#6D28D9',
              color: 'white', borderRadius: '12px', fontWeight: 700, border: 'none',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontSize: '13px', transition: '0.2s'
            }}
          >
            {isGenerating ? 'Generating…' : <><Play weight="fill" size={14} /> Start for everyone</>}
          </button>
        ) : (
          <div style={{ padding: '10px', background: '#F1F5F9', borderRadius: '10px', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
            Waiting for the presenter to start…
          </div>
        )}
      </div>
    );
  }

  // ── Generating state ──────────────────────────────────────────────────────
  if (quizState === 'generating') {
    return (
      <div style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <ThinkingIndicator />
      </div>
    );
  }

  // ── Results state ──────────────────────────────────────────────────────────
  if (quizState === 'results') {
    // Build leaderboard from plain quizScores object
    const leaderboard = Object.entries(quizScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return (
      <div style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid #EBEBEB' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Trophy size={40} color="#F59E0B" weight="fill" />
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: '8px', color: '#1E293B' }}>Quiz Finished!</h2>
        </div>

        <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '10px' }}>Leaderboard</div>
        {leaderboard.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {leaderboard.map(([cid, score], i) => (
              <div key={cid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: i === 0 ? '#FFF7ED' : '#F8FAFC', borderRadius: '10px', border: `1px solid ${i === 0 ? '#FED7AA' : '#EBEBEB'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>{['🥇', '🥈', '🥉'][i] || `#${i + 1}`}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>
                    {cid === String(self?.connectionId) ? 'You' : `Peer ${i + 1}`}
                  </span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#6D28D9' }}>{score}/{questions.length}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '12px', color: '#64748B', textAlign: 'center' }}>No scores recorded yet.</p>
        )}

        {isPresenter && (
          <button
            onClick={resetQuiz}
            style={{ width: '100%', marginTop: '16px', padding: '10px', background: '#F1F5F9', color: '#64748B', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '13px' }}
          >
            Play Again
          </button>
        )}
      </div>
    );
  }

  // ── Active question ────────────────────────────────────────────────────────
  const currentQ = questions[currentIdx];
  if (!currentQ) return null;

  return (
    <div style={{ padding: '18px', background: 'white', borderRadius: '16px', border: '1px solid #EBEBEB' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#6D28D9', background: '#F5F3FF', padding: '3px 8px', borderRadius: '6px' }}>
          Q {currentIdx + 1}/{questions.length}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748B', fontWeight: 700 }}>
          <Users size={13} /> {others.length + 1} Playing
        </div>
      </div>

      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', marginBottom: '16px', lineHeight: 1.5 }}>
        {currentQ?.question}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {Object.entries(currentQ?.options || {}).map(([key, val]) => {
          const chosen   = localAnswer === key;
          const revealed = !!localAnswer;
          const correct  = key === currentQ.answer;

          return (
            <button
              key={key}
              onClick={() => {
                if (localAnswer) return;
                setLocalAnswer(key);
                submitAnswer(key === currentQ.answer);
              }}
              style={{
                textAlign: 'left', padding: '10px 14px', borderRadius: '10px',
                border: '1.5px solid',
                borderColor: revealed
                  ? (correct ? '#10B981' : chosen ? '#EF4444' : '#EBEBEB')
                  : '#EBEBEB',
                background: revealed
                  ? (correct ? '#ECFDF5' : chosen ? '#FEF2F2' : 'white')
                  : 'white',
                fontSize: '13px', fontWeight: 600, color: '#475569',
                cursor: localAnswer ? 'default' : 'pointer', transition: '0.15s'
              }}
            >
              <span style={{ marginRight: '8px', opacity: 0.45, fontSize: '12px' }}>{key}.</span>{val}
            </button>
          );
        })}
      </div>

      {isPresenter && localAnswer && (
        <button
          onClick={() => { setLocalAnswer(null); nextQuestion(); }}
          style={{ width: '100%', marginTop: '16px', padding: '10px', background: '#6D28D9', color: 'white', borderRadius: '10px', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '13px' }}
        >
          {currentIdx < questions.length - 1 ? 'Next Question →' : 'See Results'}
        </button>
      )}
    </div>
  );
};
