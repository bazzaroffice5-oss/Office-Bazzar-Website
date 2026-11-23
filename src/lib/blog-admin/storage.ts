import fs from 'fs';
import path from 'path';
import os from 'os';
import { revalidatePath } from 'next/cache';
import { callKV, getKVConfig } from '@/lib/distributed/coordinator';

export interface AdminBlogPost {
  slug: string;
  title: string;
  status: 'published' | 'draft' | 'scheduled' | 'trash';
  previousStatus?: 'published' | 'draft' | 'scheduled';
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

// ----------------------------------------------------------------------
// Cache Invalidation Helper
// ----------------------------------------------------------------------

export function revalidateBlogCache(slug?: string) {
  try {
    revalidatePath('/blog');
    revalidatePath('/sitemap.xml');
    revalidatePath('/');
    if (slug) {
      revalidatePath(`/blog/${slug}`);
      revalidatePath('/blog/[slug]', 'page');
    }
  } catch (err) {
    // Non-critical in static export/build phases
    console.warn('[Cache Revalidation] Note:', err);
  }
}

// ----------------------------------------------------------------------
// Durable Store (Upstash Redis KV in Cloud / Local Journal File)
// ----------------------------------------------------------------------

interface LocalBlogState {
  version: 1;
  deletedSlugs: string[];
  posts: Record<string, AdminBlogPost>;
}

function getLocalStateFilePath(): string {
  try {
    const candidate = path.join(process.cwd(), 'src', 'lib', 'data', 'blog_storage_state.json');
    if (fs.existsSync(candidate)) return candidate;
    // Check if writable
    fs.accessSync(path.dirname(candidate), fs.constants.W_OK);
    return candidate;
  } catch {
    return path.join(os.tmpdir(), 'officebazzar_blog_storage_state.json');
  }
}

function readLocalBlogState(): LocalBlogState {
  const filePath = getLocalStateFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1) {
        return {
          version: 1,
          deletedSlugs: Array.isArray(parsed.deletedSlugs) ? parsed.deletedSlugs : [],
          posts: parsed.posts && typeof parsed.posts === 'object' ? parsed.posts : {},
        };
      }
    }
  } catch {
    // fallback
  }

  return {
    version: 1,
    deletedSlugs: [],
    posts: {},
  };
}

function writeLocalBlogState(state: LocalBlogState): void {
  const filePath = getLocalStateFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8');
  } catch {
    // Read-only serverless filesystem expected
  }
}

/**
 * Returns set of permanently deleted post slugs from cloud KV and local journal.
 */
export async function getDurableDeletedSlugs(): Promise<Set<string>> {
  const deletedSet = new Set<string>();

  // 1. Read local state
  const localState = readLocalBlogState();
  localState.deletedSlugs.forEach((s) => deletedSet.add(s));

  // 2. Read cloud KV if configured
  const kvConfig = getKVConfig();
  if (kvConfig) {
    try {
      const cloudMembers = await callKV<string[]>(['SMEMBERS', 'blog:deleted_slugs']);
      if (Array.isArray(cloudMembers)) {
        cloudMembers.forEach((s) => {
          if (s) deletedSet.add(s);
        });
      }
    } catch (e) {
      console.warn('[Durable Store] Error reading cloud deleted slugs:', e);
    }
  }

  return deletedSet;
}

/**
 * Returns map of posts stored or updated in durable storage.
 */
export async function getDurablePosts(): Promise<Map<string, AdminBlogPost>> {
  const postMap = new Map<string, AdminBlogPost>();

  // 1. Local state posts
  const localState = readLocalBlogState();
  for (const [slug, post] of Object.entries(localState.posts)) {
    if (post && post.slug) {
      postMap.set(slug, post);
    }
  }

  // 2. Cloud KV posts
  const kvConfig = getKVConfig();
  if (kvConfig) {
    try {
      const activeSlugs = await callKV<string[]>(['SMEMBERS', 'blog:all_slugs']);
      if (Array.isArray(activeSlugs) && activeSlugs.length > 0) {
        const fetchPromises = activeSlugs.map(async (slug) => {
          const raw = await callKV<string>(['GET', `blog:post:${slug}`]);
          if (raw) {
            try {
              const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
              if (parsed && parsed.slug) {
                return parsed as AdminBlogPost;
              }
            } catch {}
          }
          return null;
        });

        const cloudPosts = await Promise.all(fetchPromises);
        cloudPosts.forEach((cp) => {
          if (cp) postMap.set(cp.slug, cp);
        });
      }
    } catch (e) {
      console.warn('[Durable Store] Error reading cloud posts:', e);
    }
  }

  return postMap;
}

