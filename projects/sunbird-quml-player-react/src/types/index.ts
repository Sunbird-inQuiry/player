/**
 * Shared domain types for the QuML Player.
 *
 * Kept intentionally minimal and aligned with the documented Core Data Models.
 * Services and utilities use these interfaces instead of `any` where practical.
 */

/** Localized text: map of language code → string, e.g. { en: "Hi", ar: "..." } */
export type I18nValue = Record<string, string>;

/** Canonical (normalized) time limits, in seconds. Single source of truth. */
export interface TimeLimits {
  max: number;
  min: number;
}

export interface Option {
  value: string;
  label: string | I18nValue;
}

export interface Interaction {
  cardinality: string; // 'single' | 'multiple' | 'map' | 'ordered' | ...
  options?: Option[];
  [key: string]: unknown;
}

export interface ResponseDeclaration {
  correctResponse?: { value: unknown };
  mapping?: Array<{
    placeholder: string;
    correctResponse: { value: string };
  }>;
  [key: string]: unknown;
}

export interface OutcomeDeclaration {
  score?: { baseValue?: number };
  [key: string]: unknown;
}

export interface Question {
  identifier: string; // GLOBALLY UNIQUE — used as the answers map key
  code?: string;
  name?: string;
  body: string; // HTML, may contain KaTeX
  primaryCategory: string; // maps to registry (lowercased after transform)
  qType?: string;
  mimeType?: string;
  interactions?: Interaction[];
  interactionTypes?: string[];
  responseDeclaration?: ResponseDeclaration;
  outcomeDeclaration?: OutcomeDeclaration;
  maxScore: number;
  media?: unknown[];
  solutions?: unknown[];
  hints?: unknown[];
  templateId?: string;
  language?: string[];
  status?: string;
  showFeedback?: boolean;
  showSolutions?: boolean;
  showHints?: boolean;
  shuffleOptions?: boolean;
  savedResponse?: UserResponse;
}

export interface Section {
  identifier: string;
  name: string;
  description?: string;
  instructions?: I18nValue;
  children: Question[];
  maxScore?: number;
  timeLimits: TimeLimits; // canonical normalized shape (seconds)
  allowSkip: boolean;
  shuffle: boolean;
  showTimer?: boolean;
}

export interface Assessment {
  identifier: string;
  name: string;
  description?: string;
  sections: Section[];
  maxScore?: number;
  passingScore?: number;
  timeLimits?: TimeLimits; // canonical normalized shape (seconds)
  shuffleQuestions?: boolean;
  allowSkip?: boolean;
}

/**
 * One user's answer to one question. Concrete fields vary by question type:
 * - MCQ:     answer: string | string[]
 * - FTB:     response1, response2, ...
 * - MTF:     option1, option2, ...
 * - SEQ/REO: answer: string[]
 */
export interface UserResponse {
  answer?: string | string[];
  timestamp?: number;
  score?: number;
  maxScore?: number;
  [key: string]: unknown;
}

/** Runtime answers map, keyed by question.identifier (single source of truth). */
export type AnswersMap = Record<string, UserResponse>;

export interface TelemetryContext {
  uid?: string;
  sid?: string;
  did?: string;
  channel?: string;
  pdata?: { id: string; ver: string; pid?: string };
  host?: string;
  threshold?: number;
  [key: string]: unknown;
}

export interface PlayerConfig {
  context: TelemetryContext;
  config: {
    language?: string;
    theme?: string;
    [key: string]: unknown;
  };
  data?: unknown; // raw assessment/questionset payload
  [key: string]: unknown;
}

/** Runtime state owned by QumlContext (the single source of truth). */
export interface AssessmentState {
  playerConfig: PlayerConfig | null;
  context: TelemetryContext | null;
  config: PlayerConfig['config'] | null;
  sections: Section[];
  currentSectionIndex: number;
  questions: Question[];
  currentQuestionIndex: number;
  answers: AnswersMap;
  language: string;
  showFeedback: boolean;
  showSolutions: boolean;
  attemptNumber: number;
  loading: boolean;
  error: string | null;
  isDurationExpired: boolean;
}
