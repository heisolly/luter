import * as Si from 'react-icons/si';

const keywords = ['uni', 'coll', 'inst', 'harv', 'stan', 'mit', 'oxf', 'camb', 'colu', 'yale', 'princ', 'toron', 'mich', 'nus', 'cambr'];

console.log('Searching react-icons/si keys...');
const found = [];
Object.keys(Si).forEach(key => {
  const lowerKey = key.toLowerCase();
  if (keywords.some(kw => lowerKey.includes(kw))) {
    found.push(key);
  }
});

console.log(`Found ${found.length} matching keys:`);
console.log(found.slice(0, 100)); // Show up to 100 matches
