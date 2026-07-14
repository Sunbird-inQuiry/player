import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

// Mirrors the SCSS `m.compact` mixin (styles/mixins.scss) — narrow width OR
// short height. Kept in sync manually: SCSS can't export tokens to JS, and
// this is the one piece of "mobile-app-only" behavior that can't be done in
// pure CSS (it changes what's IN the DOM — paging the overview into two
// screens — not just how existing DOM looks).
const MOBILE_MAX_WIDTH = 768;
const SHORT_MAX_HEIGHT = 720;

/**
 * True when the player is effectively rendering as the mobile app — narrow
 * width (container-based, so it also matches the editor's mobile preview) OR
 * a short viewport (a real device in landscape). False on portal/desktop/
 * editor-desktop-preview, where nothing here should change behavior.
 */
export function useIsCompactViewport(containerRef: RefObject<HTMLElement>): boolean {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    // Both are unavailable under jsdom (no test env implements viewport
    // layout anyway) — fall back to the default `false` (today's single-page
    // layout), which is what every existing test already renders against.
    if (!el || typeof ResizeObserver === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const heightQuery = window.matchMedia(`(max-height: ${SHORT_MAX_HEIGHT}px)`);
    const update = () => {
      const width = el.getBoundingClientRect().width;
      setIsCompact(width <= MOBILE_MAX_WIDTH || heightQuery.matches);
    };

    const ro = new ResizeObserver(update);
    ro.observe(el);
    heightQuery.addEventListener('change', update);
    update();

    return () => {
      ro.disconnect();
      heightQuery.removeEventListener('change', update);
    };
  }, [containerRef]);

  return isCompact;
}
