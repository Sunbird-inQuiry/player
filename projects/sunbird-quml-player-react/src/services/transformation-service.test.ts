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
