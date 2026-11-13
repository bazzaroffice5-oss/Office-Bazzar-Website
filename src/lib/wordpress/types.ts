export interface WordPressMedia {
  id: number;
  source_url: string;
  alt_text?: string;
  media_details?: {
    width?: number;
    height?: number;
    sizes?: Record<
      string,
      {
        source_url: string;
        width: number;
        height: number;
        mime_type?: string;
      }
    >;
  };
}

export interface WordPressAuthor {
  id: number;
  name: string;
  url?: string;
  description?: string;
  link?: string;
  slug?: string;
  avatar_urls?: Record<string, string>;
}

export interface WordPressTerm {
  id: number;
  link: string;
  name: string;
  slug: string;
  taxonomy: 'category' | 'post_tag' | string;
}

export interface WordPressEmbedded {
  author?: WordPressAuthor[];
  'wp:featuredmedia'?: WordPressMedia[];
  'wp:term'?: WordPressTerm[][];
}

export interface RankMathHeadTag {
  tag: string;
  attributes?: Record<string, string>;
  content?: string;
}

export interface WordPressPost {
  id: number;
  date: string;
  date_gmt: string;
  guid: { rendered: string };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: 'publish' | 'future' | 'draft' | 'pending' | 'private' | 'trash';
  type: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string; protected?: boolean };
  excerpt: { rendered: string; protected?: boolean };
  author: number;
  featured_media: number;
  comment_status: string;
  ping_status: string;
  sticky: boolean;
  template: string;
  format: string;
  categories: number[];
  tags: number[];
  _embedded?: WordPressEmbedded;

  // Rank Math / Yoast REST API integration fields
  yoast_head_json?: {
    title?: string;
    description?: string;
    canonical?: string;
    og_title?: string;
    og_description?: string;
    og_url?: string;
    og_site_name?: string;
    og_image?: Array<{ url: string; width?: number; height?: number }>;
    article_published_time?: string;
    article_modified_time?: string;
    schema?: Record<string, unknown>;
  };
  rank_math_title?: string;
  rank_math_description?: string;
  rank_math_focus_keyword?: string;
  rank_math_canonical_url?: string;
  head_tags?: RankMathHeadTag[];
}

export interface WordPressCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent: number;
}

export interface WordPressTag {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
}

/**
 * Unified representation used across Next.js components and SEO helpers.
 * Bridges both live WordPress REST posts and fallback static posts seamlessly.
 */
export interface UnifiedBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  category: string;
  categories: string[];
  tags: string[];
  readTime: string;
  publishedDate: string;
  publishedIsoDate: string;
  modifiedIsoDate: string;
  author: string;
  imageUrl: string;
  imageAlt: string;
  isWordPress: boolean;
  seo?: {
    title?: string;
    description?: string;
    canonical?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    schema?: Record<string, unknown>;
    focusKeyword?: string;
  };
}

