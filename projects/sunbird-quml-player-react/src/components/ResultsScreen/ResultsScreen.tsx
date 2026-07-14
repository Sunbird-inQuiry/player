import { Scoreboard } from '../Scoreboard/Scoreboard';
import { t } from '../../i18n/translations';
import styles from './ResultsScreen.module.scss';

/**
 * ResultsScreen — end-of-assessment outcome summary (spec §7.2).
 *
 * Pure: a score ring + percentage label, then the stat breakdown via the reused
 * `Scoreboard`. The summary is computed by MainPlayer through the scoring-registry
 * (no scoring logic duplicated here). Emits Review-all / Retake intent.
 */
export interface ResultsScreenProps {
  summary: {
    correct: number;
    incorrect: number;
    partial: number;
    skipped: number;
    totalScore: number;
    maxScore: number;
  };
  /** Total seconds spent answering (shell timer); null/omitted hides the line. */
  timeTaken?: number | null;
  onReviewAll: () => void;
  /** Omit to hide the Retake CTA (Angular parity: `showReplay=false` once attempts are exhausted). */
  onRetake?: () => void;
  language?: string;
}

/** Format seconds as m:ss (matches the header timer display). */
function formatMmSs(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function ResultsScreen({
  summary,
  timeTaken = null,
  onReviewAll,
  onRetake,
  language = 'en',
}: ResultsScreenProps) {
  const { totalScore } = summary;

  return (
    <section className={styles.results} aria-label={t(language, 'YOUR_RESULTS')}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t(language, 'YOUR_RESULTS')}</h1>

        <Scoreboard
          correct={summary.correct}
          incorrect={summary.incorrect}
          partial={summary.partial}
          skipped={summary.skipped}
          totalScore={totalScore}
          language={language}
        />

        {timeTaken != null && (
          <p className={styles.timeTaken}>
            {t(language, 'TIME_TAKEN')}: <strong>{formatMmSs(timeTaken)}</strong>
          </p>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.reviewBtn} onClick={onReviewAll}>
            {t(language, 'REVIEW_ALL')}
          </button>
          {onRetake && (
            <button type="button" className={styles.retakeBtn} onClick={onRetake}>
              {t(language, 'RETAKE')}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
