import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';

const CommentsContext = createContext(null);

export function CommentsProvider({ roomId, children }) {
  const [threads, setThreads] = useState([]);
  const [comments, setComments] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);

  // Fetch initial data
  useEffect(() => {
    if (!roomId) return;

    let isMounted = true;

    const fetchCommentsData = async () => {
      // Fetch threads for the room
      const { data: threadsData, error: threadsError } = await supabase
        .from('document_threads')
        .select(`
          id,
          room_id,
          resolved,
          created_at,
          author_id,
          metadata
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (threadsError) {
        console.error('Error fetching threads:', threadsError);
        return;
      }

      if (isMounted) setThreads(threadsData || []);

      if (threadsData && threadsData.length > 0) {
        const threadIds = threadsData.map(t => t.id);
        
        // Fetch comments for all these threads
        const { data: commentsData, error: commentsError } = await supabase
          .from('document_comments')
          .select(`
            id,
            thread_id,
            body,
            created_at,
            author_id,
            metadata
          `)
          .in('thread_id', threadIds)
          .order('created_at', { ascending: true });

        if (commentsError) {
          console.error('Error fetching comments:', commentsError);
          return;
        }

        if (isMounted) setComments(commentsData || []);
      }
    };

    fetchCommentsData();

    // Subscribe to realtime updates for threads
    const threadsSubscription = supabase.channel(`threads:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'document_threads', filter: `room_id=eq.${roomId}` }, payload => {
        if (payload.eventType === 'INSERT') {
          setThreads(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setThreads(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
        } else if (payload.eventType === 'DELETE') {
          setThreads(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .subscribe();

    // Subscribe to realtime updates for comments
    // Note: We don't filter by room_id here since document_comments doesn't have it, but we can filter by the channel name logically, or listen to all and filter locally
    const commentsSubscription = supabase.channel(`comments:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'document_comments' }, payload => {
        if (payload.eventType === 'INSERT') {
          // Only add if it belongs to one of our threads
          setThreads(currentThreads => {
            if (currentThreads.some(t => t.id === payload.new.thread_id)) {
              setComments(prev => [...prev, payload.new]);
            }
            return currentThreads;
          });
        } else if (payload.eventType === 'UPDATE') {
          setComments(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c));
        } else if (payload.eventType === 'DELETE') {
          setComments(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      threadsSubscription.unsubscribe();
      commentsSubscription.unsubscribe();
    };
  }, [roomId]);

  const createThread = useCallback(async (threadId, authorId, initialCommentBody, metadata = {}) => {
    // Insert thread
    const { data: threadData, error: threadError } = await supabase
      .from('document_threads')
      .insert({ id: threadId, room_id: roomId, author_id: authorId, metadata })
      .select()
      .single();

    if (threadError) throw threadError;

    // Insert first comment
    const { data: commentData, error: commentError } = await supabase
      .from('document_comments')
      .insert({ thread_id: threadData.id, body: initialCommentBody, author_id: authorId })
      .select()
      .single();

    if (commentError) throw commentError;

    return threadData;
  }, [roomId]);

  const createComment = useCallback(async (threadId, authorId, body, metadata = {}) => {
    const { data, error } = await supabase
      .from('document_comments')
      .insert({ thread_id: threadId, body, author_id: authorId, metadata })
      .select()
      .single();

    if (error) throw error;
    return data;
  }, []);

  const resolveThread = useCallback(async (threadId) => {
    const { error } = await supabase
      .from('document_threads')
      .update({ resolved: true })
      .eq('id', threadId);

    if (error) throw error;
  }, []);

  const deleteThread = useCallback(async (threadId) => {
    const { error } = await supabase
      .from('document_threads')
      .delete()
      .eq('id', threadId);

    if (error) throw error;
  }, []);

  return (
    <CommentsContext.Provider value={{
      threads,
      comments,
      activeThreadId,
      setActiveThreadId,
      createThread,
      createComment,
      resolveThread,
      deleteThread
    }}>
      {children}
    </CommentsContext.Provider>
  );
}

export function useComments() {
  return useContext(CommentsContext);
}
