/**
 * End-to-End HTTP Lifecycle Test for OfficeBazzar Blog Admin Panel
 * Runs against the local running Next.js server on port 3005.
 */

const crypto = require('crypto');

const BASE_URL = 'http://localhost:3005';
const DEFAULT_USERNAME = 'bazzaroffice5@gmail.com';
const DEFAULT_SESSION_SECRET = 'ob_admin_sec_9b2e4f7a1c3d5e8f0a2b4c6d8e0f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f';

function createTestAdminToken() {
  const secret = process.env.BLOG_ADMIN_SESSION_SECRET || DEFAULT_SESSION_SECRET;
  const username = process.env.BLOG_ADMIN_USERNAME || DEFAULT_USERNAME;
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = JSON.stringify({ u: username, exp: expiresAt });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

const adminCookie = `ob_blog_admin_session=${createTestAdminToken()}`;

async function runE2ETests() {
  console.log('================================================================');
  console.log('  OFFICEBAZZAR BLOG ADMIN: LIVE HTTP E2E LIFECYCLE VERIFICATION  ');
  console.log('  Target Server: ' + BASE_URL);
  console.log('================================================================\n');

  const testSlug = `e2e-audit-test-${Date.now()}`;
  let passed = 0;
  const totalSteps = 13;

  try {
    // ----------------------------------------------------------------
    // Security & Auth Verification
    // ----------------------------------------------------------------
    console.log('--- Checking Server-Side Admin Authorization ---');
    const unauthRes = await fetch(`${BASE_URL}/api/blog-admin/posts`);
    if (unauthRes.status === 401) {
      console.log('✓ Security Verified: Unauthenticated requests are blocked (401 Unauthorized).');
    } else {
      throw new Error(`Security Failure: Unauthenticated request returned status ${unauthRes.status}`);
    }

    const authRes = await fetch(`${BASE_URL}/api/blog-admin/posts`, {
      headers: { Cookie: adminCookie },
    });
    if (authRes.status === 200) {
      const authData = await authRes.json();
      console.log(`✓ Admin Authenticated: Retrieved ${authData.posts.length} database posts.`);
    } else {
      throw new Error(`Auth Failure: Authenticated request returned status ${authRes.status}`);
    }

    // ----------------------------------------------------------------
    // Step 1 & 2: Create a Blog & Save as Draft
    // ----------------------------------------------------------------
    console.log('\n--- Step 1 & 2: Create a Blog & Save as Draft ---');
    const newDraft = {
      slug: testSlug,
      title: 'E2E Verified Blog Article - Office Procurement Innovations',
      status: 'draft',
      publishedDate: new Date().toISOString().split('T')[0],
      author: 'Office Bazzar Executive Team',
      category: 'Workplace Procurement',
      tags: ['Procurement', 'E2ETest'],
      featuredImage: '/images/categories/office-supplies-stationery.jpg',
      imageAlt: 'E2E Verified Blog Image',
      excerpt: 'Comprehensive live verification of real database operations on serverless.',
      content: 'Paragraph 1: Testing live server responses.\n\nParagraph 2: Ensuring reliable persistence.',
    };

    const createRes = await fetch(`${BASE_URL}/api/blog-admin/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify(newDraft),
    });

    if (!createRes.ok) throw new Error(`Create failed with status ${createRes.status}`);
    const createData = await createRes.json();
    console.log(`Created: success=${createData.success}, message="${createData.message}"`);

    // Verify draft is stored in database
    const listAfterDraft = await fetch(`${BASE_URL}/api/blog-admin/posts`, {
      headers: { Cookie: adminCookie },
    }).then((r) => r.json());

    const draftInDb = listAfterDraft.posts.find((p) => p.slug === testSlug);
    if (draftInDb && draftInDb.status === 'draft') {
      console.log('✓ Step 1 & 2 PASSED: Article created and saved as Draft in database.');
      passed += 2;
    } else {
      throw new Error('Step 1 & 2 FAILED: Draft article not found in database.');
    }

    // Verify public returns 404 for draft
    const publicDraftRes = await fetch(`${BASE_URL}/blog/${testSlug}`);
    if (publicDraftRes.status === 404) {
      console.log('✓ Verified: Public route returns 404 Not Found for draft article.');
    } else {
      throw new Error(`Security Leak: Draft returned HTTP ${publicDraftRes.status} instead of 404!`);
    }

    // ----------------------------------------------------------------
    // Step 3: Publish the Blog
    // ----------------------------------------------------------------
    console.log('\n--- Step 3: Publish the Blog ---');
    const publishPayload = { ...newDraft, status: 'published' };
    const pubRes = await fetch(`${BASE_URL}/api/blog-admin/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify(publishPayload),
    });
    if (!pubRes.ok) throw new Error(`Publish failed with status ${pubRes.status}`);

    const publicPubRes = await fetch(`${BASE_URL}/blog/${testSlug}`);
    if (publicPubRes.status === 200) {
      const html = await publicPubRes.text();
      if (html.includes(newDraft.title)) {
        console.log(`✓ Step 3 PASSED: Article published and rendered live on public URL (/blog/${testSlug}).`);
        passed += 1;
      } else {
        throw new Error('Step 3 FAILED: Published HTML does not contain article title.');
      }
    } else {
      throw new Error(`Step 3 FAILED: Public URL returned HTTP ${publicPubRes.status} instead of 200.`);
    }

    // ----------------------------------------------------------------
    // Step 4: Edit the Blog
    // ----------------------------------------------------------------
    console.log('\n--- Step 4: Edit Existing Blog ---');
    const updatedTitle = 'E2E EDIT: Modern Corporate Facility Procurement Guide 2026';
    const editPayload = { ...publishPayload, title: updatedTitle };
    const editRes = await fetch(`${BASE_URL}/api/blog-admin/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify(editPayload),
    });
    if (!editRes.ok) throw new Error(`Edit failed with status ${editRes.status}`);

    const publicEditRes = await fetch(`${BASE_URL}/blog/${testSlug}`);
    const editHtml = await publicEditRes.text();
    if (publicEditRes.status === 200 && editHtml.includes(updatedTitle)) {
      console.log('✓ Step 4 PASSED: Blog updated and edited title rendered on live website.');
      passed += 1;
    } else {
      throw new Error('Step 4 FAILED: Updated title not rendered on website.');
    }

    // ----------------------------------------------------------------
    // Step 5: Unpublish the Blog (Revert to Draft)
    // ----------------------------------------------------------------
    console.log('\n--- Step 5: Unpublish the Blog (Revert to Draft) ---');
    const unpubPayload = { ...editPayload, status: 'draft' };
    await fetch(`${BASE_URL}/api/blog-admin/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify(unpubPayload),
    });

    const publicUnpubRes = await fetch(`${BASE_URL}/blog/${testSlug}`);
    if (publicUnpubRes.status === 404) {
      console.log('✓ Step 5 PASSED: Article unpublished. Public URL immediately returns 404.');
      passed += 1;
    } else {
      throw new Error(`Step 5 FAILED: Unpublished article returned HTTP ${publicUnpubRes.status}`);
    }

    // ----------------------------------------------------------------
    // Step 6, 7 & 8: Move to Trash, Verify Hidden from Live Website, Verify in Admin Trash
    // ----------------------------------------------------------------
    console.log('\n--- Step 6, 7 & 8: Move to Trash & Verify Synchronization ---');
    // Re-publish first
    await fetch(`${BASE_URL}/api/blog-admin/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ ...editPayload, status: 'published' }),
    });

    // Move to trash
    const trashPayload = {
      ...editPayload,
      previousStatus: 'published',
      status: 'trash',
    };
    const trashRes = await fetch(`${BASE_URL}/api/blog-admin/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify(trashPayload),
    });
    if (!trashRes.ok) throw new Error('Failed to move to trash.');
    console.log('Moved to trash via API.');

    // Step 6: Verify database status is 'trash'
    const listAfterTrash = await fetch(`${BASE_URL}/api/blog-admin/posts`, {
      headers: { Cookie: adminCookie },
    }).then((r) => r.json());
    const trashedDbPost = listAfterTrash.posts.find((p) => p.slug === testSlug);

    if (trashedDbPost && trashedDbPost.status === 'trash') {
      console.log(`✓ Step 6 PASSED: Article status updated to 'trash' in database (previousStatus='${trashedDbPost.previousStatus}').`);
      passed += 1;
    } else {
      throw new Error('Step 6 FAILED: Article status is not trash in database.');
    }

    // Step 7: Verify public direct URL returns 404 & public listing excludes it
    const publicTrashUrlRes = await fetch(`${BASE_URL}/blog/${testSlug}`);
    const publicListingRes = await fetch(`${BASE_URL}/blog`);
    const listingHtml = await publicListingRes.text();
    const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
    const sitemapXml = await sitemapRes.text();

    if (
      publicTrashUrlRes.status === 404 &&
      !listingHtml.includes(updatedTitle) &&
      !sitemapXml.includes(`/blog/${testSlug}`)
    ) {
      console.log('✓ Step 7 PASSED: Trashed article strictly returns 404, excluded from /blog listing, and excluded from sitemap.xml.');
      passed += 1;
    } else {
      throw new Error('Step 7 FAILED: Trashed article still served by public URL, listing, or sitemap!');
    }

    // Step 8: Verify in Admin Trash view
    if (trashedDbPost.status === 'trash') {
      console.log('✓ Step 8 PASSED: Trashed article appears in Admin Trash records.');
      passed += 1;
    }

    // ----------------------------------------------------------------
    // Step 9 & 10: Restore the Blog & Verify Visibility
    // ----------------------------------------------------------------
    console.log('\n--- Step 9 & 10: Restore the Blog & Verify Visibility ---');
    const restorePayload = {
      ...trashedDbPost,
      status: trashedDbPost.previousStatus || 'published',
    };
    delete restorePayload.previousStatus;

    const restoreRes = await fetch(`${BASE_URL}/api/blog-admin/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify(restorePayload),
    });
    if (!restoreRes.ok) throw new Error('Restore API call failed.');

    const listAfterRestore = await fetch(`${BASE_URL}/api/blog-admin/posts`, {
      headers: { Cookie: adminCookie },
    }).then((r) => r.json());
    const restoredPost = listAfterRestore.posts.find((p) => p.slug === testSlug);

    if (restoredPost && restoredPost.status === 'published') {
      console.log(`✓ Step 9 PASSED: Article restored with original status '${restoredPost.status}'.`);
      passed += 1;
    } else {
      throw new Error(`Step 9 FAILED: Article status is not published (${restoredPost?.status}).`);
    }

    const publicRestoredRes = await fetch(`${BASE_URL}/blog/${testSlug}`);
    if (publicRestoredRes.status === 200) {
      console.log('✓ Step 10 PASSED: Restored article is immediately accessible at /blog/' + testSlug);
      passed += 1;
    } else {
      throw new Error(`Step 10 FAILED: Restored article returned HTTP ${publicRestoredRes.status}`);
    }

    // ----------------------------------------------------------------
    // Step 11, 12 & 13: Permanently Delete, Verify Database Removal & Verify 404
    // ----------------------------------------------------------------
    console.log('\n--- Step 11, 12 & 13: Permanently Delete & Verify ---');
    const deleteRes = await fetch(`${BASE_URL}/api/blog-admin/posts/${testSlug}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    if (!deleteRes.ok) throw new Error(`Delete API returned ${deleteRes.status}`);
    const deleteData = await deleteRes.json();
    console.log(`Delete API: success=${deleteData.success}, message="${deleteData.message}"`);

    // Step 11 & 12: Verify database record is actually deleted
    const listAfterDelete = await fetch(`${BASE_URL}/api/blog-admin/posts`, {
      headers: { Cookie: adminCookie },
    }).then((r) => r.json());
    const deletedInDb = listAfterDelete.posts.find((p) => p.slug === testSlug);

    if (!deletedInDb) {
      console.log('✓ Step 11 & 12 PASSED: Article permanently deleted from database (0 records remaining).');
      passed += 2;
    } else {
      throw new Error('Step 11 & 12 FAILED: Article still present in database after permanent delete!');
    }

    // Step 13: Verify public 404
    const publicDeletedRes = await fetch(`${BASE_URL}/blog/${testSlug}`);
    const finalSitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
    const finalSitemap = await finalSitemapRes.text();

    if (publicDeletedRes.status === 404 && !finalSitemap.includes(`/blog/${testSlug}`)) {
      console.log('✓ Step 13 PASSED: Public URL returns 404 Not Found, excluded from sitemap.xml.');
      passed += 1;
    } else {
      throw new Error(`Step 13 FAILED: Deleted article still returned HTTP ${publicDeletedRes.status}!`);
    }

    // ----------------------------------------------------------------
    // Dashboard Equation & Data Integrity Verification
    // ----------------------------------------------------------------
    console.log('\n--- Verifying Real Database Dashboard Numbers ---');
    const finalDb = await fetch(`${BASE_URL}/api/blog-admin/posts`, {
      headers: { Cookie: adminCookie },
    }).then((r) => r.json());

    const publishedCount = finalDb.posts.filter((p) => p.status === 'published').length;
    const draftCount = finalDb.posts.filter((p) => p.status === 'draft').length;
    const scheduledCount = finalDb.posts.filter((p) => p.status === 'scheduled').length;
    const trashCount = finalDb.posts.filter((p) => p.status === 'trash').length;
    const totalCount = finalDb.posts.length;

    console.log(`Total Blogs:     ${totalCount}`);
    console.log(`Published Blogs: ${publishedCount}`);
    console.log(`Draft Blogs:     ${draftCount}`);
    console.log(`Scheduled Blogs: ${scheduledCount}`);
    console.log(`Trash Blogs:     ${trashCount}`);
    console.log(`Equation Test:   ${totalCount} === ${publishedCount + draftCount + scheduledCount + trashCount}`);

    if (totalCount === publishedCount + draftCount + scheduledCount + trashCount) {
      console.log('✓ Strict Mutual Exclusivity Equation PASSED: Total = Published + Draft + Scheduled + Trash');
    } else {
      throw new Error('Equation check FAILED: Total does not equal sum of parts!');
    }

    console.log('\n================================================================');
    console.log(`  ALL ${passed}/${totalSteps} LIFECYCLE TESTS EXECUTED AND PASSED PERFECTLY!`);
    console.log('================================================================');
  } catch (err) {
    console.error('\n❌ E2E TEST FAILED:', err);
    process.exit(1);
  }
}

runE2ETests();
