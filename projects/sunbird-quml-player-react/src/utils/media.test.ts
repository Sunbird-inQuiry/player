import { describe, it, expect } from 'vitest';
import { resolveMediaHtml } from './media';
import type { MediaResolveContext } from './media';

// These assertions mirror the Angular web-component's asset resolution:
//   section-player.component.ts:setImageZoom(), base-question.directive.ts:resolveBody(),
//   util-service.ts:resolveMediaElements().

describe('resolveMediaHtml', () => {
  it('returns empty string for empty input', () => {
    expect(resolveMediaHtml('')).toBe('');
  });

  it('leaves plain relative img (no data-asset-variable) untouched — Angular parity', () => {
    // Angular only rewrites [data-asset-variable] images; plain relative <img> stay as-is.
    const html = '<p><img src="img/a.png"></p>';
    expect(resolveMediaHtml(html, { media: [] })).toBe(html);
  });

  it('leaves absolute img src untouched when matched by data-asset-variable', () => {
    const html = '<img data-asset-variable="m1" src="ignored">';
    const media = [{ id: 'm1', type: 'image', src: 'https://cdn/x.png' }];
    const out = resolveMediaHtml(html, { media });
    expect(out).toContain('src="https://cdn/x.png"');
  });

  describe('online <img data-asset-variable> resolution (media.baseUrl + media.src)', () => {
    it('resolves an img from the matching media entry baseUrl+src', () => {
      const html = '<img data-asset-variable="m1" src="/authored/relative.png">';
      const media = [{ id: 'm1', type: 'image', src: '/assets/pic.png', baseUrl: 'https://host' }];
      const out = resolveMediaHtml(html, { media });
      // Uses media.src (not the authored inline src), prefixed with media.baseUrl.
      expect(out).toContain('src="https://host/assets/pic.png"');
    });

    it('leaves the tag unchanged when no media entry matches', () => {
      const html = '<img data-asset-variable="missing" src="/x.png">';
      expect(resolveMediaHtml(html, { media: [{ id: 'other', src: '/y.png' }] })).toBe(html);
    });
  });

  describe('offline <img> resolution — Mirrors setImageZoom() offline branch', () => {
    it('builds {dirname(basePath)}/{sectionId}/{questionId}/{media.src}', () => {
      const html = '<img data-asset-variable="m1" src="orig.png">';
      const media = [{ id: 'm1', type: 'image', src: 'pic.png', baseUrl: 'https://host' }];
      const ctx: MediaResolveContext = {
        media,
        isAvailableLocally: true,
        basePath: '/data/content/set.json',
        sectionId: 'do_sec',
        questionId: 'do_q',
      };
      const out = resolveMediaHtml(html, ctx);
      // dirname('/data/content/set.json') = '/data/content' → + section + question + src
      expect(out).toContain('src="/data/content/do_sec/do_q/pic.png"');
    });
  });

  it('fills empty figure.image placeholders from image media, in order (resolveBody parity)', () => {
    const html = '<figure class="image"></figure><figure class="image"></figure>';
    // Angular concatenates raw (baseUrl + src, no slash inserted); real payloads
    // use root-relative src like "/assets/...".
    const media = [
      { type: 'image', src: '/one.png', baseUrl: 'https://m' },
      { type: 'image', src: 'https://cdn/two.png' },
    ];
    const out = resolveMediaHtml(html, { media });
    expect(out).toContain('src="https://m/one.png"');
    expect(out).toContain('src="https://cdn/two.png"');
  });

  describe('video/audio/source/poster — Mirrors resolveMediaElements()', () => {
    const media = [{ id: 'v1', type: 'video', src: 'ignored', baseUrl: 'https://host' }];

    it('online: prefixes source + poster with media.baseUrl', () => {
      const html =
        '<video data-asset-variable="v1" poster="/p.png"><source src="/clip.mp4" type="video/mp4"></video>';
      const out = resolveMediaHtml(html, { media });
      expect(out).toContain('poster="https://host/p.png"');
      expect(out).toContain('src="https://host/clip.mp4"');
    });

    it('leaves already-absolute source untouched', () => {
      const html = '<audio data-asset-variable="v1"><source src="https://cdn/a.mp3"></audio>';
      const out = resolveMediaHtml(html, { media });
      expect(out).toContain('src="https://cdn/a.mp3"');
    });

    it('offline: uses {basePath}/{questionId}/{src} (no section, no dirname — Angular A/V parity)', () => {
      const html = '<video data-asset-variable="v1"><source src="clip.mp4"></video>';
      const ctx: MediaResolveContext = {
        media,
        isAvailableLocally: true,
        basePath: '/data/content/set.json',
        sectionId: 'do_sec',
        questionId: 'do_q',
      };
      const out = resolveMediaHtml(html, ctx);
      // A/V offline differs from images: basePath used directly + question only.
      expect(out).toContain('src="/data/content/set.json/do_q/clip.mp4"');
    });
  });
});
