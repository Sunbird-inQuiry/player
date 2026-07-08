/**
 * Central API endpoint constants (mirrors the Angular app's app.constant.ts).
 *
 * Every backend URL string lives here — services import from this file and never
 * hardcode paths. Trailing-slash endpoints expect an identifier appended.
 */
export const ApiEndPoints = {
  getContent: '/api/content/v1/read/',
  getQuestionSetHierarchy: '/api/questionset/v2/hierarchy/',
  questionSetRead: '/api/questionset/v2/read/',
  questionList: '/api/question/v2/list',
} as const;
