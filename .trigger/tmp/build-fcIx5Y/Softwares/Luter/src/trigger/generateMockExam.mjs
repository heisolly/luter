import {
  extractTextFromFile,
  generateExamFromText,
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

// src/trigger/generateMockExam.ts
init_esm();
var generateMockExamTask = task({
  id: "generate-mock-exam",
  run: /* @__PURE__ */ __name(async (payload) => {
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
  }, "run")
});
export {
  generateMockExamTask
};
//# sourceMappingURL=generateMockExam.mjs.map
