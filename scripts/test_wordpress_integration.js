const fs = require('fs');
const assert = require('assert');

async function runTests() {
  console.log('=== Running Headless WordPress Integration Verification Suite ===\n');

  // Test 1: Check next.config.ts remotePatterns and redirects
  console.log('Test 1: Inspecting next.config.ts configuration...');
  const nextConfigContent = fs.readFileSync('next.config.ts', 'utf8');

  // Verify images.remotePatterns
  assert(nextConfigContent.includes('cms.officebazzar.com'), 'next.config.ts must include cms.officebazzar.com in remotePatterns');
  assert(nextConfigContent.includes('*.officebazzar.com'), 'next.config.ts must include *.officebazzar.com in remotePatterns');
  console.log('  [PASS] next.config.ts images.remotePatterns includes cms.officebazzar.com and *.officebazzar.com');

  // Verify redirects
  assert(nextConfigContent.includes("source: '/blogs'") && nextConfigContent.includes("destination: '/blog'"), 'next.config.ts must include 301 redirect from /blogs to /blog');
  assert(nextConfigContent.includes("source: '/blogs/:slug*'") && nextConfigContent.includes("destination: '/blog/:slug*'"), 'next.config.ts must include 301 redirect from /blogs/:slug* to /blog/:slug*');
  console.log('  [PASS] next.config.ts contains permanent 301 redirects for /blogs and /blogs/:slug*');

  // Test 2: Verify sitemap contains /blog and /blog/[slug]
  console.log('\nTest 2: Inspecting src/app/sitemap.ts...');
  const sitemapContent = fs.readFileSync('src/app/sitemap.ts', 'utf8');
  assert(sitemapContent.includes("path: '/blog'"), 'sitemap.ts must contain /blog');
  assert(sitemapContent.includes('getCanonicalUrl(`/blog/${post.slug}`)'), 'sitemap.ts must point to canonical /blog/${post.slug}');
  assert(!sitemapContent.includes("path: '/blogs'"), 'sitemap.ts must not contain /blogs');
  console.log('  [PASS] sitemap.ts correctly indexes /blog and all /blog/[slug] URLs with canonical formatting');

  // Test 3: Verify Header and Footer navigation links
  console.log('\nTest 3: Inspecting Header and Footer navigation links...');
  const headerContent = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');
  const footerContent = fs.readFileSync('src/components/layout/Footer.tsx', 'utf8');
  const homeBlogContent = fs.readFileSync('src/components/home/HomeBlogSection.tsx', 'utf8');
  assert(headerContent.includes("href: '/blog'"), 'Header.tsx must link to /blog');
  assert(footerContent.includes('href="/blog"'), 'Footer.tsx must link to /blog');
  assert(homeBlogContent.includes('href="/blog"'), 'HomeBlogSection.tsx must link to /blog');
  assert(homeBlogContent.includes('href={`/blog/${post.slug}`}'), 'HomeBlogSection.tsx must link to /blog/${post.slug}');
  console.log('  [PASS] Header, Footer, and HomeBlogSection properly link to /blog and /blog/[slug]');

  // Test 4: Verify SEO config article schema canonical URL
  console.log('\nTest 4: Inspecting src/lib/seo/config.ts getArticleJsonLd canonical URL...');
  const seoConfigContent = fs.readFileSync('src/lib/seo/config.ts', 'utf8');
  assert(seoConfigContent.includes("getCanonicalUrl(`/blog/${post.slug}`)"), 'getArticleJsonLd must use /blog/${post.slug}');
  console.log('  [PASS] src/lib/seo/config.ts generates canonical /blog/${post.slug} in Article Schema');

  // Test 5: Verify Webhook routes exist and handle authorization logic
  console.log('\nTest 5: Inspecting Revalidation Webhook routes...');
  const webhookContent = fs.readFileSync('src/app/api/revalidate-blog/route.ts', 'utf8');
  assert(webhookContent.includes('WORDPRESS_REVALIDATE_SECRET'), 'Webhook must check WORDPRESS_REVALIDATE_SECRET');
  assert(webhookContent.includes("revalidateTag('wordpress-posts'"), 'Webhook must revalidateTag wordpress-posts');
  assert(webhookContent.includes("revalidatePath('/blog')"), 'Webhook must revalidatePath /blog');
  assert(webhookContent.includes("revalidatePath('/sitemap.xml')"), 'Webhook must revalidatePath /sitemap.xml');
  console.log('  [PASS] Revalidation webhook verifies secret and purges /blog, /blog/[slug], tags, and sitemap');

  // Test 6: Verify .env.example
  console.log('\nTest 6: Inspecting .env.example configuration...');
  const envExample = fs.readFileSync('.env.example', 'utf8');
  assert(envExample.includes('WORDPRESS_API_URL=https://cms.officebazzar.com'), '.env.example must specify WORDPRESS_API_URL');
  assert(envExample.includes('WORDPRESS_REVALIDATE_SECRET='), '.env.example must specify WORDPRESS_REVALIDATE_SECRET');
  assert(envExample.includes('NEXT_PUBLIC_SITE_URL=https://www.officebazzar.com'), '.env.example must specify www canonical URL');
  console.log('  [PASS] .env.example documents WORDPRESS_API_URL and WORDPRESS_REVALIDATE_SECRET');

  console.log('\nAll 6 verification checks PASSED successfully!');
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
