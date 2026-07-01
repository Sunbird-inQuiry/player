/**
 * Central API endpoint constants (mirrors the Angular app's app.constant.ts).
 *
 * Every backend URL string lives here — services import from this file and never
 * hardcode paths. Trailing-slash endpoints expect an identifier appended.
 */
export const ApiEndPoints = {
  getContent: '/api/content/v1/read/',
  getQuestionSetHierarchy: '/questionset/v5/hierarchy/',
  questionSetRead: '/questionset/v5/read/',
  questionList: '/question/v5/list',
} as const;
