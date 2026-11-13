const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: STANDALONE BLOG ADMIN AUTH & STORAGE ===');

// 1. Test scrypt verification
const DEFAULT_USERNAME = 'bazzaroffice5@gmail.com';
const DEFAULT_PASSWORD_HASH =
  'dad416ab2189368389e950507c5cee00:ad62a72c241d063b16480975455f1b6c5cfaecb8e5da4c6d9edbe486768f548fe31346a8ed003804d29fb665a04919f72bf20459bc7e572d88ae13e13fe2a080';
const DEFAULT_SESSION_SECRET =
  'ob_admin_sec_9b2e4f7a1c3d5e8f0a2b4c6d8e0f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f';

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

const correctPass = 'Officebazzar2026';
const wrongPass = 'WrongPassword123';

console.log('1. Password verification for correct password:', verifyPassword(correctPass, DEFAULT_PASSWORD_HASH) ? 'PASS (true)' : 'FAIL');
console.log('2. Password verification for wrong password:', !verifyPassword(wrongPass, DEFAULT_PASSWORD_HASH) ? 'PASS (rejected)' : 'FAIL');

// 2. Test session token creation and verification
function createSessionToken(username, secret) {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = JSON.stringify({ u: username, exp: expiresAt });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

function verifySessionToken(token, secret) {
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

const token = createSessionToken(DEFAULT_USERNAME, DEFAULT_SESSION_SECRET);
const verifyResult = verifySessionToken(token, DEFAULT_SESSION_SECRET);
console.log('3. Valid session token verification:', verifyResult.valid && verifyResult.username === DEFAULT_USERNAME ? 'PASS (verified)' : 'FAIL');

const tamperedToken = token.slice(0, -4) + 'abcd';
const tamperedResult = verifySessionToken(tamperedToken, DEFAULT_SESSION_SECRET);
console.log('4. Tampered session token rejection:', !tamperedResult.valid ? 'PASS (rejected)' : 'FAIL');

// 3. Verify content/posts directory
const postsDir = path.join(process.cwd(), 'content', 'posts');
const exists = fs.existsSync(postsDir);
const postDirs = exists ? fs.readdirSync(postsDir) : [];
console.log(`5. Migrated articles count in content/posts: ${postDirs.length} (Expected: 10)`);

// 4. Verify hero images
const imgDir = path.join(process.cwd(), 'public', 'images', 'blog');
const imgExists = fs.existsSync(imgDir);
const imgFiles = imgExists ? fs.readdirSync(imgDir) : [];
console.log(`6. Hero images count in public/images/blog: ${imgFiles.length} (Expected: 10)`);

console.log('=== ALL TESTS COMPLETED ===');
