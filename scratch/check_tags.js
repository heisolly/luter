import fs from 'fs';

const content = fs.readFileSync('src/components/dashboard/QuizSessionPage.jsx', 'utf8');

const tags = ['div', 'button', 'form', 'svg', 'span', 'p', 'style', 'input', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

for (const tag of tags) {
  const openCount = (content.match(new RegExp(`<${tag}\\b`, 'g')) || []).length;
  const closeCount = (content.match(new RegExp(`</${tag}>`, 'g')) || []).length;
  console.log(`${tag}: open=${openCount}, close=${closeCount}, diff=${openCount - closeCount}`);
}
