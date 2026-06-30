/**
 * Internationalization - Multi-language support
 * Languages: en, ar, fr, pt
 */

import type { I18nValue } from '../types';

// Import all translation modules
import { translations as en } from './translations-en';
import { translations as ar } from './translations-ar';
import { translations as fr } from './translations-fr';
import { translations as pt } from './translations-pt';

const allTranslations: Record<string, Record<string, string>> = {
  en,
  ar,
  fr,
  pt,
};

/**
 * Get translation for a key in the given language.
 * @param language - Language code ('en', 'ar', 'fr', 'pt')
 * @param key - Translation key
 * @param params - Parameters for substitution, e.g. { name: 'John' }
 * @returns Translated text (falls back to English, then the key itself)
 */
export function t(
  language: string,
  key: string,
  params: Record<string, string | number> = {},
): string {
  const lang = allTranslations[language] || allTranslations.en;
  let text = lang[key] || allTranslations.en[key] || key;

  // Replace placeholders: {name} → params.name
  Object.entries(params).forEach(([k, v]) => {
    text = text.replace(`{${k}}`, String(v));
  });

  return text;
}

/**
 * Read an i18n field from a question/section object.
 * Handles an I18nValue object ({ en, ar, ... }) or a JSON string.
 * @param field - Field to localize
 * @param language - Target language
 */
export function readI18n(field: string | I18nValue | null | undefined, language = 'en'): string {
  if (!field) return '';

  // Object: { en: "...", ar: "..." }
  if (typeof field === 'object' && !Array.isArray(field)) {
    return field[language] || field.en || '';
  }

  // String (might be JSON)
  if (typeof field === 'string') {
    if (field.startsWith('{')) {
      try {
        const parsed = JSON.parse(field);
        if (typeof parsed === 'object') {
          return parsed[language] || parsed.en || field;
        }
      } catch {
        return field;
      }
    }
    return field;
  }

  return '';
}

/**
 * Get all translation keys for a language.
 */
export function getTranslationKeys(language = 'en'): string[] {
  return Object.keys(allTranslations[language] || allTranslations.en);
}

/**
 * Check whether a translation key exists for a language.
 */
export function hasTranslation(key: string, language = 'en'): boolean {
  return Object.prototype.hasOwnProperty.call(
    allTranslations[language] || allTranslations.en,
    key,
  );
}
