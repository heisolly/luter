import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { PaperPlaneRight, UserCircle, CircleNotch, ChatCircleDots, X } from '@phosphor-icons/react';

export default function AdminChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tempName, setTempName] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Initialize device-based user
  useEffect(() => {
    let senderId = localStorage.getItem('admin_chat_sender_id');
    if (!senderId) {
      senderId = crypto.randomUUID();
      localStorage.setItem('admin_chat_sender_id', senderId);
    }

    const senderName = localStorage.getItem('admin_chat_sender_name');
    
    if (senderName) {
      setUser({ id: senderId, full_name: senderName });
    } else {
      setUser({ id: senderId, full_name: null });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    
    setLoading(true);
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('admin_chats')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (!error && data) {
        setMessages(data);
      }
      setLoading(false);
      scrollToBottom();
    };

    fetchMessages();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_chats',
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSetName = (e) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    
    localStorage.setItem('admin_chat_sender_name', tempName.trim());
    setUser(prev => ({ ...prev, full_name: tempName.trim() }));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.full_name) return;

    const messageToSend = {
      sender_id: user.id,
      sender_name: user.full_name,
      content: newMessage.trim(),
    };

    setNewMessage('');

    const { error } = await supabase
      .from('admin_chats')
      .insert([messageToSend]);

    if (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      
      {/* Chat Window */}
      {isOpen && (
        <div className="adm-card" style={{ 
          width: '350px', 
          height: '450px', 
          display: 'flex', 
          flexDirection: 'column', 
          marginBottom: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#7a12cc', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Admin Chat</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#a7f3d0', fontWeight: 600 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'pulse 2s infinite' }} />
                Live
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: 4 }}
            >
              <X size={18} weight="bold" />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#fafafa' }}>
            {!user?.full_name ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                <div style={{ background: '#f3e8ff', padding: 16, borderRadius: '50%', marginBottom: 16 }}>
                  <UserCircle size={48} color="#7a12cc" weight="fill" />
                </div>
                <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Identify Yourself</h4>
                <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>
                  Since you share this admin panel, set a name so your colleagues know who is typing.
                </p>
                <form onSubmit={handleSetName} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="E.g. Mark, Sarah..."
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: 14 }}
                    autoFocus
                  />
                  <button 
                    type="submit"
                    disabled={!tempName.trim()}
                    style={{ 
                      background: '#7a12cc', color: 'white', padding: '10px', borderRadius: '8px', border: 'none', 
                      fontWeight: 600, cursor: tempName.trim() ? 'pointer' : 'not-allowed', opacity: tempName.trim() ? 1 : 0.5 
                    }}
                  >
                    Join Chat
                  </button>
                </form>
              </div>
            ) : loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircleNotch className="animate-spin" size={24} color="#7a12cc" />
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 'auto', marginBottom: 'auto' }}>
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = user?.id === msg.sender_id;
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2, marginLeft: isMe ? 0 : 2, marginRight: isMe ? 2 : 0 }}>
                      {msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ 
                      background: isMe ? '#7a12cc' : '#ffffff', 
                      color: isMe ? '#ffffff' : '#334155',
                      padding: '8px 12px', 
                      borderRadius: '16px',
                      borderBottomRightRadius: isMe ? '4px' : '16px',
                      borderBottomLeftRadius: !isMe ? '4px' : '16px',
                      border: isMe ? 'none' : '1px solid #e2e8f0',
                      fontSize: 13,
                      maxWidth: '85%',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      lineHeight: 1.4
                    }}>
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: '12px', borderTop: '1px solid #f3f4f6', background: '#ffffff', opacity: !user?.full_name ? 0.5 : 1, pointerEvents: !user?.full_name ? 'none' : 'auto' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={!user?.full_name ? "Set name to chat..." : "Type a message..."}
                className="adm-input"
                disabled={!user?.full_name}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '1px solid #e2e8f0', outline: 'none', fontSize: 13 }}
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim() || !user?.full_name}
                style={{ 
                  background: '#7a12cc', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: 36, 
                  height: 36, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: newMessage.trim() && user?.full_name ? 'pointer' : 'not-allowed',
                  opacity: newMessage.trim() && user?.full_name ? 1 : 0.5,
                  flexShrink: 0
                }}
              >
                <PaperPlaneRight size={16} weight="fill" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#7a12cc',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(122, 18, 204, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        {isOpen ? <X size={28} /> : <ChatCircleDots size={28} weight="fill" />}
      </button>

    </div>
  );
}
