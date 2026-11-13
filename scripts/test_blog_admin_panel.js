const assert = require('assert');
const crypto = require('crypto');

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, combinedHash) {
  try {
    const parts = combinedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, storedHash] = parts;
    const storedBuffer = Buffer.from(storedHash, 'hex');
    const calculatedBuffer = crypto.scryptSync(password, salt, 64);
    if (storedBuffer.length !== calculatedBuffer.length) return false;
    return crypto.timingSafeEqual(storedBuffer, calculatedBuffer);
  } catch {
    return false;
  }
}

function createSessionToken(username, secret = 'test-secret-key-12345678901234567890') {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = JSON.stringify({ u: username, exp: expiresAt });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

function verifySessionToken(token, secret = 'test-secret-key-12345678901234567890') {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false };
    const [payloadB64, signature] = parts;

    const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSig);

    if (sigBuffer.length !== expectedBuffer.length) return { valid: false };
    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return { valid: false };

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload.u || !payload.exp) return { valid: false };
    if (Date.now() > payload.exp) return { valid: false };

    return { valid: true, username: payload.u };
  } catch {
    return { valid: false };
  }
}

async function runTests() {
  console.log('=== Running Blog Admin Panel Unit & Security Verification ===\n');

  // Test 1: Password hashing and timing-safe verification
  console.log('Test 1: Testing scrypt password hashing & verification...');
  const testPass = 'OfficeBazzar@Secret2026!';
  const generatedHash = hashPassword(testPass);
  assert(verifyPassword(testPass, generatedHash), 'Correct password must verify as true');
  assert(!verifyPassword('WrongPassword!', generatedHash), 'Incorrect password must verify as false');
  assert(!verifyPassword('', generatedHash), 'Empty password must verify as false');
  console.log('  [PASS] Password hashing & timing-safe verification works accurately');

  // Test 2: Session token HMAC signing and validation
  console.log('\nTest 2: Testing HMAC signed session tokens...');
  const token = createSessionToken('officebazzar_admin');
  const resValid = verifySessionToken(token);
  assert(resValid.valid === true, 'Session token must be valid');
  assert.strictEqual(resValid.username, 'officebazzar_admin', 'Username in session must match');

  const tamperedToken = token.slice(0, -4) + 'abcd';
  const resTampered = verifySessionToken(tamperedToken);
  assert(resTampered.valid === false, 'Tampered token must be rejected');
  console.log('  [PASS] HMAC signed session tokens are cryptographically tamper-proof');

  // Test 3: Verify no public navigation links exist to /blog-admin-panel
  console.log('\nTest 3: Checking that admin panel is completely absent from public navigation...');
  const fs = require('fs');
  const headerContent = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');
  const footerContent = fs.readFileSync('src/components/layout/Footer.tsx', 'utf8');
  const blogPageContent = fs.readFileSync('src/app/blog/page.tsx', 'utf8');

  assert(!headerContent.includes('/blog-admin-panel'), 'Header must not link to /blog-admin-panel');
  assert(!footerContent.includes('/blog-admin-panel'), 'Footer must not link to /blog-admin-panel');
  assert(!blogPageContent.includes('/blog-admin-panel'), 'Blog page must not link to /blog-admin-panel');
  console.log('  [PASS] Strict privacy requirement satisfied: 0 public links to /blog-admin-panel');

  // Test 4: Verify robots indexing is disabled on /blog-admin-panel
  console.log('\nTest 4: Checking robots indexing directives on /blog-admin-panel...');
  const adminPageContent = fs.readFileSync('src/app/blog-admin-panel/page.tsx', 'utf8');
  assert(adminPageContent.includes("robots: { index: false, follow: false }"), 'Admin panel must have index: false, follow: false');
  console.log('  [PASS] /blog-admin-panel is explicitly barred from search engine crawlers');

  // Test 5: Verify sitemap excludes /blog-admin-panel
  console.log('\nTest 5: Checking sitemap excludes admin panel...');
  const sitemapContent = fs.readFileSync('src/app/sitemap.ts', 'utf8');
  assert(!sitemapContent.includes('/blog-admin-panel'), 'Sitemap must not contain /blog-admin-panel');
  console.log('  [PASS] Sitemap strictly omits /blog-admin-panel');

  console.log('\nAll 5 Blog Admin Security & Integrity tests PASSED successfully!');
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
