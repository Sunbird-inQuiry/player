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
    solutions: normalizeContentEntries(question.solutions), // array form (may arrive as object map)
    hints: normalizeContentEntries(question.hints), // array form (may arrive as object map)
    templateId: question.templateId || '',
    language: question.language || [],
    status: question.status || 'Draft',
    showFeedback: question.showFeedback === 'Yes' || question.showFeedback === true,
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

/** Extract max score from a raw question (defaults to 1). */
function extractMaxScore(question: any): number {
  if (question.maxScore) {
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
  };
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
