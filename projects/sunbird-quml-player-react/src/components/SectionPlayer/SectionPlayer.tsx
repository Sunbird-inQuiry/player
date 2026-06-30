import { useEffect, useRef, useState } from 'react';
import { useQuml } from '../../context/useQuml';
import { useTelemetry } from '../../context/useTelemetry';
import { QuestionRenderer } from '../QuestionRenderer/QuestionRenderer';
import { Header } from '../Header/Header';
import { Alert } from '../Alert/Alert';
import { t } from '../../i18n/translations';
import { calculateScore } from '../../registry/scoring-registry';
import type { Question, Section, UserResponse } from '../../types';
import styles from './SectionPlayer.module.scss';

type AlertKind = 'correct' | 'incorrect' | 'partial' | 'info';
interface AlertState {
  type: AlertKind;
  message: string;
}

/**
 * SectionPlayer — orchestrates one section: question carousel, answer storage
 * (Context), scoring (registry), telemetry (hook), and feedback (Alert).
 * This is where ALL per-answer business logic lives; question components stay pure.
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
  const initialTime =
    section?.timeLimits?.max && section.timeLimits.max > 0 ? section.timeLimits.max : null;
  const [timeRemaining, setTimeRemaining] = useState<number | null>(initialTime);

  // Timer — interval created once; uses a ref for the current value.
  const timeRef = useRef<number | null>(initialTime);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (initialTime == null) return;
    timerRef.current = setInterval(() => {
      const next = (timeRef.current ?? 0) - 1;
      timeRef.current = next;
      setTimeRemaining(next);
      if (next <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
        setCurrentAlert({ type: 'info', message: t(language, 'TIME_UP') });
        onSectionEnd?.();
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const handleNext = () => {
    if (currentSlide < questions.length - 1) goTo(currentSlide + 1);
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
      <Header
        questionNumber={currentSlide + 1}
        totalQuestions={questions.length}
        timeRemaining={timeRemaining}
        onPrevious={handlePrevious}
        onNext={handleNext}
        isFirstQuestion={isFirst}
        isLastQuestion={isLast}
      />

      <div className={styles.content}>
        {currentAlert && (
          <Alert
            type={currentAlert.type}
            message={currentAlert.message}
            onClose={() => setCurrentAlert(null)}
          />
        )}

        <QuestionRenderer
          key={currentQuestion.identifier}
          question={currentQuestion}
          onOptionSelected={handleQuestionAnswer}
          onGoToNext={handleNext}
        />
      </div>

      {isLast && (
        <div className={styles.footer}>
          <button type="button" className={styles.submit} onClick={handleSubmit}>
            {t(language, 'SUBMIT')}
          </button>
        </div>
      )}
    </div>
  );
}
