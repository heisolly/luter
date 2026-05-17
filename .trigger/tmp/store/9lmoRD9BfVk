import {
  extractTextFromFile,
  generateSummaryFromText,
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

// src/trigger/generateSummary.ts
init_esm();
var generateSummaryTask = task({
  id: "generate-summary",
  run: /* @__PURE__ */ __name(async (payload) => {
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
  }, "run")
});
export {
  generateSummaryTask
};
//# sourceMappingURL=generateSummary.mjs.map
