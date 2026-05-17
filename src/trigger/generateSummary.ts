import { task, metadata } from "@trigger.dev/sdk/v3";
import { extractTextFromFile, generateSummaryFromText, saveGeneratedArtifact } from "./taskHelpers";

export const generateSummaryTask = task({
  id: "generate-summary",
  run: async (payload: { fileId: string; userId: string }) => {
    await metadata.set("status", "Reading document...");
    await metadata.set("progress", 10);
    const text = await extractTextFromFile(payload.fileId);
    await metadata.set("status", "Writing summary...");
    await metadata.set("progress", 70);
    const summary = await generateSummaryFromText(text);
    await saveGeneratedArtifact("summary", summary, payload.fileId);
    await metadata.set("status", "Done!");
    await metadata.set("progress", 100);
    return { summary };
  },
});
