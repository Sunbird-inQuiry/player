import type { Question, Section, TimeLimits, I18nValue, UserResponse } from '../types';

/**
 * Transformation Service - Normalize and transform QUML data.
 *
 * Inputs are RAW QUML API payloads (loosely typed as `any`); outputs are the
 * normalized interfaces from the shared types.
 */

/** Transform raw question data to the normalized Question shape. */
export function transformQuestion(question: any): Question | null {
  if (!question) return null;

  return {
    // Core
    identifier: question.identifier,
    code: question.code,
    name: question.name,
    body: question.body || '',
    qType: question.qType?.toUpperCase() || '',
    primaryCategory: question.primaryCategory?.toLowerCase() || '',
    mimeType: question.mimeType || 'application/vnd.sunbird.question',

    // Interactions
    interactions: question.interactions || [],
    interactionTypes: question.interactionTypes || [],

    // Declarations (QUML 1.1 standard)
    responseDeclaration: question.responseDeclaration || {},
    outcomeDeclaration: question.outcomeDeclaration || {},

    // Metadata
    maxScore: extractMaxScore(question),
    media: question.media || [],
    solutions: question.solutions || [],
    hints: question.hints || [],

    // Display
    templateId: question.templateId || '',
    language: question.language || [],
    status: question.status || 'Draft',

    // Flags
    showFeedback: question.showFeedback === 'Yes' || question.showFeedback === true,
    showSolutions: question.showSolutions === 'Yes' || question.showSolutions === true,
    showHints: question.showHints === 'Yes' || question.showHints === true,
    shuffleOptions: question.shuffleOptions === true,
  };
}

/** Extract max score from a raw question (defaults to 1). */
function extractMaxScore(question: any): number {
  // Try maxScore property first
  if (question.maxScore) {
    return Number(question.maxScore);
  }

  // Try from outcomeDeclaration
  if (question.outcomeDeclaration?.score?.baseValue) {
    return Number(question.outcomeDeclaration.score.baseValue);
  }

  // Default
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
