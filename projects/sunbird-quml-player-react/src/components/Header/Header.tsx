import { useQuml } from '../../context/useQuml';
import { t } from '../../i18n/translations';
import { PreviousIcon, NextIcon, TimerIcon } from '../icons';
import styles from './Header.module.scss';

/**
 * Header — presentational top bar: question counter, optional timer, and
 * previous/next navigation.
 *
 * Per spec §3.2 it reads ONLY `state.language` from Context (for translations);
 * everything else arrives as typed props and intent is emitted via callbacks.
 * No bookmark (sidebar is the navigation pattern), no NavBar, no business logic.
 */
interface HeaderProps {
  questionNumber?: number;
  totalQuestions?: number;
  /** Seconds remaining; `null`/omitted hides the timer. */
  timeRemaining?: number | null;
  onPrevious?: () => void;
  onNext?: () => void;
  isFirstQuestion?: boolean;
  isLastQuestion?: boolean;
}

/** Local mm:ss formatter (per spec §3.2 — distinct from utils/time HH:MM:SS). */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function Header({
  questionNumber = 1,
  totalQuestions = 10,
  timeRemaining = null,
  onPrevious,
  onNext,
  isFirstQuestion = false,
  isLastQuestion = false,
}: HeaderProps) {
  const { state } = useQuml();
  const language = state.language;

  const showTimer = timeRemaining != null;
  const isTimeLow = showTimer && timeRemaining <= 60;

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <span className={styles.counter}>
          {t(language, 'QUESTION')} {questionNumber} {t(language, 'OF')} {totalQuestions}
        </span>
      </div>

      <div className={styles.center}>
        {showTimer && (
          <div
            className={`${styles.timer} ${isTimeLow ? styles.timerLow : ''}`.trim()}
            role="timer"
            aria-label={t(language, 'TIME_REMAINING')}
          >
            <TimerIcon size={16} className={styles.timerIcon} />
            <span className={styles.timerValue}>{formatTime(timeRemaining)}</span>
          </div>
        )}
      </div>

      <div className={styles.right}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={onPrevious}
          disabled={isFirstQuestion}
          aria-label={t(language, 'PREVIOUS')}
        >
          <PreviousIcon size={18} />
          <span className={styles.navLabel}>{t(language, 'PREVIOUS')}</span>
        </button>

        <button
          type="button"
          className={styles.navBtn}
          onClick={onNext}
          disabled={isLastQuestion}
          aria-label={t(language, 'NEXT')}
        >
          <span className={styles.navLabel}>{t(language, 'NEXT')}</span>
          <NextIcon size={18} />
        </button>
      </div>
    </header>
  );
}
