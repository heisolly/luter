const fs = require('fs');
let file = fs.readFileSync('c:/Softwares/Luter/src/components/dashboard/SettingsPage.jsx', 'utf8');
file = file.replace(/linear-gradient\(135deg, #9718fb 0%, #7c3aed 100%\)/g, '#98FF98');
file = file.replace(/#9718fb/gi, '#98FF98');
file = file.replace(/color: 'white'/g, "color: '#111827'");
file = file.replace(/color: "white"/g, "color: '#111827'");
fs.writeFileSync('c:/Softwares/Luter/src/components/dashboard/SettingsPage.jsx', file);
console.log('Colors fixed!');
