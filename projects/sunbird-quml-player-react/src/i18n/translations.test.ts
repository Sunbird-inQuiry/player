import { describe, it, expect } from 'vitest';
import { t, readI18n, getTranslationKeys, hasTranslation } from './translations';
import { translations as en } from './translations-en';
import { translations as ar } from './translations-ar';
import { translations as fr } from './translations-fr';
import { translations as pt } from './translations-pt';

describe('translations - t()', () => {
  it('returns the translation for a known key/language', () => {
    expect(t('en', 'NEXT')).toBe('Next');
  });

  it('falls back to English for an unknown language', () => {
    expect(t('xx', 'NEXT')).toBe('Next');
  });

  it('returns the key itself when not found', () => {
    expect(t('en', 'UNKNOWN_KEY')).toBe('UNKNOWN_KEY');
  });

  it('substitutes parameters', () => {
    // 'OF' has no placeholder; use a synthetic check on substitution logic
    expect(t('en', 'QUESTION')).toBe('Question');
    // substitution applies to placeholder tokens
    const result = t('en', 'NONEXISTENT_{name}', { name: 'Bob' });
    expect(result).toBe('NONEXISTENT_Bob');
  });
});

describe('translations - readI18n()', () => {
  it('returns empty string for null/undefined', () => {
    expect(readI18n(null)).toBe('');
    expect(readI18n(undefined)).toBe('');
  });

  it('reads from an I18nValue object', () => {
    expect(readI18n({ en: 'Hello', ar: 'Marhaba' }, 'ar')).toBe('Marhaba');
  });

  it('falls back to en within an object', () => {
    expect(readI18n({ en: 'Hello' }, 'fr')).toBe('Hello');
  });

  it('returns a plain string as-is', () => {
    expect(readI18n('Plain', 'en')).toBe('Plain');
  });

  it('parses a JSON string', () => {
    expect(readI18n('{"en":"Hi","fr":"Salut"}', 'fr')).toBe('Salut');
  });

  it('returns the original string when JSON is invalid', () => {
    expect(readI18n('{not json', 'en')).toBe('{not json');
  });
});

describe('translations - keys + hasTranslation()', () => {
  it('getTranslationKeys returns keys for a language', () => {
    expect(getTranslationKeys('en')).toContain('NEXT');
  });

  it('hasTranslation reports presence', () => {
    expect(hasTranslation('NEXT', 'en')).toBe(true);
    expect(hasTranslation('NOPE', 'en')).toBe(false);
  });

  it('all four languages share the same set of keys', () => {
    const enKeys = Object.keys(en).sort();
    expect(Object.keys(ar).sort()).toEqual(enKeys);
    expect(Object.keys(fr).sort()).toEqual(enKeys);
    expect(Object.keys(pt).sort()).toEqual(enKeys);
  });
});
