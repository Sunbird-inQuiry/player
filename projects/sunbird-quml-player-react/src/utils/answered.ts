import type { UserResponse } from '../types';

/**
 * Single source of truth for "has the learner actually answered this question?".
 *
 * Reused everywhere (navigation gates, attempted/skipped counts, the submit
 * summary, results and scoring) so an "empty" response is treated consistently
 * as unanswered. It is type-agnostic: it inspects whichever field the question
 * component populated, since each type emits exactly one shape (see UserResponse):
 *
 *  - MCQ          → `value`      → answered iff an option was chosen (not '' / null)
 *  - Subjective   → `shown`      → answered iff the model answer was revealed
 *  - FTB          → `responses`  → answered iff at least one blank has non-blank text
 *  - MTF          → `matches`    → answered iff at least one pairing exists
 *  - SEQ / REO    → `order`      → answered iff at least one item is placed
 *
 * A stored-but-empty response (e.g. a cleared FTB blank or a REO answer emptied
 * back out) is NOT answered.
 */
export function isAnswered(response: UserResponse | null | undefined): boolean {
  if (!response) return false;

  // Subjective — self-marked once the answer is revealed.
  if (response.shown === true) return true;

  // MCQ (single-select).
  if (response.value !== undefined && response.value !== null && response.value !== '') {
    return true;
  }

  // SEQ / REO.
  if (Array.isArray(response.order) && response.order.length > 0) return true;

  // MTF.
  if (response.matches && Object.keys(response.matches).length > 0) return true;

  // FTB — at least one blank filled with non-whitespace text.
  if (
    response.responses &&
    Object.values(response.responses).some((v) => String(v ?? '').trim() !== '')
  ) {
    return true;
  }

  return false;
}