/**
 * Persist an article to durable storage (cloud KV + local journal).
 */
export async function saveDurablePost(post: AdminBlogPost): Promise<void> {
  // Update local journal
  const localState = readLocalBlogState();
  localState.deletedSlugs = localState.deletedSlugs.filter((s) => s !== post.slug);
  localState.posts[post.slug] = post;
  writeLocalBlogState(localState);

  // Update cloud KV
  const kvConfig = getKVConfig();
  if (kvConfig) {
    try {
      await Promise.all([
        callKV(['SET', `blog:post:${post.slug}`, JSON.stringify(post)]),
        callKV(['SADD', 'blog:all_slugs', post.slug]),
        callKV(['SREM', 'blog:deleted_slugs', post.slug]),
        callKV(['DEL', `blog:deleted:${post.slug}`]),
      ]);
    } catch (e) {
      console.warn('[Durable Store] Cloud KV save warning:', e);
    }
  }
}

/**
 * Permanently deletes an article from durable storage.
 */
export async function deleteDurablePost(slug: string): Promise<void> {
  // Update local journal
  const localState = readLocalBlogState();
  if (!localState.deletedSlugs.includes(slug)) {
    localState.deletedSlugs.push(slug);
  }
  delete localState.posts[slug];
  writeLocalBlogState(localState);

  // Update cloud KV
  const kvConfig = getKVConfig();
  if (kvConfig) {
    try {
      await Promise.all([
        callKV(['DEL', `blog:post:${slug}`]),
        callKV(['SREM', 'blog:all_slugs', slug]),
        callKV(['SADD', 'blog:deleted_slugs', slug]),
        callKV(['SET', `blog:deleted:${slug}`, '1']),
      ]);
    } catch (e) {
      console.warn('[Durable Store] Cloud KV delete warning:', e);
    }
  }
}

// ----------------------------------------------------------------------
// Frontmatter & Markdown Serialization
// ----------------------------------------------------------------------

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
    post.previousStatus ? `previousStatus: "${post.previousStatus}"` : '',
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

// ----------------------------------------------------------------------
// Admin Operations (List, Get, Save, Duplicate, Delete)
// ----------------------------------------------------------------------

/**
 * List all blog posts (published, drafts, scheduled, trash) for the admin dashboard.
 * Merges filesystem baseline with durable storage overlays and removes deleted posts.
 */
