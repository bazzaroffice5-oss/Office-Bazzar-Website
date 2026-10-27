/**
 * Helper to resolve brand logo assets for product display
 */
const BRAND_LOGO_MAP: Record<string, string> = {
  '3m': '/images/brands/3m.png',
  'apsara': '/images/brands/apsara.png',
  'best-print': '/images/brands/best-print.png',
  'camlin': '/images/brands/camlin.png',
  'canon': '/images/brands/canon.png',
  'diversey': '/images/brands/diversey.png',
  'diversey-taski': '/images/brands/diversey.png',
  'taski': '/images/brands/diversey.png',
  'faber-castell': '/images/brands/faber-castell.png',
  'godrej': '/images/brands/godrej.png',
  'greenlime': '/images/brands/greenlime.png',
  'hi-clean': '/images/brands/hi-clean.png',
  'hindustan-unilever': '/images/brands/hindustan-unilever.png',
  'hul': '/images/brands/hindustan-unilever.png',
  'hp': '/images/brands/hp.png',
  'jk-paper': '/images/brands/jk-paper.png',
  'jk-copier': '/images/brands/jk-paper.png',
  'kimberly-clark': '/images/brands/kimberly-clark.png',
  'kimberly': '/images/brands/kimberly-clark.png',
  'nataraj': '/images/brands/nataraj.png',
  'reckitt-benckiser': '/images/brands/reckitt-benckiser.png',
  'reckitt': '/images/brands/reckitt-benckiser.png',
  'roots': '/images/brands/roots.png',
  'rorito': '/images/brands/rorito.png',
  'officebazzar': '/images/officebazzar-logo-transparent.png',
};

export function getBrandLogoUrl(brandNameOrSlug?: string, customLogoUrl?: string): string | null {
  if (customLogoUrl) return customLogoUrl;
  if (!brandNameOrSlug) return null;

  const normalized = brandNameOrSlug
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  if (BRAND_LOGO_MAP[normalized]) {
    return BRAND_LOGO_MAP[normalized];
  }

  // Check prefix matches (e.g. "diversey taski" -> "diversey")
  for (const [key, path] of Object.entries(BRAND_LOGO_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return path;
    }
  }

  return null;
}
