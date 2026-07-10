import type {
  Question,
  Section,
  TimeLimits,
  I18nValue,
  UserResponse,
  Interactions,
  ResponseDeclaration,
  ResponseDeclarationItem,
  ResponseMapping,
} from '../types';

/**
 * Transformation Service - Normalize and transform QUML data.
 *
 * Inputs are RAW QUML API payloads (loosely typed as `any`); outputs are the
 * normalized interfaces from the shared types. The SAME function is used for
 * online (fetched) and offline (embedded) questions — there is no separate adapter.
 */

/** Transform raw question data to the normalized Question shape. */
export function transformQuestion(question: any): Question | null {
  if (!question) return null;

  const primaryCategory = (question.primaryCategory || '').toLowerCase();
  const isSubjective =
    primaryCategory === 'subjective question' || (question.qType || '').toUpperCase() === 'SA';

  const normalized: Question = {
    identifier: question.identifier,
    code: question.code,
    name: question.name,
    body: question.body || '',
    qType: question.qType?.toUpperCase() || '',
    primaryCategory,
    mimeType: question.mimeType || 'application/vnd.sunbird.question',
    interactions: (question.interactions || {}) as Interactions, // keyed by responseN
    interactionTypes: question.interactionTypes || [],
    outcomeDeclaration: { maxScore: { defaultValue: extractMaxScore(question) } },
    maxScore: extractMaxScore(question),
    media: question.media || [],
    solutions: buildSolutions(question), // html/video/audio, resolved from editorState when the flat map dropped media
    hints: normalizeContentEntries(question.hints), // array form (may arrive as object map)
    templateId: question.templateId || '',
    language: question.language || [],
    status: question.status || 'Draft',
    // Tri-state: true ('Yes'/true), false ('No'/false), or undefined when the
    // author didn't specify. Consumers gate on `=== false` so an unspecified
    // flag does NOT suppress feedback (it defers to the assessment-level config).
    showFeedback:
      question.showFeedback === false || question.showFeedback === 'No'
        ? false
        : question.showFeedback === true || question.showFeedback === 'Yes'
          ? true
          : undefined,
    // Default is to shuffle; only an explicit `false` preserves authored order.
    shuffleOptions: question.shuffleOptions !== false,
  };

  if (isSubjective) {
    // SA: surface the model answer; QuML has no responseDeclaration for SA.
    normalized.answer = question.answer;
  } else {
    normalized.responseDeclaration = normalizeResponseDeclaration(question.responseDeclaration);
    // Preserve the scoring-mode hints Angular's auto-scoring reads:
    //   responseProcessing.template === 'MAP_RESPONSE' → per-item partial credit;
    //   evalUnordered → FTB "answers accepted in any order".
    if (question.responseProcessing?.template) {
      normalized.responseProcessing = { template: question.responseProcessing.template };
    }
    if (question.evalUnordered === true || String(question.evalUnordered).toLowerCase() === 'true') {
      normalized.evalUnordered = true;
    }
  }

  return normalized;
}

/** Normalize the keyed responseDeclaration (parseInt integers, convert legacy mapping). */
function normalizeResponseDeclaration(rd: any): ResponseDeclaration {
  const out: ResponseDeclaration = {};
  if (!rd || typeof rd !== 'object') return out;

  for (const key of Object.keys(rd)) {
    const item = rd[key];
    if (!item || typeof item !== 'object') continue;
    out[key] = {
      cardinality: item.cardinality || 'single',
      type: item.type || 'string',
      correctResponse: normalizeCorrectResponse(item.correctResponse, item.type),
      mapping: normalizeMapping(item.mapping),
      // Preserve per-language correct answers (REO's correct order differs by
      // language). Normalized with the same type rules as the top-level value.
      i18n: normalizeResponseI18n(item.i18n, item.type),
    } as ResponseDeclarationItem;
  }
  return out;
}

/** parseInt the correctResponse value(s) when the response type is 'integer'. */
function normalizeCorrectResponse(
  cr: any,
  type: string,
): ResponseDeclarationItem['correctResponse'] {
  if (!cr || cr.value === undefined || cr.value === null) return undefined;
  let value = cr.value;
  if (type === 'integer') {
    value = Array.isArray(value)
      ? value.map((v: any) => parseInt(v, 10))
      : parseInt(value, 10);
  }
  return { value };
}

