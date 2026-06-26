import fs from 'fs';

const content = fs.readFileSync('scratch/nesting_log.txt', 'utf8');
const lines = content.split('\n');

for (let idx = 1055; idx < 1095; idx++) {
  if (lines[idx]) console.log(lines[idx]);
}
