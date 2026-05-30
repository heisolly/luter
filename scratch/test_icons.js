import * as Si from 'react-icons/si';

const universities = [
  'Stanford', 'Harvard', 'Princeton', 'Yale', 'Columbia', 'Mit', 'Cambridge', 'Oxford',
  'Massachusettsinstituteoftechnology', 'Universityofoxford', 'Universityofcambridge',
  'Cornell', 'Berkeley', 'Nus', 'Toronto', 'Imperialcollegelondon', 'Imperial'
];

console.log('Testing React Icons Simple Icons University list:');
universities.forEach(uni => {
  const possibleNames = [
    `Si${uni}`,
    `Si${uni.toLowerCase()}`,
    `Si${uni.charAt(0).toUpperCase() + uni.slice(1)}`
  ];
  
  possibleNames.forEach(name => {
    if (Si[name]) {
      console.log(`Found: ${name}`);
    }
  });
});
