import { useState } from 'react';
import { QuestionRenderer } from '../QuestionRenderer/QuestionRenderer';
import { QuestionCard } from '../QuestionCard/QuestionCard';
import { QuestionPalette } from '../QuestionPalette/QuestionPalette';
import { PreviousIcon, NextIcon } from '../icons';
import { t } from '../../i18n/translations';
import { calculateScore } from '../../registry/scoring-registry';
import type { Question, AnswersMap } from '../../types';
import styles from './ReviewScreen.module.scss';

/**
 * ReviewScreen — per-question review (spec §7.3/§7.4).
 *
 * Reuses `QuestionPalette` to pick a question and `QuestionRenderer` in
 * `replayed` mode to render it LOCKED with the saved answer. Correctness/score is
 * derived via the `scoring-registry` (no scoring logic duplicated). Navigation is
 * local; NO answers are mutated.
 */
export interface ReviewScreenProps {
  questions: Question[];
  answers: AnswersMap;
  startIndex?: number;
  onExit: () => void;
  language?: string;
}

type Correctness = 'correct' | 'incorrect' | 'partial' | 'skipped' | 'review';

function correctnessOf(question: Question, answers: AnswersMap): { kind: Correctness; raw: number } {
  const answer = answers[question.identifier];
  if (!answer) return { kind: 'skipped', raw: 0 };
  // Subjective questions are not auto-scored.
  if (question.primaryCategory?.toLowerCase() === 'subjective question') {
    return { kind: 'review', raw: 0 };
  }
  const raw = calculateScore(question, answer);
  if (raw >= 1) return { kind: 'correct', raw };
  if (raw > 0) return { kind: 'partial', raw };
  return { kind: 'incorrect', raw };
}

const LABEL_KEY: Record<Correctness, string> = {
  correct: 'CORRECT',
  incorrect: 'INCORRECT',
  partial: 'PARTIAL',
  skipped: 'SKIPPED',
  review: 'NEEDS_REVIEW',
};

const VERDICT_CLASS: Record<Correctness, string> = {
  correct: styles.correct,
  incorrect: styles.incorrect,
  partial: styles.partial,
  skipped: styles.skipped,
  review: styles.pending,
};

export function ReviewScreen({
  questions,
  answers,
  startIndex = 0,
  onExit,
  language = 'en',
}: ReviewScreenProps) {
  const clampedStart = Math.min(Math.max(startIndex, 0), Math.max(questions.length - 1, 0));
  const [index, setIndex] = useState(clampedStart);

  if (questions.length === 0) {
    return (
      <section className={styles.review}>
        <div className={styles.empty}>{t(language, 'ERROR_LOADING')}</div>
      </section>
    );
  }

  const question = questions[index];
  const { kind, raw } = correctnessOf(question, answers);
  const displayScore = Math.round(raw * (question.maxScore ?? 1));
  const isFirst = index === 0;
  const isLast = index === questions.length - 1;

  return (
    <section className={styles.review} aria-label={t(language, 'REVIEW')}>
      <header className={styles.topbar}>
        <h1 className={styles.title}>{t(language, 'REVIEW')}</h1>
        <button type="button" className={styles.exitBtn} onClick={onExit}>
          {t(language, 'BACK_TO_RESULTS')}
        </button>
      </header>

      <div className={styles.body}>
        <aside className={styles.paletteCol}>
          <QuestionPalette
            questions={questions}
            currentIndex={index}
            answers={answers}
            onJump={setIndex}
            language={language}
          />
        </aside>

        <div className={styles.main}>
          <div className={`${styles.verdict} ${VERDICT_CLASS[kind]}`}>
            {t(language, LABEL_KEY[kind])}
          </div>

          <QuestionCard question={question} meta={{ category: question.primaryCategory }}>
            <QuestionRenderer
              key={question.identifier}
              question={question}
              replayed
              score={displayScore}
            />
          </QuestionCard>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={isFirst}
              aria-label={t(language, 'PREVIOUS')}
            >
              <PreviousIcon size={18} />
              <span className={styles.navLabel}>{t(language, 'PREVIOUS')}</span>
            </button>

            <span className={styles.counter}>
              {t(language, 'QUESTION')} {index + 1} {t(language, 'OF')} {questions.length}
            </span>

            <button
              type="button"
              className={styles.navBtn}
              onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
              disabled={isLast}
              aria-label={t(language, 'NEXT')}
            >
              <span className={styles.navLabel}>{t(language, 'NEXT')}</span>
              <NextIcon size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
