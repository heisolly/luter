import fs from 'fs';

const content = fs.readFileSync('src/components/dashboard/QuizSessionPage.jsx', 'utf8');

// Strip JavaScript comments and template literals / strings
function stripJs(code) {
  // Replace string literals (double quotes, single quotes, backticks) with empty space
  // but keep JSX tags intact. This is tricky, but we can do a rough clean.
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '') // strip /* ... */
    .replace(/\/\/.*/g, '')           // strip // ...
    .replace(/`[\s\S]*?`/g, '""')     // strip backticks
    .replace(/'[^'\n]*'/g, '""')       // strip single quotes
    .replace(/"[^"\n]*"/g, '""');     // strip double quotes
}

const cleanCode = stripJs(content);
const lines = cleanCode.split('\n');
const stack = [];
const voidTags = ['input', 'img', 'br', 'hr', 'link', 'meta'];

lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  
  // Find all tag openings/closings: <Tag, </Tag, />
  // We match:
  // 1. </TagName>
  // 2. <TagName
  // 3. />
  const regex = /<\/([a-zA-Z0-9_:]+)>|<([a-zA-Z0-9_:]+)|(\/>)/g;
  let match;
  
  while ((match = regex.exec(line)) !== null) {
    if (match[3]) { // '/>'
      // Only pop if the top of the stack is NOT a void tag (though void tags shouldn't be pushed anyway)
      if (stack.length > 0) {
        const popped = stack.pop();
        // console.log(`${lineNum}: Popped ${popped.tag} due to />`);
      }
    } else if (match[1]) { // '</TagName>'
      const tagName = match[1];
      if (stack.length > 0 && stack[stack.length - 1].tag === tagName) {
        stack.pop();
      } else {
        console.log(`Mismatch on line ${lineNum}: closed </${tagName}> but stack top is <${stack[stack.length - 1]?.tag || 'none'}> (opened on line ${stack[stack.length - 1]?.line || 'none'})`);
        // Try to recover by popping the mismatched tag if it exists in stack
        const foundIdx = stack.map(x => x.tag).lastIndexOf(tagName);
        if (foundIdx !== -1) {
          stack.splice(foundIdx);
        }
      }
    } else if (match[2]) { // '<TagName'
      const tagName = match[2];
      
      // Determine if it's self-closing on the same line
      const rest = line.substring(match.index);
      // If the line has '/>' after this tag and before any other '<'
      const nextOpen = rest.indexOf('<', 1);
      const nextClose = rest.indexOf('/>');
      const isSelfClosing = nextClose !== -1 && (nextOpen === -1 || nextClose < nextOpen);
      const isVoid = voidTags.includes(tagName.toLowerCase());
      
      if (!isSelfClosing && !isVoid) {
        stack.push({ tag: tagName, line: lineNum });
      }
    }
  }
});

console.log("\nRemaining tags in stack at end of file:");
stack.forEach(x => {
  console.log(`Line ${x.line}: <${x.tag}>`);
});
