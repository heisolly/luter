import { useMemo } from 'react';
import { useCreateThread, useThreads } from '../liveblocks.config';

export function useDocumentComments(pageNum) {
  const createThread = useCreateThread();
  const { threads = [] } = useThreads();

  const pageThreads = useMemo(
    () => threads.filter((thread) => thread.metadata?.pageNum === pageNum),
    [threads, pageNum]
  );

  const addComment = ({ selectedText, comment, position, pageNum: targetPage }) => {
    return createThread({
      body: {
        version: 1,
        content: [{
          type: 'paragraph',
          children: [{ text: comment }],
        }],
      },
      metadata: {
        pageNum: targetPage,
        selectedText,
        positionX: position.x,
        positionY: position.y,
        resolved: false,
      },
    });
  };

  return { pageThreads, addComment };
}
