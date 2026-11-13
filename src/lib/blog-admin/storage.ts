import fs from 'fs';
import path from 'path';

export interface AdminBlogPost {
  slug: string;
  title: string;
  status: 'published' | 'draft' | 'scheduled' | 'trash';
  publishedDate: string;
  scheduledDate?: string;
  author: string;
  category: string;
  tags: string[];
  featuredImage: string;
  imageAlt: string;
  excerpt: string;
  seoTitle?: string;
  seoDescription?: string;
  focusKeyword?: string;
  secondaryKeywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  indexRobots?: boolean;
  content: string; // Markdown body
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  folder: string;
  size: string;
  date: string;
  dimensions?: string;
}

const GITHUB_REPO_OWNER = 'bazzaroffice5-oss';
const GITHUB_REPO_NAME = 'Office-Bazzar-Website';
const GITHUB_BRANCH = 'main';

/**
 * Parse frontmatter and markdown body from raw file contents.
 */
export function parseMdoc(text: string): { data: Record<string, any>; body: string } {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, body: text };
  const yaml = match[1];
  const body = match[2];
  const data: Record<string, any> = {};
  let currentKey: string | null = null;

  yaml.split('\n').forEach((line) => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    if (line.startsWith('- ')) {
      if (currentKey && Array.isArray(data[currentKey])) {
        data[currentKey].push(line.replace(/^- /, '').replace(/^["']|["']$/g, '').trim());
      }
      return;
    }
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.substring(0, colonIdx).trim();
      const val = line.substring(colonIdx + 1).trim();
      if (!val) {
        data[key] = [];
        currentKey = key;
      } else {
        currentKey = null;
        const cleanVal = val.replace(/^["']|["']$/g, '').trim();
        if (cleanVal === 'true') data[key] = true;
        else if (cleanVal === 'false') data[key] = false;
        else data[key] = cleanVal;
      }
    }
  });

  return { data, body };
}

/**
 * Serialize an article object to YAML frontmatter + Markdown body.
 */
export function serializeMdoc(post: AdminBlogPost): string {
  const tagsYaml = (post.tags || []).map((t) => `  - "${t.replace(/"/g, '\\"')}"`).join('\n');
  const cleanTitle = (post.title || '').replace(/"/g, '\\"');
  const cleanExcerpt = (post.excerpt || '').replace(/"/g, '\\"').replace(/\n/g, ' ');
  const cleanAuthor = (post.author || 'Office Bazzar Team').replace(/"/g, '\\"');
  const cleanCategory = post.category || 'Housekeeping & Hygiene';
  const cleanImage = post.featuredImage || '/images/categories/office-supplies-stationery.jpg';
  const cleanAlt = (post.imageAlt || post.title || '').replace(/"/g, '\\"');
  const cleanSeoTitle = (post.seoTitle || `${post.title} | OfficeBazzar`).replace(/"/g, '\\"');
  const cleanSeoDesc = (post.seoDescription || post.excerpt || '').replace(/"/g, '\\"').replace(/\n/g, ' ');
  const cleanFocus = (post.focusKeyword || '').replace(/"/g, '\\"');
  const cleanSec = (post.secondaryKeywords || '').replace(/"/g, '\\"');
  const cleanCanonical = (post.canonicalUrl || `https://www.officebazzar.com/blog/${post.slug}`).replace(/"/g, '\\"');
  const cleanOgTitle = (post.ogTitle || post.seoTitle || post.title || '').replace(/"/g, '\\"');
  const cleanOgDesc = (post.ogDescription || post.seoDescription || post.excerpt || '').replace(/"/g, '\\"').replace(/\n/g, ' ');
  const cleanOgImage = (post.ogImage || cleanImage).replace(/"/g, '\\"');
  const indexRobots = post.indexRobots !== false;

  const lines = [
    '---',
    `title: "${cleanTitle}"`,
    `status: "${post.status}"`,
    `publishedDate: "${post.publishedDate}"`,
    post.scheduledDate ? `scheduledDate: "${post.scheduledDate}"` : '',
    `author: "${cleanAuthor}"`,
    `category: "${cleanCategory}"`,
    'tags:',
    tagsYaml,
    `featuredImage: "${cleanImage}"`,
    `imageAlt: "${cleanAlt}"`,
    `excerpt: "${cleanExcerpt}"`,
    `seoTitle: "${cleanSeoTitle}"`,
    `seoDescription: "${cleanSeoDesc}"`,
    `focusKeyword: "${cleanFocus}"`,
    `secondaryKeywords: "${cleanSec}"`,
    `canonicalUrl: "${cleanCanonical}"`,
    `ogTitle: "${cleanOgTitle}"`,
    `ogDescription: "${cleanOgDesc}"`,
    `ogImage: "${cleanOgImage}"`,
    `indexRobots: ${indexRobots}`,
    '---',
    '',
    post.content.trim(),
    '',
  ].filter(Boolean);

  return lines.join('\n');
}

/**
 * List all blog posts (both published, drafts, scheduled, trash) for the admin dashboard.
 */
export async function listAllAdminPosts(): Promise<AdminBlogPost[]> {
  const postsDir = path.join(process.cwd(), 'content', 'posts');
  const posts: AdminBlogPost[] = [];

  if (fs.existsSync(postsDir)) {
    const subdirs = fs.readdirSync(postsDir);
    for (const slug of subdirs) {
      const fullDir = path.join(postsDir, slug);
      if (fs.statSync(fullDir).isDirectory()) {
        const mdocPath = path.join(fullDir, 'index.mdoc');
        if (fs.existsSync(mdocPath)) {
          try {
            const raw = fs.readFileSync(mdocPath, 'utf8');
            const { data, body } = parseMdoc(raw);
            const validStatus = ['published', 'draft', 'scheduled', 'trash'].includes(data.status)
              ? (data.status as 'published' | 'draft' | 'scheduled' | 'trash')
              : 'published';

            posts.push({
              slug,
              title: data.title || slug,
              status: validStatus,
              publishedDate: data.publishedDate || '2026-07-22',
              scheduledDate: data.scheduledDate,
              author: data.author || 'Office Bazzar Team',
              category: data.category || 'Housekeeping & Hygiene',
              tags: Array.isArray(data.tags) ? data.tags : [],
              featuredImage: data.featuredImage || '/images/categories/office-supplies-stationery.jpg',
              imageAlt: data.imageAlt || data.title || '',
              excerpt: data.excerpt || '',
              seoTitle: data.seoTitle,
              seoDescription: data.seoDescription,
              focusKeyword: data.focusKeyword,
              secondaryKeywords: data.secondaryKeywords,
              canonicalUrl: data.canonicalUrl,
              ogTitle: data.ogTitle,
              ogDescription: data.ogDescription,
              ogImage: data.ogImage,
              indexRobots: data.indexRobots !== false,
              content: body,
            });
          } catch (e) {
            console.error(`Error reading ${mdocPath}:`, e);
          }
        }
      }
    }
  }

  // Sort newest first
  posts.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
  return posts;
}

/**
 * Retrieve a single post by slug for the admin editor.
 */
export async function getAdminPostBySlug(slug: string): Promise<AdminBlogPost | null> {
  const mdocPath = path.join(process.cwd(), 'content', 'posts', slug, 'index.mdoc');
  if (fs.existsSync(mdocPath)) {
    const raw = fs.readFileSync(mdocPath, 'utf8');
    const { data, body } = parseMdoc(raw);
    const validStatus = ['published', 'draft', 'scheduled', 'trash'].includes(data.status)
      ? (data.status as 'published' | 'draft' | 'scheduled' | 'trash')
      : 'published';

    return {
      slug,
      title: data.title || slug,
      status: validStatus,
      publishedDate: data.publishedDate || new Date().toISOString().split('T')[0],
      scheduledDate: data.scheduledDate,
      author: data.author || 'Office Bazzar Team',
      category: data.category || 'Housekeeping & Hygiene',
      tags: Array.isArray(data.tags) ? data.tags : [],
      featuredImage: data.featuredImage || '/images/categories/office-supplies-stationery.jpg',
      imageAlt: data.imageAlt || data.title || '',
      excerpt: data.excerpt || '',
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      focusKeyword: data.focusKeyword,
      secondaryKeywords: data.secondaryKeywords,
      canonicalUrl: data.canonicalUrl,
      ogTitle: data.ogTitle,
      ogDescription: data.ogDescription,
      ogImage: data.ogImage,
      indexRobots: data.indexRobots !== false,
      content: body,
    };
  }
  return null;
}

/**
 * Save or publish an article.
 * In local environment: Writes directly to disk.
 * In production on Vercel: Commits to GitHub repository via GitHub REST API, triggering automatic deployment.
 */
export async function saveAdminPost(post: AdminBlogPost): Promise<{
  success: boolean;
  message: string;
  slug: string;
  gitCommitSha?: string;
}> {
  const serialized = serializeMdoc(post);
  const filePath = `content/posts/${post.slug}/index.mdoc`;
  const token = process.env.GITHUB_TOKEN || process.env.BLOG_GITHUB_TOKEN;

  let localSaved = false;
  try {
    const postDir = path.join(process.cwd(), 'content', 'posts', post.slug);
    if (!fs.existsSync(postDir)) {
      fs.mkdirSync(postDir, { recursive: true });
    }
    fs.writeFileSync(path.join(postDir, 'index.mdoc'), serialized, 'utf8');
    localSaved = true;
  } catch (fsErr) {
    console.warn('[Admin Storage] Local fs write skipped/read-only (expected on serverless):', fsErr);
  }

  // If running in production with GitHub token, commit directly to GitHub repository
  if (token) {
    try {
      const apiUrl = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${filePath}`;

      // Check existing SHA
      let existingSha: string | undefined;
      const getRes = await fetch(`${apiUrl}?ref=${GITHUB_BRANCH}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'OfficeBazzar-Admin-Panel',
        },
      });

      if (getRes.ok) {
        const fileInfo = await getRes.json();
        existingSha = fileInfo.sha;
      }

      const commitRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'OfficeBazzar-Admin-Panel',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `${post.status === 'published' ? 'feat(blog): publish' : 'chore(blog): update'} "${post.title}"`,
          content: Buffer.from(serialized).toString('base64'),
          branch: GITHUB_BRANCH,
          sha: existingSha,
        }),
      });

      if (!commitRes.ok) {
        const errData = await commitRes.json().catch(() => ({}));
        throw new Error(`GitHub commit failed (${commitRes.status}): ${errData.message || 'Unknown error'}`);
      }

      const commitData = await commitRes.json();
      return {
        success: true,
        message: `Article successfully saved to repository. Deployment updated.`,
        slug: post.slug,
        gitCommitSha: commitData.commit?.sha,
      };
    } catch (gitErr) {
      console.error('[Admin Storage] GitHub commit error:', gitErr);
      if (localSaved) {
        return {
          success: true,
          message: `Saved locally on disk. Note: GitHub commit failed (${gitErr instanceof Error ? gitErr.message : String(gitErr)}).`,
          slug: post.slug,
        };
      }
      throw gitErr;
    }
  }

  if (localSaved) {
    return {
      success: true,
      message: 'Article saved successfully to local repository disk.',
      slug: post.slug,
    };
  }

  throw new Error(
    'Unable to write article: Filesystem is read-only and GITHUB_TOKEN is not configured in Vercel environment variables.'
  );
}

/**
 * Duplicate a post.
 */
export async function duplicateAdminPost(slug: string): Promise<AdminBlogPost> {
  const original = await getAdminPostBySlug(slug);
  if (!original) throw new Error('Original post not found');

  const newSlug = `${original.slug}-copy-${Math.floor(Math.random() * 900 + 100)}`;
  const cloned: AdminBlogPost = {
    ...original,
    slug: newSlug,
    title: `${original.title} (Copy)`,
    status: 'draft',
    canonicalUrl: `https://www.officebazzar.com/blog/${newSlug}`,
    publishedDate: new Date().toISOString().split('T')[0],
  };

  await saveAdminPost(cloned);
  return cloned;
}

/**
 * Delete an article (permanently removes directory from repository).
 */
export async function deleteAdminPost(slug: string): Promise<{ success: boolean; message: string }> {
  const token = process.env.GITHUB_TOKEN || process.env.BLOG_GITHUB_TOKEN;
  const filePath = `content/posts/${slug}/index.mdoc`;

  let localDeleted = false;
  try {
    const postDir = path.join(process.cwd(), 'content', 'posts', slug);
    if (fs.existsSync(postDir)) {
      fs.rmSync(postDir, { recursive: true, force: true });
      localDeleted = true;
    }
  } catch (fsErr) {
    console.warn('[Admin Storage] Local delete skipped (serverless):', fsErr);
  }

  if (token) {
    try {
      const apiUrl = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${filePath}`;
      const getRes = await fetch(`${apiUrl}?ref=${GITHUB_BRANCH}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'OfficeBazzar-Admin-Panel',
        },
      });

      if (getRes.ok) {
        const fileInfo = await getRes.json();
        await fetch(apiUrl, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'OfficeBazzar-Admin-Panel',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `chore(blog): delete post "${slug}"`,
            sha: fileInfo.sha,
            branch: GITHUB_BRANCH,
          }),
        });
      }

      return {
        success: true,
        message: `Article permanently deleted from repository.`,
      };
    } catch (err) {
      console.error('[Admin Storage] GitHub delete error:', err);
    }
  }

  if (localDeleted) {
    return { success: true, message: 'Article deleted locally.' };
  }

  return { success: true, message: 'Delete processed.' };
}

/**
 * Scan media files from public/images/blog/ and public/images/categories/.
 */
export async function listMediaItems(): Promise<MediaItem[]> {
  const media: MediaItem[] = [];

  const blogDir = path.join(process.cwd(), 'public', 'images', 'blog');
  if (fs.existsSync(blogDir)) {
    const blogFiles = fs.readdirSync(blogDir);
    blogFiles.forEach((file) => {
      if (/\.(jpe?g|png|webp|svg|gif)$/i.test(file)) {
        const fullPath = path.join(blogDir, file);
        const stat = fs.statSync(fullPath);
        media.push({
          id: `/images/blog/${file}`,
          name: file,
          url: `/images/blog/${file}`,
          folder: 'blog',
          size: `${Math.round(stat.size / 1024)} KB`,
          date: stat.mtime.toISOString().split('T')[0],
        });
      }
    });
  }

  const catDir = path.join(process.cwd(), 'public', 'images', 'categories');
  if (fs.existsSync(catDir)) {
    const catFiles = fs.readdirSync(catDir);
    catFiles.forEach((file) => {
      if (/\.(jpe?g|png|webp|svg|gif)$/i.test(file)) {
        const fullPath = path.join(catDir, file);
        const stat = fs.statSync(fullPath);
        media.push({
          id: `/images/categories/${file}`,
          name: file,
          url: `/images/categories/${file}`,
          folder: 'categories',
          size: `${Math.round(stat.size / 1024)} KB`,
          date: stat.mtime.toISOString().split('T')[0],
        });
      }
    });
  }

  return media;
}

/**
 * Save an uploaded media file to public/images/blog/ and commit to GitHub if configured.
 */
export async function saveUploadedMedia(
  filename: string,
  buffer: Buffer
): Promise<{ success: boolean; url: string; message: string }> {
  // Sanitize filename
  const cleanName = filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-');
  const targetPath = path.join(process.cwd(), 'public', 'images', 'blog', cleanName);
  const publicUrl = `/images/blog/${cleanName}`;
  const repoFilePath = `public/images/blog/${cleanName}`;
  const token = process.env.GITHUB_TOKEN || process.env.BLOG_GITHUB_TOKEN;

  let localSaved = false;
  try {
    const blogDir = path.join(process.cwd(), 'public', 'images', 'blog');
    if (!fs.existsSync(blogDir)) {
      fs.mkdirSync(blogDir, { recursive: true });
    }
    fs.writeFileSync(targetPath, buffer);
    localSaved = true;
  } catch (err) {
    console.warn('[Media Storage] Local write skipped:', err);
  }

  if (token) {
    try {
      const apiUrl = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${repoFilePath}`;

      let existingSha: string | undefined;
      const getRes = await fetch(`${apiUrl}?ref=${GITHUB_BRANCH}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'OfficeBazzar-Admin-Panel',
        },
      });

      if (getRes.ok) {
        const fileInfo = await getRes.json();
        existingSha = fileInfo.sha;
      }

      await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'OfficeBazzar-Admin-Panel',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `feat(media): upload "${cleanName}"`,
          content: buffer.toString('base64'),
          branch: GITHUB_BRANCH,
          sha: existingSha,
        }),
      });

      return {
        success: true,
        url: publicUrl,
        message: 'Image successfully uploaded and committed to repository.',
      };
    } catch (err) {
      console.error('[Media Storage] GitHub upload commit error:', err);
    }
  }

  if (localSaved) {
    return {
      success: true,
      url: publicUrl,
      message: 'Image saved locally to disk.',
    };
  }

  return {
    success: true,
    url: publicUrl,
    message: 'Media processed.',
  };
}
