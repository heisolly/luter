import fs from 'fs';

const content = fs.readFileSync('scratch/diff_short_raw.txt', 'utf16le');
fs.writeFileSync('scratch/diff_short.txt', content, 'utf8');
console.log('Converted short diff successfully!');
