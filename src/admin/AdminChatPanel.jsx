import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { PaperPlaneRight, UserCircle, CircleNotch, ChatCircleDots, X, Microphone, StopCircle, ArrowBendUpLeft } from '@phosphor-icons/react';

export default function AdminChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tempName, setTempName] = useState('');
  
  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);

  // Audio & Reply state
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Drag handlers
  const handleMouseDown = (e) => {
    if (e.target.tagName.toLowerCase() === 'button' || e.target.closest('button')) return; // don't drag if clicking a button
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragRef.current.startX,
      y: e.clientY - dragRef.current.startY
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

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
        .limit(100);
      
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

  const handleSend = async (e, contentOverride = null, audioUrl = null) => {
    if (e) e.preventDefault();
    const content = contentOverride !== null ? contentOverride : newMessage.trim();
    if (!content && !audioUrl || !user?.full_name) return;

    const messageToSend = {
      sender_id: user.id,
      sender_name: user.full_name,
      content: content,
      audio_url: audioUrl,
      reply_to_id: replyingTo ? replyingTo.id : null,
      reply_to_name: replyingTo ? replyingTo.sender_name : null,
      reply_to_content: replyingTo ? (replyingTo.audio_url ? 'Voice message' : replyingTo.content) : null
    };

    if (!contentOverride) setNewMessage('');
    setReplyingTo(null);

    const { error } = await supabase
      .from('admin_chats')
      .insert([messageToSend]);

    if (error) {
      console.error('Error sending message:', error);
      alert('Error sending message: ' + error.message);
    }
  };

  // Audio Recording Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        setIsUploadingAudio(true);
        const fileName = `${Date.now()}-${user.id}.webm`;
        
        const { data, error } = await supabase.storage
          .from('admin_audio')
          .upload(fileName, audioBlob);
          
        if (!error && data) {
          const { data: { publicUrl } } = supabase.storage.from('admin_audio').getPublicUrl(fileName);
          await handleSend(null, 'Voice message', publicUrl);
        } else {
          console.error("Audio upload error:", error);
          alert("Audio upload failed: " + error.message);
        }
        setIsUploadingAudio(false);
      };
      
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing mic", err);
      alert("Could not access microphone. Please allow permissions.");
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '24px', 
      right: '24px', 
      zIndex: 9999, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'flex-end',
      transform: `translate(${position.x}px, ${position.y}px)`
    }}>
      
      {/* Chat Window */}
      {isOpen && (
        <div className="adm-card" style={{ 
          width: '350px', 
          height: '450px', 
          display: 'flex', 
          flexDirection: 'column', 
          marginBottom: '16px',
          boxShadow: isDragging ? '0 15px 35px rgba(0,0,0,0.2)' : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
          pointerEvents: 'auto'
        }}>
          {/* Header (Draggable) */}
          <div 
            onMouseDown={handleMouseDown}
            style={{ 
              padding: '12px 16px', 
              borderBottom: '1px solid #f3f4f6', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              background: '#7a12cc', 
              color: 'white',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, pointerEvents: 'none' }}>Admin Chat</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#a7f3d0', fontWeight: 600, pointerEvents: 'none' }}>
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
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }} className="adm-chat-msg">
                    <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2, marginLeft: isMe ? 0 : 2, marginRight: isMe ? 2 : 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {!isMe && msg.sender_name} {!isMe && '•'} {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      
                      {/* Reply button overlay on hover */}
                      <button 
                        onClick={() => setReplyingTo(msg)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', padding: 2, marginLeft: isMe ? 0 : 4, marginRight: isMe ? 4 : 0 }}
                        title="Reply"
                      >
                        <ArrowBendUpLeft size={12} weight="bold" />
                      </button>
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
                      lineHeight: 1.4,
                      position: 'relative'
                    }}>
                      {/* Replied Message Snippet */}
                      {msg.reply_to_name && (
                        <div style={{
                          background: isMe ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          marginBottom: '6px',
                          fontSize: 11,
                          borderLeft: `3px solid ${isMe ? '#e9d5ff' : '#7a12cc'}`,
                          color: isMe ? '#f3e8ff' : '#475569'
                        }}>
                          <div style={{ fontWeight: 700, marginBottom: 2 }}>{msg.reply_to_name}</div>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                            {msg.reply_to_content}
                          </div>
                        </div>
                      )}

                      {/* Main Message Content */}
                      {msg.audio_url ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 12, opacity: 0.8 }}>Voice message</span>
                          <audio src={msg.audio_url} controls style={{ height: 30, width: 200 }} />
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {isUploadingAudio && (
               <div style={{ display: 'flex', justifyContent: 'center', padding: 8 }}>
                 <CircleNotch className="animate-spin" size={20} color="#7a12cc" />
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: '12px', borderTop: '1px solid #f3f4f6', background: '#ffffff', opacity: !user?.full_name ? 0.5 : 1, pointerEvents: !user?.full_name ? 'none' : 'auto' }}>
            
            {/* Replying Indicator */}
            {replyingTo && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '6px 10px', borderRadius: '8px', marginBottom: '8px', fontSize: 11 }}>
                <div>
                  <span style={{ fontWeight: 700, color: '#7a12cc' }}>Replying to {replyingTo.sender_name}</span>
                  <div style={{ color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>
                    {replyingTo.audio_url ? 'Voice message' : replyingTo.content}
                  </div>
                </div>
                <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
                  <X size={14} weight="bold" />
                </button>
              </div>
            )}

            <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={!user?.full_name ? "Set name to chat..." : isRecording ? "Recording..." : "Type a message..."}
                className="adm-input"
                disabled={!user?.full_name || isRecording}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '1px solid #e2e8f0', outline: 'none', fontSize: 13, background: isRecording ? '#fef2f2' : 'white', color: isRecording ? '#dc2626' : 'inherit' }}
              />
              
              {newMessage.trim() ? (
                <button 
                  type="submit" 
                  disabled={!user?.full_name}
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
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <PaperPlaneRight size={16} weight="fill" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (isRecording) {
                      stopRecording();
                    } else {
                      startRecording();
                    }
                  }}
                  disabled={!user?.full_name}
                  style={{
                    background: isRecording ? '#dc2626' : '#f1f5f9',
                    color: isRecording ? 'white' : '#64748b',
                    border: 'none',
                    borderRadius: '50%',
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    animation: isRecording ? 'pulse 1.5s infinite' : 'none'
                  }}
                  title={isRecording ? "Click to stop and send" : "Click to record audio"}
                >
                  {isRecording ? <StopCircle size={20} weight="fill" /> : <Microphone size={18} weight="bold" />}
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Toggle Button (Not Draggable) */}
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
          transition: 'transform 0.2s, box-shadow 0.2s',
          pointerEvents: 'auto'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        {isOpen ? <X size={28} /> : <ChatCircleDots size={28} weight="fill" />}
      </button>

    </div>
  );
}
