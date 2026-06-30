/**
 * Image / media resolution for question HTML.
 *
 * Mirrors the Angular player's `BaseQuestionDirective.resolveBody` contract so
 * authored QuML content renders identically:
 *  1. Empty `<figure class="image"></figure>` placeholders are filled, in order,
 *     from the question's `media` entries of type `image`.
 *  2. `<img data-asset-variable="id">` resolves its `src` from the matching media
 *     entry by `id`.
 *  3. Relative `<img src="...">` values are prefixed with `baseUrl`.
 *
 * Pure string→string, so it is safe for both `innerHTML` and
 * `dangerouslySetInnerHTML`.
 */

export interface MediaItem {
  id?: string;
  type?: string;
  mimeType?: string;
  src?: string;
  baseUrl?: string;
}

const ABSOLUTE = /^(https?:|data:|blob:|\/\/)/i;

/** Resolve one media/asset src against an optional baseUrl. */
function resolveSrc(src: string | undefined, baseUrl: string, mediaBaseUrl?: string): string {
  if (!src) return '';
  if (ABSOLUTE.test(src)) return src;
  if (baseUrl) return `${baseUrl.replace(/\/$/, '')}/${src.replace(/^\//, '')}`;
  if (mediaBaseUrl) return `${mediaBaseUrl.replace(/\/$/, '')}/${src.replace(/^\//, '')}`;
  return src;
}

function imageMedia(media: MediaItem[]): MediaItem[] {
  return (media || []).filter(
    (m) => m && (m.type === 'image' || /^image\//i.test(m.mimeType || '')),
  );
}

/**
 * Resolve image references inside a fragment of question HTML.
 * @param html    raw HTML (body / option label / answer / solution / hint)
 * @param media   the question's media entries (image entries are used)
 * @param baseUrl content base URL for relative asset paths
 */
export function resolveMediaHtml(
  html: string,
  media: MediaItem[] = [],
  baseUrl = '',
): string {
  if (!html) return '';
  const images = imageMedia(media);
  let out = html;

  // (2)+(3): fix existing <img> tags (asset variable → media src; relative → baseUrl).
  out = out.replace(/<img\b[^>]*>/gi, (tag) => {
    const idMatch = tag.match(/data-asset-variable=["']([^"']+)["']/i);
    const srcMatch = tag.match(/\ssrc=["']([^"']*)["']/i);
    let src: string | undefined = srcMatch?.[1];

    if (idMatch) {
      const m = images.find((x) => String(x.id) === idMatch[1]);
      if (m) src = resolveSrc(m.src, baseUrl, m.baseUrl);
    } else if (src !== undefined) {
      src = resolveSrc(src, baseUrl);
    }

    if (src === undefined) return tag;
    return srcMatch
      ? tag.replace(/\ssrc=["'][^"']*["']/i, ` src="${src}"`)
      : tag.replace(/^<img/i, `<img src="${src}"`);
  });

  // (1): fill empty <figure class="image"></figure> placeholders from media.
  if (images.length && /<figure\b[^>]*\bimage\b/i.test(out)) {
    let idx = 0;
    out = out.replace(
      /<figure\b[^>]*class="[^"]*\bimage\b[^"]*"[^>]*>\s*<\/figure>/gi,
      () => {
        const m = images[idx++];
        if (!m) return '<figure class="image"></figure>';
        const src = resolveSrc(m.src, baseUrl, m.baseUrl);
        return `<figure class="image"><img src="${src}" style="max-width:100%" alt="" /></figure>`;
      },
    );
  }

  return out;
}
