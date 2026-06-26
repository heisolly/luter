import fs from 'fs';

const content = fs.readFileSync('src/components/dashboard/QuizSessionPage.jsx', 'utf8');

function stripCommentsAndStrings(code) {
  // Strip multiline comments /* ... */
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');
  // Strip single line comments // ...
  code = code.replace(/\/\/.*/g, '');
  return code;
}

const cleanCode = stripCommentsAndStrings(content);
const lines = cleanCode.split('\n');
let stack = [];
let output = [];

for (let idx = 0; idx < lines.length; idx++) {
  const line = lines[idx];
  const lineNum = idx + 1;
  
  // Find tags
  const regex = /<\/?([a-zA-Z0-9]+)\b|(\/>)/g;
  let match;
  while ((match = regex.exec(line)) !== null) {
    const token = match[0];
    if (token === '/>') {
      if (stack.length > 0) {
        stack.pop();
      }
    } else if (token.startsWith('</')) {
      const tagName = match[1];
      if (stack.length > 0 && stack[stack.length - 1] === tagName) {
        stack.pop();
      } else {
        // mismatch but pop anyway to keep stack tracking sane
        if (stack.includes(tagName)) {
          while (stack.length > 0 && stack[stack.length - 1] !== tagName) {
            stack.pop();
          }
          stack.pop();
        }
      }
    } else if (token.startsWith('<')) {
      const tagName = match[1];
      // Check if self-closing on the same line
      const rest = line.substring(match.index);
      const isSelfClosing = rest.includes('/>') && !rest.split('/>')[0].includes('<');
      const isVoid = ['input', 'img', 'br', 'hr', 'link', 'meta'].includes(tagName);
      if (!isSelfClosing && !isVoid) {
        stack.push(tagName);
      }
    }
  }
  
  output.push(`${lineNum}: [${stack.join(', ')}] | ${line.trim()}`);
}

fs.writeFileSync('scratch/nesting_log.txt', output.join('\n'));
console.log('Nesting log generated in scratch/nesting_log.txt!');
