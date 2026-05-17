import {
  extractTextFromFile,
  generateCardsFromChunk,
  saveFlashcardsToSupabase,
  splitIntoChunks
} from "../../../../chunk-UUHNXV4R.mjs";
import {
  metadata,
  task
} from "../../../../chunk-FH6HAB2V.mjs";
import "../../../../chunk-QFUFFP6T.mjs";
import {
  __name,
  init_esm
} from "../../../../chunk-B4LXEYI2.mjs";

// src/trigger/generateFlashcards.ts
init_esm();
var generateFlashcardsTask = task({
  id: "generate-flashcards",
  run: /* @__PURE__ */ __name(async (payload) => {
    await metadata.set("status", "Extracting text from document...");
    await metadata.set("progress", 0);
    const extractedText = await extractTextFromFile(payload.fileId);
    await metadata.set("status", "Analyzing key concepts...");
    await metadata.set("progress", 20);
    const chunks = splitIntoChunks(extractedText, 10);
    const allCards = [];
    for (let i = 0; i < chunks.length; i++) {
      await metadata.set("status", `Generating cards for section ${i + 1} of ${chunks.length}...`);
      await metadata.set("progress", 20 + Math.round(i / chunks.length * 70));
      const cards = await generateCardsFromChunk(chunks[i]);
      allCards.push(...cards);
    }
    await metadata.set("status", "Saving flashcards...");
    await metadata.set("progress", 95);
    await saveFlashcardsToSupabase(allCards, payload.fileId);
    await metadata.set("status", "Done!");
    await metadata.set("progress", 100);
    return { cards: allCards, count: allCards.length };
  }, "run")
});
export {
  generateFlashcardsTask
};
//# sourceMappingURL=generateFlashcards.mjs.map
