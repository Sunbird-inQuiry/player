import { useState } from 'react';
import { QuestionRenderer } from '../QuestionRenderer/QuestionRenderer';
import { QuestionCard } from '../QuestionCard/QuestionCard';
import { Hint } from '../Hint/Hint';
import { Sidebar } from '../Sidebar/Sidebar';
import { PreviousIcon, NextIcon } from '../icons';
import { t } from '../../i18n/translations';
import { calculateScore } from '../../registry/scoring-registry';
import { isAnswered } from '../../utils/answered';
import { useQuml } from '../../context/useQuml';
import type { MediaItem, MediaResolveContext } from '../../utils/media';
import type { Question, Section, AnswersMap, UserResponse } from '../../types';
import styles from './ReviewScreen.module.scss';

/**
 * ReviewScreen — per-question review (spec §7.3/§7.4).
 *
 * Uses the same section `Sidebar` as the assessment shell (so review navigation
 * matches the player) and `QuestionRenderer` to render each question with its
 * saved answer restored. Matching the Angular player, review is INTERACTIVE:
 * re-answering updates the stored answer in Context, so the verdict/score update
 * live. Correctness is derived via the `scoring-registry` (no scoring logic
 * duplicated). A section jump lands on that section's first question.
 */
export interface ReviewScreenProps {
  questions: Question[];
  /** Sections drive the sidebar; `questions` is their flattened children (same order). */
  sections: Section[];
  answers: AnswersMap;
  startIndex?: number;
  onExit: () => void;
  language?: string;
}

type Correctness = 'correct' | 'incorrect' | 'partial' | 'skipped' | 'review';

function correctnessOf(question: Question, answers: AnswersMap): { kind: Correctness; raw: number } {
  const answer = answers[question.identifier];
  if (!isAnswered(answer)) return { kind: 'skipped', raw: 0 };
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
  sections,
  answers,
  startIndex = 0,
  onExit,
  language = 'en',
}: ReviewScreenProps) {
  const { state, storeAnswer } = useQuml();
  const clampedStart = Math.min(Math.max(startIndex, 0), Math.max(questions.length - 1, 0));
  const [index, setIndex] = useState(clampedStart);

  // Flat question index ↔ section: `questions` is `sections.flatMap(children)`,
  // so a running offset gives each section's first-question index.
  const sectionStarts: number[] = [];
  let offset = 0;
  for (const section of sections) {
    sectionStarts.push(offset);
    offset += section.children.length;
  }
  const currentSectionIndex = Math.max(
    0,
    sectionStarts.filter((start) => start <= index).length - 1,
  );
  const jumpToSection = (sectionIndex: number) => setIndex(sectionStarts[sectionIndex] ?? 0);

  if (questions.length === 0) {
    return (
      <section className={styles.review}>
        <div className={styles.empty}>{t(language, 'ERROR_LOADING')}</div>
      </section>
    );
  }

  const question = questions[index];
  const { kind } = correctnessOf(question, answers);
  const isFirst = index === 0;
  const isLast = index === questions.length - 1;

  // Section that owns the current question — drives the hint/solution gates.
  const currentSection = sections[currentSectionIndex];

  // Media-resolution context for solution/hint assets (mirrors SectionPlayer).
  const offline = state.playerConfig?.metadata;
  const mediaCtx: MediaResolveContext = {
    media: question.media as MediaItem[] | undefined,
    basePath: offline?.basePath,
    isAvailableLocally: offline?.isAvailableLocally,
    sectionId: currentSection?.identifier,
    questionId: question.identifier,
  };

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
          <Sidebar
            sections={sections}
            currentSectionIndex={currentSectionIndex}
            answers={answers}
            onSectionJump={jumpToSection}
            language={language}
          />
        </aside>

        <div className={styles.main}>
          <div className={styles.navBar}>
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

          <div className={`${styles.verdict} ${VERDICT_CLASS[kind]}`}>
            {t(language, LABEL_KEY[kind])}
          </div>

          <QuestionCard question={question} meta={{ category: question.primaryCategory }}>
            <QuestionRenderer
              key={question.identifier}
              question={question}
              shuffleOptions={question.shuffleOptions}
              onOptionSelected={(response: UserResponse) => storeAnswer(question.identifier, response)}
            />

            <Hint
              hints={question.hints}
              solutions={question.solutions}
              // In review the assessment is complete, so solutions are always
              // unlocked — visibility is presence-based (content exists).
              canViewSolution
              language={language}
              mediaCtx={mediaCtx}
            />
          </QuestionCard>
        </div>
      </div>
    </section>
  );
}
