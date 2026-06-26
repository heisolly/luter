import fs from 'fs';

const content = fs.readFileSync('scratch/diff_quiz.txt', 'utf16le');

const lines = content.split('\n');

console.log("ADDED LINES WITH DIV TAGS:");
lines.forEach((line, idx) => {
  if (line.startsWith('+') && !line.startsWith('+++') && (line.includes('<div') || line.includes('</div'))) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