/**
 * Normalize the per-language `i18n` block of a responseDeclaration item into
 * `{ [lang]: { correctResponse } }`. Each language's correctResponse is run
 * through the same type normalization as the top-level value. Returns undefined
 * when there are no usable language entries (keeps normal content lean).
 */
function normalizeResponseI18n(
  i18n: any,
  type: string,
): ResponseDeclarationItem['i18n'] {
  if (!i18n || typeof i18n !== 'object') return undefined;
  const out: NonNullable<ResponseDeclarationItem['i18n']> = {};
  for (const lang of Object.keys(i18n)) {
    const cr = normalizeCorrectResponse(i18n[lang]?.correctResponse, type);
    if (cr) out[lang] = { correctResponse: cr };
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Convert legacy mapping ({response,outcomes.score}) → {value,score}; pass new shape through. */
function normalizeMapping(mapping: any): ResponseMapping[] | undefined {
  if (!Array.isArray(mapping) || mapping.length === 0) return undefined;
  return mapping.map((m: any): ResponseMapping => {
    // Legacy format
    if (m && m.outcomes && m.value === undefined && m.key === undefined) {
      return { value: m.response, score: Number(m.outcomes.score) || 0 };
    }
    // New QuML 1.1: { value, score, caseSensitive } or MTF { key, value, score }
    const entry: ResponseMapping = { score: Number(m.score) || 0 };
    if (m.key !== undefined) entry.key = m.key;
    if (m.value !== undefined) entry.value = m.value;
    if (m.caseSensitive !== undefined) entry.caseSensitive = !!m.caseSensitive;
    return entry;
  });
}

/**
 * Normalize `solutions`/`hints` to the array form the Hint component consumes.
 *
 * The backend delivers these two ways:
 *   - array (offline / embedded):  [{ value: '<html>' }]           → passed through
 *   - object map (/question/v5 list): { id: { en, ar, ... } }      → [{ value: I18nValue }]
 *
 * Each entry's `value` may be a plain HTML string or an I18nValue; the Hint
 * component localizes it at render time (consistent with option labels).
 */
function normalizeContentEntries(entries: any): Array<{ value: string | I18nValue }> {
  if (!entries) return [];
  if (Array.isArray(entries)) return entries;
  if (typeof entries === 'object') {
    return Object.values(entries).map((value) => ({ value: value as string | I18nValue }));
  }
  return [];
}

/**
 * Turn one `editorState.solutions` spec into renderable HTML, mirroring Angular's
 * transformation.service.ts `getSolutionString`:
 *   - html  → the raw HTML value
 *   - video → <video controls><source ...> built from the matching media entry
 *   - audio → <audio controls><source ...> (Angular omits audio; we support it
 *             since the media ref is available)
 * The media `src` is root-relative (e.g. /assets/public/content/...); we absolutise
 * it with the media entry's baseUrl (as Angular's mcq-solutions panel does) so the
 * asset loads. Returns '' when there is nothing renderable.
 */
/** Escape a value for safe interpolation into an HTML attribute. */
function escAttr(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function solutionSpecToHtml(spec: any, media: any[]): string {
  if (!spec || typeof spec !== 'object') return '';
  const type = spec.type;
  const value = spec.value ?? '';
  if (type === 'html') return typeof value === 'string' ? value : '';
  if (type === 'video' || type === 'audio') {
    const item = media.find((m) => m?.id === value);
    const src = item?.src || '';
    if (!src) return '';
    // Emit `data-asset-variable` (the media id) + the AUTHORED src, and let the
    // render-time resolver (resolveMediaHtml via mediaCtx) rewrite the <source> —
    // that covers BOTH online (media.baseUrl) and offline (basePath), matching the
    // question stem and Angular's getSolutionString. Attribute values are escaped.
    const id = escAttr(String(value));
    const s = escAttr(src);
    return type === 'video'
      ? `<video data-asset-variable="${id}" width="400" controls><source src="${s}"></video>`
      : `<audio data-asset-variable="${id}" controls><source src="${s}"></audio>`;
  }
  return '';
}

/**
 * Build the normalized solutions array. The v5 list API delivers `solutions` as a
 * flat `{id: value}` map where media solutions are empty strings (only HTML
 * survives); the real `{type, value}` lives in `editorState.solutions`. Prefer
 * that structured source (so video/audio solutions render), and fall back to the
 * flat map / offline array form when it is absent.
 */
function buildSolutions(question: any): Array<{ value: string | I18nValue }> {
  const editorSolutions = question?.editorState?.solutions;
  if (Array.isArray(editorSolutions) && editorSolutions.length > 0) {
    const media: any[] = Array.isArray(question.media) ? question.media : [];
    const entries = editorSolutions
      .map((entry: any) => {
        const langMap = entry?.value;
        if (!langMap || typeof langMap !== 'object') return null;
        // Render one HTML string per language so readI18n picks the right one.
        const htmlByLang: Record<string, string> = {};
        for (const [lang, spec] of Object.entries(langMap)) {
          const html = solutionSpecToHtml(spec, media);
          if (html) htmlByLang[lang] = html;
        }
        return Object.keys(htmlByLang).length > 0 ? { value: htmlByLang as I18nValue } : null;
      })
      .filter((e): e is { value: I18nValue } => Boolean(e));
    if (entries.length > 0) return entries;
  }
  return normalizeContentEntries(question.solutions);
}

/** Extract max score from a raw question (defaults to 1). */
function extractMaxScore(question: any): number {
  // Explicit 0 is a valid maxScore (e.g. an unscored survey item) — only treat
  // null/undefined as "absent", not falsy 0.
  if (question.maxScore !== undefined && question.maxScore !== null) {
    return Number(question.maxScore);
  }
  // QuML: outcomeDeclaration.maxScore.defaultValue
  if (question.outcomeDeclaration?.maxScore?.defaultValue !== undefined) {
    return Number(question.outcomeDeclaration.maxScore.defaultValue);
  }
  return 1;
}

/** Transform raw section/questionset data to the normalized Section shape. */
export function transformSection(section: any): Section | null {
  if (!section) return null;

  return {
    identifier: section.identifier,
    name: section.name || '',
    description: section.description || '',
    instructions: section.instructions || {},
    children: section.children || [],
    allowSkip: section.allowSkip === 'Yes' || section.allowSkip === true,
    shuffle: section.shuffle === true,
    timeLimits: transformTimeLimit(section.timeLimits),
    showTimer: section.showTimer !== false,
    // Angular parity (processBooleanProps + section-player.component.ts:241,244):
    // boolean as-is, 'Yes' → true, anything else (incl. absent) → false.
    // Read top-level first, then `metadata` — Angular sources these from
    // `sectionConfig.metadata` (:241,244), so tolerate either shape.
    showSolutions: sectionBooleanFlag(section, 'showSolutions'),
    showHints: sectionBooleanFlag(section, 'showHints'),
    // Tri-state (feedback is ON by default): only an explicit false/'No'
    // suppresses; undefined defers to the assessment-level config. Read
    // top-level then `metadata`, mirroring sectionBooleanFlag's source order.
    showFeedback: sectionTriStateFlag(section, 'showFeedback'),
  };
}

/**
 * Resolve a section flag that is ON by default as a tri-state: explicit
 * false/'No' → false, explicit true/'Yes' → true, absent → undefined (so the
 * consumer can defer to a higher-level default instead of forcing it off).
 * Checks the top-level node first, then `section.metadata`.
 */
function sectionTriStateFlag(section: any, key: string): boolean | undefined {
  const raw = section[key] ?? section.metadata?.[key];
  if (raw === false || raw === 'No') return false;
  if (raw === true || raw === 'Yes') return true;
  return undefined;
}

/**
 * Resolve a section boolean flag with Angular-compatible coercion, checking the
 * top-level node first and falling back to `section.metadata` (Angular reads
 * these from `sectionConfig.metadata`). Absent → false. Explicit false/'No' at
 * the top level wins over metadata (only null/undefined falls through).
 */
function sectionBooleanFlag(section: any, key: string): boolean {
  const raw = section[key] ?? section.metadata?.[key];
  return raw === true || raw === 'Yes';
}

/**
 * Transform the raw QUML time-limit field into the canonical TimeLimits shape.
 *
 * Raw input  (QUML API):   { questionSet: { max, min } }  — values in seconds
 * Normalized output:       { max: number, min: number }  — the canonical shape
 *                          used everywhere the player reads time limits.
 */
function transformTimeLimit(timeLimits: any): TimeLimits {
  if (!timeLimits || !timeLimits.questionSet) {
    return { max: 0, min: 0 };
  }

  return {
    max: Number(timeLimits.questionSet.max) || 0,
    min: Number(timeLimits.questionSet.min) || 0,
  };
}

/** Attach a previously saved response to a question (for answer restoration). */
export function mergeResponseWithQuestion(
  question: Question,
  savedResponse?: UserResponse,
): Question {
  return {
    ...question,
    savedResponse,
  };
}
