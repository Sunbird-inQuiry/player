import { describe, it, expect } from 'vitest';
import { resolveMediaHtml } from './media';

describe('resolveMediaHtml', () => {
  it('returns empty string for empty input', () => {
    expect(resolveMediaHtml('')).toBe('');
  });

  it('leaves absolute and data img src untouched', () => {
    const html = '<img src="https://cdn/x.png"><img src="data:image/png;base64,AAA">';
    expect(resolveMediaHtml(html, [], 'https://base')).toBe(html);
  });

  it('prefixes relative img src with baseUrl', () => {
    const out = resolveMediaHtml('<p><img src="img/a.png"></p>', [], 'https://base/content');
    expect(out).toContain('src="https://base/content/img/a.png"');
  });

  it('fills empty figure.image placeholders from image media, in order', () => {
    const html = '<figure class="image"></figure><figure class="image"></figure>';
    const media = [
      { type: 'image', src: 'one.png', baseUrl: 'https://m' },
      { type: 'image', src: 'https://cdn/two.png' },
    ];
    const out = resolveMediaHtml(html, media, '');
    expect(out).toContain('src="https://m/one.png"');
    expect(out).toContain('src="https://cdn/two.png"');
  });

  it('resolves an img by data-asset-variable from media id', () => {
    const html = '<img data-asset-variable="m1">';
    const media = [{ id: 'm1', type: 'image', src: 'pic.png' }];
    const out = resolveMediaHtml(html, media, 'https://base');
    expect(out).toContain('src="https://base/pic.png"');
  });
});
