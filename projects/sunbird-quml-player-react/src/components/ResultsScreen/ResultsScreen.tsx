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
  onReviewAll: () => void;
  onRetake: () => void;
  language?: string;
}

export function ResultsScreen({ summary, onReviewAll, onRetake, language = 'en' }: ResultsScreenProps) {
  const { totalScore, maxScore } = summary;
  const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  // SVG ring geometry.
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;

  return (
    <section className={styles.results} aria-label={t(language, 'YOUR_RESULTS')}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t(language, 'YOUR_RESULTS')}</h1>

        <div
          className={styles.ring}
          role="img"
          aria-label={t(language, 'RESULT_SUMMARY', { score: totalScore, max: maxScore })}
        >
          <svg viewBox="0 0 120 120" className={styles.ringSvg}>
            <circle className={styles.ringTrack} cx="60" cy="60" r={radius} />
            <circle
              className={styles.ringFill}
              cx="60"
              cy="60"
              r={radius}
              strokeDasharray={`${dash} ${circumference}`}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className={styles.ringCenter}>
            <span className={styles.pct}>{pct}%</span>
            <span className={styles.scoreText}>
              {totalScore}/{maxScore}
            </span>
          </div>
        </div>

        <Scoreboard
          correct={summary.correct}
          incorrect={summary.incorrect}
          partial={summary.partial}
          skipped={summary.skipped}
          totalScore={totalScore}
          maxScore={maxScore}
        />

        <div className={styles.actions}>
          <button type="button" className={styles.reviewBtn} onClick={onReviewAll}>
            {t(language, 'REVIEW_ALL')}
          </button>
          <button type="button" className={styles.retakeBtn} onClick={onRetake}>
            {t(language, 'RETAKE')}
          </button>
        </div>
      </div>
    </section>
  );
}
