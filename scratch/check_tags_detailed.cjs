const fs = require('fs');
const content = fs.readFileSync('c:/Softwares/Luter/src/components/dashboard/WorkstationPage.jsx', 'utf8');

function checkTags(tag) {
  const openRegex = new RegExp(`<${tag}(\\s+[^>]*)?(?<!/)>`, 'g');
  const closeRegex = new RegExp(`</${tag}>`, 'g');
  const selfCloseRegex = new RegExp(`<${tag}(\\s+[^>]*)?/>`, 'g');

  const opens = (content.match(openRegex) || []).length;
  const closes = (content.match(closeRegex) || []).length;
  const selfCloses = (content.match(selfCloseRegex) || []).length;

  console.log(`${tag}: opens=${opens}, closes=${closes}, selfCloses=${selfCloses} | Balance=${opens - closes}`);
}

checkTags('div');
checkTags('main');
checkTags('aside');
checkTags('header');
checkTags('section');
checkTags('button');
checkTags('span');
checkTags('p');
checkTags('h[1-6]');
console.log(`Fragments (<>): ${ (content.match(/<>/g) || []).length }`);
console.log(`Fragments (</>): ${ (content.match(/<\/>/g) || []).length }`);
