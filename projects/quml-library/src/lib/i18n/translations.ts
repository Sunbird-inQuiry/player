import { merge } from 'lodash-es';
import { TRANSLATIONS_EN } from './translations.en';
import { TRANSLATIONS_AR } from './translations.ar';
import { TRANSLATIONS_FR } from './translations.fr';
import { TRANSLATIONS_PT } from './translations.pt';

const LANG_MAP: Record<string, Record<string, string>> = {
  en: TRANSLATIONS_EN,
  ar: TRANSLATIONS_AR,
  fr: TRANSLATIONS_FR,
  pt: TRANSLATIONS_PT,
};

/**
 * Returns the merged translation table for a given language.
 * Target language keys override EN defaults — missing keys fall back to English.
 * Mirrors ConfigService.setLanguage() in the editor.
 */
export function getTranslations(lang: string): Record<string, string> {
  const target = LANG_MAP[lang];
  if (!target || lang === 'en') return TRANSLATIONS_EN;
  return merge({}, TRANSLATIONS_EN, target);
}

/** Looks up a UI string. Falls back to English if key is missing in target language. */
export function t(lang: string, key: string, n?: number): string {
  const table = getTranslations(lang);
  const val   = table[key] ?? TRANSLATIONS_EN[key] ?? key;
  return n !== undefined ? val.replace('{n}', String(n)) : val;
}
