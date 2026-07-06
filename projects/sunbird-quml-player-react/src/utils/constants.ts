/**
 * Global constants
 */

// Scoring
export const DEFAULT_SCORE = 1;
export const MAX_SCORE = 100;

// Compatibility
export const COMPATIBILITY_LEVEL = 6;
export const API_VERSION = 'v5';

// Timer
export const WARNING_TIME_CONFIG = {
  DEFAULT_TIME: 75, // seconds
  SHOW_TIMER: true,
};

// Page IDs for telemetry
export const pageId = {
  START_PAGE: 'start',
  QUESTION_PAGE: 'question',
  FEEDBACK_PAGE: 'feedback',
  SUBMIT_PAGE: 'submit',
  END_PAGE: 'end',
  SHORT_ANSWER: 'short_answer',
};

// Event names for telemetry
export const eventName = {
  // Navigation
  NEXT_CLICKED: 'NEXT_CLICKED',
  PREV_CLICKED: 'PREV_CLICKED',
  PROGRESS_BAR_CLICKED: 'PROGRESS_BAR_CLICKED',
  BOOKMARKED: 'BOOKMARKED',
  UNBOOKMARKED: 'UNBOOKMARKED',

  // Solutions
  SHOW_ANSWER_CLICKED: 'SHOW_ANSWER_CLICKED',
  VIEW_SOLUTION_CLICKED: 'VIEW_SOLUTION_CLICKED',
  VIEW_HINT_CLICKED: 'VIEW_HINT_CLICKED',

  // Page events
  START_PAGE_LOADED: 'START_PAGE_LOADED',
  SUBMIT_PAGE_LOADED: 'SUBMIT_PAGE_LOADED',
  END_PAGE_LOADED: 'END_PAGE_LOADED',

  // User actions
  TRY_AGAIN: 'TRY_AGAIN',
  REPLAY_CLICKED: 'REPLAY_CLICKED',
  ZOOM_CLICKED: 'ZOOM_CLICKED',
  DEVICE_ROTATION: 'DEVICE_ROTATION',

  // Answers
  ANSWER_SELECTED: 'ANSWER_SELECTED',
  ANSWER_SUBMITTED: 'ANSWER_SUBMITTED',
};

// Telemetry event types
export const TelemetryType = {
  INTERACT: 'interact',
  ASSESS: 'assess',
  IMPRESSION: 'impression',
  ERROR: 'error',
};

// Question cardinality
export const Cardinality = {
  SINGLE: 'single',
  MAP: 'map',
  FTB: 'ftb',
  SEQ: 'ordered',
  REO: 'reorder',
};

// Question types
export const QuestionType = {
  MCQ: 'MCQ',
  SA: 'SA',
  FTB: 'FTB',
  MTF: 'MTF',
  SEQ: 'SEQ',
  REO: 'REO',
};

// Answer states
export const AnswerState = {
  CORRECT: 'CORRECT',
  INCORRECT: 'INCORRECT',
  PARTIAL: 'PARTIAL',
  SKIPPED: 'SKIPPED',
  NOT_VIEWED: 'NOT_VIEWED',
};

// Languages
export const Languages = {
  EN: 'en',
  AR: 'ar',
  FR: 'fr',
  PT: 'pt',
};

// HTTP status codes
export const HttpStatusCode = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};
