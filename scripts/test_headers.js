const https = require('https');

https.get('https://officebazzar.com/', (res) => {
  console.log('Status:', res.statusCode);
  console.log('HSTS:', res.headers['strict-transport-security']);
  console.log('X-Content-Type-Options:', res.headers['x-content-type-options']);
  console.log('X-Frame-Options:', res.headers['x-frame-options']);
  console.log('X-XSS-Protection:', res.headers['x-xss-protection']);
  console.log('Referrer-Policy:', res.headers['referrer-policy']);
  console.log('Permissions-Policy:', res.headers['permissions-policy']);
  console.log('CSP:', (res.headers['content-security-policy'] || '').substring(0, 100) + '...');
});
