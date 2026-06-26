import fs from 'fs';

const content = fs.readFileSync('scratch/diff_quiz.txt', 'utf16le');
fs.writeFileSync('scratch/diff_quiz_utf8.txt', content, 'utf8');
console.log('Converted successfully to UTF-8!');
