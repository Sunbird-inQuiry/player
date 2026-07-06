import { t } from '../../i18n/translations';
import { isAnswered } from '../../utils/answered';
import type { Question, AnswersMap } from '../../types';
import styles from './QuestionPalette.module.scss';

/**
 * QuestionPalette — per-question status chips that jump to a question (spec §6.4).
 *
 * Pure presentational: status is DERIVED from Context-supplied props (questions,
 * currentIndex, answers) — no new model, no Context mutation. Emits `onJump`.
 */
export type QuestionStatus = 'current' | 'answered' | 'skipped' | 'unanswered' | 'needs-review';

/**
 * Derive a question's palette status from runtime data only.
 * - `current`      → the active question
 * - `answered`     → an answer exists in the answers map
 * - `needs-review` → subjective (SA) questions are not auto-scored
 * - `skipped`      → visited (index < current) but no answer
 * - `unanswered`   → not yet visited (index > current) and no answer
 */
export function getQuestionStatus(
  question: Question,
  index: number,
  currentIndex: number,
  answers: AnswersMap,
): QuestionStatus {
  if (index === currentIndex) return 'current';
  const isSubjective = question.primaryCategory?.toLowerCase() === 'subjective question';
  if (isAnswered(answers[question.identifier])) {
    return isSubjective ? 'needs-review' : 'answered';
  }
  return index < currentIndex ? 'skipped' : 'unanswered';
}

const STATUS_LABEL: Record<QuestionStatus, string> = {
  current: 'CURRENT',
  answered: 'ANSWERED',
  skipped: 'SKIPPED',
  unanswered: 'UNANSWERED',
  'needs-review': 'NEEDS_REVIEW',
};

export interface QuestionPaletteProps {
  questions: Question[];
  currentIndex: number;
  answers: AnswersMap;
  onJump: (index: number) => void;
  language?: string;
}

export function QuestionPalette({
  questions,
  currentIndex,
  answers,
  onJump,
  language = 'en',
}: QuestionPaletteProps) {
  return (
    <ul className={styles.palette} aria-label={t(language, 'QUESTION_PALETTE')}>
      {questions.map((question, index) => {
        const status = getQuestionStatus(question, index, currentIndex, answers);
        const statusText = t(language, STATUS_LABEL[status]);
        return (
          <li key={question.identifier} className={styles.item}>
            <button
              type="button"
              className={`${styles.chip} ${styles[status]}`}
              onClick={() => onJump(index)}
              aria-current={status === 'current' ? 'true' : undefined}
              aria-label={`${t(language, 'QUESTION')} ${index + 1}, ${statusText}`}
            >
              {index + 1}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
