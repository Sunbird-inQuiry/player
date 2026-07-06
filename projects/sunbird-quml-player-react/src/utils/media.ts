/**
 * Image / media resolution for question HTML.
 *
 * This is a render-time (string) port of the Angular web-component's asset
 * resolution. Angular resolves assets by querying the live DOM AFTER render;
 * React rewrites the HTML string BEFORE injection. The resulting URLs are
 * identical — only the timing/mechanism differs.
 *
 * Angular sources mirrored here:
 *   - section-player.component.ts:setImageZoom()      → <img data-asset-variable>
 *   - base-question.directive.ts:resolveBody()        → empty <figure class="image"> fill
 *   - util-service.ts:resolveMediaElements()          → <video>/<audio>/<source>/poster
 *
 * Resolution is keyed by `data-asset-variable` matched against `media[].id`.
 * Pure string→string, safe for `innerHTML` / `dangerouslySetInnerHTML`.
 */

export interface MediaItem {
  id?: string;
  type?: string;
  mimeType?: string;
  src?: string;
  baseUrl?: string;
}

/**
 * Inputs shared by every resolver. Mirrors the values Angular reads from
 * `parentConfig`/`sectionConfig`/the question at resolution time.
 */
export interface MediaResolveContext {
  media?: MediaItem[];
  /** parentConfig.baseUrl — offline packaged path. Empty/undefined online. */
  basePath?: string;
  /** parentConfig.isAvailableLocally — true only for offline packaged content. */
  isAvailableLocally?: boolean;
  /** Current section identifier (offline image path uses it as a folder). */
  sectionId?: string;
  /** Current question identifier (offline image + A/V paths use it as a folder). */
  questionId?: string;
}

/** Angular checks only http(s):// for "already absolute". */
const isHttpAbsolute = (s?: string | null): boolean => /^https?:\/\//i.test(s ?? '');

function findMediaById(media: MediaItem[], id: string): MediaItem | undefined {
  return media.find((m) => String(m.id) === id);
}

function imageMedia(media: MediaItem[]): MediaItem[] {
  return (media || []).filter(
    (m) => m && (m.type === 'image' || /^image\//i.test(m.mimeType || '')),
  );
}

/**
 * Resolve an <img data-asset-variable> src.
 * Mirrors Angular section-player.component.ts:setImageZoom() exactly — including
 * the offline branch that strips the last basePath segment and inserts the
 * section + question folders. Uses the MEDIA entry's src (val.src), not the
 * authored inline src.
 */
function resolveImageSrc(val: MediaItem, ctx: MediaResolveContext, currentSrc?: string): string | undefined {
  if (ctx.isAvailableLocally && ctx.basePath) {
    const base = `${ctx.basePath.substring(0, ctx.basePath.lastIndexOf('/'))}/${ctx.sectionId ?? ''}`;
    // Angular only rewrites when a current question id exists; else leaves it.
    if (ctx.questionId) return `${base}/${ctx.questionId}/${val.src}`;
    return currentSrc;
  }
  if (isHttpAbsolute(val.src)) return val.src;
  if (val.baseUrl) return (val.baseUrl ?? '') + val.src;
  return currentSrc;
}

/**
 * Resolve a <video>/<audio>/<source>/poster src.
 * Mirrors Angular util-service.ts:resolveMediaElements() exactly. NOTE: the
 * offline branch here differs from images — it uses basePath directly with only
 * the question folder (no last-segment strip, no section folder). This
 * inconsistency is intentional parity with Angular. Uses the AUTHORED src.
 */
function resolveAvSrc(src: string, val: MediaItem | undefined, ctx: MediaResolveContext): string {
  // Callers already skip absolute srcs; kept defensive.
  if (isHttpAbsolute(src)) return src;
  return ctx.basePath
    ? `${ctx.basePath}/${ctx.questionId}/${src}`
    : (val?.baseUrl ?? '') + src;
}

/** Rewrite <video>/<audio> blocks (poster, direct src, child <source>). */
function resolveMediaElementsHtml(html: string, media: MediaItem[], ctx: MediaResolveContext): string {
  return html.replace(/<(video|audio)\b([^>]*)>([\s\S]*?)<\/\1>/gi, (full, tag, attrs, inner) => {
    const idMatch = attrs.match(/data-asset-variable=["']([^"']+)["']/i);
    if (!idMatch) return full;
    const val = findMediaById(media, idMatch[1]);
    if (!val) return full;

    let newAttrs: string = attrs;
    // poster
    newAttrs = newAttrs.replace(/\sposter=["']([^"']*)["']/i, (m: string, p: string) =>
      p && !isHttpAbsolute(p) ? ` poster="${resolveAvSrc(p, val, ctx)}"` : m,
    );
    // direct src on the media element (common for <audio>)
    newAttrs = newAttrs.replace(/\ssrc=["']([^"']*)["']/i, (m: string, s: string) =>
      s && !isHttpAbsolute(s) ? ` src="${resolveAvSrc(s, val, ctx)}"` : m,
    );
    // child <source src>
    const newInner: string = inner.replace(/<source\b[^>]*>/gi, (sTag: string) => {
      const sm = sTag.match(/\ssrc=["']([^"']*)["']/i);
      if (!sm || isHttpAbsolute(sm[1])) return sTag;
      return sTag.replace(/\ssrc=["'][^"']*["']/i, ` src="${resolveAvSrc(sm[1], val, ctx)}"`);
    });

    return `<${tag}${newAttrs}>${newInner}</${tag}>`;
  });
}

/**
 * Resolve every media reference inside a fragment of question HTML (body, option
 * label, hint, or solution).
 *
 * @param html raw HTML
 * @param ctx  media + offline resolution inputs
 */
export function resolveMediaHtml(html: string, ctx: MediaResolveContext = {}): string {
  if (!html) return '';
  const media = ctx.media || [];
  let out = html;

  // (1) Existing <img data-asset-variable> — Mirrors setImageZoom(). Angular only
  //     touches asset-variable images; plain relative <img> are left untouched.
  out = out.replace(/<img\b[^>]*>/gi, (tag) => {
    const idMatch = tag.match(/data-asset-variable=["']([^"']+)["']/i);
    if (!idMatch) return tag;
    const val = findMediaById(media, idMatch[1]);
    if (!val) return tag;

    const srcMatch = tag.match(/\ssrc=["']([^"']*)["']/i);
    const newSrc = resolveImageSrc(val, ctx, srcMatch?.[1]);
    if (newSrc === undefined) return tag;

    return srcMatch
      ? tag.replace(/\ssrc=["'][^"']*["']/i, ` src="${newSrc}"`)
      : tag.replace(/^<img/i, `<img src="${newSrc}"`);
  });

  // (2) Fill empty <figure class="image"></figure> — Mirrors resolveBody(). Online
  //     media.baseUrl only; no offline path and no data-asset-variable (parity).
  const images = imageMedia(media);
  if (images.length && /<figure\b[^>]*\bimage\b/i.test(out)) {
    let idx = 0;
    out = out.replace(
      /<figure\b[^>]*class="[^"]*\bimage\b[^"]*"[^>]*>\s*<\/figure>/gi,
      () => {
        const m = images[idx++];
        if (!m) return '<figure class="image"></figure>';
        const src = m.src?.startsWith('http') ? m.src : (m.baseUrl ?? '') + m.src;
        return `<figure class="image"><img src="${src}" style="max-width:100%" alt="" /></figure>`;
      },
    );
  }

  // (3) <video>/<audio>/<source>/poster — Mirrors resolveMediaElements().
  out = resolveMediaElementsHtml(out, media, ctx);

  return out;
}
