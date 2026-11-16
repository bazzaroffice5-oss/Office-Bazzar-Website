/**
 * Central Image URL Resolution & Versioning Utility
 *
 * Provides immutable CDN cache invalidation, format normalization,
 * and robust URL validation for all internal, CDN, external, and API-served product images.
 */

export const CATALOG_IMAGE_VERSION = '20261116_v32_durable_product_images';
export const FALLBACK_PRODUCT_IMAGE = '/assets/placeholder-product.svg';

export function getVersionedImageUrl(url: string | null | undefined): string {
  if (!url) return `${FALLBACK_PRODUCT_IMAGE}?v=${CATALOG_IMAGE_VERSION}`;
  const trimmed = url.trim();
  if (
    trimmed.includes('?v=') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  return `${trimmed}?v=${CATALOG_IMAGE_VERSION}`;
}

/**
 * Validates whether a given image source is a non-empty, renderable image path or URL.
 * Accepts:
 * - Relative URLs (/assets/..., /api/products/images/..., /images/..., /uploads/...)
 * - Absolute HTTPS / HTTP URLs (https://..., http://...)
 * - Data URIs (data:image/...)
 * - Blob URIs (blob:...)
 * Rejects:
 * - Null, undefined, empty strings, whitespace, or the fallback placeholder itself.
 */
export function isValidProductImageUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (
    trimmed === FALLBACK_PRODUCT_IMAGE ||
    trimmed.startsWith('/assets/placeholder-product.svg')
  ) {
    return false;
  }
  return (
    trimmed.startsWith('/') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:')
  );
}

/**
 * Resolves a product image URL, returning the versioned URL if valid, or the fallback placeholder.
 */
export function resolveProductImageUrl(
  url: unknown,
  fallback: string = FALLBACK_PRODUCT_IMAGE
): string {
  if (isValidProductImageUrl(url)) {
    return getVersionedImageUrl(url);
  }
  return getVersionedImageUrl(fallback);
}

/**
 * Resolves a list of product image URLs, returning an array of valid versioned URLs.
 * If no valid images exist, returns an array containing only the fallback placeholder.
 */
export function resolveProductImages(
  images: unknown,
  fallback: string = FALLBACK_PRODUCT_IMAGE
): string[] {
  if (Array.isArray(images)) {
    const valid = images
      .filter(isValidProductImageUrl)
      .map((img) => getVersionedImageUrl(img));
    if (valid.length > 0) return valid;
  }
  return [getVersionedImageUrl(fallback)];
}
