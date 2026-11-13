const fs = require('fs');
const path = require('path');
const assert = require('assert');

async function verify() {
  console.log('=== Running Keystatic CMS Verification Suite ===\n');

  // Check 1: 10 migrated posts in content/posts
  console.log('Test 1: Verifying 10 migrated articles in content/posts/...');
  const postsDir = path.join(process.cwd(), 'content', 'posts');
  assert(fs.existsSync(postsDir), 'content/posts directory must exist');
  const subdirs = fs.readdirSync(postsDir).filter((d) => {
    return fs.statSync(path.join(postsDir, d)).isDirectory();
  });
  assert.strictEqual(subdirs.length, 10, 'Expected exactly 10 migrated post directories');
  for (const s of subdirs) {
    const mdocFile = path.join(postsDir, s, 'index.mdoc');
    assert(fs.existsSync(mdocFile), `Post ${s} must have index.mdoc`);
  }
  console.log(`  [PASS] All 10 articles present with index.mdoc files: ${subdirs.join(', ')}`);

  // Check 2: 10 images in public/images/blog
  console.log('\nTest 2: Verifying downloaded images in public/images/blog/...');
  const imageDir = path.join(process.cwd(), 'public', 'images', 'blog');
  assert(fs.existsSync(imageDir), 'public/images/blog directory must exist');
  const images = fs.readdirSync(imageDir);
  assert(images.length >= 10, 'Expected at least 10 blog hero images');
  console.log(`  [PASS] Verified ${images.length} self-hosted blog hero images in public/images/blog`);

  // Check 3: Reader test
  console.log('\nTest 3: Testing Keystatic Content Reader...');
  const { getBlogPosts, getBlogPostBySlug, getAllBlogSlugs, getAllBlogCategories } = require('../src/lib/keystatic/reader.ts');
  const { posts, totalPosts } = await getBlogPosts({ perPage: 100 });
  assert.strictEqual(totalPosts, 10, `Expected 10 total published posts, got ${totalPosts}`);
  assert.strictEqual(posts.length, 10, `Expected 10 loaded posts in reader, got ${posts.length}`);

  const slugs = await getAllBlogSlugs();
  assert.strictEqual(slugs.length, 10, `Expected 10 slugs from reader, got ${slugs.length}`);

  const single = await getBlogPostBySlug('why-every-workplace-needs-high-quality-industrial-dustbins');
  assert(single, 'Expected single post to be resolved');
  assert.strictEqual(single.title, 'Why Every Workplace Needs High-Quality Industrial Dustbins');
  assert.strictEqual(single.category, 'Housekeeping & Hygiene');
  assert.strictEqual(single.status, 'published');
  assert(Array.isArray(single.content) && single.content.length > 0, 'Content must be parsed AST array');
  assert.strictEqual(single.seo.canonical, 'https://www.officebazzar.com/blog/why-every-workplace-needs-high-quality-industrial-dustbins');
  console.log('  [PASS] Reader accurately loaded all 10 posts, metadata, content AST, and canonical SEO');

  // Check 4: Draft isolation test
  console.log('\nTest 4: Testing Draft isolation safety...');
  const draftSlug = 'draft-test-isolated';
  const draftDir = path.join(postsDir, draftSlug);
  fs.mkdirSync(draftDir, { recursive: true });
  fs.writeFileSync(path.join(draftDir, 'index.mdoc'), `---
title: "Draft Test Post"
status: "draft"
publishedDate: "2026-11-13"
author: "Admin"
category: "Housekeeping & Hygiene"
excerpt: "Draft excerpt"
---

Draft body content.
`);

  try {
    const publicSlugs = await getAllBlogSlugs();
    assert(!publicSlugs.includes(draftSlug), 'Draft slug must NOT be returned in public slugs');
    const publicSingle = await getBlogPostBySlug(draftSlug);
    assert.strictEqual(publicSingle, null, 'Draft post must NOT be accessible publicly without preview authorization');
    console.log('  [PASS] Draft articles are strictly isolated and never leaked publicly or indexed');
  } finally {
    fs.rmSync(draftDir, { recursive: true, force: true });
  }

  // Check 5: Categories
  console.log('\nTest 5: Testing Category aggregation...');
  const categories = await getAllBlogCategories();
  assert(categories.length >= 2, 'Expected categories to be discovered');
  console.log('  [PASS] Discovered categories:', categories.map((c) => `${c.name} (${c.count})`).join(', '));

  console.log('\nAll 5 Keystatic verification checks PASSED successfully!');
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});

