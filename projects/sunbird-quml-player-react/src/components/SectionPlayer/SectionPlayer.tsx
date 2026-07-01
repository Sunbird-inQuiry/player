import { useEffect, useRef, useState } from 'react';
import { useQuml } from '../../context/useQuml';
import { useTelemetry } from '../../context/useTelemetry';
import { QuestionRenderer } from '../QuestionRenderer/QuestionRenderer';
import { QuestionCard } from '../QuestionCard/QuestionCard';
import { Hint } from '../Hint/Hint';
import { Toast } from '../Toast/Toast';
import { ImageViewer } from '../ImageViewer/ImageViewer';
import { useImageZoom } from '../ImageViewer/useImageZoom';
import { PreviousIcon, NextIcon } from '../icons';
import { t } from '../../i18n/translations';
import { calculateScore } from '../../registry/scoring-registry';
import { canGoToNextQuestion, isQuestionSkippable } from '../../services/navigation-service';
import type { MediaItem, MediaResolveContext } from '../../utils/media';
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
  /** True only for the final section — its last question shows Submit, not Next. */
  isLastSection?: boolean;
}

export function SectionPlayer({ section, onSectionEnd, isLastSection = true }: SectionPlayerProps) {
  const { state, storeAnswer, setCurrentQuestion } = useQuml();
  const { logOptionSelected, logAnswerSubmitted } = useTelemetry();
  const language = state.language;

  const questions: Question[] = section?.children ?? [];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentAlert, setCurrentAlert] = useState<AlertState | null>(null);

  // Image zoom / click-to-enlarge over the whole question area (stem + options +
  // revealed solution), mirroring Angular's document-wide setImageZoom pass.
  const contentRef = useRef<HTMLDivElement>(null);
  const zoom = useImageZoom(contentRef, [currentSlide, language]);

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

    // Feedback toast: "Correct Answer" when fully correct, otherwise
    // "Wrong Answer, Try Again". Suppressed only if feedback is explicitly off.
    if (state.config?.showFeedback !== false) {
      const isCorrect = score >= 1;
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
  // "View Solution" unlocks once the learner has interacted with this question
  // (an answer is stored for it in Context).
  const hasInteracted = Boolean(state.answers[currentQuestion.identifier]);

  // Media-resolution context for solution/hint assets (mirrors QuestionRenderer).
  const offline = state.playerConfig?.metadata;
  const mediaCtx: MediaResolveContext = {
    media: currentQuestion.media as MediaItem[] | undefined,
    basePath: offline?.basePath,
    isAvailableLocally: offline?.isAvailableLocally,
    sectionId: section?.identifier,
    questionId: currentQuestion.identifier,
  };

  return (
    <div className={styles.sectionPlayer}>
      <div className={styles.navBar}>
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

        {isLast && isLastSection ? (
          // Final question of the final section → Submit.
          <button type="button" className={styles.submit} onClick={handleSubmit}>
            {t(language, 'SUBMIT')}
          </button>
        ) : (
          // Otherwise Next: advances within the section, or to the next section
          // when on a section's last question.
          <button
            type="button"
            className={styles.navBtn}
            onClick={isLast ? handleSubmit : handleNext}
            // Last question: enabled once answered (or section is skippable) so the
            // learner can move to the next section. Otherwise gate on canAdvance.
            disabled={isLast ? requireAnswer && !hasInteracted : !canAdvance}
            aria-label={t(language, 'NEXT')}
          >
            <span className={styles.navLabel}>{t(language, 'NEXT')}</span>
            <NextIcon size={18} />
          </button>
        )}
      </div>

      <div className={styles.content} ref={contentRef}>
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
            canViewSolution={hasInteracted}
            showHints={section?.showHints}
            showSolutions={section?.showSolutions}
            language={language}
            mediaCtx={mediaCtx}
          />
        </QuestionCard>
      </div>

      <ImageViewer
        state={zoom.state}
        onClose={zoom.close}
        onZoomIn={zoom.zoomIn}
        onZoomOut={zoom.zoomOut}
      />

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
