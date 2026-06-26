const fs = require('fs');
const file = 'c:\\Softwares\\Luter\\src\\components\\dashboard\\WorkstationPage.jsx';

let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

// We want to delete from line 1265 down to line 1458 (inclusive).
// But let's find the exact indices. We know the duplicate starts with `{isMobile ? (` around 1265
// and ends with `</div>` around 1458.

// Actually, since we know the line numbers from the last view (1265 to 1459), we can just remove them by index.
// Note: line numbers are 1-indexed. Index 1264 is line 1265.
const startLineIndex = 1264;
const endLineIndex = 1458; 

// Wait, let's verify before cutting.
console.log('Start line:', lines[startLineIndex]);
console.log('End line:', lines[endLineIndex]);

lines.splice(startLineIndex, endLineIndex - startLineIndex + 1);

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Lines removed successfully.');
