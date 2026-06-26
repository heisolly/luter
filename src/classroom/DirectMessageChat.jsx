import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { PaperPlaneRight, X } from '@phosphor-icons/react';

export default function DirectMessageChat({ classId, currentUserId, recipientId, recipientName, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!classId || !currentUserId || !recipientId) return;

    // 1. Fetch initial message history
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('class_messages')
          .select('*')
          .eq('class_id', classId)
          .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${currentUserId})`)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error('[DM] Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // 2. Subscribe to new messages in real-time
    const channel = supabase
      .channel(`class-dm-${classId}-${currentUserId}-${recipientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'class_messages',
          filter: `class_id=eq.${classId}`,
        },
        (payload) => {
          const newMsg = payload.new;
          // Check if this message belongs to this conversation
          const isBelonging = 
            (newMsg.sender_id === currentUserId && newMsg.recipient_id === recipientId) ||
            (newMsg.sender_id === recipientId && newMsg.recipient_id === currentUserId);
          
          if (isBelonging) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classId, currentUserId, recipientId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    setInputText('');

    try {
      const { error } = await supabase.from('class_messages').insert({
        class_id: classId,
        sender_id: currentUserId,
        recipient_id: recipientId,
        message_text: trimmed,
      });

      if (error) throw error;
    } catch (err) {
      console.error('[DM] Error sending message:', err);
    }
  };

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: '400px',
      background: 'white', borderLeft: '1px solid #e0e0e0', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
      display: 'flex', flexDirection: 'column', zIndex: 1100,
      animation: 'slideIn 0.3s ease-out'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px', borderBottom: '1px solid #e0e0e0', background: '#f8f9fa'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#202124', fontWeight: 600 }}>Message {recipientName}</h3>
          <span style={{ fontSize: '12px', color: '#70757a' }}>Private Chat</span>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onMouseEnter={(e) => e.target.style.background = '#e8eaed'} onMouseLeave={(e) => e.target.style.background = 'none'}>
          <X size={20} color="#5f6368" />
        </button>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', fontSize: '14px', color: '#70757a' }}>Loading chat history...</div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', color: '#70757a', textAlign: 'center', padding: '0 20px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>No messages yet</span>
            <span style={{ fontSize: '12px' }}>Send a message to start a private conversation with {recipientName}.</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} style={{
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '75%', display: 'flex', flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  background: isMe ? '#1a73e8' : '#f1f3f4',
                  color: isMe ? 'white' : '#202124',
                  padding: '10px 14px', borderRadius: isMe ? '18px 18px 0 18px' : '18px 18px 18px 0',
                  fontSize: '14px', lineHeight: '1.4', wordBreak: 'break-word',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  {msg.message_text}
                </div>
                <span style={{ fontSize: '10px', color: '#70757a', marginTop: '4px', padding: '0 4px' }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={handleSendMessage} style={{
        padding: '16px 20px', borderTop: '1px solid #e0e0e0', background: 'white',
        display: 'flex', gap: '10px', alignItems: 'center'
      }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid #dadce0',
            fontSize: '14px', outline: 'none', background: '#f8f9fa'
          }}
          onFocus={(e) => e.target.style.border = '1px solid #1a73e8'}
          onBlur={(e) => e.target.style.border = '1px solid #dadce0'}
        />
        <button type="submit" style={{
          background: '#1a73e8', color: 'white', border: 'none', cursor: 'pointer',
          width: '40px', height: '40px', borderRadius: '50%', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}>
          <PaperPlaneRight size={18} weight="fill" />
        </button>
      </form>

      {/* Slide in animation style */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
