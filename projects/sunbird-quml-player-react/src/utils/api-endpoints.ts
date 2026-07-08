/**
 * Central API endpoint constants (mirrors the Angular app's app.constant.ts).
 *
 * Every backend URL string lives here — services import from this file and never
 * hardcode paths. Trailing-slash endpoints expect an identifier appended.
 *
 * The path PREFIX (`/api`) is only a fallback. Angular's player never hardcoded
 * it — the host provided a `QuestionCursor` implementation that built the URL
 * with its own slug (e.g. `/portal`). The React player mirrors that: the host
 * passes its slug via `playerConfig` and the data-service prepends it, defaulting
 * to `/api` when none is supplied. See ApiPaths + data-service `apiPrefix`.
 */

/** Fallback API path prefix (host slug) when the config/context doesn't supply one. */
export const DEFAULT_API_PREFIX = '/api';

/** Resource paths appended to the (configurable) API prefix. */
export const ApiPaths = {
  content: '/content/v1/read/',
  questionSetHierarchy: '/questionset/v2/hierarchy/',
  questionSetRead: '/questionset/v2/read/',
  questionList: '/question/v2/list',
} as const;

/**
 * Fully-qualified defaults (prefix `/api` + path). Retained for callers/tests
 * that want the default URL directly; the data-service builds URLs from the
 * configurable prefix + ApiPaths so a host slug can override `/api`.
 */
export const ApiEndPoints = {
  getContent: `${DEFAULT_API_PREFIX}${ApiPaths.content}`,
  getQuestionSetHierarchy: `${DEFAULT_API_PREFIX}${ApiPaths.questionSetHierarchy}`,
  questionSetRead: `${DEFAULT_API_PREFIX}${ApiPaths.questionSetRead}`,
  questionList: `${DEFAULT_API_PREFIX}${ApiPaths.questionList}`,
} as const;
