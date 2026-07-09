import { describe, it, expect } from 'vitest';
import { transformQuestion, transformSection } from './transformation-service';
import { readI18n } from '../i18n/translations';

const raw = (extra: Record<string, unknown> = {}) => ({
  identifier: 'q1',
  primaryCategory: 'multiple choice question',
  body: '<p>Q</p>',
  interactions: { response1: { options: [] } },
  responseDeclaration: { response1: { cardinality: 'single', type: 'integer' } },
  ...extra,
});

describe('transformQuestion — responseDeclaration i18n (REO per-language correctResponse)', () => {
  it('preserves the per-language correctResponse so scoring can use it', () => {
    const q = transformQuestion(
      raw({
        primaryCategory: 'reorder question',
        responseDeclaration: {
          response1: {
            cardinality: 'ordered',
            type: 'string',
            correctResponse: { value: ['A', 'B', 'C', 'D', 'E', 'F'] },
            i18n: {
              en: { correctResponse: { value: ['A', 'B', 'C', 'D', 'E', 'F'] } },
              ar: { correctResponse: { value: ['A', 'B', 'C'] } },
            },
          },
        },
      }),
    );
    const decl = q!.responseDeclaration!.response1;
    expect(decl.i18n?.ar?.correctResponse?.value).toEqual(['A', 'B', 'C']);
    expect(decl.i18n?.en?.correctResponse?.value).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
  });

  it('leaves i18n undefined when the item has none (normal content stays lean)', () => {
    const q = transformQuestion(raw());
    expect(q!.responseDeclaration!.response1.i18n).toBeUndefined();
  });
});

describe('transformQuestion — shuffleOptions', () => {
  it('defaults to shuffle when the flag is absent', () => {
    expect(transformQuestion(raw())?.shuffleOptions).toBe(true);
  });

  it('preserves authored order only when explicitly false', () => {
    expect(transformQuestion(raw({ shuffleOptions: false }))?.shuffleOptions).toBe(false);
  });

  it('honors an explicit true', () => {
    expect(transformQuestion(raw({ shuffleOptions: true }))?.shuffleOptions).toBe(true);
  });
});

describe('transformSection — multilingual name/description', () => {
  it('preserves a multilingual name object so render can localize it', () => {
    const s = transformSection({
      identifier: 's1',
      name: { en: 'Algebra', ar: 'الجبر' },
      description: { en: 'Basics', ar: 'أساسيات' },
      children: [],
    });
    // Kept as an object (not stringified to "[object Object]"); render localizes via readI18n.
    expect(readI18n(s!.name, 'ar')).toBe('الجبر');
    expect(readI18n(s!.name, 'en')).toBe('Algebra');
    expect(readI18n(s!.description, 'ar')).toBe('أساسيات');
  });

  it('passes a plain string name through unchanged', () => {
    const s = transformSection({ identifier: 's1', name: 'Section 1', children: [] });
    expect(readI18n(s!.name, 'en')).toBe('Section 1');
  });
});

describe('transformSection — showSolutions/showHints flags (Angular parity)', () => {
  const base = { identifier: 's1', name: 'S', children: [] };
  it('absent flags default to false (hidden)', () => {
    const s = transformSection({ ...base })!;
    expect(s.showSolutions).toBe(false);
    expect(s.showHints).toBe(false);
  });
  it('honors boolean true', () => {
    const s = transformSection({ ...base, showSolutions: true, showHints: true })!;
    expect(s.showSolutions).toBe(true);
    expect(s.showHints).toBe(true);
  });
  it("treats 'Yes' as true and 'No'/false as false", () => {
    const yes = transformSection({ ...base, showSolutions: 'Yes', showHints: 'No' })!;
    expect(yes.showSolutions).toBe(true);
    expect(yes.showHints).toBe(false);
    const no = transformSection({ ...base, showSolutions: false })!;
    expect(no.showSolutions).toBe(false);
  });
  it('falls back to section.metadata when the flag is nested there (Angular shape)', () => {
    const s = transformSection({ ...base, metadata: { showSolutions: 'Yes', showHints: true } })!;
    expect(s.showSolutions).toBe(true);
    expect(s.showHints).toBe(true);
  });
  it('top-level explicit false wins over metadata', () => {
    const s = transformSection({ ...base, showSolutions: false, metadata: { showSolutions: 'Yes' } })!;
    expect(s.showSolutions).toBe(false);
  });
});

