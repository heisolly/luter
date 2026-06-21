console.log("domain test");
function getDomain() {
  const hostname = 'localhost';
  if (hostname.includes('localhost')) {
    return '';
  }
  return hostname;
}
const domain = getDomain();
const domainString = domain ? `domain=${domain};` : '';
console.log(`cookie str: key=value; ${domainString} path=/; max-age=31536000; SameSite=Lax;`);
