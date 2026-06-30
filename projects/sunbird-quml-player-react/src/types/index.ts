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
  value: number | string; // MCQ → integer; SEQ/REO/MTF → string
  label: string | I18nValue;
}

/**
 * Interaction options:
 * - MCQ / SEQ / REO → a flat `Option[]`
 * - MTF             → `{ left, right }` columns
 */
export type InteractionOptions = Option[] | { left: Option[]; right: Option[] };

export interface Interaction {
  options?: InteractionOptions;
}

/** `interactions` is keyed by responseN, e.g. { response1: { options: [...] } } */
export type Interactions = Record<string, Interaction>;

/** A single mapping entry (QuML 1.1 partial scoring). */
export interface ResponseMapping {
  value?: number | string; // FTB / SEQ / REO / MCQ
  key?: string; // MTF (left value)
  score: number;
  caseSensitive?: boolean; // FTB
}

export interface ResponseDeclarationItem {
  cardinality: 'single' | 'multiple' | 'ordered' | string;
  type: 'integer' | 'string' | 'map' | string;
  correctResponse?: {
    value: number | string | number[] | string[] | Record<string, string>;
  };
  mapping?: ResponseMapping[];
}

/** `responseDeclaration` is keyed by responseN, e.g. { response1: { ... } } */
export type ResponseDeclaration = Record<string, ResponseDeclarationItem>;

export interface OutcomeDeclaration {
  maxScore?: { cardinality?: string; type?: string; defaultValue?: number };
}

export interface Question {
  identifier: string; // GLOBALLY UNIQUE — used as the answers map key
  code?: string;
  name?: string;
  body: string; // HTML, may contain KaTeX; FTB has [[responseN]] blank tokens
  primaryCategory: string; // maps to registry (lowercased after transform)
  qType?: string;
  mimeType?: string;
  interactions?: Interactions; // keyed by responseN
  interactionTypes?: string[];
  responseDeclaration?: ResponseDeclaration; // keyed by responseN (absent for SA)
  outcomeDeclaration?: OutcomeDeclaration;
  answer?: string | I18nValue; // SA model answer
  maxScore: number;
  media?: unknown[];
  solutions?: unknown[]; // QuML array form (not an object map)
  hints?: unknown[]; // QuML array form
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
 * One user's answer to one question (React-native runtime model — NOT the QuML
 * file format and NOT the Angular event wrapper). Each question type sets exactly
 * one of the answer fields; SA sets none.
 * - MCQ single   → value
 * - MCQ multiple → values
 * - FTB          → responses   (responseN → text)
 * - MTF          → matches     (leftValue → rightValue)
 * - SEQ / REO    → order       (ordered values)
 */
export interface UserResponse {
  value?: number | string; // MCQ single
  values?: Array<number | string>; // MCQ multiple
  responses?: Record<string, string>; // FTB
  matches?: Record<string, string>; // MTF
  order?: Array<number | string>; // SEQ / REO
  timestamp?: number;
  score?: number;
  maxScore?: number;
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
