import {
  extractTextFromFile,
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

// src/trigger/processUploadedFile.ts
init_esm();
var processUploadedFileTask = task({
  id: "process-uploaded-file",
  run: /* @__PURE__ */ __name(async (payload) => {
    await metadata.set("status", "Uploading document...");
    await metadata.set("progress", 5);
    const text = await extractTextFromFile(payload.fileId);
    await metadata.set("status", "Extracting searchable text...");
    await metadata.set("progress", 65);
    await saveGeneratedArtifact("processed-file", { text, totalPages: payload.totalPages || 0 }, payload.fileId);
    await metadata.set("status", "Done!");
    await metadata.set("progress", 100);
    return { textLength: text.length };
  }, "run")
});
export {
  processUploadedFileTask
};
//# sourceMappingURL=processUploadedFile.mjs.map
