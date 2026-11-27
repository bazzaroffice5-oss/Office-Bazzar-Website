'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function PageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedRef = useRef<string>('');

  useEffect(() => {
    if (!pathname) return;

    // Do not track admin panels, api, or static assets
    if (
      pathname.startsWith('/product-admin-panel') ||
      pathname.startsWith('/blog-admin-panel') ||
      pathname.startsWith('/analytics-admin-panel') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/api')
    ) {
      return;
    }

    const currentFull = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
    if (lastTrackedRef.current === currentFull) {
      return;
    }
    lastTrackedRef.current = currentFull;

    try {
      const payload = JSON.stringify({
        path: pathname,
        referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
      });

      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/track-visit', blob);
      } else {
        fetch('/api/track-visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {}
  }, [pathname, searchParams]);

  return null;
}
