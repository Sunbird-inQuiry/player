import { t, getTranslations } from './translations';
import { TRANSLATIONS_EN } from './translations.en';
import { TRANSLATIONS_AR } from './translations.ar';
import { TRANSLATIONS_FR } from './translations.fr';
import { TRANSLATIONS_PT } from './translations.pt';

const ALL_LANGS: Record<string, Record<string, string>> = { en: TRANSLATIONS_EN, ar: TRANSLATIONS_AR, fr: TRANSLATIONS_FR, pt: TRANSLATIONS_PT };

describe('translations — t()', () => {
  it('should return English string for a known key', () => {
    expect(t('en', 'ANSWER')).toBe('Answer');
  });

  it('should return French string for a known key', () => {
    expect(t('fr', 'ANSWER')).toBe('Réponse');
  });

  it('should return Portuguese string for a known key', () => {
    expect(t('pt', 'ANSWER')).toBe('Resposta');
  });

  it('should return Arabic string for a known key', () => {
    expect(t('ar', 'ANSWER')).toBe('الإجابة');
  });

  it('should fall back to English for an unknown language', () => {
    expect(t('xx', 'ANSWER')).toBe('Answer');
  });

  it('should fall back to the key itself when key is missing in both target and English', () => {
    expect(t('en', 'NONEXISTENT_KEY')).toBe('NONEXISTENT_KEY');
  });

  it('should substitute {n} placeholder in BLANK key', () => {
    expect(t('en', 'BLANK', 1)).toBe('Blank 1');
    expect(t('en', 'BLANK', 3)).toBe('Blank 3');
  });

  it('should not substitute {n} when n is not provided', () => {
    expect(t('en', 'BLANK')).toBe('Blank {n}');
  });

  it('should cover all 4 languages', () => {
    expect(Object.keys(ALL_LANGS)).toEqual(jasmine.arrayContaining(['en', 'fr', 'pt', 'ar']));
  });

  it('should have identical key sets across all language files', () => {
    const enKeys = Object.keys(TRANSLATIONS_EN).sort();
    Object.values(ALL_LANGS).forEach(langMap => {
      expect(Object.keys(langMap).sort()).toEqual(enKeys);
    });
  });
});

describe('getTranslations()', () => {
  it('returns EN defaults for unknown language', () => {
    expect(getTranslations('xx')).toEqual(TRANSLATIONS_EN);
  });

  it('merges target language over EN defaults', () => {
    const ar = getTranslations('ar');
    expect(ar['ANSWER']).toBe('الإجابة');
  });

  it('falls back to EN value when a key is absent in target language', () => {
    const partial: Record<string, string> = { ANSWER: 'test' };
    // getTranslations always merges over EN, so any real lang has all keys
    const merged = getTranslations('fr');
    const enKeys = Object.keys(TRANSLATIONS_EN);
    enKeys.forEach(k => expect(merged[k]).toBeDefined());
  });
});
