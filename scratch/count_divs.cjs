const fs = require('fs');

const content = fs.readFileSync('c:/Softwares/Luter/src/components/dashboard/WorkstationPage.jsx', 'utf8');
const lines = content.split('\n');

let opens = 0;
let closes = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Simple regex to count <div and </div
  const oMatches = line.match(/<div(\s|>)/g);
  const cMatches = line.match(/<\/div>/g);
  
  if (oMatches) opens += oMatches.length;
  if (cMatches) closes += cMatches.length;
  
  if (i > 1440 && oMatches && !cMatches) {
    // console.log(`Line ${i + 1}: opens ${oMatches.length}, closes 0`);
  }
}

console.log(`Total <divs: ${opens}`);
console.log(`Total </divs: ${closes}`);
console.log(`Difference: ${opens - closes}`);
