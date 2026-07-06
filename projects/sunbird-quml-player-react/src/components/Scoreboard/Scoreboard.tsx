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
}

export function Scoreboard({
  correct = 0,
  incorrect = 0,
  partial = 0,
  skipped = 0,
  totalScore = 0,
  onSubmit,
}: ScoreboardProps) {
  const stats: Array<{ key: string; label: string; value: number; variant: string }> = [
    { key: 'correct', label: 'Correct', value: correct, variant: styles.correct },
    { key: 'incorrect', label: 'Incorrect', value: incorrect, variant: styles.incorrect },
    { key: 'partial', label: 'Partial', value: partial, variant: styles.partial },
    { key: 'skipped', label: 'Skipped', value: skipped, variant: styles.skipped },
  ];

  return (
    <section className={styles.scoreboard} aria-label="Quiz Summary">
      <h2 className={styles.heading}>Quiz Summary</h2>

      <dl className={styles.stats}>
        {stats.map(({ key, label, value, variant }) => (
          <div key={key} className={`${styles.stat} ${variant}`}>
            <dt className={styles.statLabel}>{label}</dt>
            <dd className={styles.statValue}>{value}</dd>
          </div>
        ))}
      </dl>

      <p className={styles.score}>
        Score: <strong>{totalScore}</strong>
      </p>

      {onSubmit && (
        <button type="button" className={styles.submit} onClick={onSubmit}>
          Submit
        </button>
      )}
    </section>
  );
}
