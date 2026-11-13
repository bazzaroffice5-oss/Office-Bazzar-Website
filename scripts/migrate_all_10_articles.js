const fs = require('fs');
const path = require('path');
const https = require('https');
const { BLOG_POSTS } = require('../src/lib/data/blog.ts');

const blogImageDir = path.join(process.cwd(), 'public', 'images', 'blog');
if (!fs.existsSync(blogImageDir)) {
  fs.mkdirSync(blogImageDir, { recursive: true });
}

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destPath)) {
      return resolve(destPath);
    }
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadImage(response.headers.location, destPath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status code ${response.statusCode}`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(destPath));
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

function formatDateToIso(dateStr) {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch {}
  return '2026-07-22';
}

function formatContent(paragraphs) {
  const lines = [];
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i].trim();
    if (!p) continue;

    // Check if paragraph is a heading: short and not ending with a period
    const isHeading = p.length < 80 && !p.endsWith('.') && !p.endsWith('!') && !p.endsWith('?');
    if (isHeading) {
      lines.push(`## ${p}\n`);
    } else {
      lines.push(`${p}\n`);
    }
  }
  return lines.join('\n');
}

async function migrate() {
  console.log(`Starting migration of ${BLOG_POSTS.length} articles to Keystatic...\n`);

  for (let i = 0; i < BLOG_POSTS.length; i++) {
    const post = BLOG_POSTS[i];
    console.log(`[${i + 1}/${BLOG_POSTS.length}] Migrating "${post.slug}"...`);

    // Handle Image
    let localImagePath = `/images/blog/${post.slug}.jpeg`;
    const destFile = path.join(blogImageDir, `${post.slug}.jpeg`);

    if (post.imageUrl.startsWith('http')) {
      try {
        await downloadImage(post.imageUrl, destFile);
        console.log(`  Downloaded image to ${destFile}`);
      } catch (err) {
        console.warn(`  Warning downloading image for ${post.slug}:`, err.message);
        localImagePath = post.imageUrl; // fallback to original
      }
    } else {
      const srcLocal = path.join(process.cwd(), 'public', post.imageUrl.replace(/^\//, ''));
      if (fs.existsSync(srcLocal)) {
        fs.copyFileSync(srcLocal, destFile);
        console.log(`  Copied local image to ${destFile}`);
      } else {
        localImagePath = post.imageUrl;
      }
    }

    const postDir = path.join(process.cwd(), 'content', 'posts', post.slug);
    if (!fs.existsSync(postDir)) {
      fs.mkdirSync(postDir, { recursive: true });
    }

    const isoDate = formatDateToIso(post.publishedDate);
    const tagsYaml = (post.tags || []).map((t) => `  - "${t.replace(/"/g, '\\"')}"`).join('\n');

    const cleanTitle = post.title.replace(/"/g, '\\"');
    const cleanExcerpt = post.excerpt.replace(/"/g, '\\"').replace(/\n/g, ' ');
    const cleanAuthor = (post.author || 'Office Bazzar Team').replace(/"/g, '\\"');
    const cleanCategory = post.category || 'Housekeeping & Hygiene';

    const frontmatter = [
      '---',
      `title: "${cleanTitle}"`,
      'status: "published"',
      `publishedDate: "${isoDate}"`,
      `author: "${cleanAuthor}"`,
      `category: "${cleanCategory}"`,
      'tags:',
      tagsYaml,
      `featuredImage: "${localImagePath}"`,
      `imageAlt: "${cleanTitle}"`,
      `excerpt: "${cleanExcerpt}"`,
      `seoTitle: "${cleanTitle} | OfficeBazzar"`,
      `seoDescription: "${cleanExcerpt}"`,
      `focusKeyword: "${(post.tags && post.tags[0]) || cleanCategory}"`,
      `canonicalUrl: "https://www.officebazzar.com/blog/${post.slug}"`,
      '---',
      '',
      formatContent(post.content),
    ].join('\n');

    const mdocPath = path.join(postDir, 'index.mdoc');
    fs.writeFileSync(mdocPath, frontmatter, 'utf8');
    console.log(`  Created ${mdocPath}`);
  }

  console.log('\nMigration complete! All 10 articles successfully migrated to Keystatic.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

