import { task, metadata } from "@trigger.dev/sdk/v3";
import { extractTextFromFile, saveGeneratedArtifact } from "./taskHelpers";

export const processUploadedFileTask = task({
  id: "process-uploaded-file",
  run: async (payload: { fileId: string; userId: string; totalPages?: number }) => {
    await metadata.set("status", "Uploading document...");
    await metadata.set("progress", 5);
    const text = await extractTextFromFile(payload.fileId);
    await metadata.set("status", "Extracting searchable text...");
    await metadata.set("progress", 65);
    await saveGeneratedArtifact("processed-file", { text, totalPages: payload.totalPages || 0 }, payload.fileId);
    await metadata.set("status", "Done!");
    await metadata.set("progress", 100);
    return { textLength: text.length };
  },
});