export async function listAllAdminPosts(): Promise<AdminBlogPost[]> {
  const [deletedSlugs, durablePosts] = await Promise.all([
    getDurableDeletedSlugs(),
    getDurablePosts(),
  ]);

  const postsDir = path.join(process.cwd(), 'content', 'posts');
  const postMap = new Map<string, AdminBlogPost>();

  // 1. Read baseline posts from disk
  if (fs.existsSync(postsDir)) {
    const subdirs = fs.readdirSync(postsDir);
    for (const slug of subdirs) {
      if (deletedSlugs.has(slug)) continue; // Permanently deleted
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

            postMap.set(slug, {
              slug,
              title: data.title || slug,
              status: validStatus,
              previousStatus: data.previousStatus,
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

  // 2. Overlay durable storage posts (new creations or status updates)
  for (const [slug, durablePost] of durablePosts.entries()) {
    if (deletedSlugs.has(slug)) continue;
    postMap.set(slug, durablePost);
  }

  const posts = Array.from(postMap.values());
  // Sort newest first
  posts.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
  return posts;
}

/**
 * Retrieve a single post by slug for the admin editor.
 */
export async function getAdminPostBySlug(slug: string): Promise<AdminBlogPost | null> {
  const deletedSlugs = await getDurableDeletedSlugs();
  if (deletedSlugs.has(slug)) return null;

  // 1. Check durable store first
  const durablePosts = await getDurablePosts();
  if (durablePosts.has(slug)) {
    return durablePosts.get(slug)!;
  }

  // 2. Check disk
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
      previousStatus: data.previousStatus,
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
 * Saves to authoritative durable store, disk (if local), and commits to GitHub if configured.
 * Automatically invalidates Next.js caches across all public routes.
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

  // 1. Write to local disk if writable
  try {
    const postDir = path.join(process.cwd(), 'content', 'posts', post.slug);
    if (!fs.existsSync(postDir)) {
      fs.mkdirSync(postDir, { recursive: true });
    }
    fs.writeFileSync(path.join(postDir, 'index.mdoc'), serialized, 'utf8');
  } catch {
    // Read-only serverless filesystem expected
  }

  // 2. Persist to authoritative durable store (Cloud KV / Local journal)
  await saveDurablePost(post);

  // 3. Commit to GitHub repository if token is present
  let gitSha: string | undefined;
  if (token) {
    try {
      const apiUrl = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${filePath}`;

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
          message: `${
            post.status === 'published'
              ? 'feat(blog): publish'
              : post.status === 'trash'
              ? 'chore(blog): trash'
              : 'chore(blog): update'
          } "${post.title}"`,
          content: Buffer.from(serialized).toString('base64'),
          branch: GITHUB_BRANCH,
          sha: existingSha,
        }),
      });

      if (commitRes.ok) {
        const commitData = await commitRes.json();
        gitSha = commitData.commit?.sha;
      }
    } catch (gitErr) {
      console.warn('[Admin Storage] GitHub commit warning:', gitErr);
    }
  }

  // 4. Invalidate relevant caches immediately
  revalidateBlogCache(post.slug);

  const statusMsg =
    post.status === 'published'
      ? 'Article published live successfully.'
      : post.status === 'trash'
      ? 'Article moved to trash.'
      : post.status === 'scheduled'
      ? 'Article scheduled successfully.'
      : 'Article saved as draft.';

  return {
    success: true,
    message: statusMsg,
    slug: post.slug,
    gitCommitSha: gitSha,
  };
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
 * Delete an article permanently.
 * Removes from disk if writable, marks deleted in durable store, removes from GitHub if configured,
 * and purges all public and sitemap caches.
 */
export async function deleteAdminPost(slug: string): Promise<{ success: boolean; message: string }> {
  // 1. Verify article existence
  const existing = await getAdminPostBySlug(slug);
  if (!existing) {
    const deletedSlugs = await getDurableDeletedSlugs();
    if (deletedSlugs.has(slug)) {
      return { success: true, message: `Article "${slug}" is already deleted.` };
    }
    throw new Error(`Article "${slug}" not found in database.`);
  }

  const token = process.env.GITHUB_TOKEN || process.env.BLOG_GITHUB_TOKEN;
  const filePath = `content/posts/${slug}/index.mdoc`;

  // 2. Delete from local disk if writable
  try {
    const postDir = path.join(process.cwd(), 'content', 'posts', slug);
    if (fs.existsSync(postDir)) {
      fs.rmSync(postDir, { recursive: true, force: true });
    }
  } catch {
    // Read-only serverless filesystem expected
  }

  // 3. Delete from durable store and register permanent deletion tombstone
  await deleteDurablePost(slug);

  // 4. Delete from GitHub if token is configured
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
    } catch (err) {
      console.warn('[Admin Storage] GitHub delete warning:', err);
    }
  }

  // 5. Purge caches
  revalidateBlogCache(slug);

  return {
    success: true,
    message: `Article "${slug}" permanently deleted from database.`,
  };
}

// ----------------------------------------------------------------------
// Media Library Operations
// ----------------------------------------------------------------------

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
  // Strict 2MB file size enforcement
  const MAX_FILE_SIZE = 2 * 1024 * 1024;
  if (buffer.length > MAX_FILE_SIZE) {
    return {
      success: false,
      url: '',
      message: `File size exceeds the 2MB limit. Please upload an image under 2MB.`,
    };
  }

  // Sanitize filename
  let cleanName = filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-');

  // Compress image to WebP (max 1400px, quality 82) to avoid repo/storage bloat
  let finalBuffer = buffer;
  const isSvg = cleanName.endsWith('.svg');
  if (!isSvg) {
    try {
      const sharpModule = await import('sharp');
      const sharp = sharpModule.default || sharpModule;
      finalBuffer = await sharp(buffer)
        .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
      cleanName = cleanName.replace(/\.[^.]+$/, '.webp');
    } catch (e) {
      console.warn('[BlogMedia] Image compression fallback:', e);
      finalBuffer = buffer;
    }
  }

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
    fs.writeFileSync(targetPath, finalBuffer);
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
          content: finalBuffer.toString('base64'),
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
