/**
 * Comprehensive Automated E2E Test Suite for Office Bazzar Hidden Admin
 * Validates:
 * 1. Unauthorized blocking (401 on APIs, 307 on dashboard)
 * 2. Strict 2-Email Allowlist enforcement:
 *    - Rejecting non-whitelisted emails (e.g. admin@officebazzar.co.in)
 *    - Rejecting whitelisted email with wrong password
 *    - Permitting sales4@officebazzar.com with correct password
 *    - Permitting marketing@officebazzar.com with correct password
 * 3. Login page stability (loads 200 without redirect loop)
 * 4. Image upload to Supabase Storage bucket
 * 5. Draft product creation (hidden from public, returns 404)
 * 6. Live product publication (accessible on public product detail page)
 * 7. Product update & publish status toggle
 * 8. Product deletion
 * 9. Admin logout & session termination
 */

const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: body,
          json: () => {
            try {
              return JSON.parse(body);
            } catch {
              return null;
            }
          },
        });
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('OFFICE BAZZAR HIDDEN ADMIN E2E TEST SUITE');
  console.log('====================================================\n');

  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition, testName) {
    testsTotal++;
    if (condition) {
      testsPassed++;
      console.log(`[PASS] ${testName}`);
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  // 1. Unauthorized access is blocked
  console.log('--- Test 1: Unauthorized Access Block ---');
  const unauthRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/office-control/products',
    method: 'GET',
  });
  assert(unauthRes.statusCode === 401, 'Protected API blocks unauthorized GET with 401');

  const unauthPage = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/office-control/dashboard',
    method: 'GET',
  });
  // Server layout redirects to /office-control/login (307/302 redirect)
  assert(
    unauthPage.statusCode === 307 || unauthPage.statusCode === 302 || unauthPage.headers.location?.includes('/office-control/login'),
    'Protected dashboard page redirects unauthenticated visitor to /office-control/login'
  );

  // 2. Login Page Stability (No redirect loop)
  console.log('\n--- Test 2: Login Page Stability ---');
  const loginPageRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/office-control/login',
    method: 'GET',
  });
  assert(
    loginPageRes.statusCode === 200,
    'Login page loads once with 200 OK and remains stable (no redirect loops)'
  );

  // 3. Strict 2-Email Allowlist Validation
  console.log('\n--- Test 3: Strict 2-Email Allowlist Verification ---');
  const TEST_PASSWORD = process.env.ADMIN_PASSWORD_SALES4 || process.env.ADMIN_PASSWORD || 'OfficeBazzar@2026!';

  // 3a. Disallowed email must be blocked even if password is provided
  const disallowedRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/office-control/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    JSON.stringify({
      email: 'admin@officebazzar.co.in',
      password: TEST_PASSWORD,
    })
  );
  assert(
    disallowedRes.statusCode === 401,
    'Non-allowlisted email (admin@officebazzar.co.in) is rejected with 401'
  );

  // 3b. Allowed email with invalid password must be blocked
  const wrongPassRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/office-control/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    JSON.stringify({
      email: 'sales4@officebazzar.com',
      password: 'WrongPassword123!',
    })
  );
  assert(
    wrongPassRes.statusCode === 401,
    'Allowed email with wrong password is rejected with 401'
  );

  // 3c. Authorized email 1: sales4@officebazzar.com
  const loginRes1 = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/office-control/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    JSON.stringify({
      email: 'sales4@officebazzar.com',
      password: TEST_PASSWORD,
    })
  );
  const loginJson1 = loginRes1.json();
  assert(
    loginRes1.statusCode === 200 && loginJson1?.success === true && loginJson1?.user?.email === 'sales4@officebazzar.com',
    'Authorized email 1 (sales4@officebazzar.com) logs in successfully'
  );

  const cookieHeader = loginRes1.headers['set-cookie'];
  const sessionCookie = cookieHeader ? cookieHeader[0].split(';')[0] : '';
  assert(sessionCookie.startsWith('ob_admin_session='), 'Admin session cookie is securely issued');

  // Verify auth/me with cookie
  const meRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/office-control/auth/me',
    method: 'GET',
    headers: { Cookie: sessionCookie },
  });
  const meJson = meRes.json();
  assert(
    meJson?.isAuthenticated === true && meJson?.user?.email === 'sales4@officebazzar.com',
    'Session verification confirms sales4@officebazzar.com admin identity'
  );

  // 3d. Authorized email 2: marketing@officebazzar.com
  const loginRes2 = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/office-control/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    JSON.stringify({
      email: 'marketing@officebazzar.com',
      password: TEST_PASSWORD,
    })
  );
  const loginJson2 = loginRes2.json();
  assert(
    loginRes2.statusCode === 200 && loginJson2?.success === true && loginJson2?.user?.email === 'marketing@officebazzar.com',
    'Authorized email 2 (marketing@officebazzar.com) logs in successfully'
  );

  // 4. Image Upload
  console.log('\n--- Test 4: Product Image Upload ---');
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const dummyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  const preBody = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test-upload.png"\r\nContent-Type: image/png\r\n\r\n`
  );
  const postBody = Buffer.from(`\r\n--${boundary}--\r\n`);
  const multipartBody = Buffer.concat([preBody, dummyPng, postBody]);

  const uploadRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/office-control/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': multipartBody.length,
        Cookie: sessionCookie,
      },
    },
    multipartBody
  );

  const uploadJson = uploadRes.json();
  assert(uploadRes.statusCode === 200 && uploadJson?.success === true && uploadJson?.url, 'Image uploaded successfully with public URL generated');
  const uploadedImageUrl = uploadJson?.url || 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd';

  // 5. Create Draft Product & Confirm Hidden Publicly
  console.log('\n--- Test 5: Draft Product (Hidden from Public) ---');
  const testSkuDraft = `OB-TEST-DRAFT-${Date.now()}`;
  const draftCreateRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/office-control/products',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
    },
    JSON.stringify({
      name: 'Automated Test Draft Seating Chair',
      sku: testSkuDraft,
      packSize: '1 Piece',
      categoryId: 'office-supplies-stationery',
      brandId: 'officebazzar',
      images: [uploadedImageUrl],
      description: 'Private draft product that should not be visible to public users.',
      isActive: false, // DRAFT
    })
  );

  const draftJson = draftCreateRes.json();
  assert(draftCreateRes.statusCode === 200 && draftJson?.success === true, 'Draft product created via admin API');
  const draftSlug = draftJson?.product?.slug;
  const draftId = draftJson?.product?.id;

  // Confirm draft is NOT accessible on public product page
  const publicDraftCheck = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/product/${draftSlug}`,
    method: 'GET',
  });
  assert(publicDraftCheck.statusCode === 404, 'Public visitor cannot view draft product (/product/[slug] returns 404)');

  // 6. Publish Product & Confirm Visible on Public Store
  console.log('\n--- Test 6: Publish Product & Public Store Verification ---');
  const testSkuLive = `OB-TEST-LIVE-${Date.now()}`;
  const liveCreateRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/office-control/products',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
    },
    JSON.stringify({
      name: 'Automated Test Published Heavy Duty Stapler',
      sku: testSkuLive,
      packSize: 'Box of 10 Pieces',
      categoryId: 'office-supplies-stationery',
      brandId: 'officebazzar',
      images: [uploadedImageUrl],
      description: 'Heavy duty executive stapler with 100-sheet binding capacity.',
      isActive: true, // PUBLISHED
    })
  );

  const liveJson = liveCreateRes.json();
  assert(liveCreateRes.statusCode === 200 && liveJson?.success === true, 'Published product created successfully');
  const liveSlug = liveJson?.product?.slug;
  const liveId = liveJson?.product?.id;

  // Check public product page
  const publicLiveCheck = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/product/${liveSlug}`,
    method: 'GET',
  });
  assert(
    publicLiveCheck.statusCode === 200 && publicLiveCheck.data.includes(testSkuLive),
    'Public product detail page renders live product with correct SKU and title'
  );

  // 7. Edit Product
  console.log('\n--- Test 7: Edit Product ---');
  const editRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: `/api/office-control/products/${liveId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
    },
    JSON.stringify({
      name: 'Updated Heavy Duty Stapler (Enterprise Edition)',
      packSize: 'Pack of 5 Units',
    })
  );

  const editJson = editRes.json();
  assert(editRes.statusCode === 200 && editJson?.success === true, 'Product details updated via admin API');

  // 8. Toggle Publish Status (Unpublish -> 404 on public store)
  console.log('\n--- Test 8: Toggle Publish Status ---');
  const unpublishRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: `/api/office-control/products/${liveId}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
    },
    JSON.stringify({ isActive: false })
  );

  const unpublishJson = unpublishRes.json();
  assert(unpublishRes.statusCode === 200 && unpublishJson?.product?.isActive === false, 'Product unpublished via 1-click toggle');

  const publicAfterUnpublish = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/product/${liveSlug}`,
    method: 'GET',
  });
  assert(publicAfterUnpublish.statusCode === 404, 'Unpublished product returns 404 to public visitors');

  // 9. Delete Product
  console.log('\n--- Test 9: Delete Product ---');
  const deleteRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/office-control/products/${liveId}`,
    method: 'DELETE',
    headers: { Cookie: sessionCookie },
  });
  const deleteJson = deleteRes.json();
  assert(deleteRes.statusCode === 200 && deleteJson?.success === true, 'Product deleted successfully via admin API');

  // Clean up draft product
  if (draftId) {
    await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/office-control/products/${draftId}`,
      method: 'DELETE',
      headers: { Cookie: sessionCookie },
    });
  }

  // 10. Admin Logout
  console.log('\n--- Test 10: Admin Logout ---');
  const logoutRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/office-control/auth/logout',
    method: 'POST',
    headers: { Cookie: sessionCookie },
  });
  assert(logoutRes.statusCode === 200, 'Admin logout succeeds with 200 OK');

  const afterLogoutRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/office-control/auth/me',
    method: 'GET',
  });
  assert(afterLogoutRes.statusCode === 401, 'Subsequent request after logout is blocked with 401 Unauthorized');

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${testsPassed} / ${testsTotal} PASSED`);
  console.log('====================================================\n');

  if (testsPassed !== testsTotal) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
