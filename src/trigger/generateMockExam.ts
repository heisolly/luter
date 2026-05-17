import { task, metadata } from "@trigger.dev/sdk/v3";
import { extractTextFromFile, generateExamFromText, saveGeneratedArtifact } from "./taskHelpers";

export const generateMockExamTask = task({
  id: "generate-mock-exam",
  run: async (payload: { fileId: string; userId: string }) => {
    await metadata.set("status", "Reading exam scope...");
    await metadata.set("progress", 15);
    const text = await extractTextFromFile(payload.fileId);
    await metadata.set("status", "Building your exam...");
    await metadata.set("progress", 80);
    const exam = await generateExamFromText(text);
    await saveGeneratedArtifact("mock-exam", exam, payload.fileId);
    await metadata.set("status", "Done!");
    await metadata.set("progress", 100);
    return { exam };
  },
});
