export type I18nMap   = Record<string, string>;
export type I18nValue = string | I18nMap;

const DEFAULT = 'en';

/** Read with language fallback — used in player/preview. Falls back to EN, then first key. */
export function readI18n(field: I18nValue | undefined, lang: string): string {
  if (!field) return '';
  let map: I18nMap;
  if (typeof field === 'string') {
    // Some sources (v3 API / editor edit-data) store the i18n map as a JSON STRING,
    // e.g. '{"en":"...","ar":"..."}'. Parse it so we can pick the language instead of
    // rendering the raw JSON. A normal string (or non-JSON) is returned untouched.
    const s = field.trim();
    if (!(s.startsWith('{') && s.endsWith('}'))) return field;
    try {
      const parsed = JSON.parse(s);
      if (!parsed || typeof parsed !== 'object') return field;
      map = parsed as I18nMap;
    } catch {
      return field;
    }
  } else {
    map = field;
  }
  const first = Object.keys(map)[0];
  return map[lang] !== undefined ? map[lang]
       : map[DEFAULT] !== undefined ? map[DEFAULT]
       : first ? map[first] : '';
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
