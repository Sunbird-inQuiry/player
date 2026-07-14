import { t } from '../../i18n/translations';
import styles from './Scoreboard.module.scss';

/**
 * Scoreboard — end-of-quiz summary (per spec §3.4).
 *
 * Pure presentational component: props only, no Context, no business logic.
 * Aggregated counts/scores are computed by the orchestrator (Phase 5) and
 * passed in. (ReviewScreen / submit workflow are out of Phase 3 scope.)
 */
interface ScoreboardProps {
  correct?: number;
  incorrect?: number;
  partial?: number;
  skipped?: number;
  totalScore?: number;
  onSubmit?: () => void;
  language?: string;
}

export function Scoreboard({
  correct = 0,
  incorrect = 0,
  partial = 0,
  skipped = 0,
  totalScore = 0,
  onSubmit,
  language = 'en',
}: ScoreboardProps) {
  const stats: Array<{ key: string; label: string; value: number; variant: string }> = [
    { key: 'correct', label: t(language, 'CORRECT'), value: correct, variant: styles.correct },
    { key: 'incorrect', label: t(language, 'INCORRECT'), value: incorrect, variant: styles.incorrect },
    { key: 'partial', label: t(language, 'PARTIAL'), value: partial, variant: styles.partial },
    { key: 'skipped', label: t(language, 'SKIPPED'), value: skipped, variant: styles.skipped },
  ];

  return (
    <section className={styles.scoreboard} aria-label={t(language, 'QUIZ_SUMMARY')}>
      <h2 className={styles.heading}>{t(language, 'QUIZ_SUMMARY')}</h2>

      <dl className={styles.stats}>
        {stats.map(({ key, label, value, variant }) => (
          <div key={key} className={`${styles.stat} ${variant}`}>
            <dt className={styles.statLabel}>{label}</dt>
            <dd className={styles.statValue}>{value}</dd>
          </div>
        ))}
      </dl>

      <p className={styles.score}>
        {t(language, 'SCORE')}: <strong>{totalScore}</strong>
      </p>

      {onSubmit && (
        <button type="button" className={styles.submit} onClick={onSubmit}>
          {t(language, 'SUBMIT')}
        </button>
      )}
    </section>
  );
}
