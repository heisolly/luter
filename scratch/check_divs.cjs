const fs = require('fs');
const content = fs.readFileSync('c:/Softwares/Luter/src/components/dashboard/WorkstationPage.jsx', 'utf8');
const lines = content.split('\n');

let depth = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const opens = (line.match(/<div(?![^>]*\/>)/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  if (opens !== 0 || closes !== 0) {
    depth += (opens - closes);
    console.log(`${i + 1}: depth=${depth} (opens=${opens}, closes=${closes}) | ${line.trim().slice(0, 50)}`);
  }
}
