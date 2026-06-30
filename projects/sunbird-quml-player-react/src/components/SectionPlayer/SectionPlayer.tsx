import { useEffect, useState } from 'react';
import { useQuml } from '../../context/useQuml';
import { useTelemetry } from '../../context/useTelemetry';
import { QuestionRenderer } from '../QuestionRenderer/QuestionRenderer';
import { QuestionCard } from '../QuestionCard/QuestionCard';
import { Hint } from '../Hint/Hint';
import { Toast } from '../Toast/Toast';
import { PreviousIcon, NextIcon } from '../icons';
import { t } from '../../i18n/translations';
import { calculateScore } from '../../registry/scoring-registry';
import { canGoToNextQuestion, isQuestionSkippable } from '../../services/navigation-service';
import type { Question, Section, UserResponse } from '../../types';
import styles from './SectionPlayer.module.scss';

type AlertKind = 'correct' | 'incorrect' | 'partial' | 'info';
interface AlertState {
  type: AlertKind;
  message: string;
}

/**
 * SectionPlayer — orchestrates one section's question carousel: answer storage
 * (Context), scoring (registry), telemetry (hook), feedback (Alert), and the
 * question footer nav. The persistent shell header/timer live in MainPlayer; this
 * is where ALL per-answer business logic lives. Question components stay pure.
 */
interface SectionPlayerProps {
  section: Section | undefined;
  onSectionEnd?: () => void;
}

export function SectionPlayer({ section, onSectionEnd }: SectionPlayerProps) {
  const { state, storeAnswer, setCurrentQuestion } = useQuml();
  const { logOptionSelected, logAnswerSubmitted } = useTelemetry();
  const language = state.language;

  const questions: Question[] = section?.children ?? [];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentAlert, setCurrentAlert] = useState<AlertState | null>(null);

  // Honor external jumps: the sidebar emits setCurrentQuestion (Context is the
  // source of truth for the active index); sync the carousel to follow it.
  const externalIndex = state.currentQuestionIndex;
  useEffect(() => {
    setCurrentSlide(externalIndex);
    setCurrentAlert(null);
  }, [externalIndex]);

  /**
   * Central answer handler — the ONE place per-answer side effects happen:
   * 1) store in Context (single source of truth), 2) telemetry INTERACT,
   * 3) score via the registry, 4) telemetry ASSESS, 5) optional feedback.
   */
  const handleQuestionAnswer = (answer: UserResponse) => {
    const currentQuestion = questions[currentSlide];
    if (!currentQuestion) return;

    storeAnswer(currentQuestion.identifier, answer);

    const selected =
      answer.values ?? answer.value ?? answer.order ?? answer.responses ?? answer.matches;
    logOptionSelected(currentQuestion.identifier, selected as string | string[]);

    const score = calculateScore(currentQuestion, answer);
    logAnswerSubmitted(
      currentQuestion.identifier,
      selected as string | string[],
      score,
      currentQuestion.maxScore ?? 1,
    );

    if (state.config?.showFeedback) {
      const isCorrect = score === 1;
      setCurrentAlert({
        type: isCorrect ? 'correct' : 'incorrect',
        message: t(language, isCorrect ? 'CORRECT_ANSWER' : 'INCORRECT_ANSWER'),
      });
    }
  };

  const goTo = (index: number) => {
    setCurrentSlide(index);
    setCurrentQuestion(index);
    setCurrentAlert(null);
  };
  // Navigation restriction (spec §6.9): when the section is not skippable, gate
  // "Next" on the current question being answered (navigation-service is the
  // single source of navigation rules — no rule logic lives in this component).
  const requireAnswer = !isQuestionSkippable(section);
  const canAdvance = canGoToNextQuestion(currentSlide, questions, state.answers, { requireAnswer });
  const handleNext = () => {
    if (canAdvance) goTo(currentSlide + 1);
  };
  const handlePrevious = () => {
    if (currentSlide > 0) goTo(currentSlide - 1);
  };
  const handleSubmit = () => onSectionEnd?.();

  if (questions.length === 0) {
    return <div className={styles.error}>{t(language, 'ERROR_LOADING')}</div>;
  }

  const currentQuestion = questions[currentSlide];
  const isFirst = currentSlide === 0;
  const isLast = currentSlide === questions.length - 1;

  return (
    <div className={styles.sectionPlayer}>
      <div className={styles.content}>
        <QuestionCard question={currentQuestion} meta={{ category: currentQuestion.primaryCategory }}>
          <QuestionRenderer
            key={currentQuestion.identifier}
            question={currentQuestion}
            onOptionSelected={handleQuestionAnswer}
            onGoToNext={handleNext}
          />

          <Hint
            hints={currentQuestion.hints}
            solutions={currentQuestion.solutions}
            answer={currentQuestion.answer}
            showHints={currentQuestion.showHints}
            showSolutions={currentQuestion.showSolutions || state.showSolutions}
            language={language}
          />
        </QuestionCard>
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={handlePrevious}
          disabled={isFirst}
          aria-label={t(language, 'PREVIOUS')}
        >
          <PreviousIcon size={18} />
          <span className={styles.navLabel}>{t(language, 'PREVIOUS')}</span>
        </button>

        <span className={styles.counter}>
          {t(language, 'QUESTION')} {currentSlide + 1} {t(language, 'OF')} {questions.length}
        </span>

        {isLast ? (
          <button type="button" className={styles.submit} onClick={handleSubmit}>
            {t(language, 'SUBMIT')}
          </button>
        ) : (
          <button
            type="button"
            className={styles.navBtn}
            onClick={handleNext}
            disabled={!canAdvance}
            aria-label={t(language, 'NEXT')}
          >
            <span className={styles.navLabel}>{t(language, 'NEXT')}</span>
            <NextIcon size={18} />
          </button>
        )}
      </div>

      {currentAlert && (
        <Toast
          type={currentAlert.type}
          message={currentAlert.message}
          onClose={() => setCurrentAlert(null)}
        />
      )}
    </div>
  );
}
