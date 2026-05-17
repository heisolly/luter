import {
  __name,
  init_esm
} from "./chunk-B4LXEYI2.mjs";

// src/trigger/taskHelpers.ts
init_esm();
async function extractTextFromFile(fileId) {
  return `Extracted text for ${fileId}`;
}
__name(extractTextFromFile, "extractTextFromFile");
function splitIntoChunks(text, chunkCount = 10) {
  const safeText = text || "";
  const size = Math.max(1, Math.ceil(safeText.length / chunkCount));
  const chunks = [];
  for (let i = 0; i < safeText.length; i += size) chunks.push(safeText.slice(i, i + size));
  return chunks.length ? chunks : [""];
}
__name(splitIntoChunks, "splitIntoChunks");
async function generateCardsFromChunk(chunk) {
  return [{
    question: chunk.slice(0, 80) || "Key concept",
    answer: "Review the relevant section in your study material."
  }];
}
__name(generateCardsFromChunk, "generateCardsFromChunk");
async function generateSummaryFromText(text) {
  return text.slice(0, 1200) || "Summary unavailable.";
}
__name(generateSummaryFromText, "generateSummaryFromText");
async function generateNotesFromText(text) {
  return `# AI Notes

${text.slice(0, 1600) || "Notes unavailable."}`;
}
__name(generateNotesFromText, "generateNotesFromText");
async function generateExamFromText(text) {
  return [{ question: text.slice(0, 100) || "Practice question", options: ["A", "B", "C", "D"], answer: "A" }];
}
__name(generateExamFromText, "generateExamFromText");
async function saveFlashcardsToSupabase(cards, fileId) {
  return { fileId, count: cards.length };
}
__name(saveFlashcardsToSupabase, "saveFlashcardsToSupabase");
async function saveGeneratedArtifact(type, payload, fileId) {
  return { type, fileId, payload };
}
__name(saveGeneratedArtifact, "saveGeneratedArtifact");

export {
  extractTextFromFile,
  splitIntoChunks,
  generateCardsFromChunk,
  generateSummaryFromText,
  generateNotesFromText,
  generateExamFromText,
  saveFlashcardsToSupabase,
  saveGeneratedArtifact
};
//# sourceMappingURL=chunk-UUHNXV4R.mjs.map
