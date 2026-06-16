export type I18nMap   = Record<string, string>;
export type I18nValue = string | I18nMap;

const DEFAULT = 'en';

/** Read with language fallback — used in player/preview. Falls back to EN, then first key. */
export function readI18n(field: I18nValue | undefined, lang: string): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  const first = Object.keys(field)[0];
  return field[lang] !== undefined ? field[lang]
       : field[DEFAULT] !== undefined ? field[DEFAULT]
       : first ? field[first] : '';
}

/** Read with no fallback — for editor inputs. Returns '' when lang slot not yet authored. */
export function readI18nForEditor(field: I18nValue | undefined, lang: string): string {
  if (!field) return '';
  if (typeof field === 'string') return lang === DEFAULT ? field : '';
  return field[lang] ?? '';
}

/** Write one language slot into an I18nValue map. */
export function writeI18n(current: I18nValue | undefined, lang: string, value: string): I18nValue {
  if (lang === DEFAULT && !current) return value;
  const map: I18nMap = typeof current === 'object'
    ? { ...current }
    : (current ? { [DEFAULT]: current } : {});
  if (value) { map[lang] = value; } else { delete map[lang]; }
  return normalizeI18n(map);
}

/**
 * Returns the canonical body field for a question as I18nValue.
 * Detects BSON-corrupted bodies (the editor stored a multilingual map
 * as BSON binary bytes, identifiable by a leading null byte) and falls
 * back to editorState.question which the editor serialises correctly as
 * a proper JSON {en:..., hi:...} object.
 */
export function getBodyField(question: any): I18nValue | undefined {
  const body = question?.body;
  if (typeof body === 'string' && body.charCodeAt(0) === 0) {
    return question?.editorState?.question as I18nValue | undefined;
  }
  return body as I18nValue | undefined;
}

/** Collapse a single-key EN map back to a plain string; remove empty slots. */
export function normalizeI18n(map: I18nMap): I18nValue {
  const filled: I18nMap = {};
  Object.keys(map).forEach(k => { if (map[k]) { filled[k] = map[k]; } });
  const keys = Object.keys(filled);
  if (keys.length === 0)                        return '';
  if (keys.length === 1 && keys[0] === DEFAULT) return filled[DEFAULT];
  return filled;
}
