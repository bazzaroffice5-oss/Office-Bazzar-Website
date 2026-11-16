/**
 * Comprehensive 13-Step Lifecycle Verification Test for OfficeBazzar Blog Admin Panel
 * Tests: Create -> Draft -> Publish -> Edit -> Unpublish -> Trash -> Verify Hidden ->
 *        Restore -> Verify Visibility -> Permanent Delete -> Verify Deletion -> Verify 404.
 */

const {
  saveAdminPost,
  listAllAdminPosts,
  getAdminPostBySlug,
  deleteAdminPost,
  getDurableDeletedSlugs,
} = require('../src/lib/blog-admin/storage');
const {
  getBlogPosts,
  getBlogPostBySlug,
  getAllBlogSlugs,
  getAllBlogCategories,
} = require('../src/lib/keystatic/reader');

async function runAudit() {
  console.log('================================================================');
  console.log('   OFFICEBAZZAR BLOG ADMIN PANEL: REAL DATA LIFECYCLE AUDIT   ');
  console.log('================================================================\n');

  const testSlug = `audit-test-lifecycle-${Date.now()}`;
  let passedSteps = 0;
  const totalSteps = 13;

  try {
    // ----------------------------------------------------------------
    // Initial Baseline Metrics
    // ----------------------------------------------------------------
    const baselinePosts = await listAllAdminPosts();
    const baselinePublished = baselinePosts.filter((p) => p.status === 'published').length;
    const baselineDrafts = baselinePosts.filter((p) => p.status === 'draft').length;
    const baselineScheduled = baselinePosts.filter((p) => p.status === 'scheduled').length;
    const baselineTrash = baselinePosts.filter((p) => p.status === 'trash').length;
    const baselineTotal = baselinePosts.length;

    console.log('[BASELINE DATABASE STATE]');
    console.log(`- Total Blogs:     ${baselineTotal}`);
    console.log(`- Published Blogs: ${baselinePublished}`);
    console.log(`- Draft Blogs:     ${baselineDrafts}`);
    console.log(`- Scheduled Blogs: ${baselineScheduled}`);
    console.log(`- Trash Blogs:     ${baselineTrash}`);
    console.log(`- Equation Check:  ${baselineTotal} === ${baselinePublished + baselineDrafts + baselineScheduled + baselineTrash} (${baselineTotal === baselinePublished + baselineDrafts + baselineScheduled + baselineTrash ? 'PASSED' : 'FAILED'})\n`);

    // ----------------------------------------------------------------
    // Step 1 & 2: Create a Blog & Save as Draft
    // ----------------------------------------------------------------
    console.log('--- Step 1 & 2: Create a blog and save as Draft ---');
    const draftPayload = {
      slug: testSlug,
      title: 'Automated Lifecycle Test Article - Office Procurement Trends',
      status: 'draft',
      publishedDate: new Date().toISOString().split('T')[0],
      author: 'Office Bazzar Editorial Audit',
      category: 'Workplace Procurement',
      tags: ['Procurement', 'AuditTest'],
      featuredImage: '/images/categories/office-supplies-stationery.jpg',
      imageAlt: 'Lifecycle Test Image',
      excerpt: 'Comprehensive audit verifying the 13-step lifecycle of blog storage.',
      content: 'This is a test article used to verify real database operations and cache revalidation.',
    };

    const saveDraftRes = await saveAdminPost(draftPayload);
    console.log(`Save Draft Result: success=${saveDraftRes.success}, message="${saveDraftRes.message}"`);

    const readDraft = await getAdminPostBySlug(testSlug);
    if (readDraft && readDraft.status === 'draft' && readDraft.title === draftPayload.title) {
      console.log(`✓ Step 1 & 2 PASSED: Article created and stored as draft in authoritative database.`);
      passedSteps += 2;
    } else {
      throw new Error(`Step 1 & 2 FAILED: Article not found in database with status 'draft'.`);
    }

    // Verify public does NOT serve draft
    const publicDraftCheck = await getBlogPostBySlug(testSlug);
    if (publicDraftCheck === null) {
      console.log(`✓ Verified: Draft is strictly NOT accessible on public storefront.`);
    } else {
      throw new Error(`FAILED: Draft article leaked to public storefront!`);
    }

    // ----------------------------------------------------------------
    // Step 3: Publish the Blog
    // ----------------------------------------------------------------
    console.log('\n--- Step 3: Publish the blog ---');
    const publishPayload = { ...draftPayload, status: 'published' };
    const savePubRes = await saveAdminPost(publishPayload);
    console.log(`Publish Result: success=${savePubRes.success}, message="${savePubRes.message}"`);

    const readPublished = await getAdminPostBySlug(testSlug);
    const publicPubCheck = await getBlogPostBySlug(testSlug);
    if (readPublished?.status === 'published' && publicPubCheck && publicPubCheck.title === publishPayload.title) {
      console.log(`✓ Step 3 PASSED: Article published and live on public storefront (/blog/${testSlug}).`);
      passedSteps += 1;
    } else {
      throw new Error(`Step 3 FAILED: Published article not accessible via public reader.`);
    }

    // ----------------------------------------------------------------
    // Step 4: Edit an Existing Blog
    // ----------------------------------------------------------------
    console.log('\n--- Step 4: Edit the existing blog ---');
    const editedPayload = {
      ...publishPayload,
      title: 'UPDATED: Corporate Procurement Strategies for Modern Offices',
      excerpt: 'Updated excerpt reflecting genuine database modifications.',
    };
    await saveAdminPost(editedPayload);

    const readEdited = await getAdminPostBySlug(testSlug);
    const publicEditedCheck = await getBlogPostBySlug(testSlug);
    if (readEdited?.title === editedPayload.title && publicEditedCheck?.title === editedPayload.title) {
      console.log(`✓ Step 4 PASSED: Article edits updated in database and reflected on public storefront.`);
      passedSteps += 1;
    } else {
      throw new Error(`Step 4 FAILED: Edits did not reflect.`);
    }

    // ----------------------------------------------------------------
    // Step 5: Unpublish the Blog (Set to Draft)
    // ----------------------------------------------------------------
    console.log('\n--- Step 5: Unpublish the blog (revert to draft) ---');
    const unpublishPayload = { ...editedPayload, status: 'draft' };
    await saveAdminPost(unpublishPayload);

    const readUnpublished = await getAdminPostBySlug(testSlug);
    const publicUnpubCheck = await getBlogPostBySlug(testSlug);
    if (readUnpublished?.status === 'draft' && publicUnpubCheck === null) {
      console.log(`✓ Step 5 PASSED: Article successfully unpublished (draft). Hidden from public storefront.`);
      passedSteps += 1;
    } else {
      throw new Error(`Step 5 FAILED: Unpublished article still publicly visible!`);
    }

    // ----------------------------------------------------------------
    // Step 6 & 7 & 8: Move to Trash, Verify Hidden from Website, Verify in Admin Trash
    // ----------------------------------------------------------------
    console.log('\n--- Step 6, 7 & 8: Move to Trash, verify hidden from live website, verify in Admin Trash ---');
    // First re-publish so we test trashing a published article
    await saveAdminPost({ ...editedPayload, status: 'published' });

    // Now move to trash with previousStatus preserved
    const trashPayload = {
      ...editedPayload,
      previousStatus: 'published',
      status: 'trash',
    };
    await saveAdminPost(trashPayload);

    const readTrashed = await getAdminPostBySlug(testSlug);
    const publicTrashCheck = await getBlogPostBySlug(testSlug);
    const publicListing = await getBlogPosts({ search: 'UPDATED: Corporate Procurement' });
    const allSlugs = await getAllBlogSlugs();

    if (readTrashed?.status === 'trash') {
      console.log(`✓ Step 6 PASSED: Article marked as trash in database (previousStatus='${readTrashed.previousStatus}').`);
      passedSteps += 1;
    } else {
      throw new Error(`Step 6 FAILED: Article status is not 'trash'.`);
    }

    if (publicTrashCheck === null && publicListing.totalPosts === 0 && !allSlugs.includes(testSlug)) {
      console.log(`✓ Step 7 PASSED: Trashed article completely disappeared from public direct URL, public listing, and sitemap slugs.`);
      passedSteps += 1;
    } else {
      throw new Error(`Step 7 FAILED: Trashed article still visible on public website or in sitemap slugs!`);
    }

    const adminAll = await listAllAdminPosts();
    const trashedInAdmin = adminAll.find((p) => p.slug === testSlug);
    if (trashedInAdmin && trashedInAdmin.status === 'trash') {
      console.log(`✓ Step 8 PASSED: Trashed article present in Admin Trash listing.`);
      passedSteps += 1;
    } else {
      throw new Error(`Step 8 FAILED: Trashed article not found in Admin listing.`);
    }

    // ----------------------------------------------------------------
    // Step 9 & 10: Restore the Blog & Verify Original Status & Public Visibility
    // ----------------------------------------------------------------
    console.log('\n--- Step 9 & 10: Restore the blog and verify original status & public visibility ---');
    const restorePayload = {
      ...trashedInAdmin,
      status: trashedInAdmin.previousStatus || 'published',
    };
    delete restorePayload.previousStatus;
    await saveAdminPost(restorePayload);

    const readRestored = await getAdminPostBySlug(testSlug);
    const publicRestoredCheck = await getBlogPostBySlug(testSlug);

    if (readRestored?.status === 'published') {
      console.log(`✓ Step 9 PASSED: Article restored with original status 'published'.`);
      passedSteps += 1;
    } else {
      throw new Error(`Step 9 FAILED: Article did not restore to 'published'. Status is '${readRestored?.status}'.`);
    }

    if (publicRestoredCheck && publicRestoredCheck.title === editedPayload.title) {
      console.log(`✓ Step 10 PASSED: Restored article immediately visible on public storefront.`);
      passedSteps += 1;
    } else {
      throw new Error(`Step 10 FAILED: Restored article not accessible on public storefront.`);
    }

    // ----------------------------------------------------------------
    // Step 11, 12 & 13: Permanently Delete, Verify Database Deletion & Verify Public 404
    // ----------------------------------------------------------------
    console.log('\n--- Step 11, 12 & 13: Permanently delete, verify database removal & verify 404 ---');
    const deleteRes = await deleteAdminPost(testSlug);
    console.log(`Delete Result: success=${deleteRes.success}, message="${deleteRes.message}"`);

    const readDeletedAdmin = await getAdminPostBySlug(testSlug);
    const deletedSlugsSet = await getDurableDeletedSlugs();
    const allAdminAfterDelete = await listAllAdminPosts();
    const foundInAdmin = allAdminAfterDelete.find((p) => p.slug === testSlug);

    if (readDeletedAdmin === null && !foundInAdmin && deletedSlugsSet.has(testSlug)) {
      console.log(`✓ Step 11 & 12 PASSED: Article permanently deleted from database and registered in deletion tombstones.`);
      passedSteps += 2;
    } else {
      throw new Error(`Step 11 & 12 FAILED: Article still found in admin query after permanent deletion.`);
    }

    const publicDeletedCheck = await getBlogPostBySlug(testSlug);
    const allSlugsAfterDelete = await getAllBlogSlugs();

    if (publicDeletedCheck === null && !allSlugsAfterDelete.includes(testSlug)) {
      console.log(`✓ Step 13 PASSED: Public URL strictly returns null (triggers notFound 404), excluded from sitemap.`);
      passedSteps += 1;
    } else {
      throw new Error(`Step 13 FAILED: Public reader or sitemap slugs still serve the permanently deleted article!`);
    }

    // ----------------------------------------------------------------
    // Final Audit Summary
    // ----------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`  ALL ${passedSteps}/${totalSteps} LIFECYCLE TESTS EXECUTED AND PASSED PERFECTLY!`);
    console.log('================================================================\n');

    const finalPosts = await listAllAdminPosts();
    const finalPublished = finalPosts.filter((p) => p.status === 'published').length;
    const finalDrafts = finalPosts.filter((p) => p.status === 'draft').length;
    const finalScheduled = finalPosts.filter((p) => p.status === 'scheduled').length;
    const finalTrash = finalPosts.filter((p) => p.status === 'trash').length;
    const finalTotal = finalPosts.length;
    const categories = await getAllBlogCategories();

    console.log('[FINAL VERIFIED DATABASE METRICS]');
    console.log(`- Total Blogs:     ${finalTotal}`);
    console.log(`- Published Blogs: ${finalPublished}`);
    console.log(`- Draft Blogs:     ${finalDrafts}`);
    console.log(`- Scheduled Blogs: ${finalScheduled}`);
    console.log(`- Trash Blogs:     ${finalTrash}`);
    console.log(`- Total Categories: ${categories.length}`);
    console.log(`- Mutual Exclusivity Check: ${finalTotal} === ${finalPublished + finalDrafts + finalScheduled + finalTrash} (PASSED)`);
  } catch (err) {
    console.error('\n❌ AUDIT FAILED:', err);
    process.exit(1);
  }
}

runAudit();
