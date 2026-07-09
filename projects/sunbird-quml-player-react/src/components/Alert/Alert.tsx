import { useQuml } from '../../context/useQuml';
import { t } from '../../i18n/translations';
import { CloseIcon } from '../icons';
import styles from './Alert.module.scss';

/**
 * Alert — inline dismissible feedback banner (per spec §3.3).
 *
 * Presentational: reads ONLY `state.language` from Context for translations;
 * everything else is props + callbacks. No toast behavior (per design decision),
 * no business logic, no scoring.
 */
type AlertType = 'correct' | 'incorrect' | 'partial' | 'info';

interface AlertProps {
  type?: AlertType;
  message?: string;
  /** Extra detail line (e.g. the expected answer). */
  details?: string | null;
  onClose?: () => void;
  showSolution?: boolean;
  onShowSolution?: () => void;
}

export function Alert({
  type = 'info',
  message = '',
  details = null,
  onClose,
  showSolution = false,
  onShowSolution,
}: AlertProps) {
  const { state } = useQuml();
  const language = state.language;

  const typeLabel: Record<AlertType, string> = {
    correct: t(language, 'CORRECT_ANSWER'),
    incorrect: t(language, 'INCORRECT_ANSWER'),
    partial: t(language, 'PARTIAL_SCORE'),
    info: 'Info',
  };

  return (
    <div className={`${styles.alert} ${styles[type]}`} role="alert" aria-live="polite">
      <div className={styles.header}>
        <strong className={styles.title}>{typeLabel[type]}</strong>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label={t(language, 'CLOSE')}
        >
          <CloseIcon size={16} />
        </button>
      </div>

      {message && <p className={styles.message}>{message}</p>}

      {details && (
        <div className={styles.details}>
          <p>
            <strong>{t(language, 'EXPECTED_ANSWER')}:</strong> {details}
          </p>
        </div>
      )}

      {showSolution && (
        <div className={styles.actions}>
          <button type="button" className={styles.actionBtn} onClick={onShowSolution}>
            {t(language, 'VIEW_SOLUTION')}
          </button>
        </div>
      )}
    </div>
  );
}