describe('transformQuestion — solutions (media from editorState)', () => {
  it('renders a video solution from editorState + media when the flat map is empty', () => {
    const q = raw({
      solutions: { s1: '' }, // v5 flat map drops media → empty
      media: [{ id: 'do_vid', type: 'video', src: '/assets/x/bunny.webm', baseUrl: 'https://host' }],
      editorState: { solutions: [{ id: 's1', value: { en: { type: 'video', value: 'do_vid' } } }] },
    });
    const html = readI18n((transformQuestion(q)!.solutions![0] as { value: unknown }).value as never, 'en');
    expect(html).toContain('<video');
    // data-asset-variable + authored src → resolved to absolute at render time.
    expect(html).toContain('data-asset-variable="do_vid"');
    expect(html).toContain('src="/assets/x/bunny.webm"');
  });

  it('renders an audio solution from editorState + media', () => {
    const q = raw({
      solutions: { s1: '' },
      media: [{ id: 'do_aud', type: 'audio', src: '/assets/x/clip.mp3', baseUrl: 'https://host' }],
      editorState: { solutions: [{ id: 's1', value: { en: { type: 'audio', value: 'do_aud' } } }] },
    });
    const html = readI18n((transformQuestion(q)!.solutions![0] as { value: unknown }).value as never, 'en');
    expect(html).toContain('<audio');
    expect(html).toContain('data-asset-variable="do_aud"');
    expect(html).toContain('src="/assets/x/clip.mp3"');
  });

  it('passes html solutions through and falls back to the flat map without editorState', () => {
    const fromEditor = transformQuestion(
      raw({ solutions: { s1: '<b>ans</b>' }, editorState: { solutions: [{ id: 's1', value: { en: { type: 'html', value: '<b>ans</b>' } } }] } }),
    );
    expect(readI18n((fromEditor!.solutions![0] as { value: unknown }).value as never, 'en')).toBe('<b>ans</b>');

    const fallback = transformQuestion(raw({ solutions: { s1: '<i>x</i>' } }));
    expect((fallback!.solutions![0] as { value: unknown }).value).toBe('<i>x</i>');
  });
});

describe('transformQuestion — showFeedback tri-state', () => {
  it('is undefined when the author did not specify it', () => {
    expect(transformQuestion(raw())?.showFeedback).toBeUndefined();
  });
  it('is true for true/"Yes"', () => {
    expect(transformQuestion(raw({ showFeedback: true }))?.showFeedback).toBe(true);
    expect(transformQuestion(raw({ showFeedback: 'Yes' }))?.showFeedback).toBe(true);
  });
  it('is false only when explicitly false/"No"', () => {
    expect(transformQuestion(raw({ showFeedback: false }))?.showFeedback).toBe(false);
    expect(transformQuestion(raw({ showFeedback: 'No' }))?.showFeedback).toBe(false);
  });
});

describe('transformQuestion — maxScore', () => {
  it('preserves an explicit maxScore of 0 (does not default to 1)', () => {
    expect(transformQuestion(raw({ maxScore: 0 }))?.maxScore).toBe(0);
  });
  it('defaults to 1 when maxScore is absent', () => {
    expect(transformQuestion(raw())?.maxScore).toBe(1);
  });
});

describe('transformSection — showFeedback (tri-state, ON by default)', () => {
  const base = { identifier: 's1', name: 'S', children: [] };
  it('is undefined when absent (defers to config, does not suppress)', () => {
    expect(transformSection({ ...base })!.showFeedback).toBeUndefined();
  });
  it('is false only when explicitly false/"No"', () => {
    expect(transformSection({ ...base, showFeedback: false })!.showFeedback).toBe(false);
    expect(transformSection({ ...base, showFeedback: 'No' })!.showFeedback).toBe(false);
  });
  it('is true for true/"Yes"', () => {
    expect(transformSection({ ...base, showFeedback: 'Yes' })!.showFeedback).toBe(true);
  });
  it('falls back to metadata when nested there', () => {
    expect(transformSection({ ...base, metadata: { showFeedback: false } })!.showFeedback).toBe(false);
  });
});
