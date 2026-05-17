import {
  extractTextFromFile,
  generateNotesFromText,
  saveGeneratedArtifact
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

// src/trigger/generateAINotes.ts
init_esm();
var generateAINotesTask = task({
  id: "generate-ai-notes",
  run: /* @__PURE__ */ __name(async (payload) => {
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
  }, "run")
});
export {
  generateAINotesTask
};
//# sourceMappingURL=generateAINotes.mjs.map
