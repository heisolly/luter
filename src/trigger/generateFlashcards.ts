import { task, metadata } from "@trigger.dev/sdk/v3";
import { extractTextFromFile, generateCardsFromChunk, saveFlashcardsToSupabase, splitIntoChunks } from "./taskHelpers";

export const generateFlashcardsTask = task({
  id: "generate-flashcards",
  run: async (payload: { fileId: string; userId: string; totalPages: number }) => {
    await metadata.set("status", "Extracting text from document...");
    await metadata.set("progress", 0);

    const extractedText = await extractTextFromFile(payload.fileId);

    await metadata.set("status", "Analyzing key concepts...");
    await metadata.set("progress", 20);

    const chunks = splitIntoChunks(extractedText, 10);
    const allCards: unknown[] = [];

    for (let i = 0; i < chunks.length; i++) {
      await metadata.set("status", `Generating cards for section ${i + 1} of ${chunks.length}...`);
      await metadata.set("progress", 20 + Math.round((i / chunks.length) * 70));
      const cards = await generateCardsFromChunk(chunks[i]);
      allCards.push(...cards);
    }

    await metadata.set("status", "Saving flashcards...");
    await metadata.set("progress", 95);
    await saveFlashcardsToSupabase(allCards, payload.fileId);
    await metadata.set("status", "Done!");
    await metadata.set("progress", 100);

    return { cards: allCards, count: allCards.length };
  },
});
