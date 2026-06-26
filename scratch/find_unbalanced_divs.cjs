const fs = require('fs');

const content = fs.readFileSync('c:/Softwares/Luter/src/components/dashboard/WorkstationPage.jsx', 'utf8');

// We will find all <div and </div tags.
const regex = /<\/?div\b[^>]*>/gi;
let match;
const stack = [];
let unbalanced = false;

while ((match = regex.exec(content)) !== null) {
  const isClosing = match[0].startsWith('</');
  const line = content.substring(0, match.index).split('\n').length;
  
  // ignore divs inside comments
  const before = content.substring(0, match.index);
  const lastCommentStart = before.lastIndexOf('/*');
  const lastCommentEnd = before.lastIndexOf('*/');
  if (lastCommentStart > lastCommentEnd) continue; // inside comment
  
  if (!isClosing) {
    stack.push({ line, tag: match[0] });
  } else {
    if (stack.length === 0) {
      console.log(`ERROR: Extra closing </div> at line ${line}`);
      unbalanced = true;
    } else {
      stack.pop();
    }
  }
}

if (stack.length > 0) {
  console.log(`ERROR: Unclosed <div...> tags:`);
  stack.forEach(item => {
    console.log(`Line ${item.line}: ${item.tag}`);
  });
} else if (!unbalanced) {
  console.log('All divs are perfectly balanced!');
}
