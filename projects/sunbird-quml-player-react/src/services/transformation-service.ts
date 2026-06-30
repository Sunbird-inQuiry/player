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
    solutions: question.solutions || [], // QuML array form (not an object map)
    hints: question.hints || [],
    templateId: question.templateId || '',
    language: question.language || [],
    status: question.status || 'Draft',
    showFeedback: question.showFeedback === 'Yes' || question.showFeedback === true,
    showSolutions: question.showSolutions === 'Yes' || question.showSolutions === true,
    showHints: question.showHints === 'Yes' || question.showHints === true,
    shuffleOptions: question.shuffleOptions === true,
  };

  if (isSubjective) {
    // SA: surface the model answer; QuML has no responseDeclaration for SA.
    normalized.answer = question.answer;
  } else {
    normalized.responseDeclaration = normalizeResponseDeclaration(question.responseDeclaration);
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
  };
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

/**
 * Normalize an i18n field to a localized string.
 * Handles an I18nValue object ({ en, ar, ... }) or a JSON string.
 * @param language - Target language ('en', 'ar', 'fr', 'pt')
 */
export function readI18nField(
  field: string | I18nValue | null | undefined,
  language = 'en',
): string {
  if (!field) return '';

  // Handle I18nValue object: { en: "...", ar: "..." }
  if (typeof field === 'object' && !Array.isArray(field)) {
    return field[language] || field.en || '';
  }

  // Handle JSON string
  if (typeof field === 'string') {
    if (field.startsWith('{')) {
      try {
        const parsed = JSON.parse(field);
        if (typeof parsed === 'object') {
          return parsed[language] || parsed.en || field;
        }
      } catch {
        // Not JSON, return as-is
        return field;
      }
    }
    return field;
  }

  return '';
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
