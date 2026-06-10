import { t, QUML_TRANSLATIONS } from './translations';

describe('translations — t()', () => {
  it('should return English string for a known key', () => {
    expect(t('en', 'ANSWER')).toBe('Answer');
  });

  it('should return Hindi string for a known key', () => {
    expect(t('hi', 'ANSWER')).toBe('उत्तर');
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

  it('should substitute {n} placeholder in Hindi BLANK key', () => {
    expect(t('hi', 'BLANK', 2)).toBe('रिक्त 2');
  });

  it('should not substitute {n} when n is not provided', () => {
    expect(t('en', 'BLANK')).toBe('Blank {n}');
  });

  it('should cover all 5 languages in the registry', () => {
    expect(Object.keys(QUML_TRANSLATIONS)).toEqual(
      jasmine.arrayContaining(['en', 'fr', 'pt', 'ar', 'hi'])
    );
  });

  it('should have identical key sets across all languages', () => {
    const enKeys = Object.keys(QUML_TRANSLATIONS['en']).sort();
    Object.keys(QUML_TRANSLATIONS).forEach(lang => {
      expect(Object.keys(QUML_TRANSLATIONS[lang]).sort()).toEqual(enKeys);
    });
  });
});
