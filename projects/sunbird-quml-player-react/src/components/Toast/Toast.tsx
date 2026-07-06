import { useEffect } from 'react';
import { useQuml } from '../../context/useQuml';
import { t } from '../../i18n/translations';
import { CloseIcon } from '../icons';
import styles from './Toast.module.scss';

/**
 * Toast — transient feedback pinned to the bottom-center of the viewport.
 *
 * Presentational: reads ONLY `state.language` for translations; type/message and
 * dismissal are props/callbacks. Auto-dismisses after `duration` ms. Used by
 * SectionPlayer for correct/incorrect answer feedback.
 */
type ToastType = 'correct' | 'incorrect' | 'partial' | 'info';

interface ToastProps {
  type?: ToastType;
  message?: string;
  onClose?: () => void;
  /** Auto-dismiss delay in ms (0 disables). */
  duration?: number;
}

export function Toast({ type = 'info', message = '', onClose, duration = 3000 }: ToastProps) {
  const { state } = useQuml();
  const language = state.language;

  useEffect(() => {
    if (!duration) return;
    const id = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(id);
  }, [duration, onClose, message, type]);

  const typeLabel: Record<ToastType, string> = {
    correct: t(language, 'CORRECT_ANSWER'),
    incorrect: t(language, 'INCORRECT_ANSWER'),
    partial: t(language, 'PARTIAL_SCORE'),
    info: 'Info',
  };

  return (
    <div className={styles.viewport} aria-live="polite">
      <div className={`${styles.toast} ${styles[type]}`} role="status">
        <div className={styles.text}>
          <strong className={styles.title}>{typeLabel[type]}</strong>
          {message && <span className={styles.message}>{message}</span>}
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label={t(language, 'CLOSE')}
        >
          <CloseIcon size={16} />
        </button>
      </div>
    </div>
  );
}
