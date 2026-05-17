import { task, metadata } from "@trigger.dev/sdk/v3";
import { extractTextFromFile, generateNotesFromText, saveGeneratedArtifact } from "./taskHelpers";

export const generateAINotesTask = task({
  id: "generate-ai-notes",
  run: async (payload: { fileId: string; userId: string }) => {
    await metadata.set("status", "Collecting material context...");
    await metadata.set("progress", 15);
    const text = await extractTextFromFile(payload.fileId);
    await metadata.set("status", "Writing AI notes...");
    await metadata.set("progress", 75);
    const notes = await generateNotesFromText(text);
    await saveGeneratedArtifact("ai-notes", notes, payload.fileId);
    await metadata.set("status", "Done!");
    await metadata.set("progress", 100);
    return { notes };
  },
});
