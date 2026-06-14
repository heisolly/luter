import React, { useState, useEffect } from 'react';
import { useComments } from './CommentsProvider';
import { MessageSquare, X, Send, CheckCircle2, Trash2 } from 'lucide-react';

function formatDistanceToNow(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
}

export default function CommentsPane({ isOpen, onClose, user, profile, pendingComment, setPendingComment, onThreadCreated }) {
  const { threads, comments, activeThreadId, setActiveThreadId, createThread, createComment, resolveThread, deleteThread } = useComments();
  const [replyText, setReplyText] = useState('');

  if (!isOpen) return null;

  const activeThread = pendingComment ? null : (threads.find(t => t.id === activeThreadId) || threads[0]);
  const threadComments = activeThread ? comments.filter(c => c.thread_id === activeThread.id) : [];

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    try {
      if (pendingComment) {
        // Create new thread
        const thread = await createThread(pendingComment.threadId, user.id, replyText, { quote: pendingComment.quote });
        setReplyText('');
        setPendingComment(null);
        if (onThreadCreated) onThreadCreated(thread.id, pendingComment.threadId); 
      } else if (activeThread) {
        await createComment(activeThread.id, user.id, replyText);
        setReplyText('');
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
    }
  };

  const handleResolve = async () => {
    if (!activeThread) return;
    try {
      await resolveThread(activeThread.id);
      setActiveThreadId(null);
    } catch (err) {
      console.error('Failed to resolve thread:', err);
    }
  };

  const handleDelete = async () => {
    if (!activeThread) return;
    try {
      await deleteThread(activeThread.id);
      setActiveThreadId(null);
    } catch (err) {
      console.error('Failed to delete thread:', err);
    }
  };

  // Sort threads (unresolved first, then by date)
  const sortedThreads = [...threads].sort((a, b) => {
    if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div className="absolute right-6 top-24 bottom-6 w-80 bg-white/70 dark:bg-[#1E293B]/70 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-40 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/20">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-500" />
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">Comments</h2>
          <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full font-medium">
            {threads.filter(t => !t.resolved).length}
          </span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Thread List (Left thin strip or top if we only want one view) */}
        {/* Actually let's make it a split view or list view. For 320px, a list view that drills down is better. */}
        
        {activeThread ? (
          <div className="flex flex-col w-full h-full">
            <div className="px-3 py-2 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/5 dark:bg-white/5">
              <button 
                onClick={() => setActiveThreadId(null)}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                &larr; Back to all
              </button>
              <div className="flex gap-1">
                {!activeThread.resolved && (
                  <button onClick={handleResolve} className="p-1.5 text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-500/20 rounded-md transition-colors" title="Resolve Thread">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={handleDelete} className="p-1.5 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-500/20 rounded-md transition-colors" title="Delete Thread">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Thread Original Quote Context */}
            {activeThread.metadata?.quote && (
              <div className="px-4 py-3 bg-yellow-50/50 dark:bg-yellow-500/10 border-b border-yellow-100 dark:border-yellow-500/20">
                <p className="text-sm italic text-gray-600 dark:text-gray-400 line-clamp-3 border-l-2 border-yellow-400 pl-2">
                  "{activeThread.metadata.quote}"
                </p>
              </div>
            )}

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {threadComments.map((comment, index) => {
                const authorMeta = comment.auth_users?.raw_user_meta_data || {};
                const avatar = authorMeta.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorMeta.full_name || 'U')}`;
                
                return (
                  <div key={comment.id} className="flex gap-3">
                    <img src={avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-black/10 dark:border-white/10" />
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between">
                        <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                          {authorMeta.full_name || 'User'}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 whitespace-pre-wrap leading-relaxed">
                        {comment.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Composer */}
            {!activeThread.resolved && (
              <div className="p-3 border-t border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/20">
                <form onSubmit={handleReply} className="relative">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Reply..."
                    className="w-full bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleReply(e);
                      }
                    }}
                  />
                  <button 
                    type="submit"
                    disabled={!replyText.trim()}
                    className="absolute right-2 bottom-2 p-1.5 text-white bg-indigo-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-600 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {sortedThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
                <MessageSquare className="w-12 h-12 mb-3 text-gray-400" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No comments yet</p>
                <p className="text-xs text-gray-500 mt-1">Select some text and click the comment icon to start a thread.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-black/5 dark:divide-white/5">
                {sortedThreads.map(thread => {
                  const rootComment = comments.find(c => c.thread_id === thread.id);
                  const replyCount = comments.filter(c => c.thread_id === thread.id).length - 1;
                  const authorMeta = rootComment?.auth_users?.raw_user_meta_data || {};
                  
                  return (
                    <button
                      key={thread.id}
                      onClick={() => setActiveThreadId(thread.id)}
                      className={`p-4 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${thread.resolved ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <img 
                            src={authorMeta.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorMeta.full_name || 'U')}`} 
                            alt="Avatar" 
                            className="w-5 h-5 rounded-full"
                          />
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 line-clamp-1">
                            {authorMeta.full_name || 'User'}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500">
                          {thread.created_at ? formatDistanceToNow(new Date(thread.created_at)) : ''}
                        </span>
                      </div>
                      
                      {thread.metadata?.quote && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic border-l-2 border-yellow-400 pl-2 mb-2 line-clamp-2">
                          "{thread.metadata.quote}"
                        </p>
                      )}
                      
                      <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                        {rootComment?.body || '...'}
                      </p>
                      
                      <div className="flex items-center gap-3 mt-3">
                        {replyCount > 0 && (
                          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">
                            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                          </span>
                        )}
                        {thread.resolved && (
                          <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Resolved
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
