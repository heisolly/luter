import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';

export function CollabChatPanel({ isDark, room_id, user, profile }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat_room_${room_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workspace_chat_messages',
          filter: `room_id=eq.${room_id}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room_id]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workspace_chat_messages')
        .select('*')
        .eq('room_id', room_id)
        .order('created_at', { ascending: true });
        
      if (error && error.code === '42P01') {
        // Table doesn't exist yet, just ignore
        setMessages([]);
      } else if (!error && data) {
        setMessages(data);
      }
    } catch (err) {
      console.error("Error fetching chat:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || !user) return;

    const newMsg = {
      room_id,
      user_id: user.id,
      content: input.trim()
    };

    setInput(''); // Optimistic clear

    const { error } = await supabase
      .from('workspace_chat_messages')
      .insert([newMsg]);

    if (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ padding: '20px', color: isDark ? '#D1D5DB' : '#374151', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '16px' }}>
        {loading ? (
          <div style={{ opacity: 0.5, textAlign: 'center', marginTop: '20px' }}>Loading chat...</div>
        ) : messages.length === 0 ? (
          <div style={{ opacity: 0.5, textAlign: 'center', marginTop: '20px' }}>No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg) => {
            const isMe = user && msg.user_id === user.id;
            // Basic initial for avatar
            const initial = isMe && profile?.full_name 
              ? profile.full_name.charAt(0).toUpperCase() 
              : 'U';
            const bgColor = isMe ? '#4F46E5' : '#10B981';

            return (
              <div key={msg.id || Math.random()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ 
                    width: '24px', height: '24px', borderRadius: '50%', backgroundColor: bgColor, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 'bold' 
                  }}>
                    {initial}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: isDark ? '#F3F4F6' : '#111827' }}>
                    {isMe ? 'You' : 'Team Member'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{formatTime(msg.created_at)}</span>
                </div>
                <div style={{ fontSize: '14px', color: isDark ? '#D1D5DB' : '#4B5563', paddingLeft: '32px', whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', borderTop: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`, paddingTop: '16px' }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={!user}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: '20px',
            border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            color: isDark ? '#F3F4F6' : '#111827', outline: 'none', fontSize: '14px'
          }}
        />
        <button 
          onClick={sendMessage}
          disabled={!user || !input.trim()}
          style={{ 
            width: '36px', height: '36px', borderRadius: '50%', backgroundColor: input.trim() ? '#4F46E5' : '#111827',
            color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            cursor: input.trim() ? 'pointer' : 'default', transition: 'background-color 0.2s', opacity: user ? 1 : 0.5
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  );
}
