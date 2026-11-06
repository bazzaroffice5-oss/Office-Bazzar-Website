/**
 * Image URL versioning utility for immutable CDN cache invalidation.
 * Appends a version query string (?v=...) to all internal product image URLs
 * so that updated images immediately bypass stale edge and browser caches upon deployment.
 */
export const CATALOG_IMAGE_VERSION = '20261106_v3';

export function getVersionedImageUrl(url: string | null | undefined): string {
  if (!url) return `/assets/placeholder-product.svg?v=${CATALOG_IMAGE_VERSION}`;
  if (
    url.includes('?v=') ||
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  return `${url}?v=${CATALOG_IMAGE_VERSION}`;
}

