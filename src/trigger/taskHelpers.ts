export async function extractTextFromFile(fileId: string) {
  return `Extracted text for ${fileId}`;
}

export function splitIntoChunks(text: string, chunkCount = 10) {
  const safeText = text || '';
  const size = Math.max(1, Math.ceil(safeText.length / chunkCount));
  const chunks: string[] = [];
  for (let i = 0; i < safeText.length; i += size) chunks.push(safeText.slice(i, i + size));
  return chunks.length ? chunks : [''];
}

export async function generateCardsFromChunk(chunk: string) {
  return [{
    question: chunk.slice(0, 80) || 'Key concept',
    answer: 'Review the relevant section in your study material.',
  }];
}

export async function generateSummaryFromText(text: string) {
  return text.slice(0, 1200) || 'Summary unavailable.';
}

export async function generateNotesFromText(text: string) {
  return `# AI Notes\n\n${text.slice(0, 1600) || 'Notes unavailable.'}`;
}

export async function generateExamFromText(text: string) {
  return [{ question: text.slice(0, 100) || 'Practice question', options: ['A', 'B', 'C', 'D'], answer: 'A' }];
}

export async function saveFlashcardsToSupabase(cards: unknown[], fileId: string) {
  return { fileId, count: cards.length };
}

export async function saveGeneratedArtifact(type: string, payload: unknown, fileId: string) {
  return { type, fileId, payload };
}
